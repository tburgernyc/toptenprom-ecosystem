import type { Metadata } from "next";
import { requireDashboardSession } from "@/lib/auth";
import { WalkInForm } from "./_components/walk-in-form";

export const metadata: Metadata = {
  title: "Walk-in Intake",
};

/**
 * Walk-in Intake page.
 *
 * Roles: all authenticated dashboard users
 *
 * Allows front-desk staff to log a walk-in customer by collecting their
 * contact information, event date, and dress preferences. The form writes
 * to the availability_inquiries table via the createWalkInInquiry server action.
 */
export default async function WalkInPage() {
  await requireDashboardSession();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1">
          <a
            href="/receptionist"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Front Desk
          </a>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          New Walk-in
        </h1>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          Log a walk-in customer and their dress preferences.
        </p>
      </div>

      {/* Form card */}
      <div className="bento-card">
        <WalkInForm />
      </div>
    </div>
  );
}
