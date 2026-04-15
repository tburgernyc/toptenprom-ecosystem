import type { TenantContext } from "@brand-network/database";
import type { AnalyticsPeriod } from "@/lib/queries/analytics";
import { streamStylistAnalytics, generateAnalyticsSummary } from "@/components/ai-provider";
import { getDashboardSummary } from "@/lib/queries/analytics";

interface AIAnalyticsProps {
  tenantContext: TenantContext;
  period?: AnalyticsPeriod;
}

/**
 * AIAnalytics — RSC that orchestrates streaming analytics UI.
 *
 * Rendering order:
 *  1. Skeleton is shown immediately via streamStylistAnalytics (createStreamableUI)
 *  2. Chart resolves once DB query completes
 *  3. Summary text and stat cards render when their Promises resolve
 *
 * Do NOT add "use client" — this is intentionally a Server Component.
 * Reads tenantContext from props (always server-derived, never client input).
 */
export async function AIAnalytics({
  tenantContext,
  period = "30d",
}: AIAnalyticsProps) {
  // Fire both in parallel — chart stream and summary text
  const [chartUI, summaryText, summaryData] = await Promise.all([
    streamStylistAnalytics(tenantContext, { period }),
    generateAnalyticsSummary(tenantContext, { period }),
    getDashboardSummary(tenantContext, period),
  ]);

  const completionRate =
    summaryData.totalBookingsThisPeriod > 0
      ? Math.round(
          (summaryData.completedBookings /
            summaryData.totalBookingsThisPeriod) *
            100
        )
      : 0;

  const noShowRate =
    summaryData.totalBookingsThisPeriod > 0
      ? Math.round(
          (summaryData.noShowBookings / summaryData.totalBookingsThisPeriod) *
            100
        )
      : 0;

  return (
    <section
      aria-labelledby="ai-analytics-heading"
      className="space-y-6"
    >
      {/* AI-generated summary */}
      <div className="bento-card border-[var(--color-border-brand)] bg-[var(--color-surface-brand)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)]">
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 text-[var(--color-foreground-on-brand)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-primary)]">
              AI Insight
            </p>
            <p className="text-sm text-[var(--color-foreground)]">
              {summaryText}
            </p>
          </div>
        </div>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={summaryData.totalBookingsThisPeriod.toString()}
          subLabel="this period"
        />
        <StatCard
          label="Completed"
          value={summaryData.completedBookings.toString()}
          subLabel={`${completionRate}% rate`}
          accent="success"
        />
        <StatCard
          label="Pending"
          value={summaryData.pendingBookings.toString()}
          subLabel="awaiting service"
          accent="warning"
        />
        <StatCard
          label="No-shows"
          value={summaryData.noShowBookings.toString()}
          subLabel={`${noShowRate}% rate`}
          accent={noShowRate > 15 ? "danger" : "neutral"}
        />
      </div>

      {/* Streaming stylist utilization chart */}
      <div className="bento-card">
        <h2
          id="ai-analytics-heading"
          className="mb-4 text-sm font-semibold text-[var(--color-foreground)]"
        >
          Stylist Performance
        </h2>
        {chartUI}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard — small KPI tile
// ─────────────────────────────────────────────────────────────────────────────

type Accent = "success" | "warning" | "danger" | "neutral";

const accentColor: Record<Accent, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  neutral: "var(--color-brand-primary)",
};

function StatCard({
  label,
  value,
  subLabel,
  accent = "neutral",
}: {
  label: string;
  value: string;
  subLabel?: string;
  accent?: Accent;
}) {
  return (
    <div className="bento-card space-y-1">
      <p className="text-xs text-[var(--color-foreground-muted)]">{label}</p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: accentColor[accent] }}
      >
        {value}
      </p>
      {subLabel && (
        <p className="text-xs text-[var(--color-foreground-subtle)]">
          {subLabel}
        </p>
      )}
    </div>
  );
}
