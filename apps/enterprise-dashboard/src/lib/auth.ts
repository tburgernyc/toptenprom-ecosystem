import "server-only";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDb } from "@brand-network/database";
import { userProfiles } from "@brand-network/database/schema";
import { eq } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Role types aligned with the database enum
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardRole =
  | "super_admin"
  | "brand_admin"
  | "tenant_manager"
  | "tenant_staff"
  | "customer";

// Roles that are allowed to access the enterprise dashboard at all
const ALLOWED_ROLES = new Set<DashboardRole>([
  "super_admin",
  "brand_admin",
  "tenant_manager",
  "tenant_staff",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Session types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSession {
  readonly userId: string;
  readonly email: string;
  readonly role: DashboardRole;
  readonly tenantId: string | null;
  readonly displayName: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// requireDashboardSession
//
// Validates the current user has an active session AND a role that grants
// dashboard access. Redirects to /login on failure.
//
// SECURITY: tenantId is loaded from the server-side DB, never from the client.
// ─────────────────────────────────────────────────────────────────────────────

export async function requireDashboardSession(): Promise<DashboardSession> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
    // TypeScript: redirect() throws, but we assist narrowing with an explicit throw
    throw new Error("unreachable");
  }

  const db = getDb();
  const profile = await db
    .select({
      role: userProfiles.role,
      tenantId: userProfiles.tenantId,
      displayName: userProfiles.displayName,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!profile) {
    // Profile missing — user exists in auth but has no profile record.
    redirect("/login?error=no_profile");
    throw new Error("unreachable");
  }

  const role = profile.role as DashboardRole;

  if (!ALLOWED_ROLES.has(role)) {
    redirect("/login?error=unauthorized");
    throw new Error("unreachable");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    tenantId: profile.tenantId,
    displayName: profile.displayName,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// requireRole — additional role guard for specific views
// ─────────────────────────────────────────────────────────────────────────────

export function requireRole(
  session: DashboardSession,
  allowed: readonly DashboardRole[]
): void {
  if (!allowed.includes(session.role)) {
    redirect("/");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// roleHomePath — canonical landing path per role
// ─────────────────────────────────────────────────────────────────────────────

export function roleHomePath(role: DashboardRole): string {
  switch (role) {
    case "super_admin":
    case "brand_admin":
      return "/owner";
    case "tenant_manager":
      return "/manager";
    case "tenant_staff":
      return "/stylist";
    default:
      return "/";
  }
}
