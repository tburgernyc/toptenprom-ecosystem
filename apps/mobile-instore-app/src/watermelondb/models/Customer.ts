import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

// App-level push status for our custom sync queue.
// Named PushStatus to avoid colliding with WatermelonDB's internal SyncStatus.
export type PushStatus = "pending" | "synced" | "conflict" | "failed";

// ─────────────────────────────────────────────────────────────────────────────
// Customer — local WatermelonDB model
//
// Represents a walk-in client created on-device. version_timestamp is set at
// creation time (epoch ms) and updated on every local mutation. The sync
// engine uses it for OCC when pushing to the server.
// ─────────────────────────────────────────────────────────────────────────────

export class Customer extends Model {
  static override table = "customers" as const;

  @field("server_id") serverId!: string | null;
  @field("tenant_id") tenantId!: string;
  @field("first_name") firstName!: string;
  @field("last_name") lastName!: string;
  @field("email") email!: string;
  @field("phone_number") phoneNumber!: string | null;
  @field("sync_status") pushStatus!: PushStatus;
  @field("version_timestamp") versionTimestamp!: number;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;

  get displayName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
