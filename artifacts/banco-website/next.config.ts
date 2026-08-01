import type { NextConfig } from "next";

function apiRewriteTarget(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(
    /\/+$/,
    "",
  );
  return base;
}

/**
 * CDN origin for the build's static assets (`/_next/static/*`) — infrastructure
 * only, never behaviour. Unset it is undefined and Next behaves exactly as today;
 * set, hashed immutable assets are served from the edge instead of the app
 * container. Same operator-env pattern as the Vite apps' BASE_PATH and the mobile
 * web export's EXPO_WEB_BASE_URL, so there is one way to do this in the monorepo.
 */
const assetCdnOrigin = process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim().replace(
  /\/+$/,
  "",
);

// Replit preview runs inside an iframe on a proxied domain. We need to:
//   1. list that domain in allowedDevOrigins (Next.js 15 WS/HMR cross-origin check)
//   2. omit X-Frame-Options: SAMEORIGIN in dev so the iframe isn't blocked
// REPLIT_DEV_DOMAIN is injected automatically by the Replit runtime.
const replitDevDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(assetCdnOrigin ? { assetPrefix: assetCdnOrigin } : {}),
  // In dev, include the Replit proxy domain so /_next/* assets & HMR WS are not blocked.
  // In prod, leave empty — production never runs behind a Replit dev proxy.
  allowedDevOrigins: [
    // Local access (curl, Screenshot tool, any direct 127.0.0.1 request)
    "127.0.0.1",
    "localhost",
    // Replit preview proxy — injected at runtime; empty string if not on Replit
    ...(replitDevDomain
      ? [replitDevDomain, `https://${replitDevDomain}`, `http://${replitDevDomain}`]
      : []),
  ],
  transpilePackages: [
    "@workspace/design-tokens",
    "@workspace/search-contract",
    "@workspace/taxonomy",
    "@workspace/api-client-react",
  ],
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" as const } : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // X-Frame-Options: SAMEORIGIN blocks Replit's preview iframe in dev.
          // Keep the header in production only — the CDN/Nginx layer enforces it there.
          ...(isProd
            ? [{ key: "X-Frame-Options", value: "SAMEORIGIN" }]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
  async rewrites() {
    const apiBase = apiRewriteTarget();
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: "/l/:id",
        destination: `${apiBase}/l/:id`,
      },
    ];
  },
};

export default nextConfig;
