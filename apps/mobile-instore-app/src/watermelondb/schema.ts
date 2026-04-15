import { appSchema, tableSchema } from "@nozbe/watermelondb";

// ─────────────────────────────────────────────────────────────────────────────
// WatermelonDB local schema
//
// Tables mirror the server-side Drizzle schema but are simplified for
// offline-first use. Fields prefixed with server_ hold remote identifiers.
// sync_status tracks the OCC lifecycle:
//   pending   — created/modified locally, not yet pushed
//   synced    — matches server state
//   conflict  — server rejected due to version_timestamp mismatch
//   failed    — push failed after max retries
// ─────────────────────────────────────────────────────────────────────────────

export const localSchema = appSchema({
  version: 1,
  tables: [
    // ─────────────────────────────────────────────────────────────────────
    // customers — walk-in client records created on device
    // ─────────────────────────────────────────────────────────────────────
    tableSchema({
      name: "customers",
      columns: [
        { name: "server_id", type: "string", isOptional: true },
        { name: "tenant_id", type: "string" },
        { name: "first_name", type: "string" },
        { name: "last_name", type: "string" },
        { name: "email", type: "string" },
        { name: "phone_number", type: "string", isOptional: true },
        { name: "sync_status", type: "string" },
        { name: "version_timestamp", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // bookings — walk-in appointments created on device
    // ─────────────────────────────────────────────────────────────────────
    tableSchema({
      name: "bookings",
      columns: [
        { name: "server_id", type: "string", isOptional: true },
        { name: "tenant_id", type: "string" },
        { name: "customer_id", type: "string" },
        { name: "service_id", type: "string" },
        { name: "location_id", type: "string" },
        { name: "staff_user_id", type: "string", isOptional: true },
        { name: "status", type: "string" },
        { name: "scheduled_at", type: "number" },
        { name: "ends_at", type: "number" },
        { name: "notes", type: "string", isOptional: true },
        { name: "confirmation_code", type: "string", isOptional: true },
        { name: "sync_status", type: "string" },
        { name: "version_timestamp", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),

    // ─────────────────────────────────────────────────────────────────────
    // sync_queue — pending mutations to push to server
    // One entry per local create/update. Cleared after successful push.
    // Conflicts are retained with sync_status = 'conflict' and conflict_data.
    // ─────────────────────────────────────────────────────────────────────
    tableSchema({
      name: "sync_queue",
      columns: [
        { name: "table_name", type: "string" },
        { name: "local_id", type: "string" },
        { name: "server_id", type: "string", isOptional: true },
        { name: "operation", type: "string" },
        { name: "payload", type: "string" },
        { name: "client_timestamp", type: "number" },
        { name: "sync_status", type: "string" },
        { name: "sync_error", type: "string", isOptional: true },
        { name: "retry_count", type: "number" },
        { name: "conflict_data", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
      ],
    }),
  ],
});
