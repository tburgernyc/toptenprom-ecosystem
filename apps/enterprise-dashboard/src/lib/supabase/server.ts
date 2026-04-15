import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 *
 * Do NOT call this inside a "use cache" function — cookies() is request-scoped.
 * Read auth state outside the cache boundary and pass the relevant values in.
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
 * Uses getUser() (not getSession()) to re-validate the JWT against
 * the Supabase auth server on every call.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
