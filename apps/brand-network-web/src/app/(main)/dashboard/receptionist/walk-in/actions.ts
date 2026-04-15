"use server";

import { z } from "zod";
import { requireDashboardSession } from "@/lib/auth-dashboard";
import {
  withTenant,
  availabilityInquiries,
  boutiques,
  getDb,
} from "@brand-network/database";
import { eq } from "drizzle-orm";
import type { TenantContext } from "@brand-network/database";

// ─────────────────────────────────────────────────────────────────────────────
// Input schema
// ─────────────────────────────────────────────────────────────────────────────

const walkInSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Invalid email address").max(320),
  phoneNumber: z.string().max(30).optional(),
  eventDate: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(Date.parse(v)),
      "Invalid event date"
    ),
  preferredDressStyle: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────────────────────────────────────

export type WalkInResult =
  | { status: "success"; inquiryId: string }
  | { status: "error"; message: string };

// ─────────────────────────────────────────────────────────────────────────────
// createWalkInInquiry — server action
//
// Resolves the boutique_id from the authenticated user's tenantId, then
// writes a new availability_inquiries record via withTenant().
//
// SECURITY: tenantId comes from the server-side session, never from the client.
// ─────────────────────────────────────────────────────────────────────────────

export async function createWalkInInquiry(
  formData: FormData
): Promise<WalkInResult> {
  const session = await requireDashboardSession();

  // All dashboard staff roles can log a walk-in
  if (!session.tenantId) {
    return {
      status: "error",
      message: "No boutique assigned to your account. Contact your administrator.",
    };
  }

  const raw = walkInSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    preferredDressStyle: formData.get("preferredDressStyle") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!raw.success) {
    const firstError = raw.error.issues[0];
    return {
      status: "error",
      message: firstError?.message ?? "Invalid form data.",
    };
  }

  const db = getDb();

  const ctx: TenantContext = {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
  };

  try {
    // Resolve boutique from tenantId (tenantId maps to boutique.tenantId)
    const [boutique] = await db
      .select({ id: boutiques.id })
      .from(boutiques)
      .where(eq(boutiques.tenantId, session.tenantId))
      .limit(1);

    if (!boutique) {
      return {
        status: "error",
        message: "No boutique found for your account. Contact your administrator.",
      };
    }

    return await withTenant(ctx, async (tx) => {
      const [inserted] = await tx
        .insert(availabilityInquiries)
        .values({
          boutiqueId: boutique.id,
          firstName: raw.data.firstName,
          lastName: raw.data.lastName,
          email: raw.data.email,
          phoneNumber: raw.data.phoneNumber ?? undefined,
          eventDate: raw.data.eventDate
            ? new Date(raw.data.eventDate)
            : undefined,
          preferredDressStyle: raw.data.preferredDressStyle ?? undefined,
          notes: raw.data.notes ?? undefined,
          status: "new",
        })
        .returning({ id: availabilityInquiries.id });

      if (!inserted) {
        return { status: "error" as const, message: "Failed to save inquiry. Please try again." };
      }

      return { status: "success" as const, inquiryId: inserted.id };
    });
  } catch (err) {
    console.error("[createWalkInInquiry] Unexpected error:", err);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
