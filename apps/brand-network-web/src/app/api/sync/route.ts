import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  withTenant,
  getDb,
  tenants,
  customers,
  bookings,
  mobileSyncQueue,
  userProfiles,
} from "@brand-network/database";
import type { TenantContext } from "@brand-network/database";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Route config
// ─────────────────────────────────────────────────────────────────────────────
// Exported segment configs removed due to Next.js 16 cacheComponents incompatibility

// ─────────────────────────────────────────────────────────────────────────────
// Request / response schemas
// ─────────────────────────────────────────────────────────────────────────────

const pushChangeSchema = z.object({
  localId: z.string().min(1),
  serverId: z.string().uuid().nullable(),
  table: z.enum(["customers", "bookings"]),
  operation: z.enum(["insert", "update", "delete"]),
  payload: z.record(z.unknown()),
  clientVersionTimestamp: z.string().datetime(),
});

const syncRequestSchema = z.object({
  device_id: z.string().min(1).max(255),
  tenant_id: z.string().uuid(),
  changes: z.array(pushChangeSchema).max(100),
  last_pull_timestamp: z.string().datetime().nullable().optional(),
});

type PushChange = z.infer<typeof pushChangeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Response types
// ─────────────────────────────────────────────────────────────────────────────

interface AppliedChange {
  localId: string;
  serverId: string;
  table: string;
  confirmationCode?: string;
}

interface ServerConflict {
  localId: string;
  table: string;
  serverState: Record<string, unknown>;
  clientState: Record<string, unknown>;
  recordLabel: string;
}

interface PullChange {
  table: string;
  serverId: string;
  operation: "upsert" | "delete";
  payload: Record<string, unknown>;
}

interface SyncResponse {
  applied: AppliedChange[];
  conflicts: ServerConflict[];
  serverChanges: PullChange[];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sync
//
// Security:
//   1. Requires authenticated Supabase session (staff JWT)
//   2. tenant_id in body cross-checked against the user's profile tenant_id
//      — server-derived, never trusted from client alone.
//   3. super_admin may sync any tenant; all other roles must match.
//   4. All queries run inside withTenant() which sets RLS session variables.
//   5. OCC: reject any push whose clientVersionTimestamp ≤ server version_timestamp.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth check
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = syncRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const { device_id, tenant_id, changes, last_pull_timestamp } = parsed.data;

  const db = getDb();

  // 3. Load user profile — resolve role and tenant membership server-side
  const [profile] = await db
    .select({ tenantId: userProfiles.tenantId, role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }

  // 4. Tenant membership check
  const isSuperAdmin = profile.role === "super_admin";
  if (!isSuperAdmin && profile.tenantId !== tenant_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5. Load tenant and verify active
  const [tenant] = await db
    .select({
      id: tenants.id,
      status: tenants.status,
    })
    .from(tenants)
    .where(eq(tenants.id, tenant_id))
    .limit(1);

  if (!tenant || tenant.status === "suspended" || tenant.status === "churned") {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const ctx: TenantContext = {
    tenantId: tenant.id,
    userId: user.id,
    role: profile.role,
  };

  // 6. Process sync inside RLS transaction
  try {
    const result = await withTenant(ctx, async (tx) => {
      const applied: AppliedChange[] = [];
      const conflicts: ServerConflict[] = [];

      // ── Push phase ──────────────────────────────────────────────────────
      for (const change of changes) {
        const outcome = await processChange(
          tx,
          tenant.id,
          device_id,
          change
        );
        if (outcome.type === "applied") {
          applied.push(outcome.value);
        } else {
          conflicts.push(outcome.value);
        }
      }

      // ── Pull phase ───────────────────────────────────────────────────────
      const serverChanges = await pullChanges(
        tx,
        tenant.id,
        last_pull_timestamp ?? null
      );

      return { applied, conflicts, serverChanges };
    });

    const response: SyncResponse = result;
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[/api/sync] Sync failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// processChange — routes to table-specific handler
// ─────────────────────────────────────────────────────────────────────────────

type ChangeOutcome =
  | { type: "applied"; value: AppliedChange }
  | { type: "conflict"; value: ServerConflict };

async function processChange(
  tx: ReturnType<typeof getDb>,
  tenantId: string,
  deviceId: string,
  change: PushChange
): Promise<ChangeOutcome> {
  const clientVersion = new Date(change.clientVersionTimestamp);

  if (change.table === "customers") {
    return processCustomerChange(tx, tenantId, deviceId, change, clientVersion);
  }
  return processBookingChange(tx, tenantId, deviceId, change, clientVersion);
}

// ─────────────────────────────────────────────────────────────────────────────
// processCustomerChange
// ─────────────────────────────────────────────────────────────────────────────

async function processCustomerChange(
  tx: ReturnType<typeof getDb>,
  tenantId: string,
  deviceId: string,
  change: PushChange,
  clientVersion: Date
): Promise<ChangeOutcome> {
  const p = change.payload;

  const firstName = String(p["first_name"] ?? "");
  const lastName = String(p["last_name"] ?? "");
  const email = String(p["email"] ?? "");
  const phoneNumber =
    p["phone_number"] != null ? String(p["phone_number"]) : null;

  if (change.operation === "insert") {
    // Check for email collision within tenant
    const [existing] = await tx
      .select({ id: customers.id, versionTimestamp: customers.versionTimestamp })
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.email, email)))
      .limit(1);

    if (existing) {
      const [serverState] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, existing.id))
        .limit(1);

      return {
        type: "conflict",
        value: {
          localId: change.localId,
          table: "customers",
          recordLabel: `${firstName} ${lastName} (${email})`,
          clientState: p,
          serverState: serverState as unknown as Record<string, unknown>,
        },
      };
    }

    const [inserted] = await tx
      .insert(customers)
      .values({
        tenantId,
        email,
        firstName,
        lastName,
        phoneNumber: phoneNumber ?? undefined,
        versionTimestamp: clientVersion,
      })
      .returning({ id: customers.id });

    if (!inserted) throw new Error("Customer insert returned no row");

    await recordSyncAudit(
      tx,
      tenantId,
      deviceId,
      "customers",
      inserted.id,
      "insert"
    );

    return {
      type: "applied",
      value: {
        localId: change.localId,
        serverId: inserted.id,
        table: "customers",
      },
    };
  }

  if (change.operation === "update") {
    if (!change.serverId) {
      return conflictResponse(change.localId, "customers", email, p, {});
    }

    const [current] = await tx
      .select({ id: customers.id, versionTimestamp: customers.versionTimestamp })
      .from(customers)
      .where(
        and(
          eq(customers.id, change.serverId),
          eq(customers.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!current) {
      return conflictResponse(change.localId, "customers", email, p, {
        message: "Record not found.",
      });
    }

    if (current.versionTimestamp > clientVersion) {
      const [serverState] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, change.serverId))
        .limit(1);

      return conflictResponse(
        change.localId,
        "customers",
        email,
        p,
        serverState as unknown as Record<string, unknown>
      );
    }

    await tx
      .update(customers)
      .set({
        firstName,
        lastName,
        phoneNumber: phoneNumber ?? undefined,
        versionTimestamp: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, change.serverId),
          eq(customers.tenantId, tenantId)
        )
      );

    await recordSyncAudit(
      tx,
      tenantId,
      deviceId,
      "customers",
      change.serverId,
      "update"
    );

    return {
      type: "applied",
      value: {
        localId: change.localId,
        serverId: change.serverId,
        table: "customers",
      },
    };
  }

  // delete — not permitted from mobile
  return conflictResponse(change.localId, "customers", email, p, {
    message: "Delete not permitted from mobile.",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// processBookingChange
// ─────────────────────────────────────────────────────────────────────────────

async function processBookingChange(
  tx: ReturnType<typeof getDb>,
  tenantId: string,
  deviceId: string,
  change: PushChange,
  clientVersion: Date
): Promise<ChangeOutcome> {
  const p = change.payload;

  const serviceId = String(p["service_id"] ?? "");
  const locationId = String(p["location_id"] ?? "");
  const staffUserId =
    p["staff_user_id"] != null ? String(p["staff_user_id"]) : null;
  const status = String(p["status"] ?? "pending");
  const scheduledAt =
    typeof p["scheduled_at"] === "string"
      ? new Date(p["scheduled_at"])
      : new Date();
  const endsAt =
    typeof p["ends_at"] === "string" ? new Date(p["ends_at"]) : new Date();
  const notes = p["notes"] != null ? String(p["notes"]) : null;
  const confirmationCode =
    p["confirmation_code"] != null
      ? String(p["confirmation_code"])
      : generateConfirmationCode();
  const recordLabel = `Booking at ${scheduledAt.toLocaleString()}`;

  // Resolve customer server_id to DB id
  let customerId: string | null = null;
  if (typeof p["customer_server_id"] === "string") {
    const [cust] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, p["customer_server_id"]),
          eq(customers.tenantId, tenantId)
        )
      )
      .limit(1);
    customerId = cust?.id ?? null;
  }

  if (!customerId) {
    return conflictResponse(change.localId, "bookings", recordLabel, p, {
      message: "Customer not found on server. Sync customer record first.",
    });
  }

  if (change.operation === "insert") {
    // OCC slot conflict check
    if (staffUserId) {
      const overlap = await tx.execute(sql`
        SELECT 1 FROM bookings
        WHERE tenant_id     = ${tenantId}
          AND staff_user_id = ${staffUserId}
          AND status NOT IN ('cancelled', 'no_show')
          AND scheduled_at  < ${endsAt.toISOString()}
          AND ends_at       > ${scheduledAt.toISOString()}
        LIMIT 1
      `);

      if (Array.isArray(overlap) && overlap.length > 0) {
        return conflictResponse(change.localId, "bookings", recordLabel, p, {
          message: "Time slot already booked for this staff member.",
          scheduled_at: scheduledAt.toISOString(),
        });
      }
    }

    const [inserted] = await tx
      .insert(bookings)
      .values({
        tenantId,
        customerId,
        serviceId,
        locationId,
        staffUserId: staffUserId ?? undefined,
        status: status as "pending",
        scheduledAt,
        endsAt,
        notes: notes ?? undefined,
        confirmationCode,
        versionTimestamp: clientVersion,
      })
      .returning({
        id: bookings.id,
        confirmationCode: bookings.confirmationCode,
      });

    if (!inserted) throw new Error("Booking insert returned no row");

    await recordSyncAudit(
      tx,
      tenantId,
      deviceId,
      "bookings",
      inserted.id,
      "insert"
    );

    const appliedValue: AppliedChange = {
      localId: change.localId,
      serverId: inserted.id,
      table: "bookings",
    };
    if (inserted.confirmationCode != null) {
      appliedValue.confirmationCode = inserted.confirmationCode;
    }

    return { type: "applied", value: appliedValue };
  }

  if (change.operation === "update") {
    if (!change.serverId) {
      return conflictResponse(change.localId, "bookings", recordLabel, p, {});
    }

    const [current] = await tx
      .select({ id: bookings.id, versionTimestamp: bookings.versionTimestamp })
      .from(bookings)
      .where(
        and(
          eq(bookings.id, change.serverId),
          eq(bookings.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!current) {
      return conflictResponse(change.localId, "bookings", recordLabel, p, {
        message: "Booking not found.",
      });
    }

    if (current.versionTimestamp > clientVersion) {
      const [serverState] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, change.serverId))
        .limit(1);

      return conflictResponse(
        change.localId,
        "bookings",
        recordLabel,
        p,
        serverState as unknown as Record<string, unknown>
      );
    }

    await tx
      .update(bookings)
      .set({
        status: status as "pending",
        scheduledAt,
        endsAt,
        notes: notes ?? undefined,
        versionTimestamp: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookings.id, change.serverId),
          eq(bookings.tenantId, tenantId)
        )
      );

    await recordSyncAudit(
      tx,
      tenantId,
      deviceId,
      "bookings",
      change.serverId,
      "update"
    );

    return {
      type: "applied",
      value: {
        localId: change.localId,
        serverId: change.serverId,
        table: "bookings",
      },
    };
  }

  return conflictResponse(change.localId, "bookings", recordLabel, p, {
    message: "Delete not permitted from mobile.",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// pullChanges
// ─────────────────────────────────────────────────────────────────────────────

async function pullChanges(
  tx: ReturnType<typeof getDb>,
  tenantId: string,
  since: string | null
): Promise<PullChange[]> {
  const sinceDate = since ? new Date(since) : new Date(0);
  const pullList: PullChange[] = [];

  const updatedCustomers = await tx
    .select()
    .from(customers)
    .where(
      and(eq(customers.tenantId, tenantId), gte(customers.updatedAt, sinceDate))
    )
    .limit(200);

  for (const c of updatedCustomers) {
    pullList.push({
      table: "customers",
      serverId: c.id,
      operation: "upsert",
      payload: {
        tenant_id: c.tenantId,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        phone_number: c.phoneNumber,
        version_timestamp: c.versionTimestamp?.toISOString() ?? null,
      },
    });
  }

  const updatedBookings = await tx
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.tenantId, tenantId), gte(bookings.updatedAt, sinceDate))
    )
    .limit(200);

  for (const b of updatedBookings) {
    pullList.push({
      table: "bookings",
      serverId: b.id,
      operation: "upsert",
      payload: {
        tenant_id: b.tenantId,
        customer_id: b.customerId,
        service_id: b.serviceId,
        location_id: b.locationId,
        staff_user_id: b.staffUserId,
        status: b.status,
        scheduled_at: b.scheduledAt.toISOString(),
        ends_at: b.endsAt.toISOString(),
        notes: b.notes,
        confirmation_code: b.confirmationCode,
        version_timestamp: b.versionTimestamp?.toISOString() ?? null,
      },
    });
  }

  return pullList;
}

// ─────────────────────────────────────────────────────────────────────────────
// recordSyncAudit
// ─────────────────────────────────────────────────────────────────────────────

async function recordSyncAudit(
  tx: ReturnType<typeof getDb>,
  tenantId: string,
  deviceId: string,
  tableName: string,
  recordId: string,
  operation: string
): Promise<void> {
  await tx.insert(mobileSyncQueue).values({
    tenantId,
    deviceId,
    tableName,
    recordId,
    operation,
    payload: {},
    clientTimestamp: new Date(),
    syncStatus: "synced",
    syncedAt: new Date(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function conflictResponse(
  localId: string,
  table: string,
  recordLabel: string,
  clientState: Record<string, unknown>,
  serverState: Record<string, unknown>
): { type: "conflict"; value: ServerConflict } {
  return {
    type: "conflict",
    value: { localId, table, recordLabel, clientState, serverState },
  };
}

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return code;
}
