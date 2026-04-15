"use client";

import { useState, useTransition } from "react";
import { Button } from "@brand-network/ui-design-system";
import {
  extractDressDetails,
  saveToRegistry,
  type DressExtraction,
  type SaveToRegistryResult,
} from "../actions";

type ExtractionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: DressExtraction }
  | { status: "error"; message: string };

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; reservationId: string }
  | { status: "error"; message: string };

export function DressExtractionForm() {
  const [state, setState] = useState<ExtractionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({ status: "loading" });

    startTransition(async () => {
      const result = await extractDressDetails(formData);
      if (result.success) {
        setState({ status: "success", data: result.data });
      } else {
        setState({ status: "error", message: result.error });
      }
    });
  }

  function handleReset() {
    setState({ status: "idle" });
  }

  if (state.status === "success") {
    return <ExtractionResult data={state.data} onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="notes"
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          Staff Notes
        </label>
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">
          Enter any details about the dress — style, color, fabric, customer
          preferences, designer name, price range, etc.
        </p>
        <textarea
          id="notes"
          name="notes"
          rows={6}
          required
          maxLength={4000}
          placeholder="e.g. Customer Sarah wants a floor-length royal blue satin A-line gown, sweetheart neckline with beading along the bodice. Size 6-8. Budget around $400-600. Prefers Jovani or similar."
          className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        />
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {state.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending || state.status === "loading"}>
          Extract with AI
        </Button>
        <p className="text-xs text-[var(--color-text-subtle)]">
          AI will extract structured dress attributes from your notes.
        </p>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SaveToRegistryForm — collects customer contact info before saving
// ─────────────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60";

function SaveToRegistryForm({
  data,
  onSaved,
  onCancel,
}: {
  data: DressExtraction;
  onSaved: (reservationId: string) => void;
  onCancel: () => void;
}) {
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const isSubmitting = isPending || saveState.status === "saving";

  function handleSaveSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setSaveState({ status: "saving" });

    startTransition(async () => {
      const result: SaveToRegistryResult = await saveToRegistry({
        customerName: (formEl.elements.namedItem("customerName") as HTMLInputElement).value,
        customerEmail: (formEl.elements.namedItem("customerEmail") as HTMLInputElement).value,
        customerPhone: (formEl.elements.namedItem("customerPhone") as HTMLInputElement).value || undefined,
        eventDate: (formEl.elements.namedItem("eventDate") as HTMLInputElement).value || undefined,
        notes: data.notes,
        garmentAnalysis: data as unknown as Record<string, unknown>,
        dressName: `${data.style ?? "Dress"} – ${data.primaryColor ?? "Unknown"}`.trim(),
        dressColor: data.primaryColor,
        dressCategory: "prom",
        basePrice: data.priceRange
          ? String((data.priceRange.min + data.priceRange.max) / 2)
          : undefined,
      });

      if (result.status === "success") {
        setSaveState({ status: "saved", reservationId: result.reservationId });
        onSaved(result.reservationId);
      } else {
        setSaveState({ status: "error", message: result.message });
      }
    });
  }

  return (
    <form onSubmit={handleSaveSubmit} className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--color-text)]">
        Customer Details
      </h4>
      <p className="text-xs text-[var(--color-text-muted)]">
        Enter the customer&apos;s contact information to complete the registry entry.
      </p>

      <div>
        <label htmlFor="reg-customerName" className="mb-1.5 block text-xs font-medium text-[var(--color-text)]">
          Customer Name <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="reg-customerName"
          name="customerName"
          type="text"
          required
          maxLength={255}
          defaultValue={data.customerName ?? ""}
          placeholder="Full name"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="reg-customerEmail" className="mb-1.5 block text-xs font-medium text-[var(--color-text)]">
          Email <span aria-hidden="true" className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="reg-customerEmail"
          name="customerEmail"
          type="email"
          required
          maxLength={320}
          placeholder="customer@example.com"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reg-customerPhone" className="mb-1.5 block text-xs font-medium text-[var(--color-text)]">
            Phone
          </label>
          <input
            id="reg-customerPhone"
            name="customerPhone"
            type="tel"
            maxLength={30}
            placeholder="+1-555-000-1234"
            className={inputClass}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="reg-eventDate" className="mb-1.5 block text-xs font-medium text-[var(--color-text)]">
            Event Date
          </label>
          <input
            id="reg-eventDate"
            name="eventDate"
            type="date"
            className={inputClass}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {saveState.status === "error" && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {saveState.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isSubmitting}>
          Confirm & Save
        </Button>
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Back
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExtractionResult — displays AI-extracted fields for review
// ─────────────────────────────────────────────────────────────────────────────

function ExtractionResult({
  data,
  onReset,
}: {
  data: DressExtraction;
  onReset: () => void;
}) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const confidenceColor: Record<string, string> = {
    high: "var(--color-success)",
    medium: "var(--color-warning)",
    low: "var(--color-danger)",
  };

  const fields: Array<{ label: string; value: string | undefined }> = [
    { label: "Customer Name", value: data.customerName },
    { label: "Style", value: data.style },
    { label: "Primary Color", value: data.primaryColor },
    { label: "Accent Color", value: data.accentColor },
    { label: "Fabric", value: data.fabric },
    { label: "Size", value: data.size },
    { label: "Designer", value: data.designer },
    { label: "Neckline", value: data.neckline },
    {
      label: "Embellishments",
      value: data.embellishments?.join(", "),
    },
    {
      label: "Price Range",
      value: data.priceRange
        ? `${data.priceRange.currency} ${data.priceRange.min}–${data.priceRange.max}`
        : undefined,
    },
    { label: "Notes", value: data.notes },
  ].filter((f): f is { label: string; value: string } => typeof f.value === "string" && f.value.length > 0);

  if (savedId) {
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
          <p className="text-sm font-semibold text-[var(--color-text)]">Saved to Registry</p>
          <p className="mt-1 font-mono text-xs text-[var(--color-text-subtle)]">
            Reservation ID: {savedId}
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={onReset}>
          Extract Another
        </Button>
      </div>
    );
  }

  if (showSaveForm) {
    return (
      <SaveToRegistryForm
        data={data}
        onSaved={(id) => setSavedId(id)}
        onCancel={() => setShowSaveForm(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Confidence badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          AI Extraction Result
        </h3>
        <span
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            color: confidenceColor[data.confidence] ?? "var(--color-text)",
            backgroundColor: `color-mix(in oklch, ${confidenceColor[data.confidence] ?? "var(--color-text)"} 15%, transparent)`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                confidenceColor[data.confidence] ?? "var(--color-text)",
            }}
          />
          {data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)}{" "}
          confidence
        </span>
      </div>

      {/* Extracted fields grid */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[var(--radius-md)] bg-[var(--color-bg-glass)] px-3 py-2"
          >
            <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
        <Button
          variant="primary"
          type="button"
          onClick={() => setShowSaveForm(true)}
        >
          Save to Registry
        </Button>
        <Button variant="secondary" type="button" onClick={onReset}>
          Extract Another
        </Button>
      </div>

      <p className="text-xs text-[var(--color-text-subtle)]">
        Review the extracted details above before saving. You can edit fields
        after saving.
      </p>
    </div>
  );
}
