import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DB_CHECK_TIMEOUT_MS = 2000;

/**
 * Deploy pin for F1 production verification (which SHA/build is live).
 * Prefer build-injected GIT_SHA; fall back to common cloud env names.
 * Never invent a SHA — null when unset.
 */
function deployPin(): { gitSha: string | null; buildId: string | null } {
  const rawSha =
    process.env.GIT_SHA ||
    process.env.COMMIT_SHA ||
    process.env.SOURCE_VERSION ||
    process.env.K_REVISION ||
    "";
  const rawBuild = process.env.BUILD_ID || process.env.CLOUD_BUILD_ID || "";
  return {
    gitSha: rawSha.trim() || null,
    buildId: rawBuild.trim() || null,
  };
}

/**
 * Root liveness. The platform deploy probe hits `/api` directly, which mounts
 * this router at its root — previously no route matched `/api`, so the probe got
 * a non-200 and the deploy was marked unhealthy. This must NOT touch the database
 * (liveness != readiness); it only proves the process is up and serving.
 */
router.get("/", (_req, res) => {
  res.json({ status: "ok", ...deployPin() });
});

/**
 * Liveness: is the process up and able to serve? Intentionally trivial — it must
 * not touch external dependencies, so an unhealthy database does not cause the
 * orchestrator to kill an otherwise-healthy process.
 * Strict HealthCheckResponse shape kept for OpenAPI/probe compatibility.
 */
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Alias kept for clarity alongside /readyz. Includes deploy pin (OpenAPI: LiveStatus).
router.get("/livez", (_req, res) => {
  res.json({ status: "ok", ...deployPin() });
});

/**
 * Readiness: should this instance receive traffic? Returns 200 only when the
 * database is actually reachable AND money-path tables exist; otherwise 503 so
 * load balancers stop routing to it. A bare `SELECT 1` previously went green on
 * an empty/migrated-wrong Postgres that could not settle top-ups.
 * The DB probe is time-boxed so readiness never hangs.
 * Includes gitSha/buildId so ops can pin live traffic to a known commit (F1).
 */
router.get("/readyz", async (_req, res) => {
  const checks: Record<string, "ok" | "down"> = {};
  let healthy = true;

  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db check timed out")), DB_CHECK_TIMEOUT_MS),
      ),
    ]);
    checks.database = "ok";
  } catch (err) {
    checks.database = "down";
    healthy = false;
    logger.error({ err }, "Readiness check failed: database unreachable");
  }

  if (checks.database === "ok") {
    try {
      await Promise.race([
        (async () => {
          // Fail closed if money tables are missing (wrong DB / incomplete migrate).
          await db.execute(sql`SELECT 1 FROM payment_intents LIMIT 0`);
          await db.execute(sql`SELECT 1 FROM transactions LIMIT 0`);
          await db.execute(sql`SELECT 1 FROM promo_ad_transactions LIMIT 0`);
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("schema check timed out")), DB_CHECK_TIMEOUT_MS),
        ),
      ]);
      checks.money_schema = "ok";
    } catch (err) {
      checks.money_schema = "down";
      healthy = false;
      logger.error({ err }, "Readiness check failed: money schema incomplete");
    }

    // REL-02: upload ownership claims are required for media promote/IDOR.
    // Money-ok alone must not mark the API ready if upload_claims is missing.
    try {
      await Promise.race([
        db.execute(sql`SELECT 1 FROM upload_claims LIMIT 0`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("upload_claims check timed out")), DB_CHECK_TIMEOUT_MS),
        ),
      ]);
      checks.upload_claims = "ok";
    } catch (err) {
      checks.upload_claims = "down";
      healthy = false;
      logger.error({ err }, "Readiness check failed: upload_claims missing");
    }
  } else {
    checks.money_schema = "down";
    checks.upload_claims = "down";
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks,
    ...deployPin(),
  });
});

export default router;
