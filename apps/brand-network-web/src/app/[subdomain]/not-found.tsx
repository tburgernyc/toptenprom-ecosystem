import Link from "next/link";

// ---------------------------------------------------------------------------
// Tenant-level 404 boundary — shown when notFound() is thrown inside any
// [subdomain]/* route. Rendered inside TenantShell so tenant CSS variables
// (including --color-tenant-primary) are available.
// ---------------------------------------------------------------------------

export default function TenantNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-[var(--radius-card)] border p-8 text-center backdrop-blur-md"
        style={{
          background: "var(--color-surface)/60",
          borderColor: "var(--color-border-glow)",
          boxShadow: "0 8px 32px var(--color-primary-glow)",
        }}
      >
        <p
          className="mb-2 text-6xl font-bold leading-none"
          style={{ color: "var(--color-tenant-primary)" }}
          aria-hidden="true"
        >
          404
        </p>
        <h1
          className="mb-2 text-xl font-semibold"
          style={{ color: "var(--color-foreground)" }}
        >
          Page not found
        </h1>
        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist at this boutique.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition-colors"
            style={{
              background: "var(--color-tenant-primary)",
              color: "var(--color-foreground-on-brand)",
            }}
          >
            Go home
          </Link>
          <Link
            href="/network"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border px-6 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground-muted)",
            }}
          >
            Find a boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
