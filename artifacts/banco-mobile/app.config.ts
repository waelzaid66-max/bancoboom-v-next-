import type { ConfigContext, ExpoConfig } from "expo/config";
import {
  mergeAndroidAppLinkFilters,
  mergeAssociatedDomains,
  resolveWebAppLinkHost,
} from "./lib/link-host-merge.mjs";

/**
 * Deep-link / universal-link origin for expo-router static rendering.
 *
 * Prefer EXPO_PUBLIC_ROUTER_ORIGIN, then EXPO_PUBLIC_PUBLIC_APP_URL (production
 * app host). Last resort is replit.com for local Expo Go on Replit only —
 * Coolify/EAS must set a real origin or web export canonical links break.
 *
 * On EAS cloud builds (`EAS_BUILD=true`), the Replit fallback is rejected so a
 * misconfigured profile cannot ship store binaries with replit.com App Links.
 */
const configuredOrigin =
  process.env.EXPO_PUBLIC_ROUTER_ORIGIN?.trim() ||
  process.env.EXPO_ROUTER_ORIGIN?.trim() ||
  process.env.EXPO_PUBLIC_PUBLIC_APP_URL?.trim() ||
  "";

const isEasBuild = process.env.EAS_BUILD === "true";
if (isEasBuild && (!configuredOrigin || /replit\.com/i.test(configuredOrigin))) {
  throw new Error(
    "EAS build refused: set EXPO_PUBLIC_ROUTER_ORIGIN or EXPO_PUBLIC_PUBLIC_APP_URL to the production app host (not replit.com).",
  );
}

const routerOrigin = configuredOrigin || "https://replit.com/";
const webHost = resolveWebAppLinkHost(process.env);

function withRouterOrigin(plugins: ExpoConfig["plugins"]): ExpoConfig["plugins"] {
  return (plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "expo-router") {
      const opts =
        typeof plugin[1] === "object" && plugin[1] !== null ? plugin[1] : {};
      return ["expo-router", { ...opts, origin: routerOrigin }];
    }
    return plugin;
  });
}

// Canonical dynamic-config pattern: `config` IS the parsed app.json, so the
// static store config (bundle ids, permissions, icons) stays the single source
// of truth and this file only layers the env-driven link/origin bits on top.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: withRouterOrigin(config.plugins),
  // Web static export served under a path prefix (e.g. /banco-mobile/ on the
  // Replit deployment). Set ONLY by scripts/build.js during `expo export -p web`;
  // absent in dev and native builds so nothing changes there.
  // Restored from bancoo production handoff (C-WEB-BASE) — evidence: white-screen
  // / QR-only browser when web export path prefix is missing.
  ...(process.env.EXPO_WEB_BASE_URL
    ? {
        experiments: {
          ...config.experiments,
          baseUrl: process.env.EXPO_WEB_BASE_URL.replace(/\/+$/, ""),
        },
      }
    : {}),
  ios: {
    ...config.ios,
    ...(webHost
      ? {
          associatedDomains: mergeAssociatedDomains(
            config.ios?.associatedDomains,
            webHost,
          ),
        }
      : {}),
  },
  android: {
    ...config.android,
    ...(webHost
      ? {
          intentFilters: mergeAndroidAppLinkFilters(
            config.android?.intentFilters,
            webHost,
          ),
        }
      : {}),
  },
});
