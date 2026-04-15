import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: stable server-component caching via "use cache" directive.
  // Enables cacheTag() / cacheLife() APIs and caches React Server Components.
  cacheComponents: true,

  // Enforce static-analysis safety: treat missing env vars as build errors.
  env: {
    NEXT_PUBLIC_ROOT_DOMAIN: process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "",
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
    // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is optional; missing = fallback link shown
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"] ?? "",
  },

  // Server-only env vars validated at build time.
  // GOOGLE_AI_API_KEY must never be in a NEXT_PUBLIC_ var.
  serverExternalPackages: [],

  // Security headers applied to every response.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
