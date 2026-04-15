"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components.
 *
 * Uses the browser cookie store so that the session is shared with
 * Server Components (which use the same cookie via lib/supabase/server.ts).
 *
 * This function is safe to call multiple times — @supabase/ssr deduplicates
 * the underlying client within a single page lifecycle.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? ""
  );
}
