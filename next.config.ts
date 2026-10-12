import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Cache Components queda apagado a propósito: casi todas las pantallas
  // dependen de la sesión del usuario y se renderizan por request.
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: new URL(supabaseUrl).protocol.replace(":", "") as
              | "http"
              | "https",
            hostname: new URL(supabaseUrl).hostname,
            port: new URL(supabaseUrl).port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
