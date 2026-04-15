import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { getActiveLocations } from "@/lib/queries/locations";
import { BookingWizard } from "./_components/booking-wizard";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Find your nearest Top 10 Prom boutique and book a personalised styling appointment with one of our expert consultants.",
};

// ---------------------------------------------------------------------------
// Skeleton shown while locations load
// ---------------------------------------------------------------------------

function WizardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {/* Search bar skeleton */}
      <div
        className="h-12 w-full animate-pulse rounded-[var(--radius-pill)]"
        style={{ background: "var(--color-bg-glass)" }}
      />
      {/* Card skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="glass-card animate-pulse p-5"
          style={{ opacity: 1 - i * 0.15 }}
        >
          <div
            className="mb-2 h-3 w-24 rounded"
            style={{ background: "var(--color-bg-elevated)" }}
          />
          <div
            className="mb-1 h-5 w-48 rounded"
            style={{ background: "var(--color-bg-elevated)" }}
          />
          <div
            className="h-3 w-40 rounded"
            style={{ background: "var(--color-bg-elevated)" }}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner async component — fetches locations at request time
// ---------------------------------------------------------------------------

async function BookingContent() {
  await connection();

  const locations = await getActiveLocations();
  const rootDomain =
    process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "toptenprom.com";

  return <BookingWizard locations={locations} rootDomain={rootDomain} />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BookPage() {
  return (
    <main style={{ background: "var(--color-bg)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mesh-bg relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        {/* Pink radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary-glow), transparent)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              background: "var(--color-primary-subtle)",
              border: "1px solid var(--color-border-glow)",
              color: "var(--color-primary)",
            }}
          >
            <MapPin size={12} />
            55+ Boutique Locations
          </div>

          <h1
            className="text-display mb-6 text-5xl font-bold tracking-tight sm:text-6xl"
            style={{ color: "var(--color-text)" }}
          >
            Book Your{" "}
            <span
              style={{
                color: "var(--color-primary)",
                textShadow: "0 0 40px var(--color-primary-glow)",
              }}
            >
              VIP Session
            </span>
          </h1>
          <p
            className="mx-auto max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Choose your nearest boutique and book a one-on-one styling
            appointment with one of our expert consultants. Your look, curated
            exclusively for you.
          </p>
        </div>
      </section>

      {/* ── Value props strip ─────────────────────────────────────────────── */}
      <section
        className="border-b px-4 py-10 sm:px-6 lg:px-8"
        style={{
          background: "var(--color-bg-elevated)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Personal Stylist",
              body: "One-on-one time with a dedicated styling consultant.",
            },
            {
              icon: CalendarDays,
              title: "Flexible Scheduling",
              body: "Morning, evening, and weekend slots available at every boutique.",
            },
            {
              icon: MapPin,
              title: "Nationwide Network",
              body: "55+ boutiques across the country — find one near you.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4">
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "var(--color-primary-subtle)",
                  border: "1px solid var(--color-border-glow)",
                }}
              >
                <Icon size={18} style={{ color: "var(--color-primary)" }} />
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {title}
                </p>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Wizard ─────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Section heading */}
          <div className="mb-10 text-center">
            <h2
              className="text-display mb-3 text-3xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Find Your{" "}
              <span style={{ color: "var(--color-primary)" }}>Boutique</span>
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Search by city, state, or boutique name to get started.
            </p>
          </div>

          <Suspense fallback={<WizardSkeleton />}>
            <BookingContent />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
