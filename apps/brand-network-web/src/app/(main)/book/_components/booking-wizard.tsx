"use client";

// ---------------------------------------------------------------------------
// BookingWizard — Phase 10
//
// Multi-step global booking flow:
//   Step 1 → Select a location from the 55+ network
//   Step 2 → Redirect to that tenant's /book page pre-loaded
//
// Architecture decision: After the user selects a location, we redirect to
// https://[subdomain].[rootDomain]/book  — the tenant-scoped booking page
// which owns the full services/slots/stylist flow with proper RLS.
// This is architecturally safer than re-implementing tenant-scoped slot
// fetching in a global, non-authenticated context.
// ---------------------------------------------------------------------------

import { useState, useMemo } from "react";
import { MapPin, Search, ArrowRight, ChevronRight, Phone } from "lucide-react";
import type { PublicLocationWithTenant } from "@/lib/queries/locations";

interface BookingWizardProps {
  locations: PublicLocationWithTenant[];
  rootDomain: string;
}

export function BookingWizard({ locations, rootDomain }: BookingWizardProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Live-filter by name, city, or state
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.state ?? "").toLowerCase().includes(q) ||
        l.tenantName.toLowerCase().includes(q)
    );
  }, [query, locations]);

  const selected = locations.find((l) => l.id === selectedId) ?? null;

  function handleBook() {
    if (!selected) return;
    const url = `https://${selected.tenantSubdomain}.${rootDomain}/book`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="space-y-8"
      style={{ animation: "fadeSlideUp 0.5s var(--ease-luxury) both" }}
    >
      {/* ── Step indicator ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {["Select Location", "Book at Boutique"].map((label, i) => {
          const active = i === 0 ? true : !!selected;
          const current = i === 0 ? !selected : !!selected;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <ChevronRight
                  size={14}
                  className="flex-shrink-0"
                  style={{ color: "var(--color-text-subtle)" }}
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: current
                      ? "var(--color-primary)"
                      : active
                      ? "var(--color-primary-subtle)"
                      : "var(--color-bg-glass)",
                    color: current
                      ? "var(--color-text-inverse)"
                      : active
                      ? "var(--color-primary)"
                      : "var(--color-text-subtle)",
                    border: current ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="hidden text-xs font-medium sm:inline"
                  style={{
                    color: current
                      ? "var(--color-text)"
                      : "var(--color-text-subtle)",
                  }}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Location picker ────────────────────────────────────── */}
      {!selected && (
        <div
          className="space-y-5"
          style={{ animation: "fadeSlideUp 0.4s var(--ease-luxury) both" }}
        >
          {/* Search input */}
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-subtle)" }}
            />
            <input
              type="search"
              id="location-search"
              placeholder="Search by city, state, or boutique name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-[var(--radius-pill)] py-3 pl-10 pr-4 text-base sm:text-sm outline-none"
              style={{
                background: "var(--color-bg-glass)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                backdropFilter: "blur(12px)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            />
          </div>

          {/* Results count */}
          <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
            {filtered.length} boutique{filtered.length !== 1 ? "s" : ""}{" "}
            {query ? "match your search" : "nationwide"}
          </p>

          {/* Location list */}
          {filtered.length === 0 ? (
            <div
              className="glass-card flex flex-col items-center gap-3 py-12 text-center"
            >
              <MapPin size={28} style={{ color: "var(--color-text-subtle)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No boutiques match &ldquo;{query}&rdquo;. Try a different search.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" role="listbox" aria-label="Select a boutique location">
              {filtered.map((loc) => (
                <li key={loc.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(loc.id)}
                    className="glass-card group w-full text-left transition-all duration-200"
                    style={{ padding: "1rem 1.25rem" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-primary)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 0 16px var(--color-primary-glow)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-border)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Boutique name */}
                        <p
                          className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: "var(--color-text-subtle)" }}
                        >
                          {loc.tenantName}
                        </p>
                        <p
                          className="mt-0.5 font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {loc.name}
                        </p>
                        {/* Address */}
                        <address
                          className="mt-1 not-italic text-xs leading-relaxed"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {loc.addressLine1}
                          {loc.addressLine2 ? `, ${loc.addressLine2}` : ""}
                          <br />
                          {loc.city}
                          {loc.state ? `, ${loc.state}` : ""} {loc.postalCode}
                        </address>
                        {/* Phone */}
                        {loc.phone && (
                          <p
                            className="mt-1 flex items-center gap-1 text-xs"
                            style={{ color: "var(--color-text-subtle)" }}
                          >
                            <Phone size={11} />
                            {loc.phone}
                          </p>
                        )}
                      </div>

                      {/* Arrow CTA */}
                      <div
                        className="flex-shrink-0 rounded-full p-2 transition-all duration-200"
                        style={{
                          background: "var(--color-primary-subtle)",
                          color: "var(--color-primary)",
                        }}
                      >
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Step 2: Confirm & redirect ─────────────────────────────────── */}
      {selected && (
        <div
          className="space-y-6"
          style={{ animation: "fadeSlideUp 0.4s var(--ease-luxury) both" }}
        >
          {/* Selected location card */}
          <div
            className="glass-card p-5"
            style={{ borderColor: "var(--color-border-glow)" }}
          >
            <p
              className="mb-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-primary)" }}
            >
              Selected boutique
            </p>
            <p className="font-bold" style={{ color: "var(--color-text)" }}>
              {selected.name}
            </p>
            <address
              className="mt-1 not-italic text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {selected.addressLine1}
              {selected.addressLine2 ? `, ${selected.addressLine2}` : ""}
              <br />
              {selected.city}
              {selected.state ? `, ${selected.state}` : ""}{" "}
              {selected.postalCode}
            </address>
          </div>

          {/* Explainer */}
          <div
            className="rounded-[var(--radius-card)] px-4 py-3 text-sm"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            You&apos;ll be taken to{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {selected.tenantName}
            </strong>
            &apos;s booking page where you can choose your service, stylist, and
            preferred time slot.
          </div>

          {/* Action row */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBook}
              className="btn-primary inline-flex h-12 flex-1 items-center justify-center gap-2 text-sm"
            >
              Book at {selected.name}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="btn-ghost inline-flex h-12 items-center justify-center gap-2 px-5 text-sm"
            >
              ← Change location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
