import { webPlugStatus } from "./web-plug-config";

/** Shared JSON body for /api/health and /api/healthz probes. */
export function buildWebHealthPayload() {
  return {
    status: "ok" as const,
    // Canonical consumer/marketing Next surface (artifacts/banco-website).
    // Do not report "banco-web" — that package is FROZEN and a deploy twin only.
    surface: "banco-website" as const,
    plug: webPlugStatus(),
    wave: "w4.1",
    ts: new Date().toISOString(),
  };
}

/** Paths that must stay up when the website plug is OFF. */
export function isWebHealthPath(pathname: string): boolean {
  return (
    pathname === "/api/health" ||
    pathname.startsWith("/api/health/") ||
    pathname === "/api/healthz" ||
    pathname.startsWith("/api/healthz/")
  );
}
