import type { Metadata } from "next";
import { requireDashboardSession } from "@/lib/auth-dashboard";
import { getStylistUtilization } from "@/lib/queries/analytics";
import { Suspense } from "react";
import { ChartSkeleton } from "@/components/ChartSkeleton";

export const metadata: Metadata = {
  title: "My Schedule",
};

/**
 * Stylist personal view.
 *
 * Roles: all dashboard roles (every authenticated staff member can see this)
 *
 * Shows the stylist's own appointment performance and upcoming schedule.
 */
export default async function StylistPage() {
  const session = await requireDashboardSession();

  if (!session.tenantId) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
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
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          My Schedule
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {session.displayName
            ? `Welcome back, ${session.displayName}`
            : "Your appointments and performance"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal stats */}
        <div className="bento-card">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
            My Performance — Last 30 Days
          </h2>
          <Suspense fallback={<ChartSkeleton rows={1} label="Loading stats…" />}>
            <StylistStats
              tenantContext={tenantContext}
              stylistUserId={session.userId}
            />
          </Suspense>
        </div>

        {/* Today's appointments */}
        <div className="bento-card">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
            Today&apos;s Appointments
          </h2>
          <TodaysAppointmentsPlaceholder />
        </div>
      </div>

      {/* Upcoming week */}
      <div className="bento-card">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
          This Week
        </h2>
        <WeekViewPlaceholder />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StylistStats
// ─────────────────────────────────────────────────────────────────────────────

async function StylistStats({
  tenantContext,
  stylistUserId,
}: {
  tenantContext: { tenantId: string; userId: string; role: string };
  stylistUserId: string;
}) {
  const allStylists = await getStylistUtilization(tenantContext, "30d");
  const myStats = allStylists.find((s: { stylistId: string; totalMinutes: number; completedBookings: number }) => s.stylistId === stylistUserId);

  if (!myStats) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No completed appointments found for this period.
      </p>
    );
  }

  const hours = Math.floor(myStats.totalMinutes / 60);
  const mins = myStats.totalMinutes % 60;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatTile
        label="Completed"
        value={myStats.completedBookings.toString()}
        subLabel="appointments"
        color="var(--color-success)"
      />
      <StatTile
        label="Service Time"
        value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
        subLabel="total chair time"
        color="var(--color-primary)"
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  subLabel,
  color,
}: {
  label: string;
  value: string;
  subLabel: string;
  color: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-glass)] p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-subtle)]">{subLabel}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholders — replaced by live data once scheduling integration lands
// ─────────────────────────────────────────────────────────────────────────────

function TodaysAppointmentsPlaceholder() {
  return (
    <div className="space-y-2">
      {["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"].map((time) => (
        <div
          key={time}
          className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-glass)] px-3 py-2.5 text-sm"
        >
          <span className="w-16 flex-shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
            {time}
          </span>
          <span className="flex-1 text-[var(--color-text-subtle)] text-xs">
            Available
          </span>
        </div>
      ))}
      <p className="pt-1 text-xs text-[var(--color-text-subtle)]">
        Live schedule loads from your location&apos;s booking system.
      </p>
    </div>
  );
}

function WeekViewPlaceholder() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => (
        <div key={day} className="text-center">
          <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
            {day}
          </p>
          <div className="h-16 rounded-[var(--radius-md)] bg-[var(--color-bg-glass)]" />
        </div>
      ))}
    </div>
  );
}
