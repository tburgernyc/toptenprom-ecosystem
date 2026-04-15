/**
 * ChartSkeleton — shown while AI analytics are streaming / data is resolving.
 * Pure RSC-compatible: no "use client" directive needed.
 */
export function ChartSkeleton({
  rows = 5,
  label = "Loading analytics…",
}: {
  rows?: number;
  label?: string;
}) {
  const barWidths = [85, 65, 72, 90, 55, 78, 40, 68, 82, 50].slice(0, rows);

  return (
    <div
      role="status"
      aria-label={label}
      className="space-y-3 rounded-[var(--radius-lg)] p-1"
    >
      {/* Chart title skeleton */}
      <div className="skeleton h-4 w-40" />

      {/* Bar chart skeleton */}
      <div className="space-y-2">
        {barWidths.map((width, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Label */}
            <div className="skeleton h-3 w-20 flex-shrink-0" />
            {/* Bar */}
            <div
              className="skeleton h-6 rounded-[var(--radius-sm)]"
              style={{ width: `${width}%` }}
            />
            {/* Value */}
            <div className="skeleton h-3 w-8 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Legend skeleton */}
      <div className="flex gap-4 pt-1">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-20" />
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
