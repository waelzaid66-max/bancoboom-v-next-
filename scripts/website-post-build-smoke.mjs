#!/usr/bin/env node
/**
 * Post-build route smoke — starts banco-web locally, hits static routes, exits.
 * Does NOT require CDN or mobile. Optional listing share check needs live API.
 *
 * Prereq: `pnpm --filter @workspace/banco-web run build` already ran.
 *
 * Usage:
 *   node scripts/website-post-build-smoke.mjs
 *   BANCO_LISTING_SMOKE_ID=<uuid> node scripts/website-post-build-smoke.mjs
 *
 * Exit: 0 pass, 1 fail
 */

import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BANCO_WEB_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const isWin = process.platform === "win32";
const pnpm = isWin ? "pnpm.cmd" : "pnpm";

let server = null;

function shutdownServer() {
  if (!server || server.killed) return;
  try {
    if (isWin) {
      spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      process.kill(-server.pid, "SIGTERM");
    }
  } catch {
    try {
      server.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
}

function startServer() {
  server = spawn(pnpm, ["--filter", "@workspace/banco-web", "start"], {
    cwd: ROOT,
    stdio: "ignore",
    shell: isWin,
    detached: !isWin,
    env: { ...process.env, PORT: "3000", HOSTNAME: "0.0.0.0" },
  });
}

async function waitForHealth() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/health`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return true;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function runStagingSmoke() {
  return spawnSync("node", ["scripts/website-staging-smoke.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      BANCO_WEB_URL: BASE,
      BANCO_WEB_EXPECT_AUTH:
        process.env.BANCO_WEB_EXPECT_AUTH ||
        (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          ? "configured"
          : "unconfigured"),
    },
    shell: isWin,
  });
}

process.on("exit", shutdownServer);
process.on("SIGINT", () => {
  shutdownServer();
  process.exit(130);
});
process.on("SIGTERM", () => {
  shutdownServer();
  process.exit(143);
});

console.log("Post-build smoke — isolated from mobile/API deploy\n");
startServer();

if (!(await waitForHealth())) {
  console.error("[FAIL] banco-web did not become healthy in time");
  shutdownServer();
  process.exit(1);
}

const smoke = runStagingSmoke();
shutdownServer();
process.exit(smoke.status === 0 ? 0 : 1);
