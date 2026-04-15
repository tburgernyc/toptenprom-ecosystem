import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { resolveTenant } from "@/lib/tenant";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getTenantStylists } from "@/lib/queries/stylists";
import type { TenantContext } from "@brand-network/database";

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface StylistsPageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({
  params,
}: StylistsPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await resolveTenant(subdomain);
  if (!tenant) return { title: "Stylists" };

  return {
    title: "Our Stylists",
    description: `Meet the expert styling team at ${tenant.name}. Book your appointment today.`,
  };
}

// ---------------------------------------------------------------------------
// Stylist avatar — initials fallback when no photo is available
// ---------------------------------------------------------------------------

function StylistAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-24 w-24 rounded-full object-cover ring-2 ring-[var(--color-tenant-primary)]"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-tenant-primary)] text-2xl font-bold text-[var(--color-foreground-on-brand)] ring-2 ring-[var(--color-tenant-primary)]"
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function StylistsPage({ params }: StylistsPageProps) {
  await connection();

  const { subdomain } = await params;
  const tenant = await resolveTenant(subdomain);

  if (
    !tenant ||
    tenant.status === "suspended" ||
    tenant.status === "churned"
  ) {
    const rootDomain = process.env["NEXT_PUBLIC_ROOT_DOMAIN"];
    redirect(rootDomain ? `https://${rootDomain}/network` : "/network");
  }

  // Authenticated user needed for withTenant context.
  // Stylists page is publicly visible, but we read from a tenant-scoped table
  // so we must provide a valid tenant context. We use a service-role-like
  // approach: for public reads we use the tenant's own ID as actor but
  // downgrade to "customer" role — RLS allows SELECT on user_profiles
  // for the matching tenant.
  const user = await getAuthenticatedUser();

  const ctx: TenantContext = {
    tenantId: tenant.id,
    userId: user?.id ?? "00000000-0000-0000-0000-000000000000",
    role: user ? "customer" : "customer",
  };

  const stylists = await getTenantStylists(ctx);

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-surface-brand)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Meet our{" "}
            <span className="text-[var(--color-tenant-primary)]">stylists</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-foreground-muted)]">
            Our expert team is here to help you look and feel your best.
            Book a consultation or appointment below.
          </p>
        </div>
      </section>

      {/* Stylist grid */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {stylists.length === 0 ? (
            <p className="text-center text-[var(--color-foreground-muted)]">
              Our team details are coming soon. In the meantime,{" "}
              <Link
                href={`/${subdomain}/book`}
                className="text-[var(--color-tenant-primary)] underline underline-offset-2 hover:no-underline"
              >
                book an appointment
              </Link>{" "}
              and we&apos;ll match you with the right stylist.
            </p>
          ) : (
            <ul
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
            >
              {stylists.map((stylist) => {
                const name = stylist.displayName ?? "Stylist";
                return (
                  <li
                    key={stylist.id}
                    className="flex flex-col items-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 text-center shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
                  >
                    <StylistAvatar name={name} avatarUrl={stylist.avatarUrl} />
                    <h2 className="mt-4 font-semibold text-[var(--color-foreground)]">
                      {name}
                    </h2>
                    <Link
                      href={`/${subdomain}/book?stylist=${stylist.id}`}
                      className="mt-4 inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-tenant-primary)] px-4 text-xs font-semibold text-[var(--color-foreground-on-brand)] transition-colors hover:bg-[var(--color-tenant-primary-hover)]"
                    >
                      Book with {name.split(" ")[0]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
