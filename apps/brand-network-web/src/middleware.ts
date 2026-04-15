import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

// ---------------------------------------------------------------------------
// Root domain is set via NEXT_PUBLIC_ROOT_DOMAIN (e.g. "toptenprom.com").
// For local dev use "localhost". Tenant subdomains: store1.localhost.
// ---------------------------------------------------------------------------
const ROOT_DOMAIN =
  process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "brand-network.com";

/**
 * Returns the tenant subdomain string if the request is for a tenant storefront,
 * or null if the request is for the corporate site.
 *
 * Custom domains are passed through as-is so the tenant layout can resolve them
 * via DB lookup in Phase 3.
 */
function extractSubdomain(hostname: string): string | null {
  // Strip port number for comparison
  const host = hostname.split(":")[0] ?? hostname;

  // Corporate: bare localhost
  if (host === "localhost" || host === "127.0.0.1") return null;

  // Tenant: *.localhost (e.g. store1.localhost)
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    return sub === "www" ? null : sub;
  }

  // Corporate: root domain or www subdomain
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;

  // Tenant: registered subdomain of ROOT_DOMAIN
  const suffix = `.${ROOT_DOMAIN}`;
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, -suffix.length);
    return sub === "www" ? null : sub;
  }

  // Unknown / custom domain — the tenant layout resolves these in Phase 3.
  // Pass the full hostname as the "subdomain" param so the layout can query
  // the tenants table by custom_domain.
  return host;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;
  const subdomain = extractSubdomain(hostname);
  const { pathname } = request.nextUrl;

  // ── Supabase session refresh ───────────────────────────────────────────────
  // @supabase/ssr requires that the middleware refreshes the auth token on
  // every matched request so Server Components see an up-to-date session.
  // DO NOT remove this block.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session. Required — do not remove.
  await supabase.auth.getUser();

  // ── Tenant subdomain routing ───────────────────────────────────────────────
  // Rewrite /path → /[subdomain]/path so that requests to tenant subdomains
  // hit app/[subdomain]/* without changing the visible browser URL.
  if (subdomain !== null) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname =
      pathname === "/" ? `/${subdomain}` : `/${subdomain}${pathname}`;

    const rewriteResponse = NextResponse.rewrite(rewriteUrl);

    // Forward Supabase auth cookies to the rewrite response
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      rewriteResponse.cookies.set(name, value);
    });

    return rewriteResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next.js internals:
     *   _next/static  — compiled static assets
     *   _next/image   — image optimisation API
     *   favicon.ico, sitemap.xml, robots.txt — standard web files
     *   *.{img,font}  — binary public files
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)).*)",
  ],
};
