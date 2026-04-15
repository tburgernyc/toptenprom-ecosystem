import type { Metadata } from "next";
import { Suspense } from "react";
import { requireDashboardSession, requireRole } from "@/lib/auth";
import { ChartSkeleton } from "@/components/ChartSkeleton";
import { StylistUtilizationChart } from "@/components/StylistUtilizationChart";
import { getDashboardSummary, getStylistUtilization } from "@/lib/queries/analytics";

export const metadata: Metadata = {
  title: "Operations",
};

/**
 * Manager operations view.
 *
 * Roles: tenant_manager, brand_admin, super_admin
 *
 * Shows:
 * - Booking KPIs for the current period
 * - Stylist utilization chart
 * - Staff schedule overview placeholder
 */
export default async function ManagerPage() {
  const session = await requireDashboardSession();
  requireRole(session, ["super_admin", "brand_admin", "tenant_manager"]);

  if (!session.tenantId) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-center">
        <p className="text-sm text-[var(--color-foreground-muted)]">
          No tenant assigned to this account.
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
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Operations
        </h1>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          Booking performance and staff utilization · Last 30 days
        </p>
      </div>

      {/* KPI row */}
      <Suspense fallback={<ChartSkeleton rows={1} label="Loading KPIs…" />}>
        <ManagerKPIs tenantContext={tenantContext} />
      </Suspense>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stylist utilization */}
        <div className="bento-card">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
            Stylist Utilization
          </h2>
          <Suspense fallback={<ChartSkeleton rows={5} label="Loading stylist data…" />}>
            <ManagerStylistChart tenantContext={tenantContext} />
          </Suspense>
        </div>

        {/* Upcoming schedule placeholder */}
        <div className="bento-card">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">
            Today&apos;s Schedule
          </h2>
          <SchedulePlaceholder />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManagerKPIs
// ─────────────────────────────────────────────────────────────────────────────

async function ManagerKPIs({
  tenantContext,
}: {
  tenantContext: { tenantId: string; userId: string; role: string };
}) {
  const summary = await getDashboardSummary(tenantContext, "30d");
  const completionRate =
    summary.totalBookingsThisPeriod > 0
      ? Math.round(
          (summary.completedBookings / summary.totalBookingsThisPeriod) * 100
        )
      : 0;

  const kpis = [
    { label: "Total Bookings", value: summary.totalBookingsThisPeriod, color: "var(--color-brand-primary)" },
    { label: "Completed", value: summary.completedBookings, color: "var(--color-success)" },
    { label: "Completion Rate", value: `${completionRate}%`, color: "var(--color-info)" },
    { label: "Pending", value: summary.pendingBookings, color: "var(--color-warning)" },
    { label: "No-shows", value: summary.noShowBookings, color: "var(--color-danger)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bento-card space-y-1 text-center">
          <p className="text-xs text-[var(--color-foreground-muted)]">{kpi.label}</p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: kpi.color }}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManagerStylistChart
// ─────────────────────────────────────────────────────────────────────────────

async function ManagerStylistChart({
  tenantContext,
}: {
  tenantContext: { tenantId: string; userId: string; role: string };
}) {
  const data = await getStylistUtilization(tenantContext, "30d");
  return <StylistUtilizationChart data={data} period="30d" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SchedulePlaceholder
// ─────────────────────────────────────────────────────────────────────────────

function SchedulePlaceholder() {
  const slots = [
    { time: "9:00 AM", stylist: "—", service: "—", status: "open" },
    { time: "10:00 AM", stylist: "—", service: "—", status: "open" },
    { time: "11:00 AM", stylist: "—", service: "—", status: "open" },
    { time: "1:00 PM", stylist: "—", service: "—", status: "open" },
    { time: "2:00 PM", stylist: "—", service: "—", status: "open" },
  ];

  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <div
          key={slot.time}
          className="flex items-center gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs"
        >
          <span className="w-16 flex-shrink-0 font-mono text-[var(--color-foreground-muted)]">
            {slot.time}
          </span>
          <span className="flex-1 text-[var(--color-foreground-subtle)]">
            Available slot
          </span>
          <span className="rounded-full bg-[var(--color-success-subtle)] px-2 py-0.5 text-[var(--color-success)]">
            open
          </span>
        </div>
      ))}
      <p className="pt-1 text-xs text-[var(--color-foreground-subtle)]">
        Connect your scheduling integration to populate live data.
      </p>
    </div>
  );
}
