"use client";

import { useEffect } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// (dashboard) group error boundary — catches errors thrown within any
// authenticated dashboard page (owner, receptionist, manager, stylist).
// Renders inside the (dashboard) layout so the sidebar nav is preserved.
// ---------------------------------------------------------------------------

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard] Error boundary caught:", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center p-6 text-center"
      style={{ minHeight: "calc(100vh - 150px)" }}
    >
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border p-8 backdrop-blur-md"
        style={{
          background: "var(--color-surface)/50",
          borderColor: "var(--color-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
          Something went wrong
        </h2>
        <p className="mb-8 text-sm" style={{ color: "var(--color-foreground-subtle)" }}>
          The dashboard experienced an issue loading this data. Please try again
          or return to the main dashboard.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border px-6 text-sm font-medium transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-overlay)",
              color: "var(--color-foreground)",
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-medium transition-colors"
            style={{
              color: "var(--color-foreground-subtle)",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
