"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center" style={{ minHeight: "calc(100vh - 150px)" }}>
      <div className="glass-panel w-full max-w-md rounded-[var(--radius-lg)] p-8 border border-[var(--color-border)] bg-[var(--color-surface)]/50 backdrop-blur-md shadow-2xl">
        <h2 className="mb-4 font-bold text-xl text-[var(--color-foreground)]">
          Something went wrong
        </h2>
        <p className="mb-8 text-sm text-[var(--color-foreground-subtle)]">
          We experienced an issue loading this content. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-6 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
