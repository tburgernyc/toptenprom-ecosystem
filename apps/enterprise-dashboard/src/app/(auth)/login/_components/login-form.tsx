"use client";

import { useState, useTransition } from "react";
import { Button } from "@brand-network/ui-design-system";
import { loginAction } from "../actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          placeholder="you@brand-network.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" loading={isPending}>
        Sign in
      </Button>
    </form>
  );
}
