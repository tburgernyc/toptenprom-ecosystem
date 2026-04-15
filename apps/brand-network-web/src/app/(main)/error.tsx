"use client";

import { useEffect } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// (main) group error boundary — catches errors thrown within any dashboard,
// catalog, try-on, or other authenticated page. Renders inside the (main)
// layout so the global nav chrome is preserved.
// ---------------------------------------------------------------------------

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Main] Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-[var(--radius-card)] border p-8 text-center backdrop-blur-md"
        style={{
          background: "var(--color-surface)/60",
          borderColor: "var(--color-border-glow)",
          boxShadow: "0 8px 32px var(--color-primary-glow)",
        }}
      >
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "var(--color-primary-subtle)",
            border: "1px solid var(--color-border-glow)",
          }}
        >
          <span
            className="text-2xl font-bold leading-none"
            style={{ color: "var(--color-primary)" }}
            aria-hidden="true"
          >
            !
          </span>
        </div>

        <h2
          className="mb-2 text-xl font-semibold"
          style={{ color: "var(--color-foreground)" }}
        >
          Something went wrong
        </h2>
        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          We couldn&apos;t load this page. This is usually a temporary issue.
          Please try again or return to your dashboard.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition-colors"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-foreground-on-brand)",
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border px-6 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground-muted)",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
