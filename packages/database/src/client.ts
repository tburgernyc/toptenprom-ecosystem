import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema.ts";
import * as relations from "./relations.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Singleton connection (server-side only)
// ─────────────────────────────────────────────────────────────────────────────

let _client: ReturnType<typeof postgres> | undefined;

function getPostgresClient(): ReturnType<typeof postgres> {
  if (_client) return _client;

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env.local file."
    );
  }

  _client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return _client;
}

export function getDb() {
  return drizzle(getPostgresClient(), {
    schema: { ...schema, ...relations },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant context types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// withTenant — MANDATORY wrapper for all tenant-scoped DB operations.
//
// Sets PostgreSQL session variables consumed by RLS policies:
//   app.current_tenant  → used in RLS: current_setting('app.current_tenant')
//   app.current_user_id → used in RLS: current_setting('app.current_user_id')
//   app.current_role    → used in RLS: current_setting('app.current_role')
//
// SECURITY CONTRACT:
//   - tenantId MUST be derived server-side from Supabase JWT (never from client input)
//   - userId MUST come from auth.uid() or the validated JWT
//   - role MUST come from the verified JWT claims or user_profiles table
//   - This wrapper is the ONLY approved path for tenant-scoped queries
//   - Bypassing this wrapper is a security violation
// ─────────────────────────────────────────────────────────────────────────────

export async function withTenant<T>(
  ctx: TenantContext,
  callback: (tx: ReturnType<typeof getDb>) => Promise<T>
): Promise<T> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_tenant', ${ctx.tenantId}, TRUE)`
    );
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${ctx.userId}, TRUE)`
    );
    await tx.execute(
      sql`SELECT set_config('app.current_role', ${ctx.role}, TRUE)`
    );

    return callback(tx as unknown as ReturnType<typeof getDb>);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// withSuperAdmin — bypasses tenant RLS for super_admin operations.
// Only callable from server-side admin routes; must never be exposed to client.
// ─────────────────────────────────────────────────────────────────────────────

export async function withSuperAdmin<T>(
  userId: string,
  callback: (tx: ReturnType<typeof getDb>) => Promise<T>
): Promise<T> {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${userId}, TRUE)`
    );
    await tx.execute(
      sql`SELECT set_config('app.current_role', ${"super_admin"}, TRUE)`
    );

    return callback(tx as unknown as ReturnType<typeof getDb>);
  });
}
