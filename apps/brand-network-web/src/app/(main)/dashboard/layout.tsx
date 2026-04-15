import type { Metadata } from "next";
import { requireDashboardSession } from "@/lib/auth-dashboard";
import { DashboardNav } from "@/components/DashboardNav";

export const metadata: Metadata = {
  title: {
    template: "%s | Dashboard",
    default: "Dashboard",
  },
};

/**
 * Protected dashboard layout.
 *
 * requireDashboardSession() validates the Supabase JWT server-side and
 * loads the user's role from user_profiles. Redirects to /login if:
 *   - No active session
 *   - User has no profile
 *   - Role is not allowed in the dashboard
 *
 * tenantId and role are always loaded from the DB, never from client input.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Throws redirect() if unauthenticated or unauthorized
  const session = await requireDashboardSession();

  return (
    <div className="flex flex-col md:flex-row overflow-hidden" style={{ color: "var(--color-text)", background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Sidebar nav */}
      <aside className="w-full h-auto md:h-full md:w-64 flex-shrink-0 z-10 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--color-border)" }}>
        <DashboardNav
          role={session.role}
          displayName={session.displayName}
          email={session.email}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ background: "var(--color-bg)" }}>
        {children}
      </main>
    </div>
  );
}
