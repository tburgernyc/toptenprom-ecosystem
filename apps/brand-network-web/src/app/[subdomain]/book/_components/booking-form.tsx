"use client";

import {
  useState,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import { parseBookingIntent, createBooking } from "../actions";
import type {
  ParsedBookingIntent,
  BookingActionResult,
} from "../actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ServiceOption {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
}

interface LocationOption {
  id: string;
  name: string;
  city: string;
}

interface StylistOption {
  id: string;
  displayName: string | null;
}

interface BookingFormProps {
  subdomain: string;
  services: ServiceOption[];
  locations: LocationOption[];
  stylists: StylistOption[];
  prefilledServiceId?: string | undefined;
  prefilledStylistId?: string | undefined;
  prefilledDate?: string | undefined;
}

// ---------------------------------------------------------------------------
// Slot time options — every 30 min from 09:00-17:30
// ---------------------------------------------------------------------------

function buildTimeSlots(): { label: string; value: string }[] {
  const slots: { label: string; value: string }[] = [];
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m === 30) break;
      const hStr = String(h).padStart(2, "0");
      const mStr = String(m).padStart(2, "0");
      const label = new Date(`1970-01-01T${hStr}:${mStr}`).toLocaleTimeString(
        "en-US",
        { hour: "numeric", minute: "2-digit" }
      );
      slots.push({ label, value: `${hStr}:${mStr}` });
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

// ---------------------------------------------------------------------------
// Initial action state
// ---------------------------------------------------------------------------

const initialState: BookingActionResult | null = null;

// ---------------------------------------------------------------------------
// BookingForm
// ---------------------------------------------------------------------------

export function BookingForm({
  subdomain,
  services,
  locations,
  stylists,
  prefilledServiceId,
  prefilledStylistId,
  prefilledDate,
}: BookingFormProps) {
  // AI intent state
  const [aiInput, setAiInput] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiIntent, setAiIntent] = useState<ParsedBookingIntent | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form field state
  const [serviceId, setServiceId] = useState(prefilledServiceId ?? "");
  const [locationId, setLocationId] = useState(
    locations[0]?.id ?? ""
  );
  const [stylistId, setStylistId] = useState(prefilledStylistId ?? "");
  const [selectedDate, setSelectedDate] = useState(
    prefilledDate ?? new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState("10:00");

  // Form submission via useActionState (React 19)
  const [result, dispatch, isPending] = useActionState(
    async (_prev: BookingActionResult | null, formData: FormData) => {
      return createBooking(subdomain, formData);
    },
    initialState
  );

  const formRef = useRef<HTMLFormElement>(null);

  // Apply AI-parsed intent to form fields
  useEffect(() => {
    if (!aiIntent) return;
    if (aiIntent.preferredDate) setSelectedDate(aiIntent.preferredDate);
    if (aiIntent.preferredTime) setSelectedTime(aiIntent.preferredTime);
  }, [aiIntent]);

  // ---------------------------------------------------------------------------
  // AI intent handler
  // ---------------------------------------------------------------------------

  async function handleAiParse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAiParsing(true);
    setAiError(null);
    setAiIntent(null);

    const intent = await parseBookingIntent(aiInput);
    setAiParsing(false);

    if (!intent || intent.confidence < 0.3) {
      setAiError(
        "I couldn't understand that request. Please fill in the form below."
      );
      return;
    }

    setAiIntent(intent);
    // Auto-scroll to the main form
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------------------------------------------------------------------------
  // Render — success state
  // ---------------------------------------------------------------------------

  if (result?.status === "success") {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-xl)] border border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)] p-8 text-center"
      >
        <p className="text-5xl" aria-hidden="true">
          ✅
        </p>
        <h2 className="mt-4 text-xl font-semibold text-[var(--color-foreground)]">
          Booking confirmed!
        </h2>
        <p className="mt-2 text-[var(--color-foreground-muted)]">
          Your confirmation code is{" "}
          <strong className="font-mono text-[var(--color-foreground)]">
            {result.confirmationCode}
          </strong>
        </p>
        <p className="mt-1 text-sm text-[var(--color-foreground-subtle)]">
          You&apos;ll receive a confirmation email shortly.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-tenant-primary)] px-6 text-sm font-semibold text-[var(--color-foreground-on-brand)] transition-colors hover:bg-[var(--color-tenant-primary-hover)]"
        >
          Back to home
        </a>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — form
  // ---------------------------------------------------------------------------

  const todayISO = new Date().toISOString().split("T")[0]!;

  return (
    <div className="space-y-8">
      {/* AI intent input */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          Tell us what you&apos;re looking for{" "}
          <span className="ml-1 rounded-full bg-[var(--color-brand-primary-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-primary)]">
            AI
          </span>
        </h2>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
          Describe your ideal appointment in plain language and we&apos;ll
          pre-fill the form for you.
        </p>
        <form onSubmit={handleAiParse} className="mt-4 flex gap-3">
          <input
            id="ai-booking-input"
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="e.g. I'd like a haircut next Tuesday around 2pm"
            aria-label="Describe your booking request"
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
          />
          <button
            type="submit"
            disabled={aiParsing || !aiInput.trim()}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-tenant-primary)] px-4 text-sm font-semibold text-[var(--color-foreground-on-brand)] transition-colors hover:bg-[var(--color-tenant-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiParsing ? "Thinking…" : "Parse"}
          </button>
        </form>
        {aiError && (
          <p role="alert" className="mt-2 text-sm text-[var(--color-error)]">
            {aiError}
          </p>
        )}
        {aiIntent && aiIntent.confidence >= 0.3 && (
          <p
            role="status"
            className="mt-2 text-sm text-[var(--color-foreground-muted)]"
          >
            ✓ Got it
            {aiIntent.serviceKeyword && (
              <> — {aiIntent.serviceKeyword}</>
            )}
            {aiIntent.preferredDate && (
              <> on {aiIntent.preferredDate}</>
            )}
            {aiIntent.preferredTime && (
              <> at {aiIntent.preferredTime}</>
            )}
            . The form has been pre-filled below.
          </p>
        )}
      </div>

      {/* Error / conflict feedback */}
      {result?.status === "error" && (
        <div
          role="alert"
          className="rounded-[var(--radius-lg)] border border-[var(--color-error-subtle)] bg-[var(--color-error-subtle)] px-4 py-3 text-base sm:text-sm text-[var(--color-foreground)]"
        >
          {result.message}
        </div>
      )}
      {result?.status === "conflict" && (
        <div
          role="alert"
          className="rounded-[var(--radius-lg)] border border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)] px-4 py-3 text-base sm:text-sm text-[var(--color-foreground)]"
        >
          ⚠️ {result.message}
        </div>
      )}

      {/* Main booking form */}
      <form ref={formRef} action={dispatch} className="space-y-6">
        <fieldset className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
          <legend className="px-1 text-base font-semibold text-[var(--color-foreground)]">
            Your details
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                First name <span aria-hidden="true">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Last name <span aria-hidden="true">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Phone
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
          <legend className="px-1 text-base font-semibold text-[var(--color-foreground)]">
            Appointment details
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Service */}
            <div>
              <label
                htmlFor="serviceId"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Service <span aria-hidden="true">*</span>
              </label>
              <select
                id="serviceId"
                name="serviceId"
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              >
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${s.price} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="locationId"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Location <span aria-hidden="true">*</span>
              </label>
              <select
                id="locationId"
                name="locationId"
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}, {l.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Stylist (optional) */}
            {stylists.length > 0 && (
              <div>
                <label
                  htmlFor="staffUserId"
                  className="block text-sm font-medium text-[var(--color-foreground-muted)]"
                >
                  Stylist preference
                </label>
                <select
                  id="staffUserId"
                  name="staffUserId"
                  value={stylistId}
                  onChange={(e) => setStylistId(e.target.value)}
                  className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
                >
                  <option value="">No preference</option>
                  {stylists.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.displayName ?? "Stylist"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div>
              <label
                htmlFor="booking-date"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Date <span aria-hidden="true">*</span>
              </label>
              <input
                id="booking-date"
                type="date"
                required
                min={todayISO}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              />
            </div>

            {/* Time */}
            <div>
              <label
                htmlFor="booking-time"
                className="block text-sm font-medium text-[var(--color-foreground-muted)]"
              >
                Time <span aria-hidden="true">*</span>
              </label>
              <select
                id="booking-time"
                required
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              >
                {TIME_SLOTS.map((ts) => (
                  <option key={ts.value} value={ts.value}>
                    {ts.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hidden scheduledAt field — combines date + time */}
          <input
            type="hidden"
            name="scheduledAt"
            value={`${selectedDate}T${selectedTime}:00`}
          />

          {/* Notes */}
          <div className="mt-4">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-[var(--color-foreground-muted)]"
            >
              Special requests
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={aiIntent?.notes ?? ""}
              className="mt-1 block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base sm:text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tenant-primary)]"
              placeholder="Any special requests or notes for your stylist…"
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-tenant-primary)] px-8 text-sm font-semibold text-[var(--color-foreground-on-brand)] transition-colors hover:bg-[var(--color-tenant-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Booking…" : "Confirm appointment"}
        </button>
      </form>
    </div>
  );
}
