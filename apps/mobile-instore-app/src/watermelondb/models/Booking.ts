import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";
import type { PushStatus } from "./Customer";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled";

// ─────────────────────────────────────────────────────────────────────────────
// Booking — local WatermelonDB model
//
// Walk-in appointments created offline. customer_id references the local
// WatermelonDB Customer row ID (not the server UUID). When syncing, the
// engine resolves the server UUID via the customer's server_id field.
//
// version_timestamp enables OCC on push: the server rejects if
// server.version_timestamp > client.version_timestamp.
// ─────────────────────────────────────────────────────────────────────────────

export class Booking extends Model {
  static override table = "bookings" as const;

  @field("server_id") serverId!: string | null;
  @field("tenant_id") tenantId!: string;
  @field("customer_id") customerId!: string;
  @field("service_id") serviceId!: string;
  @field("location_id") locationId!: string;
  @field("staff_user_id") staffUserId!: string | null;
  @field("status") status!: BookingStatus;
  @date("scheduled_at") scheduledAt!: Date;
  @date("ends_at") endsAt!: Date;
  @field("notes") notes!: string | null;
  @field("confirmation_code") confirmationCode!: string | null;
  @field("sync_status") pushStatus!: PushStatus;
  @field("version_timestamp") versionTimestamp!: number;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
}
