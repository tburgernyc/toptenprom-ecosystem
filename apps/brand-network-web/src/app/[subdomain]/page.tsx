// Tenant resolution and status enforcement are handled once by TenantShell
// in the parent layout. We only need params here to construct correct hrefs.
import Link from "next/link";

interface TenantHomePageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { subdomain } = await params;

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-surface-brand)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Welcome to our store
          </h1>
          <p className="mt-4 text-lg text-[var(--color-foreground-muted)]">
            Discover our full range of services and products. Book an
            appointment or shop online today.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/${subdomain}/book`}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-tenant-primary)] px-8 text-sm font-semibold text-[var(--color-foreground-on-brand)] transition-colors hover:bg-[var(--color-tenant-primary-hover)]"
            >
              Book an appointment
            </Link>
            {/* Catalog is a global route — no tenant-scoped catalog exists yet */}
            <Link
              href="/catalog"
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-8 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-overlay)]"
            >
              Browse catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Onboarding notice is handled at the layout level via TenantShell context. */}
    </>
  );
}
