import { redirect } from "next/navigation";
import { requireDashboardSession, roleHomePath } from "@/lib/auth";

/**
 * Root dashboard page — immediately redirects to the role-appropriate home.
 *
 * owner/brand_admin → /owner
 * tenant_manager    → /manager
 * tenant_staff      → /stylist
 */
export default async function DashboardRootPage() {
  const session = await requireDashboardSession();
  redirect(roleHomePath(session.role));
}
