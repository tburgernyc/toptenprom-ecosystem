import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { resolveTenant } from "@/lib/tenant";
import { buildTenantCssVars } from "@brand-network/ui-design-system";
import type { TenantConfig } from "@/lib/tenant";

// ---------------------------------------------------------------------------
// Params
// The proxy rewrites subdomain.brand-network.com/* → /[subdomain]/*,
// so Next.js always provides the subdomain (or full custom domain) here.
// ---------------------------------------------------------------------------

interface TenantLayoutParams {
  subdomain: string;
}

interface TenantLayoutProps {
  children: ReactNode;
  params: Promise<TenantLayoutParams>;
}

// ---------------------------------------------------------------------------
// Dynamic metadata — tenant name and branding
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<TenantLayoutParams>;
}): Promise<Metadata> {
  try {
    const { subdomain } = await params;
    const tenant = await resolveTenant(subdomain);

    if (!tenant) {
      return { title: "Store Not Found" };
    }

    return {
      title: {
        template: `%s | ${tenant.name}`,
        default: tenant.name,
      },
      description: `Shop ${tenant.name} — beauty, style, and services near you.`,
      openGraph: {
        type: "website",
        siteName: tenant.name,
        images: tenant.logoUrl ? [{ url: tenant.logoUrl }] : [],
      },
    };
  } catch {
    return { title: "Top 10 Prom" };
  }
}

// ---------------------------------------------------------------------------
// Tenant navigation
// ---------------------------------------------------------------------------

interface TenantNavProps {
  tenantName: string;
  logoUrl: string | null;
  subdomain: string;
}

function TenantNav({ tenantName, logoUrl, subdomain }: TenantNavProps) {
  return (
    <header className="sticky top-0 z-[var(--z-raised)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Tenant logo / name — links back to the tenant root */}
        <Link
          href={`/${subdomain}`}
          className="flex items-center gap-3 font-semibold text-[var(--color-foreground)]"
          aria-label={`${tenantName} home`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={tenantName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="flex h-8 items-center rounded-[var(--radius-md)] bg-[var(--color-tenant-primary)] px-2.5 text-sm font-bold text-[var(--color-foreground-on-brand)]">
              {tenantName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="hidden sm:inline">{tenantName}</span>
        </Link>

        {/* Navigation */}
        <nav aria-label={`${tenantName} navigation`}>
          <ul className="flex items-center gap-6 text-sm">
            <li>
              {/* Catalog is a global route — no tenant-scoped catalog exists */}
              <Link
                href="/catalog"
                className="text-[var(--color-foreground-muted)] transition-colors hover:text-[var(--color-foreground)]"
              >
                Catalog
              </Link>
            </li>
            <li>
              {/* Stylists is a tenant-scoped route */}
              <Link
                href={`/${subdomain}/stylists`}
                className="text-[var(--color-foreground-muted)] transition-colors hover:text-[var(--color-foreground)]"
              >
                Stylists
              </Link>
            </li>
            <li>
              <Link
                href={`/${subdomain}/book`}
                className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-tenant-primary)] px-4 text-xs font-semibold text-[var(--color-foreground-on-brand)] transition-colors hover:bg-[var(--color-tenant-primary-hover)]"
              >
                Book now
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Tenant footer
// ---------------------------------------------------------------------------

interface TenantFooterProps {
  tenantName: string;
}

function TenantFooter({ tenantName }: TenantFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[var(--color-foreground-subtle)]">
            &copy; {currentYear} {tenantName}. Powered by{" "}
            <a
              href={
                process.env["NEXT_PUBLIC_ROOT_DOMAIN"]
                  ? `https://${process.env["NEXT_PUBLIC_ROOT_DOMAIN"]}`
                  : "/"
              }
              className="text-[var(--color-foreground-muted)] transition-colors hover:text-[var(--color-foreground)]"
            >
              Brand Network
            </a>
          </p>
          <nav aria-label={`${tenantName} footer navigation`}>
            <ul className="flex gap-6 text-sm">
              <li>
                <a
                  href="/privacy"
                  className="text-[var(--color-foreground-subtle)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-[var(--color-foreground-subtle)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// TenantShell — inner async component that does the request-time data fetch.
// Lives inside a Suspense boundary so that the layout shell above it can be
// pre-rendered while this component waits for tenant data on each request.
// ---------------------------------------------------------------------------

async function TenantShell({
  params,
  children,
}: {
  params: Promise<TenantLayoutParams>;
  children: ReactNode;
}) {
  // connection() signals this subtree requires a live HTTP request (cannot be
  // pre-rendered). Must be called inside a Suspense boundary.
  await connection();

  const { subdomain } = await params;

  // Wrap tenant resolution so a transient DB error degrades gracefully to the
  // network store locator rather than surfacing a hard 500.
  let tenant: TenantConfig | null = null;
  try {
    tenant = await resolveTenant(subdomain);
  } catch (err) {
    console.error(`[TenantShell] Failed to resolve tenant "${subdomain}":`, err);
    // Fall through — treated as unknown tenant below.
  }

  // Inactive or unknown tenants are redirected to the global store locator.
  // Suspended tenants are treated as not found to avoid leaking their existence.
  if (
    tenant === null ||
    tenant.status === "suspended" ||
    tenant.status === "churned"
  ) {
    const rootDomain = process.env["NEXT_PUBLIC_ROOT_DOMAIN"];
    redirect(rootDomain ? `https://${rootDomain}/network` : "/network");
  }

  // Inject tenant colour overrides as CSS custom properties on the wrapper
  // element. Child components consume --color-tenant-* tokens automatically.
  const themeStyle = buildTenantCssVars({
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined,
  });

  return (
    <div style={themeStyle} className="flex min-h-dvh flex-col">
      <TenantNav
        tenantName={tenant.name}
        logoUrl={tenant.logoUrl}
        subdomain={subdomain}
      />
      <main className="flex-1">{children}</main>
      <TenantFooter tenantName={tenant.name} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TenantSkeleton — shown by Suspense while TenantShell fetches tenant data.
// Mirrors the full-page chrome so there is no layout shift on resolution.
// ---------------------------------------------------------------------------

function TenantSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col" aria-hidden="true">
      {/* Nav skeleton */}
      <div className="sticky top-0 z-[var(--z-raised)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / name placeholder */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-overlay)]" />
            <div className="hidden h-4 w-32 animate-pulse rounded bg-[var(--color-surface-overlay)] sm:block" />
          </div>
          {/* Nav links placeholder */}
          <div className="flex items-center gap-6">
            <div className="h-4 w-10 animate-pulse rounded bg-[var(--color-surface-overlay)]" />
            <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-surface-overlay)]" />
            <div className="h-9 w-24 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-overlay)]" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <main className="flex-1">
        <section className="bg-[var(--color-surface-brand)] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
            <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--color-surface-overlay)] sm:h-12" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-overlay)]" />
            <div className="mt-4 flex gap-4">
              <div className="h-12 w-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-overlay)]" />
              <div className="h-12 w-36 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-overlay)]" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer skeleton */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="h-4 w-48 animate-pulse rounded bg-[var(--color-surface-overlay)]" />
            <div className="flex gap-6">
              <div className="h-4 w-14 animate-pulse rounded bg-[var(--color-surface-overlay)]" />
              <div className="h-4 w-14 animate-pulse rounded bg-[var(--color-surface-overlay)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout export — static shell; TenantShell handles all request-time work.
// ---------------------------------------------------------------------------

export default function TenantLayout({ children, params }: TenantLayoutProps) {
  return (
    <Suspense fallback={<TenantSkeleton />}>
      <TenantShell params={params}>{children}</TenantShell>
    </Suspense>
  );
}
