import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

const DB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = path.join(DB_ROOT, "src", "baseline.ts");
const MIGRATE = path.join(DB_ROOT, "src", "migrate.ts");
const MIGRATIONS = path.join(DB_ROOT, "migrations");
const JOURNAL = JSON.parse(
  fs.readFileSync(path.join(MIGRATIONS, "meta", "_journal.json"), "utf8"),
);
const BASE_DATABASE_URL = process.env.DATABASE_URL?.trim();

const CUTOVER_COMMIT = "9f3e5c59fbf11014c78b06cf01262fc8e2949bb0";
const ADOPTION_CUTOFF_TAG = "0001_minor_stingray";
const ADOPTION_CUTOFF_INDEX = 1;
const REQUIRED_CONFIRMATION = `${CUTOVER_COMMIT}:${ADOPTION_CUTOFF_TAG}`;
const CRITICAL_TAGS = [
  "0004_fi_workspace_lifecycle",
  "0005_early_talisman",
  "0006_outgoing_thunderball",
  "0007_early_tiger_shark",
];

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

function databaseNameFromUrl(databaseUrl) {
  return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
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
  const database = `banco_baseline_${crypto.randomBytes(8).toString("hex")}`;
  const admin = new pg.Client({ connectionString: adminUrlFor(BASE_DATABASE_URL) });
  await admin.connect();
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

function runScript(script, databaseUrl, options = {}) {
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };
  delete env.BANCO_BASELINE_ADOPTION_CONFIRM;
  delete env.BANCO_BASELINE_EXPECT_DATABASE;

  if (options.confirmation !== null) {
    env.BANCO_BASELINE_ADOPTION_CONFIRM =
      options.confirmation ?? REQUIRED_CONFIRMATION;
  }
  if (options.expectedDatabase !== null) {
    env.BANCO_BASELINE_EXPECT_DATABASE =
      options.expectedDatabase ?? databaseNameFromUrl(databaseUrl);
  }

  return spawnSync(process.execPath, [script], {
    cwd: DB_ROOT,
    env,
    encoding: "utf8",
  });
}

function runBaseline(databaseUrl, options) {
  return runScript(BASELINE, databaseUrl, options);
}

function runMigrate(databaseUrl) {
  return spawnSync(process.execPath, [MIGRATE], {
    cwd: DB_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
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
  for (let index = 0; index < hashes.length; index += 1) {
    await client.query(
      'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hashes[index], index + 1],
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

async function referenceSchemaCount(client) {
  const result = await client.query(`
    SELECT count(*)::int AS count
      FROM pg_namespace
     WHERE nspname LIKE 'banco_baseline_ref_%'
  `);
  return result.rows[0]?.count ?? 0;
}

async function assertNoAdoptionWrites(databaseUrl) {
  const client = await connect(databaseUrl);
  try {
    assert.deepEqual(await journalHashes(client), []);
    assert.equal(await referenceSchemaCount(client), 0);
  } finally {
    await client.end();
  }
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

async function applyHistoricalSchema(client) {
  await applyMigrationFile(client, 0);
  await applyMigrationFile(client, 1);
}

const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS });
assert.ok(
  migrations.length >= 8,
  "Gate-1 requires at least the current 0000..0007 history; later migrations remain supported",
);
assert.equal(JOURNAL.entries[ADOPTION_CUTOFF_INDEX]?.tag, ADOPTION_CUTOFF_TAG);

const migrationHashes = migrations.map((migration) => migration.hash);
const adoptionHashes = migrationHashes.slice(0, ADOPTION_CUTOFF_INDEX + 1);
const postAdoptionHashes = migrationHashes.slice(ADOPTION_CUTOFF_INDEX + 1);
const criticalHashes = CRITICAL_TAGS.map((tag) => {
  const index = JOURNAL.entries.findIndex((entry) => entry.tag === tag);
  assert.notEqual(index, -1, `critical migration ${tag} missing from journal`);
  return migrationHashes[index];
});

test("baseline requires the exact historical cutover confirmation", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const result = runBaseline(databaseUrl, { confirmation: null });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /BANCO_BASELINE_ADOPTION_CONFIRM/);
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("baseline requires an explicit matching database identity", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const result = runBaseline(databaseUrl, { expectedDatabase: "not_the_target" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /connected database/i);
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("baseline rejects a genuinely empty database", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0, "empty databases must run migrate, never baseline");
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("arbitrary non-empty but non-equivalent database is rejected", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE unrelated_marker(id integer PRIMARY KEY)");
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema equivalence failed/i);
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("an existing Drizzle schema without a journal is rejected", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await client.query('CREATE SCHEMA "drizzle"');
      await client.query("CREATE TABLE historical_marker(id integer PRIMARY KEY)");
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema drizzle already exists/i);
  });
});

test("a partial adoption journal fails closed", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE historical_marker(id integer PRIMARY KEY)");
      await seedDrizzleJournal(client, adoptionHashes.slice(0, 1));
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema drizzle already exists/i);
  });
});

test("a completed adoption is terminal and cannot be baselined again", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await client.query("CREATE TABLE historical_marker(id integer PRIMARY KEY)");
      await seedDrizzleJournal(client, adoptionHashes);
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /one-time only/i);
  });
});

test("a same-name index with the wrong definition is rejected", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await applyHistoricalSchema(client);
      await client.query('DROP INDEX "idx_ads_active"');
      await client.query('CREATE INDEX "idx_ads_active" ON "ads" ("created_at")');
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema equivalence failed/i);
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("a same-name foreign key with different delete semantics is rejected", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await applyHistoricalSchema(client);
      await client.query(
        'ALTER TABLE "ads" DROP CONSTRAINT "ads_seller_id_users_id_fk"',
      );
      await client.query(`
        ALTER TABLE "ads"
        ADD CONSTRAINT "ads_seller_id_users_id_fk"
        FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE
      `);
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema equivalence failed/i);
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("a changed column default is rejected even when name, type and nullability match", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    try {
      await applyHistoricalSchema(client);
      await client.query(
        `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'dealer'::"user_role"`,
      );
    } finally {
      await client.end();
    }

    const result = runBaseline(databaseUrl);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /schema equivalence failed/i);
    await assertNoAdoptionWrites(databaseUrl);
  });
});

test("critical 0004..0007 hashes are never stamped without their physical guarantees", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
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
        assert.equal(hashes.includes(hash), false);
      }
    } finally {
      await verify.end();
    }
  });
});

test("proven 0000..0001 schema baselines only to cutoff; migrate owns every later migration", async (t) => {
  await withDisposableDatabase(t, async ({ databaseUrl }) => {
    const client = await connect(databaseUrl);
    let activeOwnerId;
    let suspendedOwnerId;
    try {
      await applyHistoricalSchema(client);

      activeOwnerId = (
        await client.query(
          "INSERT INTO users (clerk_id, name) VALUES ('baseline_active_owner', 'Active owner') RETURNING id",
        )
      ).rows[0].id;
      suspendedOwnerId = (
        await client.query(
          "INSERT INTO users (clerk_id, name) VALUES ('baseline_suspended_owner', 'Suspended owner') RETURNING id",
        )
      ).rows[0].id;
      await client.query(
        "INSERT INTO financing_intermediaries (name, owner_user_id, is_active) VALUES ('Legacy active FI', $1, true), ('Legacy suspended FI', $2, false)",
        [activeOwnerId, suspendedOwnerId],
      );
    } finally {
      await client.end();
    }

    const baseline = runBaseline(databaseUrl);
    assert.equal(baseline.status, 0, baseline.stderr || baseline.stdout);

    const afterBaseline = await connect(databaseUrl);
    try {
      assert.deepEqual(await journalHashes(afterBaseline), adoptionHashes);
      for (const hash of postAdoptionHashes) {
        assert.equal(
          (await journalHashes(afterBaseline)).includes(hash),
          false,
          "post-cutoff migrations must remain pending",
        );
      }
      assert.equal(await referenceSchemaCount(afterBaseline), 0);
    } finally {
      await afterBaseline.end();
    }

    const migrate = runMigrate(databaseUrl);
    assert.equal(migrate.status, 0, migrate.stderr || migrate.stdout);

    const verify = await connect(databaseUrl);
    try {
      assert.deepEqual(await journalHashes(verify), migrationHashes);

      const usersColumns = await verify.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name IN ('last_seen_at', 'show_presence')
        ORDER BY column_name
      `);
      assert.deepEqual(
        usersColumns.rows.map((row) => row.column_name),
        ["last_seen_at", "show_presence"],
      );

      const fi = await verify.query(
        `SELECT owner_user_id, workspace_owner_user_id, workspace_status
           FROM financing_intermediaries
          WHERE owner_user_id IN ($1, $2)
          ORDER BY owner_user_id::text`,
        [activeOwnerId, suspendedOwnerId],
      );
      assert.equal(fi.rows.length, 2);
      for (const row of fi.rows) {
        assert.equal(row.workspace_owner_user_id, row.owner_user_id);
        const expected = row.owner_user_id === activeOwnerId ? "active" : "suspended";
        assert.equal(row.workspace_status, expected);
      }

      const requiredRelations = await verify.query(`
        SELECT to_regclass('public.fi_lifecycle_events') AS fi_events,
               to_regclass('public.billing_receipt_outbox') AS billing_outbox,
               to_regclass('public.message_notification_outbox') AS message_outbox,
               to_regclass('public.uniq_message_client_attempt') AS message_idempotency
      `);
      assert.ok(requiredRelations.rows[0].fi_events);
      assert.ok(requiredRelations.rows[0].billing_outbox);
      assert.ok(requiredRelations.rows[0].message_outbox);
      assert.ok(requiredRelations.rows[0].message_idempotency);

      const messageColumn = await verify.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'client_message_id'
      `);
      assert.equal(messageColumn.rowCount, 1);

      const expectedIndexes = [
        "financing_intermediaries_workspace_owner_uniq",
        "uniq_notification_dedupe",
        "uniq_message_client_attempt",
        "idx_message_notification_outbox_due",
      ];
      const indexes = await verify.query(
        `SELECT indexname FROM pg_indexes
          WHERE schemaname = 'public' AND indexname = ANY($1::text[])
          ORDER BY indexname`,
        [expectedIndexes],
      );
      assert.deepEqual(
        indexes.rows.map((row) => row.indexname),
        [...expectedIndexes].sort(),
      );

      const recipientRoleConstraint = await verify.query(`
        SELECT pg_get_constraintdef(oid) AS definition
          FROM pg_constraint
         WHERE conname = 'message_notification_outbox_recipient_role'
      `);
      assert.equal(recipientRoleConstraint.rowCount, 1);
      assert.match(recipientRoleConstraint.rows[0].definition, /buyer.*seller/);
    } finally {
      await verify.end();
    }
  });
});
