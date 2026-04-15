// ─────────────────────────────────────────────────────────────────────────────
// ID generation — device-side UUIDs
//
// UUIDs are generated on-device so bookings/customers can be inserted into
// WatermelonDB immediately without a server round-trip. The same UUID is
// forwarded to the server as the record's primary key during sync, which
// allows the server to detect duplicate pushes (idempotent inserts).
// ─────────────────────────────────────────────────────────────────────────────

import * as Crypto from "expo-crypto";

/**
 * Generates a cryptographically random UUID v4.
 * Uses expo-crypto which wraps the platform secure random API.
 */
export function generateLocalId(): string {
  return Crypto.randomUUID();
}
