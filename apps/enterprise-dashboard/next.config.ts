import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dashboard serves per-user, authenticated data — do not enable global
  // cacheComponents, which would require every async data access to be inside
  // a Suspense boundary. Opt-in caching is done per-component with "use cache".

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
    NEXT_PUBLIC_ROOT_DOMAIN: process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "",
  },

  serverExternalPackages: [],

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
