import { redirect } from "next/navigation";
import { requireDashboardSession, roleHomePath } from "@/lib/auth-dashboard";

/**
 * Root dashboard page — immediately redirects to the role-appropriate home.
 */
export default async function DashboardRootPage() {
  const session = await requireDashboardSession();
  redirect(roleHomePath(session.role));
}
