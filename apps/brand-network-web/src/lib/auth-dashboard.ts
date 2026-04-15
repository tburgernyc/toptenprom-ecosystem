import "server-only";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDb, userProfiles } from "@brand-network/database";
import { eq } from "drizzle-orm";

import type { DashboardRole, DashboardSession } from "@/lib/types/auth";
export type { DashboardRole, DashboardSession };

export async function requireDashboardSession(): Promise<DashboardSession> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
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
    redirect("/login?error=no_profile");
    throw new Error("unreachable");
  }

  const role = profile.role as DashboardRole;

  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    tenantId: profile.tenantId,
    displayName: profile.displayName,
  };
}

export function requireRole(
  session: DashboardSession,
  allowed: readonly DashboardRole[]
): void {
  if (!allowed.includes(session.role)) {
    redirect("/dashboard");
  }
}

export function roleHomePath(role: DashboardRole): string {
  switch (role) {
    case "super_admin":
    case "brand_admin":
      return "/dashboard/owner";
    case "tenant_manager":
      return "/dashboard/manager";
    case "tenant_staff":
      return "/dashboard/stylist";
    case "customer":
      return "/dashboard/customer";
    default:
      return "/dashboard";
  }
}

