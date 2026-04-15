import "server-only";
import { getDb, locations, tenants } from "@brand-network/database";
import { eq, and } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { Location } from "@brand-network/database";

// ---------------------------------------------------------------------------
// Location query types
// ---------------------------------------------------------------------------

export type PublicLocation = Pick<
  Location,
  | "id"
  | "tenantId"
  | "name"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "postalCode"
  | "country"
  | "latitude"
  | "longitude"
  | "phone"
>;

export type PublicLocationWithTenant = PublicLocation & {
  tenantName: string;
  tenantSubdomain: string;
  tenantLogoUrl: string | null;
};

const locationSelect = {
  id: locations.id,
  tenantId: locations.tenantId,
  name: locations.name,
  addressLine1: locations.addressLine1,
  addressLine2: locations.addressLine2,
  city: locations.city,
  state: locations.state,
  postalCode: locations.postalCode,
  country: locations.country,
  latitude: locations.latitude,
  longitude: locations.longitude,
  phone: locations.phone,
} as const;

/**
 * Fetches all active locations across all active tenants for the corporate
 * locations page. Cached for 1 hour; revalidate via `revalidateTag("locations")`.
 *
 * SECURITY: Returns public address/phone data only — no internal tenant config.
 */
export async function getActiveLocations(): Promise<
  PublicLocationWithTenant[]
> {
  "use cache";
  cacheTag("locations");
  cacheLife("hours");

  const db = getDb();
  try {
    const rows = await db
      .select({
        ...locationSelect,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        tenantLogoUrl: tenants.logoUrl,
      })
      .from(locations)
      .innerJoin(tenants, eq(locations.tenantId, tenants.id))
      .where(
        and(
          eq(locations.isActive, true),
          eq(tenants.status, "active")
        )
      )
      .orderBy(locations.name);

    return rows;
  } catch (err) {
    console.error("[getActiveLocations] Database loop error:", err);
    return [];
  }
}

/**
 * Fetches all active locations for a single tenant.
 * Used in tenant routes for location selectors and map displays.
 * Cached per-tenant for 1 hour.
 *
 * SECURITY: Returns public address data only; no RLS required as location
 * addresses are intentionally public (customers need to find the store).
 */
export async function getTenantLocations(
  tenantId: string
): Promise<PublicLocation[]> {
  "use cache";
  cacheTag(`tenant-locations:${tenantId}`);
  cacheLife("hours");

  const db = getDb();
  try {
    const rows = await db
      .select(locationSelect)
      .from(locations)
      .where(
        and(
          eq(locations.tenantId, tenantId),
          eq(locations.isActive, true)
        )
      )
      .orderBy(locations.name);

    return rows;
  } catch (err) {
    console.error("[getTenantLocations] Database fallback error:", err);
    return [];
  }
}
