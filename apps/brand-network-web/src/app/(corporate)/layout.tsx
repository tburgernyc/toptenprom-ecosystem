import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { CorporateFooter } from "./_components/corporate-footer";

// ---------------------------------------------------------------------------
// Corporate layout
// Wraps all routes under the main brand-network.com domain.
// The outer HTML/body shell is rendered by the root layout.
//
// Phase 9: All tokens unified to Pearled Velvet Glass dark theme.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    template: "%s | Top 10 Prom",
    default: "Top 10 Prom — Luxury Prom & Bridal Boutiques",
  },
  description:
    "Top 10 Prom powers 55+ franchise retail locations with a unified commerce platform — online, in-store, and everywhere in between.",
  openGraph: {
    type: "website",
    siteName: "Top 10 Prom",
  },
};

// ---------------------------------------------------------------------------
// Corporate navigation — Pearled Velvet Glass dark theme
// ---------------------------------------------------------------------------

function CorporateNav() {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-3"
          aria-label="Top 10 Prom home"
        >
          {/* Pink accent badge */}
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-text-inverse)",
            }}
          >
            10
          </span>
          {/* Wordmark gradient */}
          <span
            className="logo-wordmark hidden text-sm font-bold tracking-tight select-none sm:inline"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            TOP 10 PROM
          </span>
        </a>

        {/* Navigation links */}
        <nav aria-label="Corporate navigation">
          <ul className="flex items-center gap-6 text-sm font-medium">
            <li>
              <a
                href="/network"
                className="transition-colors duration-200"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text-muted)")
                }
              >
                Our Network
              </a>
            </li>
            <li>
              <a
                href="/about"
                className="transition-colors duration-200"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text-muted)")
                }
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="transition-colors duration-200"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text-muted)")
                }
              >
                Contact
              </a>
            </li>
            <li>
              <a
                href="/home"
                className="btn-primary inline-flex h-9 items-center justify-center px-4 text-xs"
              >
                Enter Site
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Layout export
// ---------------------------------------------------------------------------

export default function CorporateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <CorporateNav />
      <main className="flex-1">{children}</main>
      <Suspense>
        <CorporateFooter />
      </Suspense>
    </div>
  );
}
