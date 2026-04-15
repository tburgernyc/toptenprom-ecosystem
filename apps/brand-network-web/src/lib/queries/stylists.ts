import "server-only";
import { withTenant, userProfiles } from "@brand-network/database";
import { eq, and } from "drizzle-orm";
import type { TenantContext, UserProfile } from "@brand-network/database";

// ---------------------------------------------------------------------------
// Stylist query types
// ---------------------------------------------------------------------------

export type PublicStylist = Pick<
  UserProfile,
  "id" | "displayName" | "avatarUrl"
>;

/**
 * Fetches all active tenant_staff members for the given tenant.
 * Uses withTenant() so RLS enforces tenant isolation at the DB layer.
 *
 * The tenantId in ctx is derived from the server-side resolved tenant —
 * it is never sourced from client input.
 */
export async function getTenantStylists(
  ctx: TenantContext
): Promise<PublicStylist[]> {
  try {
    return await withTenant(ctx, async (tx) => {
      return tx
        .select({
          id: userProfiles.id,
          displayName: userProfiles.displayName,
          avatarUrl: userProfiles.avatarUrl,
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.tenantId, ctx.tenantId),
            eq(userProfiles.role, "tenant_staff")
          )
        )
        .orderBy(userProfiles.displayName);
    });
  } catch (err) {
    console.error("[getTenantStylists] Database query failed:", err);
    return [];
  }
}
