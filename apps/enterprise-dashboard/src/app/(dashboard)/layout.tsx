import type { Metadata } from "next";
import { requireDashboardSession } from "@/lib/auth";
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
 *   - Role is not allowed in the dashboard (e.g. "customer")
 *
 * tenantId and role are always loaded from the DB, never from client input.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Throws redirect() if unauthenticated or unauthorized
  const session = await requireDashboardSession();

  return (
    <div className="flex h-dvh flex-col md:flex-row overflow-hidden text-[var(--color-foreground)]">
      {/* Sidebar nav */}
      <aside className="w-full h-auto md:h-full md:w-60 flex-shrink-0 z-10 border-b border-[var(--color-border)] md:border-b-0">
        <DashboardNav
          role={session.role}
          displayName={session.displayName}
          email={session.email}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-6">
        {children}
      </main>
    </div>
  );
}
