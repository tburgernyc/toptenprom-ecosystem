import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 *
 * Reads and writes auth cookies via next/headers so that session state is
 * available to React Server Components and shared across the request.
 *
 * Do NOT call this inside a cached function ("use cache") — the cookies()
 * call makes this request-scoped by design. Read auth state outside the
 * cache boundary and pass the relevant values in.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * Returns the authenticated user from the current Supabase session,
 * or null if there is no active session.
 *
 * Prefer this over getSession() — getUser() re-validates the JWT against
 * the Supabase auth server, preventing stale token exploitation.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
