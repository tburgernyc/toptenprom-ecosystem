"use client";

import { useState, useTransition } from "react";
import { createWalkInInquiry, type WalkInResult } from "../actions";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; inquiryId: string }
  | { status: "error"; message: string };

// ─────────────────────────────────────────────────────────────────────────────
// Shared input/label styles
// ─────────────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--color-text)]";

// ─────────────────────────────────────────────────────────────────────────────
// WalkInForm
// ─────────────────────────────────────────────────────────────────────────────

export function WalkInForm() {
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const isSubmitting = isPending || formState.status === "loading";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFormState({ status: "loading" });

    startTransition(async () => {
      const result: WalkInResult = await createWalkInInquiry(formData);
      if (result.status === "success") {
        setFormState({ status: "success", inquiryId: result.inquiryId });
      } else {
        setFormState({ status: "error", message: result.message });
      }
    });
  }

  function handleReset() {
    setFormState({ status: "idle" });
  }

  if (formState.status === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-subtle)]">
          <svg
            aria-hidden="true"
            className="h-6 w-6 text-[var(--color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Walk-in Logged
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            The inquiry has been saved and will appear in the front-desk queue.
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--color-text-subtle)]">
            ID: {formState.inquiryId}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Log Another Walk-in
          </button>
          <a
            href="/dashboard/receptionist/walk-in"
            className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-glow)] bg-[var(--color-bg)] px-5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-glass)]"
          >
            Back to Front Desk
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Customer info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First Name <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            maxLength={255}
            autoComplete="given-name"
            placeholder="Sarah"
            className={inputClass}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last Name <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            maxLength={255}
            autoComplete="family-name"
            placeholder="Johnson"
            className={inputClass}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          placeholder="sarah@example.com"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className={labelClass}>
          Phone Number
        </label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          placeholder="+1-555-000-1234"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="eventDate" className={labelClass}>
          Event Date
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="preferredDressStyle" className={labelClass}>
          Preferred Dress Style
        </label>
        <input
          id="preferredDressStyle"
          name="preferredDressStyle"
          type="text"
          maxLength={100}
          placeholder="A-line, ball gown, mermaid…"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Budget range, size preferences, color ideas…"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      {/* Error message */}
      {formState.status === "error" && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {formState.message}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Saving…
            </>
          ) : (
            "Log Walk-in"
          )}
        </button>
        <a
          href="/dashboard/receptionist/walk-in"
          className="text-sm text-[var(--color-text-muted)] underline underline-offset-2 hover:no-underline"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
