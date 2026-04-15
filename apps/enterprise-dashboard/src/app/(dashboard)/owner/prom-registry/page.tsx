import type { Metadata } from "next";
import { requireDashboardSession, requireRole } from "@/lib/auth";
import { DressExtractionForm } from "./_components/extraction-form";

export const metadata: Metadata = {
  title: "Prom Registry",
};

/**
 * Prom Registry page.
 *
 * Roles: super_admin, brand_admin, tenant_manager
 *
 * Features:
 *  1. Registry list — existing dress registrations per tenant
 *  2. AI extraction flow — staff enters raw notes, AI extracts structured
 *     dress attributes using zod-validated generateObject
 */
export default async function PromRegistryPage() {
  const session = await requireDashboardSession();
  requireRole(session, ["super_admin", "brand_admin", "tenant_manager"]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Prom Registry
        </h1>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          Manage dress reservations and use AI to extract dress details from
          staff notes.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* AI extraction panel */}
        <div className="bento-card space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-primary-subtle)]">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-[var(--color-brand-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                AI Dress Extraction
              </h2>
              <p className="text-xs text-[var(--color-foreground-muted)]">
                Paste staff notes and let AI extract structured dress details.
              </p>
            </div>
          </div>

          <DressExtractionForm />
        </div>

        {/* Registry list */}
        <div className="bento-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              Registered Dresses
            </h2>
            <span className="rounded-full bg-[var(--color-surface-overlay)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-foreground-muted)]">
              0 total
            </span>
          </div>

          <RegistryList />
        </div>
      </div>

      {/* Extraction guide */}
      <div className="bento-card bg-[var(--color-surface-brand)]">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          AI Extraction Guide
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs text-[var(--color-foreground-muted)]">
          <div>
            <p className="mb-1 font-semibold text-[var(--color-foreground)]">
              What AI extracts:
            </p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Customer name</li>
              <li>Dress style (A-line, ball gown…)</li>
              <li>Color (primary + accent)</li>
              <li>Fabric type</li>
              <li>Neckline &amp; embellishments</li>
              <li>Size and price range</li>
              <li>Designer / brand</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[var(--color-foreground)]">
              Good note example:
            </p>
            <p className="italic leading-relaxed">
              &ldquo;Sarah wants floor-length royal blue satin A-line, sweetheart neck,
              beaded bodice. Size 6–8. Budget $400–600. Preferring Jovani.&rdquo;
            </p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[var(--color-foreground)]">
              Tips:
            </p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Include as many details as known</li>
              <li>Mention the customer&apos;s name</li>
              <li>State the budget range if discussed</li>
              <li>Review before saving — AI may miss details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RegistryList — placeholder until DB-backed list is wired
// ─────────────────────────────────────────────────────────────────────────────

function RegistryList() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-8 text-center">
      <svg
        aria-hidden="true"
        className="mx-auto mb-3 h-8 w-8 text-[var(--color-foreground-subtle)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="text-sm text-[var(--color-foreground-muted)]">
        No dresses registered yet.
      </p>
      <p className="mt-1 text-xs text-[var(--color-foreground-subtle)]">
        Use the AI extraction tool to add your first entry.
      </p>
    </div>
  );
}
