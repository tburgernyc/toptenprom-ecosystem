import "server-only";

import { createStreamableUI } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  // GOOGLE_AI_API_KEY is required at runtime; undefined at build time is safe.
  apiKey: process.env.GOOGLE_AI_API_KEY!,
});
import { generateText } from "ai";
import { z } from "zod";
import type { ReactNode } from "react";
import type { TenantContext } from "@brand-network/database";
import {
  getStylistUtilization,
  getDashboardSummary,
} from "@/lib/queries/analytics";
import { StylistUtilizationChart } from "@/components/StylistUtilizationChart";
import { ChartSkeleton } from "@/components/ChartSkeleton";

// ─────────────────────────────────────────────────────────────────────────────
// Zod schemas for AI tool parameters
// ─────────────────────────────────────────────────────────────────────────────

export const stylistUtilizationParamsSchema = z.object({
  period: z
    .enum(["7d", "30d", "90d"])
    .describe("The time period to analyze: 7d, 30d, or 90d"),
  locationId: z
    .string()
    .uuid()
    .optional()
    .describe("Optional: filter to a specific location UUID"),
});

export const dashboardSummaryParamsSchema = z.object({
  period: z
    .enum(["7d", "30d", "90d"])
    .describe("The time period to summarize: 7d, 30d, or 90d"),
});

export type StylistUtilizationParams = z.infer<
  typeof stylistUtilizationParamsSchema
>;
export type DashboardSummaryParams = z.infer<
  typeof dashboardSummaryParamsSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// streamStylistAnalytics
//
// Returns a streamable UI value. Immediately yields the skeleton while
// the DB query resolves, then renders the final chart.
//
// SECURITY: tenantContext is always server-derived, never client-supplied.
// ─────────────────────────────────────────────────────────────────────────────

export async function streamStylistAnalytics(
  tenantContext: TenantContext,
  params: StylistUtilizationParams
): Promise<ReactNode> {
  const stream = createStreamableUI(<ChartSkeleton label="Loading stylist utilization…" />);

  // Kick off async resolution without awaiting — stream resolves when done
  void (async () => {
    try {
      const validParams = stylistUtilizationParamsSchema.parse(params);
      const data = await getStylistUtilization(tenantContext, validParams.period);

      stream.done(
        <StylistUtilizationChart data={data} period={validParams.period} />
      );
    } catch {
      stream.done(
        <div
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          Failed to load stylist utilization data. Please try again.
        </div>
      );
    }
  })();

  return stream.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateAnalyticsSummary
//
// Uses the LLM to produce a natural-language summary of dashboard metrics.
// Result is plain text — rendered by the caller.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAnalyticsSummary(
  tenantContext: TenantContext,
  params: DashboardSummaryParams
): Promise<string> {
  const validParams = dashboardSummaryParamsSchema.parse(params);
  const summary = await getDashboardSummary(tenantContext, validParams.period);

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    system:
      "You are an analytics assistant for a multi-location beauty and prom dress retail network. " +
      "Provide concise, actionable insights (2-3 sentences max). " +
      "Focus on trends, anomalies, and specific recommendations for salon managers.",
    prompt:
      `Analyze these booking metrics for the ${validParams.period} period:\n` +
      `- Total bookings: ${summary.totalBookingsThisPeriod}\n` +
      `- Completed: ${summary.completedBookings}\n` +
      `- Pending: ${summary.pendingBookings}\n` +
      `- Cancelled: ${summary.cancelledBookings}\n` +
      `- No-shows: ${summary.noShowBookings}\n\n` +
      "Provide a brief performance summary and one actionable recommendation.",
  });

  return text;
}
