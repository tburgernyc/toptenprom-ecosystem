import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { resolveTenant } from "@/lib/tenant";
import { TryOnForm } from "./_components/try-on-form";

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface TryOnPageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({
  params,
}: TryOnPageProps): Promise<Metadata> {
  try {
    const { subdomain } = await params;
    const tenant = await resolveTenant(subdomain);
    if (!tenant) return { title: "Virtual Try-On" };
    return {
      title: "Virtual Try-On",
      description: `Upload a photo of any garment and get expert AI styling recommendations from ${tenant.name}.`,
    };
  } catch {
    return { title: "Virtual Try-On" };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TryOnPage({ params }: TryOnPageProps) {
  // Signals a live HTTP request — prevents stale cached tenant status
  // from being served if the tenant was recently suspended.
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

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-surface-brand)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Virtual{" "}
            <span className="text-[var(--color-tenant-primary)]">try-on</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-foreground-muted)]">
            Upload a photo of any garment — dress, blazer, or outfit — and our
            AI stylist will analyse it and give you personalised recommendations.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ol className="flex flex-col gap-6 sm:flex-row sm:gap-0">
            {[
              { step: "1", label: "Upload a photo", detail: "Any garment, any angle" },
              { step: "2", label: "AI analyses the look", detail: "Style, colour, and occasion matching" },
              { step: "3", label: "Get recommendations", detail: "Tips, pairings, and booking CTA" },
            ].map(({ step, label, detail }, i, arr) => (
              <li key={step} className="flex flex-1 items-center gap-4 sm:gap-0">
                <div className="flex flex-col items-center text-center sm:flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-tenant-primary)] text-sm font-bold text-[var(--color-foreground-on-brand)]">
                    {step}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-foreground-muted)]">
                    {detail}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden h-px w-12 bg-[var(--color-border)] sm:block sm:flex-shrink-0"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <TryOnForm />
        </div>
      </section>
    </>
  );
}
