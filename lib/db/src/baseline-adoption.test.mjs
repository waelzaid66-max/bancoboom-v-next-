import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

const DB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = path.join(DB_ROOT, "src", "baseline.ts");
const MIGRATIONS = path.join(DB_ROOT, "migrations");
const BASE_DATABASE_URL = process.env.DATABASE_URL?.trim();

if (!BASE_DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for baseline-adoption integration tests. Use the disposable Postgres test service, never production.",
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

async function withDisposableDatabase(t, fn) {
  const database = `banco_baseline_${crypto.randomBytes(8).toString("hex")}`;
  const admin = new pg.Client({ connectionString: adminUrlFor(BASE_DATABASE_URL) });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  const url = databaseUrlFor(BASE_DATABASE_URL, database);

  t.after(async () => {
    await admin.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [database],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
    await admin.end();
  });

  await fn(url);
}

function runBaseline(databaseUrl) {
  return spawnSync(process.execPath, [BASELINE], {
    cwd: DB_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
}

async function connect(databaseUrl) {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

async function seedDrizzleJournal(client, hashes) {
  await client.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);
  for (let i = 0; i < hashes.length; i += 1) {
    await client.query(
      'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hashes[i], i + 1],
    );
  }
}

async function journalHashes(client) {
  const exists = await client.query(`
    SELECT to_regclass('drizzle.__drizzle_migrations') AS regclass
  `);
  if (!exists.rows[0]?.regclass) return [];
  const rows = await client.query(
    'SELECT hash FROM "drizzle"."__drizzle_migrations" ORDER BY id ASC',
  );
  return rows.rows.map((row) => row.hash);
}

const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS });
assert.equal(migrations.length, 8, "current Gate-1 test contract expects migrations 0000..0007");

const migrationHashes = migrations.map((migration) => migration.hash);
const criticalHashes = migrationHashes.slice(4, 8);

test("control: baseline rejects a genuinely empty database", async (t) => {
  await withDisposableDatabase(t, async (databaseUrl) => {
    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0, "empty databases must run migrate, never baseline");
  });
});

test("RED: arbitrary non-empty but non-equivalent database must be rejected", async (t) => {
  await withDisposableDatabase(t, async (databaseUrl) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE unrelated_marker(id integer PRIMARY KEY)");
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(
      result.status,
      0,
      "one unrelated public table is not evidence that the committed BANCO schema is equivalent",
    );
  });
});

test("RED: a partial Drizzle migration journal must fail closed", async (t) => {
  await withDisposableDatabase(t, async (databaseUrl) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE historical_marker(id integer PRIMARY KEY)");
      await seedDrizzleJournal(client, migrationHashes.slice(0, 3));
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(
      result.status,
      0,
      "baseline must not silently fill a mixed/partial migration history",
    );
  });
});

test("RED: baseline must not be a repeatable stamp-current-folder command", async (t) => {
  await withDisposableDatabase(t, async (databaseUrl) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE historical_marker(id integer PRIMARY KEY)");
    } finally {
      await client.end();
    }

    const first = runBaseline(databaseUrl);
    assert.equal(
      first.status,
      0,
      `pre-fix reproduction setup expects the first legacy baseline to complete; stderr=${first.stderr}`,
    );

    const second = runBaseline(databaseUrl);
    assert.notEqual(
      second.status,
      0,
      "a completed adoption must be terminal; a second baseline invocation must fail closed",
    );
  });
});

test("RED: a migration newer than the adoption boundary must remain pending", async (t) => {
  await withDisposableDatabase(t, async (databaseUrl) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE historical_marker(id integer PRIMARY KEY)");
      await seedDrizzleJournal(client, migrationHashes.slice(0, 7));
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(
      result.status,
      0,
      "baseline must not stamp a later migration merely because it exists in the current folder",
    );

    const verify = await connect(databaseUrl);
    try {
      const hashes = await journalHashes(verify);
      assert.equal(
        hashes.includes(migrationHashes[7]),
        false,
        "0007-equivalent later migration must remain pending for migrate",
      );
    } finally {
      await verify.end();
    }
  });
});

test("RED: critical 0004..0007 hashes must never be stamped when their physical guarantees are absent", async (t) => {
  await withDisposableDatabase(t, async (databaseUrl) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE unrelated_marker(id integer PRIMARY KEY)");
    } finally {
      await client.end();
    }

    runBaseline(databaseUrl);

    const verify = await connect(databaseUrl);
    try {
      const hashes = await journalHashes(verify);
      for (const hash of criticalHashes) {
        assert.equal(
          hashes.includes(hash),
          false,
          "FI/Billing/Messenger migration hashes cannot be claimed without their DDL/DML postconditions",
        );
      }
    } finally {
      await verify.end();
    }
  });
});
