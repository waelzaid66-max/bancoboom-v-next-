import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DB_CHECK_TIMEOUT_MS = 2000;
const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;

function cleanEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/**
 * Release identity is one authority in production: RELEASE_SHA.
 * GIT_SHA/BUILD_ID are compatibility/reporting mirrors and must match it exactly.
 * SOURCE_COMMIT is optional, but when supplied by the platform it must agree too.
 * Non-production keeps historical cloud fallbacks so local/dev probes do not
 * require release metadata.
 */
function releaseIdentity(): {
  gitSha: string | null;
  buildId: string | null;
  valid: boolean;
} {
  const releaseSha = cleanEnv("RELEASE_SHA");
  const explicitGitSha = cleanEnv("GIT_SHA");
  const explicitBuildId = cleanEnv("BUILD_ID");
  const sourceCommit = cleanEnv("SOURCE_COMMIT");

  if (process.env.NODE_ENV === "production") {
    const valid =
      FULL_GIT_SHA.test(releaseSha) &&
      explicitGitSha === releaseSha &&
      explicitBuildId === releaseSha &&
      (!sourceCommit || sourceCommit === releaseSha);

    return {
      gitSha: explicitGitSha || releaseSha || null,
      buildId: explicitBuildId || releaseSha || null,
      valid,
    };
  }

  const rawSha =
    explicitGitSha ||
    cleanEnv("COMMIT_SHA") ||
    sourceCommit ||
    cleanEnv("SOURCE_VERSION") ||
    cleanEnv("K_REVISION");
  const rawBuild = explicitBuildId || cleanEnv("CLOUD_BUILD_ID");
  return {
    gitSha: rawSha || null,
    buildId: rawBuild || null,
    valid: true,
  };
}

/** Deploy pin retained for liveness/ops response compatibility. */
function deployPin(): { gitSha: string | null; buildId: string | null } {
  const identity = releaseIdentity();
  return { gitSha: identity.gitSha, buildId: identity.buildId };
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
 * release identity is coherent, the database is reachable, and critical
 * transactional tables exist. Production RELEASE_SHA/GIT_SHA/BUILD_ID drift is
 * therefore traffic-blocking rather than an observability-only warning.
 * The DB probe is time-boxed so readiness never hangs.
 */
router.get("/readyz", async (_req, res) => {
  const checks: Record<string, "ok" | "down"> = {};
  let healthy = true;

  const identity = releaseIdentity();
  checks.release_identity = identity.valid ? "ok" : "down";
  if (!identity.valid) {
    healthy = false;
    logger.error(
      {
        releaseShaPresent: Boolean(cleanEnv("RELEASE_SHA")),
        gitShaPresent: Boolean(cleanEnv("GIT_SHA")),
        buildIdPresent: Boolean(cleanEnv("BUILD_ID")),
        sourceCommitPresent: Boolean(cleanEnv("SOURCE_COMMIT")),
      },
      "Readiness check failed: release identity missing, malformed, or inconsistent",
    );
  }

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
          await db.execute(sql`SELECT 1 FROM billing_receipt_outbox LIMIT 0`);
          await db.execute(sql`SELECT dedupe_key FROM notifications LIMIT 0`);
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

    try {
      await Promise.race([
        db.execute(sql`SELECT 1 FROM message_notification_outbox LIMIT 0`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("messaging schema check timed out")), DB_CHECK_TIMEOUT_MS),
        ),
      ]);
      checks.messaging_schema = "ok";
    } catch (err) {
      checks.messaging_schema = "down";
      healthy = false;
      logger.error({ err }, "Readiness check failed: messaging schema incomplete");
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
    checks.messaging_schema = "down";
    checks.upload_claims = "down";
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks,
    gitSha: identity.gitSha,
    buildId: identity.buildId,
  });
});

export default router;
