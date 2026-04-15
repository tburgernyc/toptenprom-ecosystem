"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  MapPin,
  Heart,
  CircleHelp,
  Wand2,
  CalendarDays,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home",    href: "/home",          icon: Home },
  { label: "Catalog", href: "/catalog",       icon: Sparkles },
  { label: "Try-On",  href: "/try-on",        icon: Wand2 },
  { label: "Book",    href: "/book",          icon: CalendarDays },
  { label: "Boutiques",href: "/network",      icon: MapPin },
  { label: "Wishlist",href: "/wishlist",      icon: Heart },
  { label: "FAQ",     href: "/faq",           icon: CircleHelp },
  { label: "Dashboard",href: "/dashboard",    icon: LayoutDashboard },
];

export function FloatingPillNav() {
  const pathname = usePathname();
  const params = useParams();
  const subdomain = params?.subdomain as string | undefined;

  const getHref = (baseHref: string) => {
    if (subdomain) {
      if (baseHref === "/") return `/${subdomain}`;
      return `/${subdomain}${baseHref}`;
    }
    return baseHref;
  };

  return (
    <nav
      className="glass-pill fixed top-5 left-1/2 z-40 flex items-center gap-1 px-3 py-2"
      style={{ transform: "translateX(-50%)" }}
      aria-label="Main navigation"
    >
      {/* Logo wordmark */}
      <Link
        href={getHref("/home")}
        className="logo-wordmark mr-3 text-sm font-bold tracking-tight select-none"
        style={{ fontFamily: "var(--font-family-display)" }}
        aria-label="Top 10 Prom — home"
      >
        TOP 10
      </Link>

      {/* Separator */}
      <div
        className="h-5 w-px mr-2"
        style={{ background: "var(--color-border)" }}
        aria-hidden="true"
      />

      {/* Nav links */}
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const targetHref = getHref(href);
        const isActive =
          href === "/home"
            ? pathname === targetHref || pathname === getHref("/") 
            : pathname.startsWith(targetHref);

        return (
          <Link
            key={href}
            href={targetHref}
            aria-current={isActive ? "page" : undefined}
            className={[
              "group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              "transition-all duration-200",
              isActive
                ? "text-[var(--color-primary)]"
                : "text-subtle hover:text-[var(--color-text)]",
            ].join(" ")}
            style={
              isActive
                ? {
                    background: "var(--color-primary-subtle)",
                    color: "var(--color-primary)",
                    border: "1px solid var(--color-border-glow)",
                  }
                : undefined
            }
          >
            <Icon
              size={14}
              strokeWidth={isActive ? 2.5 : 2}
              className={[
                "transition-transform duration-200",
                "group-hover:scale-110",
              ].join(" ")}
            />
            <span className="hidden sm:inline">{label}</span>

            {/* Active dot indicator */}
            {isActive && (
              <span
                className="absolute -bottom-0.5 left-1/2 h-0.5 w-3 rounded-full -translate-x-1/2"
                style={{ background: "var(--color-primary)" }}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
