"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Instagram,
  Music2,
  Heart,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared luxury footer — Pearled Velvet Glass dark theme
// Used by both (main) layout and (corporate) layout.
//
// Phase 9: All tokens strictly from Pearled Velvet Glass system.
// NO arbitrary hex codes. NO Tailwind default colors.
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { label: "Home", href: "/home" },
  { label: "Catalog", href: "/catalog" },
  { label: "Our Boutiques", href: "/network" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
];

const SERVICE_LINKS = [
  { label: "Virtual Try-On", href: "/try-on" },
  { label: "Book Appointment", href: "/book" },
  { label: "AI Stylist", href: "/home#ai-stylist" },
  { label: "Prom Registry", href: "/registry" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Franchise Info", href: "/franchise" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "TikTok", href: "https://tiktok.com", icon: Music2 },
  { label: "Pinterest", href: "https://pinterest.com", icon: Heart },
];

interface FooterColumnProps {
  heading: string;
  links: { label: string; href: string }[];
}

function FooterColumn({ heading, links, getHref }: FooterColumnProps & { getHref: (href: string) => string }) {
  return (
    <div>
      <h3
        className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--color-primary)" }}
      >
        {heading}
      </h3>
      <ul className="space-y-2.5">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={getHref(href)}
              className="text-sm transition-colors duration-200"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                (e.currentTarget.style.color = "var(--color-text)")
              }
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                (e.currentTarget.style.color = "var(--color-text-muted)")
              }
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const params = useParams();
  const subdomain = params?.subdomain as string | undefined;

  const getHref = (baseHref: string) => {
    // If external link, ignore subdomain logic
    if (baseHref.startsWith("http")) return baseHref;
    
    if (subdomain) {
      if (baseHref === "/") return `/${subdomain}`;
      if (baseHref.startsWith("/#")) return `/${subdomain}${baseHref.slice(1)}`;
      return `/${subdomain}${baseHref}`;
    }
    return baseHref;
  };

  return (
    <footer
      className="border-t"
      style={{
        background: "var(--color-bg-elevated)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Pink accent rule at very top */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-primary-glow), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ── Upper section: Brand + Nav columns ────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            {/* Wordmark */}
            <Link
              href={getHref("/home")}
              className="logo-wordmark inline-block text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-family-display)" }}
              aria-label="Top 10 Prom — home"
            >
              TOP 10 PROM
            </Link>
            <p
              className="mt-4 max-w-xs text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              The most exclusive prom and bridal boutique network in America.
              Your look, guaranteed exclusively yours.
            </p>

            {/* Contact info */}
            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-subtle)" }}>
                <MapPin size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                55+ Locations Nationwide
              </li>
              <li className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-subtle)" }}>
                <Mail size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                hello@top10prom.com
              </li>
              <li className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-subtle)" }}>
                <Phone size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                1-800-TOP-PROM
              </li>
            </ul>

            {/* Social icons */}
            <div className="mt-8 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="glass-card flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
                  style={{ color: "var(--color-text-muted)" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "var(--color-primary)";
                    el.style.borderColor = "var(--color-border-glow)";
                    el.style.boxShadow = "0 0 16px var(--color-primary-glow)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "var(--color-text-muted)";
                    el.style.borderColor = "";
                    el.style.boxShadow = "";
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:col-span-3">
            <FooterColumn heading="Quick Links" links={QUICK_LINKS} getHref={getHref} />
            <FooterColumn heading="Services" links={SERVICE_LINKS} getHref={getHref} />
            <FooterColumn heading="Company" links={COMPANY_LINKS} getHref={getHref} />
          </div>
        </div>

        {/* ── AI Stylist CTA banner ──────────────────────────────────────────── */}
        <div
          className="glass-card mt-14 flex flex-col items-center justify-between gap-4 rounded-[var(--radius-card)] p-6 text-center sm:flex-row sm:text-left"
          style={{ borderColor: "var(--color-border-glow)" }}
        >
          <div className="flex items-center gap-4">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--color-primary-subtle)",
                border: "1px solid var(--color-border-glow)",
              }}
            >
              <Sparkles size={18} style={{ color: "var(--color-primary)" }} />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Not sure what to wear?
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Let our AI Stylist analyse your look and give you personalised prom recommendations.
              </p>
            </div>
          </div>
          <Link
            href={getHref("/try-on")}
            className="btn-primary flex-shrink-0 inline-flex items-center gap-2 px-6 py-2.5 text-xs"
          >
            <Sparkles size={13} />
            Try It Free
          </Link>
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────────────── */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-8 sm:flex-row"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
            &copy; {currentYear} Top 10 Prom. All rights reserved.
          </p>
          <nav aria-label="Footer legal navigation">
            <ul className="flex items-center gap-5">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Accessibility", href: "/accessibility" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={getHref(href)}
                    className="text-xs transition-colors duration-150"
                    style={{ color: "var(--color-text-subtle)" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                      (e.currentTarget.style.color = "var(--color-text-muted)")
                    }
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                      (e.currentTarget.style.color = "var(--color-text-subtle)")
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
