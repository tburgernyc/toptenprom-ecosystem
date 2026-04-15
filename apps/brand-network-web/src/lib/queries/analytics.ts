import "server-only";
import { withTenant, type TenantContext } from "@brand-network/database";
import {
  bookings,
  userProfiles,
  locations,
  services,
} from "@brand-network/database/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StylistUtilizationRow {
  stylistId: string;
  displayName: string | null;
  completedBookings: number;
  totalMinutes: number;
}

export interface BookingMetricRow {
  status: string;
  count: number;
}

export interface LocationMetricRow {
  locationId: string;
  locationName: string;
  bookingCount: number;
}

export interface DashboardSummary {
  totalBookingsThisPeriod: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Period helpers
// ─────────────────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = "7d" | "30d" | "90d";

function periodStart(period: AnalyticsPeriod): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getStylistUtilization
// Returns booking counts and total service minutes per stylist for a period.
// All queries run inside withTenant to enforce RLS.
// ─────────────────────────────────────────────────────────────────────────────

export async function getStylistUtilization(
  ctx: TenantContext,
  period: AnalyticsPeriod
): Promise<StylistUtilizationRow[]> {
  const since = periodStart(period);

  return withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        stylistId: bookings.staffUserId,
        displayName: userProfiles.displayName,
        completedBookings: count(bookings.id),
        totalMinutes: sql<number>`COALESCE(SUM(${services.durationMinutes}), 0)`,
      })
      .from(bookings)
      .leftJoin(userProfiles, eq(bookings.staffUserId, userProfiles.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(
        and(
          eq(bookings.tenantId, ctx.tenantId),
          eq(bookings.status, "completed"),
          gte(bookings.scheduledAt, since)
        )
      )
      .groupBy(bookings.staffUserId, userProfiles.displayName)
      .orderBy(sql`COUNT(${bookings.id}) DESC`);

    return rows
      .filter((r): r is typeof r & { stylistId: string } => r.stylistId !== null)
      .map((r) => ({
        stylistId: r.stylistId,
        displayName: r.displayName,
        completedBookings: Number(r.completedBookings),
        totalMinutes: Number(r.totalMinutes),
      }));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// getDashboardSummary
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardSummary(
  ctx: TenantContext,
  period: AnalyticsPeriod
): Promise<DashboardSummary> {
  const since = periodStart(period);

  return withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        status: bookings.status,
        count: count(bookings.id),
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, ctx.tenantId),
          gte(bookings.scheduledAt, since)
        )
      )
      .groupBy(bookings.status);

    const byStatus = new Map(rows.map((r) => [r.status, Number(r.count)]));

    const totalBookingsThisPeriod = [...byStatus.values()].reduce(
      (a, b) => a + b,
      0
    );

    return {
      totalBookingsThisPeriod,
      completedBookings: byStatus.get("completed") ?? 0,
      pendingBookings: byStatus.get("pending") ?? 0,
      cancelledBookings: byStatus.get("cancelled") ?? 0,
      noShowBookings: byStatus.get("no_show") ?? 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// getLocationMetrics
// ─────────────────────────────────────────────────────────────────────────────

export async function getLocationMetrics(
  ctx: TenantContext,
  period: AnalyticsPeriod
): Promise<LocationMetricRow[]> {
  const since = periodStart(period);

  return withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        locationId: locations.id,
        locationName: locations.name,
        bookingCount: count(bookings.id),
      })
      .from(locations)
      .leftJoin(
        bookings,
        and(
          eq(bookings.locationId, locations.id),
          gte(bookings.scheduledAt, since)
        )
      )
      .where(eq(locations.tenantId, ctx.tenantId))
      .groupBy(locations.id, locations.name)
      .orderBy(sql`COUNT(${bookings.id}) DESC`);

    return rows.map((r) => ({
      locationId: r.locationId,
      locationName: r.locationName,
      bookingCount: Number(r.bookingCount),
    }));
  });
}
