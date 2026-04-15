import type { Metadata } from "next";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { ShieldCheck, Sparkles, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Home — Top 10 Prom",
  description:
    "Welcome to Top 10 Prom. Browse our exclusive luxury prom and bridal collections, book a VIP styling session, and guarantee your look stays uniquely yours.",
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── 2. The Prom Promise (No-Duplicate Guarantee) ────────────────────── */}
      <section className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-24 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-surface-overlay), transparent)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="glass-pill rounded-full border p-4"
              style={{
                borderColor: "var(--color-border-glow)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <ShieldCheck
                className="h-8 w-8"
                style={{ color: "var(--color-text)" }}
                strokeWidth={1.5}
              />
            </div>
          </div>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              fontFamily: "var(--font-family-display)",
              color: "var(--color-text)",
            }}
          >
            The Top 10{" "}
            <span style={{ color: "var(--color-primary)" }}>Prom Promise</span>
          </h2>
          <p
            className="mx-auto max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your moment should be exclusively yours. The Top 10 Prom Registry
            guarantees we will never sell the same dress, in the same color, to
            the same event. Our nationwide franchise database tracks every
            school&apos;s registry in real-time, ensuring your look remains
            uniquely yours.
          </p>
        </div>
      </section>

      {/* ── 3. Virtual Try-On Highlight ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Placeholder card (left on desktop) */}
            <div className="order-2 lg:order-1">
              <div
                className="glass-card relative aspect-[4/5] overflow-hidden border"
                style={{
                  borderRadius: "var(--radius-2xl)",
                  borderColor: "var(--color-border-glow)",
                  boxShadow: "var(--shadow-xl)",
                  background: "var(--color-surface-brand)",
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  <Sparkles
                    className="mb-4 h-12 w-12 opacity-50"
                    strokeWidth={1}
                  />
                  <p
                    className="text-xl font-medium tracking-widest opacity-50"
                    style={{
                      fontFamily: "var(--font-family-display)",
                      color: "var(--color-text)",
                    }}
                  >
                    AI STYLIST
                  </p>
                </div>
              </div>
            </div>

            {/* Copy (right on desktop) */}
            <div className="order-1 lg:order-2">
              <h2
                className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
                style={{
                  fontFamily: "var(--font-family-display)",
                  color: "var(--color-text)",
                }}
              >
                Visualize Your{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  Perfect Fit
                </span>
              </h2>
              <p
                className="mb-10 text-lg leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                Not sure which silhouette suits you? Upload a photo and let our
                AI Virtual Try-On instantly style you in our latest arrivals.
                Discover your dream dress before ever stepping foot in the
                boutique.
              </p>
              <Link
                href="/try-on"
                className="btn-primary inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300"
              >
                Try It Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Book an Appointment ──────────────────────────────────────────── */}
      <section
        className="border-t px-4 py-32 sm:px-6 lg:px-8"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-brand)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <MapPin
              className="h-10 w-10"
              style={{ color: "var(--color-primary)" }}
              strokeWidth={1}
            />
          </div>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{
              fontFamily: "var(--font-family-display)",
              color: "var(--color-text)",
            }}
          >
            Experience{" "}
            <span style={{ color: "var(--color-primary)" }}>VIP Styling</span>
          </h2>
          <p
            className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Step into one of our 55+ nationwide luxury boutiques for a
            personalized, one-on-one styling session. Let our expert consultants
            find the gown that makes you feel unstoppable.
          </p>
          <Link
            href="/network"
            className="glass-pill inline-flex items-center justify-center border px-10 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[var(--color-surface-hover)]"
            style={{
              borderColor: "var(--color-border-glow)",
              color: "var(--color-text)",
            }}
          >
            Find Your Nearest Boutique
          </Link>
        </div>
      </section>
    </main>
  );
}
