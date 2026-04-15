import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--color-surface-brand)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-brand-primary)]">
            <svg
              aria-hidden="true"
              className="h-6 w-6 text-[var(--color-foreground-on-brand)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Brand Network
          </h1>
          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
            Enterprise Dashboard
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
