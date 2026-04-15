import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { localSchema } from "./schema";
import { Customer } from "./models/Customer";
import { Booking } from "./models/Booking";
import { SyncQueueItem } from "./models/SyncQueueItem";

// ─────────────────────────────────────────────────────────────────────────────
// SQLite adapter — persists to on-device SQLite via expo-sqlite
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new SQLiteAdapter({
  schema: localSchema,
  // migrations omitted — add when schema version increments
  jsi: true, // Enable JSI for better performance on native
  onSetUpError: (error) => {
    // In production: surface this to crash reporting (e.g. Sentry)
    console.error("[WatermelonDB] Adapter setup error:", error);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Singleton database instance — safe to import anywhere in the app
// ─────────────────────────────────────────────────────────────────────────────

export const database = new Database({
  adapter,
  modelClasses: [Customer, Booking, SyncQueueItem],
});

// Re-export model types for convenience
export { Customer, Booking, SyncQueueItem };
export type { PushStatus } from "./models/Customer";
export type { BookingStatus } from "./models/Booking";
export type { SyncOperation } from "./models/SyncQueueItem";
