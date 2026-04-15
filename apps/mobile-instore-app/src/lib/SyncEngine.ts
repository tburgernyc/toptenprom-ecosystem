import { Q } from "@nozbe/watermelondb";
import { database } from "@/watermelondb/database";
import type { Customer } from "@/watermelondb/models/Customer";
import type { Booking } from "@/watermelondb/models/Booking";
import type { SyncQueueItem } from "@/watermelondb/models/SyncQueueItem";
import type { SyncConflict } from "@/components/ConflictResolutionModal";
import * as SecureStore from "expo-secure-store";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LAST_PULL_KEY = "sync_last_pull_timestamp";
const MAX_RETRIES = 3;
const SYNC_BATCH_SIZE = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Wire types — shapes exchanged with the /api/sync endpoint
// ─────────────────────────────────────────────────────────────────────────────

interface PushChange {
  localId: string;
  serverId: string | null;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  clientVersionTimestamp: string;
}

interface ServerConflict {
  localId: string;
  table: string;
  serverState: Record<string, unknown>;
  clientState: Record<string, unknown>;
  recordLabel: string;
}

interface AppliedChange {
  localId: string;
  serverId: string;
  table: string;
  confirmationCode?: string;
}

interface PullChange {
  table: string;
  serverId: string;
  operation: "upsert" | "delete";
  payload: Record<string, unknown>;
}

interface SyncResponse {
  applied: AppliedChange[];
  conflicts: ServerConflict[];
  serverChanges: PullChange[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SyncEngine
//
// Lifecycle of a sync cycle:
//   1. Collect pending sync_queue entries
//   2. Push to /api/sync as a batch
//   3. For applied items: update local records with server_id and mark synced
//   4. For conflicts: mark local records as 'conflict', store server state
//   5. For failed items: increment retry_count; mark 'failed' at max retries
//   6. Apply server pull changes to local DB (upserts and deletes)
// ─────────────────────────────────────────────────────────────────────────────

export class SyncEngine {
  private readonly syncUrl: string;
  private readonly tenantId: string;
  private readonly deviceId: string;
  private readonly authToken: string;

  private isSyncing = false;

  constructor(opts: {
    syncUrl: string;
    tenantId: string;
    deviceId: string;
    authToken: string;
  }) {
    this.syncUrl = opts.syncUrl;
    this.tenantId = opts.tenantId;
    this.deviceId = opts.deviceId;
    this.authToken = opts.authToken;
  }

  // ── Public interface ───────────────────────────────────────────────────────

  /**
   * Runs a full sync cycle. Returns any conflicts that require staff
   * resolution via ConflictResolutionModal.
   *
   * Guards against concurrent calls with `isSyncing`.
   */
  async sync(): Promise<SyncConflict[]> {
    if (this.isSyncing) {
      console.warn("[SyncEngine] Sync already in progress — skipping.");
      return [];
    }

    this.isSyncing = true;
    const conflicts: SyncConflict[] = [];

    try {
      const pendingItems = await this.collectPending();

      if (pendingItems.length === 0 && !(await this.shouldPull())) {
        return [];
      }

      const changes = this.buildPushChanges(pendingItems);
      const lastPullTimestamp = await this.getLastPullTimestamp();

      const response = await this.callSyncApi(changes, lastPullTimestamp);

      await this.applyApplied(response.applied, pendingItems);
      const newConflicts = await this.applyConflicts(
        response.conflicts,
        pendingItems
      );
      conflicts.push(...newConflicts);

      await this.applyServerChanges(response.serverChanges);
      await this.updateLastPullTimestamp();
    } catch (err) {
      console.error("[SyncEngine] Sync cycle failed:", err);
    } finally {
      this.isSyncing = false;
    }

    return conflicts;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async collectPending(): Promise<SyncQueueItem[]> {
    return database
      .get<SyncQueueItem>("sync_queue")
      .query(
        Q.where("sync_status", Q.oneOf(["pending", "failed"])),
        Q.where("retry_count", Q.lt(MAX_RETRIES)),
        Q.take(SYNC_BATCH_SIZE)
      )
      .fetch();
  }

  private buildPushChanges(items: SyncQueueItem[]): PushChange[] {
    return items.map((item) => {
      const payload = item.parsedPayload;
      const clientVersionTimestamp =
        typeof payload["version_timestamp"] === "string"
          ? payload["version_timestamp"]
          : new Date(item.clientTimestamp).toISOString();

      return {
        localId: item.localId,
        serverId: item.serverId,
        table: item.tableName,
        operation: item.operation,
        payload,
        clientVersionTimestamp,
      };
    });
  }

  private async callSyncApi(
    changes: PushChange[],
    lastPullTimestamp: string | null
  ): Promise<SyncResponse> {
    const body = {
      device_id: this.deviceId,
      tenant_id: this.tenantId,
      changes,
      last_pull_timestamp: lastPullTimestamp,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(this.syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(`[SyncEngine] API error ${res.status}: ${text}`);
      }

      return await res.json() as SyncResponse;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError" || err.message.includes("timeout")) {
          throw new Error(`[SyncEngine] Network timeout connecting to sync server.`);
        }
        if (err.message.includes("Network request failed")) {
          throw new Error(`[SyncEngine] Network connection is offline or unreachable.`);
        }
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async applyApplied(
    applied: AppliedChange[],
    pendingItems: SyncQueueItem[]
  ): Promise<void> {
    if (applied.length === 0) return;

    const itemMap = new Map(pendingItems.map((i) => [i.localId, i]));

    await database.write(async () => {
      for (const ack of applied) {
        const queueItem = itemMap.get(ack.localId);
        if (!queueItem) continue;

        // Update the local record with server_id and mark synced
        await this.markLocalRecordSynced(
          queueItem.tableName,
          queueItem.localId,
          ack.serverId,
          ack.confirmationCode
        );

        // Remove from sync queue
        await queueItem.destroyPermanently();
      }
    });
  }

  private async markLocalRecordSynced(
    tableName: string,
    localId: string,
    serverId: string,
    confirmationCode?: string
  ): Promise<void> {
    try {
      if (tableName === "customers") {
        const record = await database
          .get<Customer>("customers")
          .find(localId);
        await record.update((r) => {
          r.serverId = serverId;
          r.pushStatus = "synced";
          r.versionTimestamp = Date.now();
        });
      } else if (tableName === "bookings") {
        const record = await database
          .get<Booking>("bookings")
          .find(localId);
        await record.update((r) => {
          r.serverId = serverId;
          r.pushStatus = "synced";
          r.versionTimestamp = Date.now();
          if (confirmationCode) {
            r.confirmationCode = confirmationCode;
          }
        });
      }
    } catch (err) {
      // Record may already be deleted — non-fatal
      console.warn(
        `[SyncEngine] Could not update local record ${localId}:`,
        err
      );
    }
  }

  private async applyConflicts(
    serverConflicts: ServerConflict[],
    pendingItems: SyncQueueItem[]
  ): Promise<SyncConflict[]> {
    if (serverConflicts.length === 0) return [];

    const itemMap = new Map(pendingItems.map((i) => [i.localId, i]));
    const surfaced: SyncConflict[] = [];

    await database.write(async () => {
      for (const sc of serverConflicts) {
        const queueItem = itemMap.get(sc.localId);
        if (!queueItem) continue;

        // Mark local record as conflicted
        try {
          if (sc.table === "customers") {
            const record = await database
              .get<Customer>("customers")
              .find(sc.localId);
            await record.update((r) => {
              r.pushStatus = "conflict";
            });
          } else if (sc.table === "bookings") {
            const record = await database
              .get<Booking>("bookings")
              .find(sc.localId);
            await record.update((r) => {
              r.pushStatus = "conflict";
            });
          }
        } catch {
          // Record may not exist — continue
        }

        // Persist conflict data in sync queue item for resolution UI
        await queueItem.update((r) => {
          r.pushStatus = "conflict";
          r.conflictData = JSON.stringify(sc.serverState);
          r.syncError = "OCC conflict: server version is newer.";
        });

        surfaced.push({
          syncQueueItemId: queueItem.id,
          tableName: sc.table,
          recordLabel: sc.recordLabel,
          localState: sc.clientState,
          serverState: sc.serverState,
        });
      }
    });

    return surfaced;
  }

  private async applyServerChanges(changes: PullChange[]): Promise<void> {
    if (changes.length === 0) return;

    await database.write(async () => {
      for (const change of changes) {
        try {
          if (change.table === "customers") {
            await this.upsertCustomer(change);
          } else if (change.table === "bookings") {
            await this.upsertBooking(change);
          }
        } catch (err) {
          console.warn(
            `[SyncEngine] Failed to apply server change for ${change.table}/${change.serverId}:`,
            err
          );
        }
      }
    });
  }

  private async upsertCustomer(change: PullChange): Promise<void> {
    const p = change.payload;

    // Find existing local record by server_id
    const existing = await database
      .get<Customer>("customers")
      .query(Q.where("server_id", change.serverId))
      .fetch();

    if (change.operation === "delete") {
      if (existing[0]) await existing[0].destroyPermanently();
      return;
    }

    const vts = typeof p["version_timestamp"] === "string"
      ? new Date(p["version_timestamp"]).getTime()
      : Date.now();

    if (existing[0]) {
      // Only overwrite if server is newer (OCC)
      if (vts > existing[0].versionTimestamp) {
        await existing[0].update((r) => {
          r.firstName = String(p["first_name"] ?? r.firstName);
          r.lastName = String(p["last_name"] ?? r.lastName);
          r.email = String(p["email"] ?? r.email);
          r.phoneNumber = p["phone_number"] != null
            ? String(p["phone_number"])
            : r.phoneNumber;
          r.pushStatus = "synced";
          r.versionTimestamp = vts;
        });
      }
    } else {
      await database.get<Customer>("customers").create((r) => {
        r.serverId = change.serverId;
        r.tenantId = String(p["tenant_id"] ?? this.tenantId);
        r.firstName = String(p["first_name"] ?? "");
        r.lastName = String(p["last_name"] ?? "");
        r.email = String(p["email"] ?? "");
        r.phoneNumber = p["phone_number"] != null
          ? String(p["phone_number"])
          : null;
        r.pushStatus = "synced";
        r.versionTimestamp = vts;
        const now = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r as any)._raw.created_at = now;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r as any)._raw.updated_at = now;
      });
    }
  }

  private async upsertBooking(change: PullChange): Promise<void> {
    const p = change.payload;

    const existing = await database
      .get<Booking>("bookings")
      .query(Q.where("server_id", change.serverId))
      .fetch();

    if (change.operation === "delete") {
      if (existing[0]) await existing[0].destroyPermanently();
      return;
    }

    const vts = typeof p["version_timestamp"] === "string"
      ? new Date(p["version_timestamp"]).getTime()
      : Date.now();

    const scheduledAt = typeof p["scheduled_at"] === "string"
      ? new Date(p["scheduled_at"])
      : new Date();
    const endsAt = typeof p["ends_at"] === "string"
      ? new Date(p["ends_at"])
      : new Date();

    if (existing[0]) {
      if (vts > existing[0].versionTimestamp) {
        await existing[0].update((r) => {
          r.status = String(p["status"] ?? r.status) as Booking["status"];
          r.scheduledAt = scheduledAt;
          r.endsAt = endsAt;
          r.notes = p["notes"] != null ? String(p["notes"]) : r.notes;
          r.confirmationCode = p["confirmation_code"] != null
            ? String(p["confirmation_code"])
            : r.confirmationCode;
          r.pushStatus = "synced";
          r.versionTimestamp = vts;
        });
      }
    } else {
      await database.get<Booking>("bookings").create((r) => {
        r.serverId = change.serverId;
        r.tenantId = String(p["tenant_id"] ?? this.tenantId);
        r.customerId = String(p["local_customer_id"] ?? "");
        r.serviceId = String(p["service_id"] ?? "");
        r.locationId = String(p["location_id"] ?? "");
        r.staffUserId = p["staff_user_id"] != null
          ? String(p["staff_user_id"])
          : null;
        r.status = String(p["status"] ?? "pending") as Booking["status"];
        r.scheduledAt = scheduledAt;
        r.endsAt = endsAt;
        r.notes = p["notes"] != null ? String(p["notes"]) : null;
        r.confirmationCode = p["confirmation_code"] != null
          ? String(p["confirmation_code"])
          : null;
        r.pushStatus = "synced";
        r.versionTimestamp = vts;
        const now = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r as any)._raw.created_at = now;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r as any)._raw.updated_at = now;
      });
    }
  }

  private async getLastPullTimestamp(): Promise<string | null> {
    try {
      const raw = await SecureStore.getItemAsync(LAST_PULL_KEY);
      return raw ?? null;
    } catch {
      return null;
    }
  }

  private async updateLastPullTimestamp(): Promise<void> {
    try {
      await SecureStore.setItemAsync(LAST_PULL_KEY, new Date().toISOString());
    } catch (err) {
      console.warn("[SyncEngine] Failed to persist last pull timestamp:", err);
    }
  }

  private async shouldPull(): Promise<boolean> {
    const last = await this.getLastPullTimestamp();
    if (!last) return true;
    // Pull if last pull was more than 60 seconds ago
    return Date.now() - new Date(last).getTime() > 60_000;
  }
}
