"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function HeroSection() {
  const [visible, setVisible] = useState(false);

  // Delayed CTA reveal — enter animation after page load
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background  */}
      <div
        className="mesh-bg absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,10,14,0.40) 0%, rgba(11,10,14,0.65) 60%, var(--color-bg) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 text-center px-6 max-w-4xl mx-auto transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <p
          className="text-xs font-semibold tracking-[0.4em] uppercase"
          style={{ color: "var(--color-primary)" }}
        >
          The Luxury Prom Experience
        </p>

        <h1
          className="text-display text-5xl sm:text-6xl md:text-7xl font-bold leading-none"
          style={{ color: "var(--color-text)" }}
        >
          Your Night.
          <br />
          <em className="logo-wordmark not-italic">Your Gown.</em>
        </h1>

        <p
          className="text-body text-base sm:text-lg max-w-lg"
          style={{ color: "var(--color-text-muted)" }}
        >
          Handpicked designer gowns from the most exclusive boutiques. Find the
          dress that tells your story.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/catalog"
            className="btn-primary inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300"
          >
            Shop the Collection
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: visible ? 0.6 : 0, transition: "opacity 1s 1.2s" }}
        aria-hidden="true"
      >
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--color-text-subtle)" }}
        >
          Scroll
        </span>
        <div
          className="h-8 w-px"
          style={{ background: "var(--color-border)" }}
        />
      </div>
    </section>
  );
}
