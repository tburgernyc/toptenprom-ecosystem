"use client";

import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Tenant-level error boundary — catches errors thrown within any [subdomain]/*
// page or server component. Preserves the tenant URL so the user can retry
// without losing their context.
//
// Rendered inside TenantShell, so --color-tenant-* CSS variables are live and
// the frosted glass card will reflect the tenant's brand colour.
// ---------------------------------------------------------------------------

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Tenant] Error boundary caught:", error);
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
        {/* Icon */}
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
          Please try again.
        </p>

        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition-colors"
          style={{
            background: "var(--color-tenant-primary)",
            color: "var(--color-foreground-on-brand)",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
