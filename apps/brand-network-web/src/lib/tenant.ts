import "server-only";
import { getDb, tenants } from "@brand-network/database";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { Tenant } from "@brand-network/database";

// ---------------------------------------------------------------------------
// TenantConfig — the fields required by the web application layer.
// Derived from the Drizzle-inferred Tenant type so schema changes propagate.
// ---------------------------------------------------------------------------

export type TenantConfig = Pick<
  Tenant,
  | "id"
  | "slug"
  | "name"
  | "subdomain"
  | "customDomain"
  | "primaryColor"
  | "secondaryColor"
  | "themeConfig"
  | "logoUrl"
  | "status"
>;

const tenantSelect = {
  id: tenants.id,
  slug: tenants.slug,
  name: tenants.name,
  subdomain: tenants.subdomain,
  customDomain: tenants.customDomain,
  primaryColor: tenants.primaryColor,
  secondaryColor: tenants.secondaryColor,
  themeConfig: tenants.themeConfig,
  logoUrl: tenants.logoUrl,
  status: tenants.status,
} as const;

/**
 * Looks up an active tenant by subdomain.
 *
 * Cached per-subdomain for 1 hour. On-demand revalidation is available via
 * revalidateTag(`tenant-subdomain:${subdomain}`) when tenant config changes.
 *
 * SECURITY: this query is read-only against the public tenants table.
 * It does NOT require RLS / withTenant() since tenants are not tenant-scoped.
 * Never expose internal tenant config (e.g. themeConfig) to client bundles.
 */
export async function getTenantBySubdomain(
  subdomain: string
): Promise<TenantConfig | null> {
  "use cache";
  cacheTag(`tenant-subdomain:${subdomain}`);
  cacheLife("hours");

  const db = getDb();
  const rows = await db
    .select(tenantSelect)
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Looks up an active tenant by custom domain.
 *
 * Used in Phase 3+ when the middleware passes a full hostname as the
 * "subdomain" param because it could not match the ROOT_DOMAIN suffix.
 *
 * Cached per-domain for 1 hour with on-demand revalidation support.
 */
export async function getTenantByCustomDomain(
  domain: string
): Promise<TenantConfig | null> {
  "use cache";
  cacheTag(`tenant-domain:${domain}`);
  cacheLife("hours");

  const db = getDb();
  const rows = await db
    .select(tenantSelect)
    .from(tenants)
    .where(eq(tenants.customDomain, domain))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Resolves a tenant from the subdomain-or-custom-domain parameter that the
 * middleware injects into app/[subdomain]/ routes.
 *
 * Resolution order:
 *   1. Subdomain match (most common)
 *   2. Custom-domain match if the param looks like a full hostname
 *
 * Returns null when no matching active tenant is found.
 */
export async function resolveTenant(
  subdomainParam: string
): Promise<TenantConfig | null> {
  const bySubdomain = await getTenantBySubdomain(subdomainParam);
  if (bySubdomain) return bySubdomain;

  // If the param contains a dot it might be a custom domain (e.g. store.com)
  if (subdomainParam.includes(".")) {
    return getTenantByCustomDomain(subdomainParam);
  }

  return null;
}
