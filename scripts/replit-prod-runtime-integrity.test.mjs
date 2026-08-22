import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const replitPath = path.join(repoRoot, ".replit");
const startPath = path.join(repoRoot, "scripts", "replit-prod-start.sh");
const smokePath = path.join(repoRoot, "scripts", "replit-prod-route-smoke.mjs");

const replit = readFileSync(replitPath, "utf8");
const start = readFileSync(startPath, "utf8");

function indexOfOrFail(haystack, needle, message) {
  const index = haystack.indexOf(needle);
  assert.notEqual(index, -1, message);
  return index;
}

test("Replit deployment declares nginx through the Nix package contract", () => {
  const nixBlock = replit.match(/\[nix\]([\s\S]*?)(?=\n\[[^\]]+\]|$)/)?.[1] ?? "";
  assert.notEqual(nixBlock, "", ".replit must declare a [nix] block for deployment runtime packages");
  assert.match(
    nixBlock,
    /packages\s*=\s*\[[^\]]*"nginx"[^\]]*\]/,
    ".replit [nix].packages must include nginx",
  );
});

test("router prerequisites are discovered and validated before child services launch", () => {
  assert.doesNotMatch(
    start,
    /include\s+\/etc\/nginx\/mime\.types\s*;/,
    "Replit startup must not hard-code /etc/nginx/mime.types in a Nix runtime",
  );

  const nginxProbe = indexOfOrFail(
    start,
    "command -v nginx",
    "startup must fail closed when the nginx binary is unavailable",
  );
  const mimeDiscovery = indexOfOrFail(
    start,
    "MIME_TYPES",
    "startup must resolve a MIME-types path instead of assuming /etc/nginx",
  );
  const apiLaunch = indexOfOrFail(
    start,
    "pnpm --filter @workspace/api-server run start",
    "API launch marker is required for startup-order verification",
  );

  assert.ok(nginxProbe < apiLaunch, "nginx binary preflight must run before API child launch");
  assert.ok(mimeDiscovery < apiLaunch, "MIME preflight must run before API child launch");
});

test("router runtime owns cleanup on every shell exit and supports isolated diagnostic ports", () => {
  assert.match(start, /trap[^\n]*\bEXIT\b/, "startup must register cleanup for normal/error EXIT paths");

  for (const name of [
    "REPLIT_ROUTER_PORT",
    "REPLIT_API_PORT",
    "REPLIT_WEB_PORT",
    "REPLIT_MOBILE_PORT",
  ]) {
    assert.ok(start.includes(name), `startup must support ${name} for isolated runtime diagnostics`);
  }
});

test("nginx runtime state is redirected to a writable preview-owned location", () => {
  assert.ok(
    start.includes("REPLIT_NGINX_PREFIX"),
    "startup must expose a writable nginx runtime prefix instead of relying on package-store defaults",
  );
  assert.match(start, /client_body_temp_path|proxy_temp_path/, "nginx config must redirect runtime temp state");
});

test("production-shaped route smoke exists and validates surface identity, not HTTP 200 alone", () => {
  assert.ok(existsSync(smokePath), "scripts/replit-prod-route-smoke.mjs must exist");
  const smoke = readFileSync(smokePath, "utf8");

  const requiredMarkers = [
    "/nginx-health",
    "/api/healthz",
    "/admin/",
    "BANCO Admin",
    "/market/",
    "BANCO Market",
    "/banco-mobile/expo-go",
    "BANCO",
  ];

  for (const marker of requiredMarkers) {
    assert.ok(smoke.includes(marker), `route smoke must verify ${marker}`);
  }

  assert.match(smoke, /JSON\.parse|\.json\(\)/, "API health smoke must validate a JSON response shape");
  assert.match(
    smoke,
    /includes\(|match\(|RegExp|assert\.match/,
    "surface smoke must inspect response identity content, not status alone",
  );
});
