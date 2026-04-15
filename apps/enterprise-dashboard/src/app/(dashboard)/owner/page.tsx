import type { Metadata } from "next";
import { Suspense } from "react";
import { requireDashboardSession, requireRole } from "@/lib/auth";
import { AIAnalytics } from "@/components/ai-analytics";
import { ChartSkeleton } from "@/components/ChartSkeleton";
import { getLocationMetrics } from "@/lib/queries/analytics";

export const metadata: Metadata = {
  title: "Owner Overview",
};

/**
 * Owner/Brand-Admin overview page.
 *
 * Bento grid layout:
 *  [AI Analytics — full width]
 *  [Locations performance | Quick actions]
 */
export default async function OwnerPage() {
  const session = await requireDashboardSession();
  requireRole(session, ["super_admin", "brand_admin"]);

  // tenantId is required for analytics — super_admin sees cross-tenant;
  // for this view we require tenantId to scope queries.
  if (!session.tenantId) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-center">
        <p className="text-sm text-[var(--color-foreground-muted)]">
          No tenant assigned to this account. Contact your administrator.
        </p>
      </div>
    );
  }

  const tenantContext = {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Business Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          AI-powered analytics for your network · Last 30 days
        </p>
      </div>

      {/* AI Analytics — skeleton shown while streaming resolves */}
      <Suspense fallback={<ChartSkeleton rows={5} label="Loading AI analytics…" />}>
        <AIAnalytics tenantContext={tenantContext} period="30d" />
      </Suspense>

      {/* Bento row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Location breakdown */}
        <div className="bento-card lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
            Location Performance
          </h2>
          <Suspense fallback={<ChartSkeleton rows={4} label="Loading locations…" />}>
            <LocationMetricsTable tenantContext={tenantContext} />
          </Suspense>
        </div>

        {/* Quick actions */}
        <div className="bento-card space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Quick Actions
          </h2>
          <QuickActionList />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LocationMetricsTable — async RSC
// ─────────────────────────────────────────────────────────────────────────────

async function LocationMetricsTable({
  tenantContext,
}: {
  tenantContext: { tenantId: string; userId: string; role: string };
}) {
  const rows = await getLocationMetrics(tenantContext, "30d");

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-foreground-muted)]">
        No location data available.
      </p>
    );
  }

  const maxBookings = Math.max(...rows.map((r) => r.bookingCount), 1);

  return (
    <div className="space-y-2" role="list" aria-label="Location booking counts">
      {rows.map((row) => {
        const pct = Math.round((row.bookingCount / maxBookings) * 100);
        return (
          <div
            key={row.locationId}
            role="listitem"
            className="flex items-center gap-3"
          >
            <div className="w-32 flex-shrink-0 truncate text-xs font-medium text-[var(--color-foreground)]">
              {row.locationName}
            </div>
            <div className="relative h-5 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-overlay)]">
              <div
                className="h-full rounded-[var(--radius-sm)] bg-[var(--color-brand-secondary)]"
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="w-8 flex-shrink-0 text-right text-xs font-semibold text-[var(--color-foreground)]">
              {row.bookingCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuickActionList
// ─────────────────────────────────────────────────────────────────────────────

function QuickActionList() {
  const actions = [
    { href: "/owner/prom-registry", label: "Prom Registry", desc: "Manage dress registrations" },
    { href: "/manager", label: "Operations", desc: "Bookings & staff scheduling" },
    { href: "/receptionist", label: "Front Desk", desc: "Walk-ins & check-ins" },
  ];

  return (
    <ul className="space-y-2" role="list">
      {actions.map((action) => (
        <li key={action.href}>
          <a
            href={action.href}
            className="block rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-border-brand)] hover:bg-[var(--color-surface-brand)]"
          >
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              {action.label}
            </p>
            <p className="text-xs text-[var(--color-foreground-muted)]">
              {action.desc}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
