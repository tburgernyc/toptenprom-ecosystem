"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function LandingGate() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const handleEnter = useCallback(() => {
    if (entering) return;
    setEntering(true);

    // After 600ms CSS fade-out, push to /home
    setTimeout(() => {
      router.push("/home");
    }, 600);
  }, [entering, router]);

  return (
    <div
      className="relative min-h-screen overflow-hidden select-none"
      style={{ background: "var(--color-bg)" }}
    >
      {/* ── Animated Background ───────────────────────────────────────── */}
      <div
        className="mesh-bg absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {/* ── Dark scrim over video ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,10,14,0.55) 0%, rgba(11,10,14,0.70) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Fade-out curtain ──────────────────────────────────────────── */}
      <div
        className="fade-curtain"
        style={{ opacity: entering ? 1 : 0 }}
        aria-hidden="true"
      />

      {/* ── Centre stage content ──────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10 text-center px-6">
        {/* Wordmark */}
        <h1
          className="logo-wordmark text-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight"
          aria-label="Top 10 Prom"
        >
          TOP 10 PROM
        </h1>

        {/* Tagline */}
        <p
          className="text-body text-base sm:text-lg font-light tracking-[0.25em] uppercase"
          style={{ color: "var(--color-text-muted)" }}
        >
          Luxury Prom &amp; Bridal
        </p>

        {/* ENTER prompt */}
        <button
          type="button"
          onClick={handleEnter}
          disabled={entering}
          className="group relative mt-4"
          aria-label="Enter the storefront"
        >
          {/* Glow ring */}
          <span
            className="absolute inset-0 rounded-full blur-xl transition-opacity duration-500"
            style={{
              background: "var(--color-primary-glow)",
              opacity: entering ? 0.8 : 0.4,
            }}
            aria-hidden="true"
          />

          <span
            className="relative flex items-center gap-4 rounded-full border px-10 py-4 text-sm font-semibold tracking-[0.3em] uppercase transition-all duration-300"
            style={{
              borderColor: "var(--color-border-glow)",
              color: entering ? "var(--color-primary)" : "var(--color-text)",
              background: entering
                ? "var(--color-primary-subtle)"
                : "rgba(255,255,255,0.04)",
            }}
          >
            {/* Animated left line */}
            <span
              className="h-px w-6 transition-all duration-500"
              style={{
                background: "var(--color-primary)",
                transform: entering ? "scaleX(1.5)" : "scaleX(1)",
              }}
              aria-hidden="true"
            />
            {entering ? "Entering…" : "Enter"}
            {/* Animated right line */}
            <span
              className="h-px w-6 transition-all duration-500"
              style={{
                background: "var(--color-primary)",
                transform: entering ? "scaleX(1.5)" : "scaleX(1)",
              }}
              aria-hidden="true"
            />
          </span>
        </button>

        {/* Scroll hint */}
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--color-text-subtle)" }}
        >
          Press Enter or click to begin
        </p>
      </div>
    </div>
  );
}
