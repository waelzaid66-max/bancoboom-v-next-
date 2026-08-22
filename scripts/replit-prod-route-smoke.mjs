#!/usr/bin/env node
/**
 * Smoke the deployment-shaped nginx router and every public surface.
 *
 * Usage:
 *   pnpm run ops:prod-route-smoke
 *
 * The router and its child services use an isolated port set by default. The
 * smoke owns the whole process group so an interrupted or failed run cannot
 * leave API, web, mobile, or nginx processes behind.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routerScript = path.join(ROOT, "scripts", "replit-prod-start.sh");
const basePort = Number(process.env.PROD_ROUTE_SMOKE_BASE_PORT || 55100);
const ports = {
  router: basePort,
  api: basePort + 1,
  web: basePort + 2,
  mobile: basePort + 3,
};
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "banco-prod-route-smoke-"));
const baseUrl = `http://127.0.0.1:${ports.router}`;
const surfaceChecks = [
  {
    route: "/",
    label: "landing",
    marker: "<title>BANCO — سيارات وعقارات وصناعي</title>",
  },
  { route: "/admin/", label: "admin", marker: "BANCO Admin — Control Center" },
  { route: "/market/", label: "market", marker: "BANCO Market — Dealer Management Platform" },
  { route: "/banco-mobile/", label: "mobile", marker: 'name="banco-surface" content="mobile"' },
];

const apiChecks = [
  {
    route: "/api/healthz",
    label: "healthz",
    validate(json) {
      return json?.status === "ok";
    },
  },
  {
    route: "/api/livez",
    label: "livez",
    validate(json) {
      return (
        json?.status === "ok" &&
        (json.gitSha === null || typeof json.gitSha === "string") &&
        (json.buildId === null || typeof json.buildId === "string")
      );
    },
  },
  {
    route: "/api/readyz",
    label: "readyz",
    validate(json) {
      const checks = json?.checks;
      return (
        json?.status === "ok" &&
        checks &&
        checks.database === "ok" &&
        checks.money_schema === "ok" &&
        checks.messaging_schema === "ok" &&
        checks.upload_claims === "ok" &&
        (json.gitSha === null || typeof json.gitSha === "string") &&
        (json.buildId === null || typeof json.buildId === "string")
      );
    },
  },
];

let router = null;
let cleaned = false;

function log(message) {
  console.log(`▶ ${message}`);
}

function cleanup() {
  if (cleaned) return;
  cleaned = true;
  if (router && router.exitCode === null) {
    try {
      process.kill(-router.pid, "SIGTERM");
    } catch {
      try {
        router.kill("SIGTERM");
      } catch {
        // The process may have exited between the two checks.
      }
    }
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function stopWith(code) {
  cleanup();
  process.exit(code);
}

process.on("exit", cleanup);
process.on("SIGINT", () => stopWith(130));
process.on("SIGTERM", () => stopWith(143));

async function waitForRouter(timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (router?.exitCode !== null) {
      throw new Error(`router exited before becoming ready (code ${router.exitCode})`);
    }
    try {
      const response = await fetch(`${baseUrl}/nginx-health`, {
        signal: AbortSignal.timeout(1_500),
      });
      if (response.ok) return;
    } catch {
      // Services are expected to take a few seconds to boot.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`router did not become ready within ${timeoutMs / 1000}s`);
}

async function checkSurface({ route, label, marker }) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  if (response.status !== 200) {
    throw new Error(`${route} returned HTTP ${response.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  if (!body.includes(marker)) {
    throw new Error(`${route} returned HTTP 200 but is missing ${label} marker: ${marker}`);
  }
  console.log(`[PASS] ${route} → 200 (${label} surface)`);
}

async function checkApi({ route, label, validate }) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  if (response.status !== 200) {
    throw new Error(`${route} returned HTTP ${response.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`${route} returned HTTP 200 with invalid JSON`);
  }
  if (!validate(json)) {
    throw new Error(`${route} returned an unexpected health response: ${JSON.stringify(json)}`);
  }
  console.log(`[PASS] ${route} → 200 (${label} shape)`);
}

try {
  if (!Number.isInteger(basePort) || basePort < 1024 || basePort > 64000) {
    throw new Error("PROD_ROUTE_SMOKE_BASE_PORT must be an integer between 1024 and 64000");
  }
  log(`Starting production router on isolated ports ${Object.values(ports).join(", ")}...`);
  router = spawn("bash", [routerScript], {
    cwd: ROOT,
    detached: true,
    stdio: "inherit",
    env: {
      ...process.env,
      ROUTER_PORT: String(ports.router),
      API_PORT: String(ports.api),
      WEB_PORT: String(ports.web),
      MOBILE_PORT: String(ports.mobile),
      STATIC_DIR: path.join(tempDir, "static"),
      NGINX_CONF: path.join(tempDir, "nginx.conf"),
      NGINX_PID_FILE: path.join(tempDir, "nginx.pid"),
    },
  });
  router.once("error", (error) => {
    console.error(`[FAIL] could not start router: ${error.message}`);
    stopWith(1);
  });

  await waitForRouter();
  for (const check of surfaceChecks) await checkSurface(check);
  for (const check of apiChecks) await checkApi(check);
  console.log("\n[PASS] production route smoke");
  stopWith(0);
} catch (error) {
  console.error(`[FAIL] production route smoke: ${error instanceof Error ? error.message : String(error)}`);
  stopWith(1);
}