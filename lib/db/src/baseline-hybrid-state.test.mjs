import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import pg from "pg";

const DB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = path.join(DB_ROOT, "src", "baseline.ts");
const ENSURE_SCHEMA = path.join(DB_ROOT, "src", "ensureSchema.ts");
const MIGRATIONS = path.join(DB_ROOT, "migrations");
const JOURNAL = JSON.parse(
  fs.readFileSync(path.join(MIGRATIONS, "meta", "_journal.json"), "utf8"),
);
const BASE_DATABASE_URL = process.env.DATABASE_URL?.trim();

const REQUIRED_CONFIRMATION =
  "9f3e5c59fbf11014c78b06cf01262fc8e2949bb0:0001_minor_stingray";

if (!BASE_DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for baseline hybrid-state tests. Use disposable PostgreSQL only.",
  );
}

function databaseUrlFor(baseUrl, database) {
  const parsed = new URL(baseUrl);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function adminUrlFor(baseUrl) {
  return databaseUrlFor(baseUrl, "postgres");
}

async function connect(databaseUrl) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

async function withDisposableDatabase(t, fn) {
  const database = `banco_baseline_hybrid_${crypto.randomBytes(8).toString("hex")}`;
  const admin = await connect(adminUrlFor(BASE_DATABASE_URL));
  await admin.query(`CREATE DATABASE "${database}"`);
  const databaseUrl = databaseUrlFor(BASE_DATABASE_URL, database);

  const databaseClient = await connect(databaseUrl);
  try {
    await databaseClient.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
  } finally {
    await databaseClient.end();
  }

  t.after(async () => {
    await admin.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [database],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
    await admin.end();
  });

  await fn({ database, databaseUrl });
}

async function applyMigrationFile(client, index) {
  const tag = JOURNAL.entries[index]?.tag;
  assert.ok(tag, `journal entry ${index} missing`);
  const sql = fs.readFileSync(path.join(MIGRATIONS, `${tag}.sql`), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) await client.query(statement);
}

async function applyHistoricalCutoverSchema(client) {
  await applyMigrationFile(client, 0);
  await applyMigrationFile(client, 1);
}

async function applyCurrentFiBootPatchShape(client) {
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fi_workspace_status') THEN
        CREATE TYPE fi_workspace_status AS ENUM ('draft','pending_review','active','suspended');
      END IF;
    END$$
  `);
  await client.query(`
    ALTER TABLE financing_intermediaries
      ADD COLUMN IF NOT EXISTS workspace_status fi_workspace_status NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS workspace_owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS fi_lifecycle_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      intermediary_id uuid NOT NULL REFERENCES financing_intermediaries(id) ON DELETE CASCADE,
      from_status fi_workspace_status,
      to_status fi_workspace_status NOT NULL,
      actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      reason text,
      created_at timestamp DEFAULT now()
    )
  `);
  await client.query(
    "CREATE INDEX IF NOT EXISTS fi_lifecycle_events_intermediary_idx ON fi_lifecycle_events (intermediary_id)",
  );
  await client.query(
    "CREATE INDEX IF NOT EXISTS fi_lifecycle_events_created_at_idx ON fi_lifecycle_events (created_at DESC)",
  );
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS financing_intermediaries_workspace_owner_uniq
      ON financing_intermediaries (workspace_owner_user_id)
      WHERE workspace_owner_user_id IS NOT NULL
  `);
  await client.query(`
    UPDATE financing_intermediaries
       SET workspace_status = CASE WHEN is_active THEN 'active'::fi_workspace_status
                                   ELSE 'suspended'::fi_workspace_status END
     WHERE workspace_status = 'draft'
       AND workspace_owner_user_id IS NULL
  `);
  await client.query(`
    UPDATE financing_intermediaries fi
       SET workspace_owner_user_id = fi.owner_user_id
     WHERE fi.owner_user_id IS NOT NULL
       AND fi.workspace_owner_user_id IS NULL
       AND (
         SELECT COUNT(*) FROM financing_intermediaries fi2
          WHERE fi2.owner_user_id = fi.owner_user_id
       ) = 1
  `);
}

function runBaseline(database, databaseUrl) {
  return spawnSync(process.execPath, [BASELINE], {
    cwd: DB_ROOT,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      BANCO_BASELINE_EXPECT_DATABASE: database,
      BANCO_BASELINE_ADOPTION_CONFIRM: REQUIRED_CONFIRMATION,
    },
    encoding: "utf8",
  });
}

async function assertNoBaselineArtifacts(databaseUrl) {
  const client = await connect(databaseUrl);
  try {
    const drizzle = await client.query(
      "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'drizzle') AS exists",
    );
    assert.equal(drizzle.rows[0]?.exists, false, "a rejected hybrid state must not create Drizzle history");

    const reference = await client.query(`
      SELECT count(*)::int AS count
        FROM pg_namespace
       WHERE nspname LIKE 'banco_baseline_ref_%'
    `);
    assert.equal(reference.rows[0]?.count, 0, "reference schemas must roll back on rejection");
  } finally {
    await client.end();
  }
}

test("baseline source uses a lock mode that blocks concurrent table/index DDL", () => {
  const source = fs.readFileSync(BASELINE, "utf8");
  assert.match(source, /IN SHARE UPDATE EXCLUSIVE MODE/);
  assert.doesNotMatch(source, /IN ACCESS SHARE MODE/);
});

test("current FI boot-patch shape is classified as hybrid and rejected without journal writes", async (t) => {
  const ensureSource = fs.readFileSync(ENSURE_SCHEMA, "utf8");
  for (const marker of [
    "fi_workspace_status",
    "fi_lifecycle_events",
    "workspace_owner_user_id",
    "fi_lifecycle_events_intermediary_idx",
  ]) {
    assert.match(ensureSource, new RegExp(marker));
  }

  await withDisposableDatabase(t, async ({ database, databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await applyHistoricalCutoverSchema(client);
      await applyCurrentFiBootPatchShape(client);

      const hybrid = await client.query(`
        SELECT to_regclass('public.fi_lifecycle_events') AS events,
               EXISTS (
                 SELECT 1 FROM pg_type t
                 JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE n.nspname = 'public' AND t.typname = 'fi_workspace_status'
               ) AS status_enum
      `);
      assert.ok(hybrid.rows[0]?.events);
      assert.equal(hybrid.rows[0]?.status_enum, true);
    } finally {
      await client.end();
    }

    const result = runBaseline(database, databaseUrl);
    assert.notEqual(result.status, 0, "a post-cutover boot-patched schema must never be stamped as 0001");
    assert.match(result.stderr, /schema equivalence failed/i);
    await assertNoBaselineArtifacts(databaseUrl);
  });
});
