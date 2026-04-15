"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  // GOOGLE_AI_API_KEY is required at runtime; undefined at build time is safe.
  apiKey: process.env.GOOGLE_AI_API_KEY!,
});
import { generateObject } from "ai";
import { z } from "zod";
import { requireDashboardSession } from "@/lib/auth-dashboard";
import {
  withTenant,
  getDb,
  boutiques,
  dresses,
  dressReservations,
} from "@brand-network/database";
import { eq } from "drizzle-orm";
import type { TenantContext } from "@brand-network/database";

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema for extracted dress attributes
// ─────────────────────────────────────────────────────────────────────────────

export const dressExtractionSchema = z.object({
  customerName: z
    .string()
    .describe("Customer's full name if mentioned"),
  style: z
    .string()
    .describe("Dress style: e.g. A-line, ball gown, mermaid, sheath, empire"),
  primaryColor: z
    .string()
    .describe("Primary dress color"),
  accentColor: z
    .string()
    .optional()
    .describe("Secondary or accent color if present"),
  fabric: z
    .string()
    .optional()
    .describe("Fabric type: e.g. chiffon, satin, tulle, lace, velvet"),
  size: z
    .string()
    .optional()
    .describe("Dress size as stated in the notes"),
  designer: z
    .string()
    .optional()
    .describe("Designer or brand name if mentioned"),
  neckline: z
    .string()
    .optional()
    .describe("Neckline style: e.g. sweetheart, strapless, v-neck, halter"),
  embellishments: z
    .array(z.string())
    .optional()
    .describe("List of embellishments: e.g. beading, sequins, lace trim"),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string().default("USD"),
    })
    .optional()
    .describe("Price range if mentioned"),
  notes: z
    .string()
    .optional()
    .describe("Any remaining details not captured above"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence level of the extraction based on input clarity"),
});

export type DressExtraction = z.infer<typeof dressExtractionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// extractDressDetails
//
// Given raw staff notes about a dress, uses AI to extract structured
// dress attributes using zod-validated structured output.
//
// SECURITY: session is validated server-side; no client-supplied tenant context.
// ─────────────────────────────────────────────────────────────────────────────

export async function extractDressDetails(formData: FormData): Promise<
  | { success: true; data: DressExtraction }
  | { success: false; error: string }
> {
  // Validate session — only owner/brand_admin can use the prom registry
  const session = await requireDashboardSession();
  if (
    session.role !== "super_admin" &&
    session.role !== "brand_admin" &&
    session.role !== "tenant_manager"
  ) {
    return { success: false, error: "Insufficient permissions." };
  }

  const rawNotes = formData.get("notes");
  if (typeof rawNotes !== "string" || rawNotes.trim().length === 0) {
    return { success: false, error: "Notes field is required." };
  }

  if (rawNotes.length > 4000) {
    return { success: false, error: "Notes must be under 4,000 characters." };
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: dressExtractionSchema,
      system:
        "You are a specialist assistant for a prom and bridal dress registry. " +
        "Extract structured dress details from staff notes. " +
        "Be precise and only include details explicitly stated or strongly implied. " +
        "If a field cannot be determined from the notes, omit it rather than guessing. " +
        "Set confidence to 'high' when notes are detailed, 'medium' for partial info, 'low' for vague notes.",
      prompt:
        `Extract dress registry details from these staff notes:\n\n${rawNotes}`,
    });

    return { success: true, data: object };
  } catch {
    return {
      success: false,
      error: "AI extraction failed. Please try again or enter details manually.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// saveToRegistry — server action
//
// Persists an AI-extracted dress entry as a dress_reservations row.
// A placeholder dress record is created if no matching dress is found
// in the catalog; the owner can link it to a catalog dress later.
//
// SECURITY:
//   - Session validated server-side
//   - tenantId resolved from session, never from client input
//   - boutiqueId resolved from tenantId server-side
// ─────────────────────────────────────────────────────────────────────────────

const saveToRegistrySchema = z.object({
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email().max(320),
  customerPhone: z.string().max(30).optional(),
  eventDate: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), "Invalid event date"),
  notes: z.string().max(2000).optional(),
  garmentAnalysis: z.record(z.unknown()),
  dressName: z.string().min(1).max(255),
  dressColor: z.string().max(100).optional(),
  dressCategory: z
    .enum(["prom", "wedding", "homecoming", "quinceanera", "formal", "other"])
    .default("prom"),
  basePrice: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(Number(v)),
      "Invalid price"
    ),
});

export type SaveToRegistryInput = z.infer<typeof saveToRegistrySchema>;

export type SaveToRegistryResult =
  | { status: "success"; reservationId: string }
  | { status: "error"; message: string };

export async function saveToRegistry(
  input: SaveToRegistryInput
): Promise<SaveToRegistryResult> {
  const session = await requireDashboardSession();

  if (
    session.role !== "super_admin" &&
    session.role !== "brand_admin" &&
    session.role !== "tenant_manager"
  ) {
    return { status: "error", message: "Insufficient permissions." };
  }

  if (!session.tenantId) {
    return {
      status: "error",
      message: "No boutique assigned to your account. Contact your administrator.",
    };
  }

  const validated = saveToRegistrySchema.safeParse(input);
  if (!validated.success) {
    const first = validated.error.issues[0];
    return { status: "error", message: first?.message ?? "Invalid input." };
  }

  const db = getDb();

  const ctx: TenantContext = {
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
  };

  try {
    // Resolve boutique from tenantId
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
      // Create a draft dress record for this registry entry.
      // Staff can later link it to an existing catalog dress.
      const [insertedDress] = await tx
        .insert(dresses)
        .values({
          boutiqueId: boutique.id,
          name: validated.data.dressName,
          category: validated.data.dressCategory,
          color: validated.data.dressColor ?? undefined,
          basePrice: validated.data.basePrice ?? "0.00",
          isActive: false, // draft until linked to catalog
        })
        .returning({ id: dresses.id });

      if (!insertedDress) {
        return {
          status: "error" as const,
          message: "Failed to create dress record. Please try again.",
        };
      }

      // Split customerName into first + last for storage
      const nameParts = validated.data.customerName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? validated.data.customerName;
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const [reservation] = await tx
        .insert(dressReservations)
        .values({
          boutiqueId: boutique.id,
          dressId: insertedDress.id,
          customerName: `${firstName} ${lastName}`.trim(),
          customerEmail: validated.data.customerEmail,
          customerPhone: validated.data.customerPhone ?? undefined,
          eventDate: validated.data.eventDate
            ? new Date(validated.data.eventDate)
            : undefined,
          notes: validated.data.notes ?? undefined,
          garmentAnalysis: validated.data.garmentAnalysis,
          status: "pending",
        })
        .returning({ id: dressReservations.id });

      if (!reservation) {
        return {
          status: "error" as const,
          message: "Failed to save reservation. Please try again.",
        };
      }

      return { status: "success" as const, reservationId: reservation.id };
    });
  } catch (err) {
    console.error("[saveToRegistry] Unexpected error:", err);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
