"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardRole } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: readonly DashboardRole[];
}

const navItems: NavItem[] = [
  {
    href: "/owner",
    label: "Overview",
    roles: ["super_admin", "brand_admin"],
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/owner/prom-registry",
    label: "Prom Registry",
    roles: ["super_admin", "brand_admin"],
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/manager",
    label: "Operations",
    roles: ["super_admin", "brand_admin", "tenant_manager"],
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
      </svg>
    ),
  },
  {
    href: "/stylist",
    label: "My Schedule",
    roles: ["super_admin", "brand_admin", "tenant_manager", "tenant_staff"],
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
  {
    href: "/receptionist",
    label: "Front Desk",
    roles: ["super_admin", "brand_admin", "tenant_manager", "tenant_staff"],
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

interface DashboardNavProps {
  role: DashboardRole;
  displayName: string | null;
  email: string;
}

export function DashboardNav({ role, displayName, email }: DashboardNavProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <nav
      aria-label="Dashboard navigation"
      className="flex h-16 md:h-full flex-row md:flex-col items-center md:items-stretch overflow-x-auto md:border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] scrollbar-hide"
    >
      {/* Brand */}
      <div className="hidden md:flex flex-shrink-0 h-16 items-center border-b border-[var(--color-border)] px-5">
        <span className="text-sm font-bold text-[var(--color-brand-primary)]">
          Brand Network
        </span>
        <span className="ml-2 rounded-full bg-[var(--color-brand-primary-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brand-primary)]">
          Dashboard
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex md:block overflow-x-auto md:overflow-y-auto px-3 py-2 md:py-4">
        <ul className="flex md:block space-x-2 md:space-x-0 md:space-y-1 items-center" role="list">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 rounded-[var(--radius-md)] px-3 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]"
                      : "text-[var(--color-foreground-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-brand-primary)]",
                  ].join(" ")}
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
      <div className="border-l md:border-l-0 md:border-t border-[var(--color-border)] px-4 py-2 md:py-4 flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-0">
        <div className="hidden md:block mb-3">
          <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
            {displayName ?? email}
          </p>
          <p className="truncate text-xs text-[var(--color-foreground-muted)]">
            {roleDisplayName(role)}
          </p>
        </div>
        <form action={logoutAction} className="flex-shrink-0">
          <button
            type="submit"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-center md:text-left text-sm text-[var(--color-foreground-muted)] transition-colors hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] focus:ring-2 focus:ring-[var(--color-danger)]"
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
      return "Staff";
    default:
      return role;
  }
}
