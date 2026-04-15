import type { Metadata } from "next";
import { requireDashboardSession } from "@/lib/auth-dashboard";

export const metadata: Metadata = {
  title: "Front Desk",
};

/**
 * Receptionist / Front Desk view.
 *
 * Roles: all authenticated dashboard users (staff check-in, walk-in intake)
 *
 * Focused on:
 * - Today's booking queue
 * - Walk-in registration
 * - Customer check-in
 */
export default async function ReceptionistPage() {
  const session = await requireDashboardSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          Front Desk
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's queue */}
        <div className="bento-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Today&apos;s Appointments
            </h2>
            <span className="rounded-full bg-[var(--color-primary-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
              0 today
            </span>
          </div>
          <AppointmentQueue />
        </div>

        {/* Quick intake panel */}
        <div className="space-y-4">
          <div className="bento-card">
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
              Walk-in Intake
            </h2>
            <WalkInIntakePanel locationManagerUserId={session.userId} />
          </div>

          <div className="bento-card">
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
              Status
            </h2>
            <StatusPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppointmentQueue
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentQueue() {
  // Live data will be populated once scheduling integration is wired
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-12 text-center">
        <div>
          <svg
            aria-hidden="true"
            className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-subtle)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <p className="text-sm text-[var(--color-text-muted)]">
            No appointments scheduled for today.
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
            Walk-ins will appear here after intake below.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WalkInIntakePanel
// ─────────────────────────────────────────────────────────────────────────────

function WalkInIntakePanel({ locationManagerUserId: _id }: { locationManagerUserId: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">
        Add a walk-in customer to today&apos;s queue.
      </p>
      <a
        href="/receptionist/walk-in"
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Walk-in
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusPanel
// ─────────────────────────────────────────────────────────────────────────────

function StatusPanel() {
  return (
    <div className="space-y-2 text-sm">
      {[
        { label: "Waiting", count: 0, color: "var(--color-warning)" },
        { label: "In service", count: 0, color: "var(--color-success)" },
        { label: "Checked out", count: 0, color: "var(--color-text-muted)" },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">
            {item.label}
          </span>
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: item.color }}
          >
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
