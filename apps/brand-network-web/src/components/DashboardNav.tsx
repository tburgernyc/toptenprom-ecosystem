"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { DashboardRole } from "@/lib/types/auth";
import { logoutAction } from "@/app/(auth)/login/actions";
import {
  PieChart,
  ClipboardList,
  CalendarDays,
  Users,
  ShoppingBag,
  Clock,
  Heart,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: readonly DashboardRole[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard/owner",
    label: "Overview",
    roles: ["super_admin", "brand_admin"],
    icon: <PieChart size={20} />,
  },
  {
    href: "/dashboard/owner/prom-registry",
    label: "Prom Registry",
    roles: ["super_admin", "brand_admin"],
    icon: <ClipboardList size={20} />,
  },
  {
    href: "/dashboard/manager",
    label: "Operations",
    roles: ["super_admin", "brand_admin", "tenant_manager"],
    icon: <Users size={20} />,
  },
  {
    href: "/dashboard/stylist",
    label: "My Schedule",
    roles: ["super_admin", "brand_admin", "tenant_manager", "tenant_staff"],
    icon: <CalendarDays size={20} />,
  },
  {
    href: "/dashboard/customer",
    label: "My Profile",
    roles: ["customer"],
    icon: <Heart size={20} />,
  },
  {
    href: "/dashboard/customer/appointments",
    label: "Appointments",
    roles: ["customer"],
    icon: <Clock size={20} />,
  },
  {
    href: "/dashboard/customer/orders",
    label: "Orders",
    roles: ["customer"],
    icon: <ShoppingBag size={20} />,
  },
];

interface DashboardNavProps {
  role: DashboardRole;
  displayName: string | null;
  email: string;
}

export function DashboardNav({ role, displayName, email }: DashboardNavProps) {
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

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav
      aria-label="Dashboard navigation"
      className="flex h-16 md:h-full flex-row md:flex-col items-center md:items-stretch overflow-x-auto md:border-r"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-bg-elevated)",
      }}
    >
      {/* Brand */}
      <div className="hidden md:flex flex-shrink-0 h-16 items-center border-b px-5" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href={getHref("/home")}
          className="logo-wordmark text-lg font-bold tracking-tight"
          style={{ fontFamily: "var(--font-family-display)" }}
        >
          TOP 10 PROM
        </Link>
        <span
          className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: "var(--color-primary-subtle)",
            color: "var(--color-primary)",
          }}
        >
          Dashboard
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex md:block overflow-x-auto md:overflow-y-auto px-3 py-2 md:py-4">
        <ul className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 items-center md:items-stretch" role="list">
          {visibleItems.map((item) => {
            const targetHref = getHref(item.href);
            const isActive =
              pathname === targetHref ||
              (item.href !== "/dashboard" && pathname.startsWith(targetHref));

            return (
              <li key={item.href}>
                <Link
                  href={targetHref}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                    isActive ? "active-link" : "",
                  ].join(" ")}
                  style={
                    isActive
                      ? {
                          background: "var(--color-primary-subtle)",
                          color: "var(--color-primary)",
                        }
                      : { color: "var(--color-text-muted)" }
                  }
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--color-text)";
                      e.currentTarget.style.background = "var(--color-bg-glass)";
                    }
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--color-text-muted)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User info + logout */}
      <div
        className="border-l md:border-l-0 md:border-t px-4 py-2 md:py-4 flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="hidden md:block mb-3">
          <p className="truncate text-sm font-medium" style={{ color: "var(--color-text)" }}>
            {displayName ?? email}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--color-primary)" }}>
            {roleDisplayName(role)}
          </p>
        </div>
        <form action={logoutAction} className="flex-shrink-0">
          <button
            type="submit"
            className="w-full rounded-lg border px-3 py-1.5 text-center md:text-left text-sm transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.color = "var(--color-text)";
              e.currentTarget.style.borderColor = "var(--color-text)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

function roleDisplayName(role: DashboardRole): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "brand_admin":
      return "Brand Owner";
    case "tenant_manager":
      return "Location Manager";
    case "tenant_staff":
      return "Stylist";
    case "customer":
      return "VIP Customer";
    default:
      return role;
  }
}
