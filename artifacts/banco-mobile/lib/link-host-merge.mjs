/**
 * Pure helpers for Universal Links / App Links host merging (H2).
 * Kept as .mjs so node:test can execute them without a TS compile step.
 * app.config.ts imports the same module — one source of truth.
 */

/**
 * Normalize a hostname for App Link membership.
 * Returns null when empty, whitespace-only, or a rejected host (replit).
 */
export function normalizeAppLinkHost(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\.$/, "").toLowerCase();
  if (!trimmed) return null;
  if (trimmed === "replit.com" || trimmed.endsWith(".replit.dev")) return null;
  return trimmed;
}

/**
 * Resolve the env-driven primary HTTPS app-link host.
 * Never hardcodes production domains. Skips replit origins.
 */
export function resolveWebAppLinkHost(env = process.env) {
  for (const key of [
    "EXPO_PUBLIC_PUBLIC_APP_URL",
    "EXPO_PUBLIC_ROUTER_ORIGIN",
    "EXPO_ROUTER_ORIGIN",
  ]) {
    const t = env[key]?.trim();
    if (!t) continue;
    try {
      const url = t.includes("://") ? new URL(t) : new URL(`https://${t}`);
      const host = normalizeAppLinkHost(url.hostname);
      if (host) return host;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Collect HTTPS hosts already declared on Android intent filters (from app.json).
 */
export function hostsFromIntentFilters(filters) {
  const hosts = [];
  for (const filter of filters ?? []) {
    const data = filter?.data;
    const entries = Array.isArray(data) ? data : data ? [data] : [];
    for (const entry of entries) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof entry.host === "string"
      ) {
        const host = normalizeAppLinkHost(entry.host);
        if (host) hosts.push(host);
      }
    }
  }
  return hosts;
}

/**
 * Merge app.json multi-host App Links with the env primary host.
 * Path prefixes stay production-safe (/l, /listing) for every host in the union.
 */
export function mergeAndroidAppLinkFilters(existing, primaryHost) {
  const primary = normalizeAppLinkHost(primaryHost);
  if (!primary) {
    return existing ?? [];
  }
  const hosts = Array.from(
    new Set([...hostsFromIntentFilters(existing), primary]),
  );
  return [
    {
      action: "VIEW",
      autoVerify: true,
      data: hosts.flatMap((host) => [
        { scheme: "https", host, pathPrefix: "/l" },
        { scheme: "https", host, pathPrefix: "/listing" },
      ]),
      category: ["BROWSABLE", "DEFAULT"],
    },
  ];
}

/**
 * Union iOS associatedDomains with applinks/webcredentials for primary host.
 * Normalizes existing applinks:/webcredentials: entries; drops replit / blank.
 */
export function mergeAssociatedDomains(existing, primaryHost) {
  const primary = normalizeAppLinkHost(primaryHost);
  const out = new Set();
  for (const entry of existing ?? []) {
    if (typeof entry !== "string") continue;
    const raw = entry.trim();
    if (!raw) continue;
    const m = /^(applinks|webcredentials):(.+)$/i.exec(raw);
    if (!m) {
      out.add(raw);
      continue;
    }
    const host = normalizeAppLinkHost(m[2]);
    if (!host) continue;
    out.add(`${m[1].toLowerCase()}:${host}`);
  }
  if (primary) {
    out.add(`applinks:${primary}`);
    out.add(`webcredentials:${primary}`);
  }
  return Array.from(out);
}
