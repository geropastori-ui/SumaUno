import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Cache Components queda apagado a propósito: casi todas las pantallas
  // dependen de la sesión del usuario y se renderizan por request.
  typedRoutes: true,
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
