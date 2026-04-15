"use server";

import { z } from "zod";
import { getGeminiModel } from "@/lib/gemini";
import { resolveTenant } from "@/lib/tenant";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  withTenant,
  type getDb,
  customers,
  bookings,
  services,
  locations,
} from "@brand-network/database";
import { eq, and, sql } from "drizzle-orm";
import type { TenantContext } from "@brand-network/database";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/**
 * Schema for Gemini structured output when parsing a natural-language
 * booking request into actionable fields.
 */
const bookingIntentSchema = z.object({
  /**
   * Detected service category, e.g. "haircut", "colour", "fitting", "styling".
   * null if the user's input does not clearly indicate a service type.
   */
  serviceKeyword: z.string().nullable(),
  /**
   * Preferred date in ISO 8601 format (YYYY-MM-DD). null if not detected.
   */
  preferredDate: z.string().nullable(),
  /**
   * Preferred time as an HH:MM string (24-hour). null if not detected.
   */
  preferredTime: z.string().nullable(),
  /**
   * Any special notes extracted from the user's message.
   */
  notes: z.string().nullable(),
  /**
   * Confidence 0-1 that the input is a genuine booking request.
   */
  confidence: z.number().min(0).max(1),
});

export type ParsedBookingIntent = z.infer<typeof bookingIntentSchema>;

// ---------------------------------------------------------------------------
// Booking action result types
// ---------------------------------------------------------------------------

export type BookingActionResult =
  | { status: "success"; confirmationCode: string; bookingId: string }
  | { status: "conflict"; message: string }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// Guest customer upsert / lookup
// ---------------------------------------------------------------------------

const customerUpsertSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email().max(320),
  phoneNumber: z.string().max(30).optional(),
});

type CustomerUpsertInput = z.infer<typeof customerUpsertSchema>;

/**
 * Finds or creates a customer record for the given tenant.
 * Must be called inside a withTenant() transaction.
 */
async function upsertCustomer(
  tx: ReturnType<typeof getDb>,
  tenantId: string,
  input: CustomerUpsertInput
): Promise<string> {
  const existing = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(eq(customers.tenantId, tenantId), eq(customers.email, input.email))
    )
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    return existing[0].id;
  }

  const inserted = await tx
    .insert(customers)
    .values({
      tenantId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
    })
    .returning({ id: customers.id });

  if (!inserted[0]) {
    throw new Error("Failed to create customer record");
  }

  return inserted[0].id;
}

// ---------------------------------------------------------------------------
// Confirmation code generator
// ---------------------------------------------------------------------------

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  // Use crypto.getRandomValues for unpredictable codes
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return code;
}

// ---------------------------------------------------------------------------
// parseBookingIntent — Gemini structured extraction
// ---------------------------------------------------------------------------

/**
 * Parses a natural-language booking request into structured fields using
 * Gemini 2.0 Flash with JSON output mode.
 *
 * Returns null if the model output fails Zod validation (treated as low-
 * confidence input — the caller should fall back to the manual form).
 */
export async function parseBookingIntent(
  input: string
): Promise<ParsedBookingIntent | null> {
  if (!input.trim()) return null;

  const model = getGeminiModel("gemini-2.0-flash");

  const prompt = `You are a booking assistant for a retail beauty and styling store.
Extract structured information from the customer's booking request.

Customer message: "${input.replace(/"/g, '\\"')}"

Today's date: ${new Date().toISOString().split("T")[0]}

Respond with a JSON object matching this shape exactly:
{
  "serviceKeyword": string | null,   // e.g. "haircut", "color", "fitting", "styling consultation"
  "preferredDate": string | null,    // ISO 8601 YYYY-MM-DD, resolved from relative dates like "tomorrow"
  "preferredTime": string | null,    // HH:MM 24-hour
  "notes": string | null,            // special requests or additional context
  "confidence": number               // 0.0-1.0 confidence this is a valid booking request
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as unknown;
    const validated = bookingIntentSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// createBooking — main server action
//
// OCC protocol:
//   1. Read current version_timestamp for the target service/location/slot
//   2. Within withTenant() transaction, INSERT booking
//   3. On unique constraint violation for the same slot, surface conflict
// ---------------------------------------------------------------------------

export async function createBooking(
  subdomain: string,
  formData: FormData
): Promise<BookingActionResult> {
  // 1. Resolve tenant from subdomain (never from client input)
  const tenant = await resolveTenant(subdomain);
  if (
    !tenant ||
    tenant.status === "suspended" ||
    tenant.status === "churned"
  ) {
    return { status: "error", message: "Store not found." };
  }

  // 2. Validate form fields
  const rawCustomer = customerUpsertSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber") ?? undefined,
  });

  if (!rawCustomer.success) {
    return {
      status: "error",
      message: rawCustomer.error.issues[0]?.message ?? "Invalid form data.",
    };
  }

  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const locationId = String(formData.get("locationId") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const staffUserId = String(formData.get("staffUserId") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!serviceId || !locationId || !scheduledAt) {
    return {
      status: "error",
      message: "Service, location, and date/time are required.",
    };
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return { status: "error", message: "Invalid appointment date/time." };
  }

  if (scheduledDate < new Date()) {
    return {
      status: "error",
      message: "Appointment must be in the future.",
    };
  }

  // 3. Build tenant context
  const user = await getAuthenticatedUser();
  const ctx: TenantContext = {
    tenantId: tenant.id,
    userId: user?.id ?? "00000000-0000-0000-0000-000000000000",
    role: user ? "customer" : "customer",
  };

  try {
    return await withTenant(ctx, async (tx) => {
      // 3a. Verify service belongs to this tenant
      const [service] = await tx
        .select({
          id: services.id,
          durationMinutes: services.durationMinutes,
        })
        .from(services)
        .where(
          and(
            eq(services.id, serviceId),
            eq(services.tenantId, tenant.id),
            eq(services.isActive, true)
          )
        )
        .limit(1);

      if (!service) {
        return { status: "error" as const, message: "Service not available." };
      }

      // 3b. Verify location belongs to this tenant
      const [location] = await tx
        .select({ id: locations.id })
        .from(locations)
        .where(
          and(
            eq(locations.id, locationId),
            eq(locations.tenantId, tenant.id),
            eq(locations.isActive, true)
          )
        )
        .limit(1);

      if (!location) {
        return {
          status: "error" as const,
          message: "Location not available.",
        };
      }

      // 3c. Calculate end time
      const endsAt = new Date(
        scheduledDate.getTime() + service.durationMinutes * 60_000
      );

      // 3d. OCC slot conflict check: reject if the staff member already has
      // a confirmed/pending booking overlapping this slot.
      if (staffUserId) {
        const overlapResult = await tx.execute(sql`
          SELECT 1 FROM bookings
          WHERE tenant_id   = ${tenant.id}
            AND staff_user_id = ${staffUserId}
            AND status NOT IN ('cancelled', 'no_show')
            AND scheduled_at < ${endsAt.toISOString()}
            AND ends_at     > ${scheduledDate.toISOString()}
          LIMIT 1
        `);

        if (Array.isArray(overlapResult) && overlapResult.length > 0) {
          return {
            status: "conflict" as const,
            message:
              "That time slot is no longer available. Please choose another time.",
          };
        }
      }

      // 3e. Upsert customer
      const customerId = await upsertCustomer(
        tx as ReturnType<typeof getDb>,
        tenant.id,
        rawCustomer.data
      );

      // 3f. Insert booking with OCC version_timestamp
      const confirmationCode = generateConfirmationCode();

      const [inserted] = await tx
        .insert(bookings)
        .values({
          tenantId: tenant.id,
          customerId,
          serviceId,
          locationId,
          staffUserId: staffUserId ?? undefined,
          status: "pending",
          scheduledAt: scheduledDate,
          endsAt,
          notes: notes ?? undefined,
          confirmationCode,
        })
        .returning({ id: bookings.id });

      if (!inserted) {
        return {
          status: "error" as const,
          message: "Failed to create booking. Please try again.",
        };
      }

      return {
        status: "success" as const,
        confirmationCode,
        bookingId: inserted.id,
      };
    });
  } catch (err) {
    console.error("[createBooking] Unexpected error:", err);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
