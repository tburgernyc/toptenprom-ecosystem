import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getActiveLocations } from "@/lib/queries/locations";
import { sortByNearest } from "@/lib/haversine";
import { LocationsMap } from "./_components/locations-map";

export const metadata: Metadata = {
  title: "Our Network",
  description:
    "Find a Top 10 Prom boutique near you. 55+ franchise stores offering appointments, styling services, and online shopping.",
};

// ---------------------------------------------------------------------------
// Search-params type
// lat/lng are injected by the LocationsMap client component after geolocation.
// ---------------------------------------------------------------------------

interface NetworkPageProps {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}

// ---------------------------------------------------------------------------
// Skeleton for the Suspense fallback — Pearled Velvet Glass tokens
// ---------------------------------------------------------------------------

function NetworkSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--radius-card)]"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated)",
          }}
        >
          <div
            className="h-44 w-full animate-pulse"
            style={{ background: "var(--color-bg-glass)" }}
          />
          <div className="space-y-3 p-5">
            <div
              className="h-3 w-20 animate-pulse rounded"
              style={{ background: "var(--color-bg-glass)" }}
            />
            <div
              className="h-4 w-40 animate-pulse rounded"
              style={{ background: "var(--color-bg-glass)" }}
            />
            <div className="space-y-1.5">
              <div
                className="h-3 w-48 animate-pulse rounded"
                style={{ background: "var(--color-bg-glass)" }}
              />
              <div
                className="h-3 w-32 animate-pulse rounded"
                style={{ background: "var(--color-bg-glass)" }}
              />
            </div>
            <div
              className="h-9 w-32 animate-pulse rounded-[var(--radius-pill)]"
              style={{ background: "var(--color-bg-glass)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner async component — loads locations and applies optional geo-sort
// ---------------------------------------------------------------------------

async function NetworkContent({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  await connection();

  const [allLocations, { lat, lng }] = await Promise.all([
    getActiveLocations(),
    searchParams,
  ]);

  const originLat = lat ? parseFloat(lat) : NaN;
  const originLng = lng ? parseFloat(lng) : NaN;

  const sorted =
    !isNaN(originLat) && !isNaN(originLng)
      ? sortByNearest(originLat, originLng, allLocations).map(
          ({ location }) => location
        )
      : allLocations;

  const apiKey = process.env["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"];

  return <LocationsMap locations={sorted} apiKey={apiKey} />;
}

// ---------------------------------------------------------------------------
// Page export — Phase 9: Pearled Velvet Glass tokens throughout
// ---------------------------------------------------------------------------

export default function NetworkPage({ searchParams }: NetworkPageProps) {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="mesh-bg relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
      >
        {/* Subtle pink radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary-glow), transparent)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow label */}
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--color-primary)" }}
          >
            55+ Boutique Locations
          </p>
          <h1
            className="text-display mb-6 text-5xl font-bold tracking-tight sm:text-6xl"
            style={{ color: "var(--color-text)" }}
          >
            Our{" "}
            <span
              style={{
                color: "var(--color-primary)",
                textShadow: "0 0 30px var(--color-primary-glow)",
              }}
            >
              Network
            </span>
          </h1>
          <p
            className="mx-auto max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            55+ franchise boutiques across the country — each with expert
            stylists, in-store services, and a curated collection exclusively
            yours.
          </p>
        </div>
      </section>

      {/* ── Location grid ─────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Suspense fallback={<NetworkSkeleton />}>
            <NetworkContent searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
