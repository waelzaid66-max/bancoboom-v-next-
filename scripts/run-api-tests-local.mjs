#!/usr/bin/env node
/**
 * Run the full api-server Vitest suite against a disposable PostgreSQL database.
 *
 * Safe default (recommended):
 *   node scripts/run-api-tests-local.mjs
 *
 * This starts/reuses docker-compose.test.yml only as a TEST SERVER, creates a
 * unique child database for this run, verifies that child identity, then runs
 * migrations/seed/tests only against the child. The child is terminated+dropped
 * on completion.
 *
 * External test server mode is deliberately fail-closed. Do NOT pass an
 * arbitrary DATABASE_URL. Instead provide BANCO_API_TEST_ADMIN_URL plus all of:
 *   BANCO_API_TEST_DISPOSABLE_CONFIRM=CREATE_DROP_RANDOM_CHILD_DB
 *   BANCO_API_TEST_EXPECT_HOST=<exact admin URL host>
 *   BANCO_API_TEST_EXPECT_PORT=<exact admin URL port; default 5432>
 *   BANCO_API_TEST_EXPECT_DATABASE=<exact admin database name>
 *
 * The supplied external server is only an administration endpoint. This runner
 * still creates a random banco_api_test_* child and never migrates/seeds/tests
 * the supplied parent database itself.
 */
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SERVER_URL =
  "postgresql://postgres:postgres@127.0.0.1:5433/postgres";
const EXTERNAL_CONFIRM = "CREATE_DROP_RANDOM_CHILD_DB";
const CHILD_PREFIX = "banco_api_test_";
const FAULT_AFTER_IDENTITY = "after_identity";
const DOCKER_READY_ATTEMPTS = 30;
const DOCKER_READY_DELAY_MS = 1_000;

export function commandExecutable(cmd, platform = process.platform) {
  return platform === "win32" && cmd === "pnpm" ? "pnpm.cmd" : cmd;
}

function commandResult(cmd, args, options = {}) {
  return spawnSync(commandExecutable(cmd), args, {
    cwd: ROOT,
    encoding: "utf8",
    ...options,
  });
}

function run(cmd, args, env = process.env) {
  const result = commandResult(cmd, args, { env, stdio: "inherit" });
  if (result.status !== 0) {
    const error = new Error(`${cmd} exited with status ${result.status ?? "unknown"}`);
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

function executableAvailable(cmd, args = ["--version"]) {
  const result = commandResult(cmd, args, { stdio: "ignore" });
  return result.status === 0;
}

function dockerAvailable() {
  return executableAvailable("docker", ["info"]);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function databaseNameFromUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!name) throw new Error("PostgreSQL URL must include an explicit database name.");
  return name;
}

export function databaseUrlForChild(adminUrl, database) {
  if (!new RegExp(`^${CHILD_PREFIX}[a-f0-9]{16}$`).test(database)) {
    throw new Error("Refusing unsafe child database name.");
  }
  const parsed = new URL(adminUrl);
  parsed.pathname = `/${database}`;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

export function makeChildDatabaseName(randomBytes = crypto.randomBytes) {
  return `${CHILD_PREFIX}${randomBytes(8).toString("hex")}`;
}

export function createCleanupController(cleanupTarget) {
  let cleaned = false;
  let cleaning = false;

  return {
    run() {
      if (cleaned || cleaning) return;
      cleaning = true;
      try {
        cleanupTarget();
        cleaned = true;
      } finally {
        cleaning = false;
      }
    },
    isCleaned() {
      return cleaned;
    },
  };
}

export function validateFaultInjection(env = process.env) {
  const fault = env.BANCO_API_TEST_FAULT_INJECT?.trim() ?? "";
  if (!fault) return null;
  if (fault !== FAULT_AFTER_IDENTITY) {
    throw new Error(
      "BANCO_API_TEST_FAULT_INJECT must be unset or exactly after_identity.",
    );
  }
  return fault;
}

export function validateExternalAdminConfig(env = process.env) {
  if (env.DATABASE_URL?.trim()) {
    throw new Error(
      "Refusing inherited DATABASE_URL: destructive API integration tests never mutate an arbitrary supplied database. " +
        "Unset DATABASE_URL and use explicitly armed BANCO_API_TEST_ADMIN_URL instead.",
    );
  }

  const adminUrl = env.BANCO_API_TEST_ADMIN_URL?.trim();
  if (!adminUrl) return null;

  if (env.BANCO_API_TEST_DISPOSABLE_CONFIRM !== EXTERNAL_CONFIRM) {
    throw new Error(
      `External test server is not armed. Set BANCO_API_TEST_DISPOSABLE_CONFIRM=${EXTERNAL_CONFIRM}.`,
    );
  }

  const parsed = new URL(adminUrl);
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("BANCO_API_TEST_ADMIN_URL must be a PostgreSQL URL.");
  }
  if (parsed.search) {
    throw new Error("BANCO_API_TEST_ADMIN_URL query parameters are unsupported; refusing ambiguous external PostgreSQL connection semantics.");
  }

  const actualHost = parsed.hostname;
  const actualPort = parsed.port || "5432";
  const actualDatabase = databaseNameFromUrl(adminUrl);
  const expectedHost = env.BANCO_API_TEST_EXPECT_HOST?.trim();
  const expectedPort = env.BANCO_API_TEST_EXPECT_PORT?.trim();
  const expectedDatabase = env.BANCO_API_TEST_EXPECT_DATABASE?.trim();

  if (!expectedHost || !expectedPort || !expectedDatabase) {
    throw new Error(
      "External test server requires BANCO_API_TEST_EXPECT_HOST, BANCO_API_TEST_EXPECT_PORT and BANCO_API_TEST_EXPECT_DATABASE.",
    );
  }
  if (expectedHost !== actualHost || expectedPort !== actualPort || expectedDatabase !== actualDatabase) {
    throw new Error(
      "External test server identity does not match the explicit expected host/port/database contract.",
    );
  }

  return { adminUrl, host: actualHost, port: actualPort, database: actualDatabase };
}

function psqlArgs(databaseUrl, sql, tuplesOnly = false) {
  const parsed = new URL(databaseUrl);
  const args = [
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-h",
    parsed.hostname,
    "-p",
    parsed.port || "5432",
    "-U",
    decodeURIComponent(parsed.username),
    "-d",
    databaseNameFromUrl(databaseUrl),
  ];
  if (tuplesOnly) args.push("-A", "-t");
  args.push("-c", sql);
  return {
    args,
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(parsed.password),
    },
  };
}

function externalPsql(databaseUrl, sql, { tuplesOnly = false, inherit = true } = {}) {
  const { args, env } = psqlArgs(databaseUrl, sql, tuplesOnly);
  const result = commandResult("psql", args, {
    env,
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const error = new Error(`psql exited with status ${result.status ?? "unknown"}`);
    error.exitCode = result.status ?? 1;
    throw error;
  }
  return result.stdout?.trim() ?? "";
}

function dockerClientArgs(tool, database, toolArgs = []) {
  return [
    "compose",
    "-f",
    "docker-compose.test.yml",
    "run",
    "--rm",
    "-e",
    "PGPASSWORD=postgres",
    "postgres",
    tool,
    "-h",
    "postgres",
    "-U",
    "postgres",
    "-d",
    database,
    ...toolArgs,
  ];
}

function dockerPostgresReady() {
  const result = commandResult(
    "docker",
    dockerClientArgs("pg_isready", "postgres"),
    { stdio: "ignore" },
  );
  return result.status === 0;
}

function waitForDockerPostgres() {
  for (let attempt = 1; attempt <= DOCKER_READY_ATTEMPTS; attempt += 1) {
    if (dockerPostgresReady()) return;
    if (attempt < DOCKER_READY_ATTEMPTS) sleep(DOCKER_READY_DELAY_MS);
  }
  throw new Error("Disposable Docker Postgres did not become ready in time.");
}

function dockerPsql(database, sql, { tuplesOnly = false, inherit = true } = {}) {
  const toolArgs = ["-X", "-v", "ON_ERROR_STOP=1"];
  if (tuplesOnly) toolArgs.push("-A", "-t");
  toolArgs.push("-c", sql);

  const result = commandResult(
    "docker",
    dockerClientArgs("psql", database, toolArgs),
    { stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    const error = new Error(`docker psql exited with status ${result.status ?? "unknown"}`);
    error.exitCode = result.status ?? 1;
    throw error;
  }
  return result.stdout?.trim() ?? "";
}

function quotedIdentifier(identifier) {
  if (!new RegExp(`^${CHILD_PREFIX}[a-f0-9]{16}$`).test(identifier)) {
    throw new Error("Refusing unsafe PostgreSQL identifier.");
  }
  return `"${identifier}"`;
}

function provisionDockerChild(database) {
  console.log("Starting dedicated test Postgres server (docker-compose.test.yml)…");
  run("docker", ["compose", "-f", "docker-compose.test.yml", "up", "-d", "postgres"]);
  waitForDockerPostgres();
  dockerPsql("postgres", `CREATE DATABASE ${quotedIdentifier(database)}`);
  return {
    databaseUrl: databaseUrlForChild(DEFAULT_SERVER_URL, database),
    verify() {
      return dockerPsql(database, "SELECT current_database()", {
        tuplesOnly: true,
        inherit: false,
      });
    },
    enableExtensions() {
      dockerPsql(database, "CREATE EXTENSION IF NOT EXISTS pg_trgm");
    },
    cleanup() {
      dockerPsql(
        "postgres",
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid()`,
      );
      dockerPsql("postgres", `DROP DATABASE IF EXISTS ${quotedIdentifier(database)}`);
    },
    className: "docker-compose.test.yml / random child database",
  };
}

function provisionExternalChild(config, database) {
  if (!executableAvailable("psql")) {
    throw new Error(
      "External test server mode requires the PostgreSQL psql client. No fallback to the parent database is allowed.",
    );
  }

  const connectedAdmin = externalPsql(config.adminUrl, "SELECT current_database()", {
    tuplesOnly: true,
    inherit: false,
  });
  if (connectedAdmin !== config.database) {
    throw new Error(
      `External admin identity verification failed: expected database ${config.database}, got ${connectedAdmin || "<empty>"}.`,
    );
  }

  externalPsql(config.adminUrl, `CREATE DATABASE ${quotedIdentifier(database)}`);
  const childUrl = databaseUrlForChild(config.adminUrl, database);
  return {
    databaseUrl: childUrl,
    verify() {
      return externalPsql(childUrl, "SELECT current_database()", {
        tuplesOnly: true,
        inherit: false,
      });
    },
    enableExtensions() {
      externalPsql(childUrl, "CREATE EXTENSION IF NOT EXISTS pg_trgm");
    },
    cleanup() {
      externalPsql(
        config.adminUrl,
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid()`,
      );
      externalPsql(config.adminUrl, `DROP DATABASE IF EXISTS ${quotedIdentifier(database)}`);
    },
    className: `explicitly armed external test server ${config.host}:${config.port}/${config.database} / random child database`,
  };
}

function installSignalCleanup(cleanup) {
  let handlingSignal = false;
  const handler = (signal) => {
    if (handlingSignal) return;
    handlingSignal = true;
    console.error(`\nReceived ${signal}; cleaning disposable API-test database…`);
    try {
      cleanup();
    } catch (error) {
      console.error("Disposable database cleanup failed during signal handling:", error.message);
    }
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  process.once("SIGINT", handler);
  process.once("SIGTERM", handler);
  return () => {
    process.removeListener("SIGINT", handler);
    process.removeListener("SIGTERM", handler);
  };
}

export function main(env = process.env) {
  const faultInjection = validateFaultInjection(env);
  const external = validateExternalAdminConfig(env);
  if (!external && !dockerAvailable()) {
    throw new Error(
      "Docker is unavailable and no explicitly armed BANCO_API_TEST_ADMIN_URL was provided. Refusing to use an arbitrary database.",
    );
  }

  const childDatabase = makeChildDatabaseName();
  const provisioned = external
    ? provisionExternalChild(external, childDatabase)
    : provisionDockerChild(childDatabase);

  const cleanupController = createCleanupController(() => provisioned.cleanup());
  const cleanup = () => cleanupController.run();
  const removeSignalHandlers = installSignalCleanup(cleanup);

  try {
    const connectedDatabase = provisioned.verify();
    if (connectedDatabase !== childDatabase) {
      throw new Error(
        `Disposable database identity verification failed: expected ${childDatabase}, got ${connectedDatabase || "<empty>"}.`,
      );
    }

    console.log(`\nAPI integration test database: ${childDatabase}`);
    console.log(`Isolation: ${provisioned.className}`);

    if (faultInjection === FAULT_AFTER_IDENTITY) {
      throw new Error("Injected API test DB failure after identity verification.");
    }

    provisioned.enableExtensions();

    const testEnv = {
      ...env,
      DATABASE_URL: provisioned.databaseUrl,
      TZ: "UTC",
    };
    delete testEnv.BANCO_API_TEST_ADMIN_URL;
    delete testEnv.BANCO_API_TEST_DISPOSABLE_CONFIRM;
    delete testEnv.BANCO_API_TEST_EXPECT_HOST;
    delete testEnv.BANCO_API_TEST_EXPECT_PORT;
    delete testEnv.BANCO_API_TEST_EXPECT_DATABASE;
    delete testEnv.BANCO_API_TEST_FAULT_INJECT;

    console.log("\nValidating committed migrations…");
    run("pnpm", ["--filter", "@workspace/db", "run", "check"], testEnv);

    console.log("\nApplying committed migrations…");
    run("pnpm", ["--filter", "@workspace/db", "run", "migrate"], testEnv);

    console.log("\nReplaying migrations (must be idempotent)…");
    run("pnpm", ["--filter", "@workspace/db", "run", "migrate"], testEnv);

    console.log("\nSeeding reference data…");
    run("pnpm", ["--filter", "@workspace/api-server", "run", "seed"], testEnv);

    // Kept from fix/db-baseline-adoption-20260821, whose three-line addition to
    // the previous runner was lost when this file was rewritten to provision a
    // disposable child database. The matrix proves baseline refuses an empty
    // database, is terminal once complete, and stamps only through the
    // historical cutoff — it must not fall out of the union.
    console.log("\nRunning fail-closed legacy baseline adoption matrix…");
    run("pnpm", ["--filter", "@workspace/db", "run", "test:baseline-adoption"], testEnv);

    console.log("\nRunning api-server tests…");
    run("pnpm", ["--filter", "@workspace/api-server", "run", "test"], testEnv);

    console.log("\n[PASS] api-server integration suite");
  } finally {
    removeSignalHandlers();
    console.log("\nCleaning disposable API-test database…");
    cleanup();
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = Number.isInteger(error?.exitCode) ? error.exitCode : 1;
  }
}
