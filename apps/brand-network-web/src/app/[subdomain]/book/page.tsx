import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { resolveTenant } from "@/lib/tenant";
import { getTenantLocations } from "@/lib/queries/locations";
import { getTenantStylists } from "@/lib/queries/stylists";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { withTenant, services } from "@brand-network/database";
import { eq, and } from "drizzle-orm";
import { BookingForm } from "./_components/booking-form";
import type { TenantContext } from "@brand-network/database";

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface BookPageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{
    service?: string;
    date?: string;
    stylist?: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await resolveTenant(subdomain);
  if (!tenant) return { title: "Book" };
  return {
    title: "Book an Appointment",
    description: `Book a styling appointment at ${tenant.name}. Choose your service, stylist, and preferred time.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BookPage({
  params,
  searchParams,
}: BookPageProps) {
  await connection();

  const [{ subdomain }, sp] = await Promise.all([params, searchParams]);

  const tenant = await resolveTenant(subdomain);
  if (
    !tenant ||
    tenant.status === "suspended" ||
    tenant.status === "churned"
  ) {
    const rootDomain = process.env["NEXT_PUBLIC_ROOT_DOMAIN"];
    redirect(rootDomain ? `https://${rootDomain}/network` : "/network");
  }

  const user = await getAuthenticatedUser();
  const ctx: TenantContext = {
    tenantId: tenant.id,
    userId: user?.id ?? "00000000-0000-0000-0000-000000000000",
    role: user ? "customer" : "customer",
  };

  // Fetch services, locations, and stylists in parallel
  const [tenantServices, tenantLocations, tenantStylists] = await Promise.all([
    withTenant(ctx, (tx) =>
      tx
        .select({
          id: services.id,
          name: services.name,
          price: services.price,
          durationMinutes: services.durationMinutes,
        })
        .from(services)
        .where(
          and(eq(services.tenantId, tenant.id), eq(services.isActive, true))
        )
        .orderBy(services.name)
    ),
    getTenantLocations(tenant.id),
    getTenantStylists(ctx),
  ]);

  if (tenantServices.length === 0) {
    return (
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[var(--color-foreground-muted)]">
            No services are currently available for booking. Please check back
            soon or{" "}
            <a
              href="/contact"
              className="text-[var(--color-tenant-primary)] underline underline-offset-2 hover:no-underline"
            >
              contact us
            </a>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-surface-brand)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Book an{" "}
            <span className="text-[var(--color-tenant-primary)]">
              appointment
            </span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-foreground-muted)]">
            Choose your service, preferred time, and stylist. We&apos;ll send a
            confirmation to your email.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <BookingForm
            subdomain={subdomain}
            services={tenantServices.map((s) => ({
              ...s,
              price: s.price,
            }))}
            locations={tenantLocations.map((l) => ({
              id: l.id,
              name: l.name,
              city: l.city,
            }))}
            stylists={tenantStylists}
            prefilledServiceId={sp.service}
            prefilledStylistId={sp.stylist}
            prefilledDate={sp.date}
          />
        </div>
      </section>
    </>
  );
}
