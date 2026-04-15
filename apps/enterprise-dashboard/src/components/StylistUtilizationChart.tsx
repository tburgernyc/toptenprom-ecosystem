import type { StylistUtilizationRow, AnalyticsPeriod } from "@/lib/queries/analytics";

interface StylistUtilizationChartProps {
  data: StylistUtilizationRow[];
  period: AnalyticsPeriod;
}

const periodLabel: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

/**
 * StylistUtilizationChart
 *
 * Server-rendered horizontal bar chart for stylist booking metrics.
 * Pure HTML/CSS — no client JS required.
 */
export function StylistUtilizationChart({
  data,
  period,
}: StylistUtilizationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--color-foreground-muted)]">
        No completed bookings found for this period.
      </div>
    );
  }

  const maxBookings = Math.max(...data.map((r) => r.completedBookings), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          Stylist Utilization
        </h3>
        <span className="text-xs text-[var(--color-foreground-muted)]">
          {periodLabel[period]}
        </span>
      </div>

      <div className="space-y-2" role="list" aria-label="Stylist utilization chart">
        {data.map((row) => {
          const pct = Math.round((row.completedBookings / maxBookings) * 100);
          const hours = Math.floor(row.totalMinutes / 60);
          const mins = row.totalMinutes % 60;
          const timeLabel =
            hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

          return (
            <div
              key={row.stylistId}
              role="listitem"
              aria-label={`${row.displayName ?? "Unknown"}: ${row.completedBookings} bookings`}
              className="flex items-center gap-3"
            >
              {/* Name */}
              <div
                className="w-28 flex-shrink-0 truncate text-xs font-medium text-[var(--color-foreground)]"
                title={row.displayName ?? row.stylistId}
              >
                {row.displayName ?? "Unknown"}
              </div>

              {/* Bar track */}
              <div className="relative h-6 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-overlay)]">
                <div
                  className="h-full rounded-[var(--radius-sm)] bg-[var(--color-brand-primary)] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              </div>

              {/* Metrics */}
              <div className="w-24 flex-shrink-0 text-right text-xs text-[var(--color-foreground-muted)]">
                <span className="font-semibold text-[var(--color-foreground)]">
                  {row.completedBookings}
                </span>{" "}
                appt · {timeLabel}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-foreground-subtle)]">
        {data.length} stylist{data.length !== 1 ? "s" : ""} · completed
        appointments only
      </p>
    </div>
  );
}
