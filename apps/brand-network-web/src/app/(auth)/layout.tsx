import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center pt-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
            <svg
              aria-hidden="true"
              className="h-6 w-6"
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
          <h1 className="text-3xl font-bold tracking-tight font-display" style={{ color: "var(--color-text)" }}>
            TOP 10 PROM
          </h1>
          <p className="mt-2 text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--color-primary)" }}>
            Authorized Access Only
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
