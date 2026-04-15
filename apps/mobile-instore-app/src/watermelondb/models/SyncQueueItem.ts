import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";
import type { PushStatus } from "./Customer";

export type SyncOperation = "insert" | "update" | "delete";

// ─────────────────────────────────────────────────────────────────────────────
// SyncQueueItem — pending mutation to push to server
//
// Created alongside every local write. The SyncEngine reads pending items,
// batches them, and sends to /api/sync. On success, the item is deleted.
// On OCC conflict, pushStatus is set to 'conflict' and conflict_data holds
// the server's current state so the UI can present resolution options.
// ─────────────────────────────────────────────────────────────────────────────

export class SyncQueueItem extends Model {
  static override table = "sync_queue" as const;

  @field("table_name") tableName!: string;
  @field("local_id") localId!: string;
  @field("server_id") serverId!: string | null;
  @field("operation") operation!: SyncOperation;
  // JSON-serialised record snapshot at mutation time
  @field("payload") payload!: string;
  @date("client_timestamp") clientTimestamp!: Date;
  @field("sync_status") pushStatus!: PushStatus;
  @field("sync_error") syncError!: string | null;
  @field("retry_count") retryCount!: number;
  // JSON-serialised server state when a conflict occurs
  @field("conflict_data") conflictData!: string | null;
  @readonly @date("created_at") createdAt!: Date;

  get parsedPayload(): Record<string, unknown> {
    try {
      return JSON.parse(this.payload) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  get parsedConflictData(): Record<string, unknown> | null {
    if (!this.conflictData) return null;
    try {
      return JSON.parse(this.conflictData) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
