import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

import { assertBaselineSnapshotEquivalent } from "./baselineEquivalence.ts";

/**
 * One-time adoption step for the historical push-built database lineage.
 *
 * The deployment migration cutover was made when migrations 0000 and 0001 were
 * the complete committed/journalled set (commit 9f3e5c59). Existing databases
 * may therefore be adopted ONLY if their physical public schema is equivalent
 * to the 0001 snapshot. Every migration after 0001 belongs to the normal
 * migrator and must never be stamped by this command.
 *
 * This command is intentionally fail-closed and terminal:
 * - it refuses empty/non-equivalent databases;
 * - it refuses any pre-existing Drizzle migration journal, including partial
 *   journals and repeat invocations;
 * - it stamps exactly 0000..0001 inside one transaction;
 * - it leaves 0002+ pending for `migrate`.
 *
 * Set BANCO_BASELINE_ADOPTION_CONFIRM=0001_minor_stingray only after taking the
 * required backup and confirming this is the historical pre-journal database.
 */

const DB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_FOLDER = path.join(DB_DIR, "migrations");
const JOURNAL_PATH = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");
const ADOPTION_CUTOFF_TAG = "0001_minor_stingray";
const ADOPTION_SNAPSHOT_PATH = path.join(
  MIGRATIONS_FOLDER,
  "meta",
  "0001_snapshot.json",
);
const ADOPTION_CONFIRM_ENV = "BANCO_BASELINE_ADOPTION_CONFIRM";
const ADVISORY_LOCK_KEY = "banco:baseline-adoption:0001";

// Matches drizzle-orm's node-postgres migrator exactly. If these drift, drizzle
// will not see the rows this script writes and will try to re-run everything.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set — refusing to baseline an unknown database.");
  }

  if (process.env[ADOPTION_CONFIRM_ENV] !== ADOPTION_CUTOFF_TAG) {
    throw new Error(
      `${ADOPTION_CONFIRM_ENV} must equal ${ADOPTION_CUTOFF_TAG} — refusing legacy adoption without an explicit cutoff confirmation.`,
    );
  }

  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8")) as {
    entries?: Array<{ idx: number; when: number; tag: string }>;
  };
  const cutoff = journal.entries?.find((entry) => entry.tag === ADOPTION_CUTOFF_TAG);
  if (!cutoff || cutoff.idx !== 1) {
    throw new Error(
      `Historical adoption cutoff ${ADOPTION_CUTOFF_TAG} is missing or moved in ${JOURNAL_PATH}; refusing to guess.`,
    );
  }

  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (migrations.length <= cutoff.idx) {
    throw new Error(
      `Migration folder does not contain the full historical adoption set through ${ADOPTION_CUTOFF_TAG}.`,
    );
  }
  if (migrations[cutoff.idx]?.folderMillis !== cutoff.when) {
    throw new Error(
      `Migration ordering drifted at ${ADOPTION_CUTOFF_TAG}; refusing to baseline against a different journal.`,
    );
  }
  const adoptionMigrations = migrations.slice(0, cutoff.idx + 1);

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  let inTransaction = false;
  try {
    await client.query("BEGIN");
    inTransaction = true;
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [ADVISORY_LOCK_KEY]);

    // Any existing journal means this database is already adopted, partially
    // adopted, or otherwise mixed. Filling missing hashes would fabricate
    // history, so every such state is rejected for explicit reconciliation.
    const existingJournal = await client.query<{ regclass: string | null }>(
      `SELECT to_regclass('${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}')::text AS regclass`,
    );
    if (existingJournal.rows[0]?.regclass) {
      throw new Error(
        `Drizzle migration journal already exists at ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}; baseline is one-time only and will not repair/fill an existing journal.`,
      );
    }

    const { rows: existing } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    const tableCount = Number(existing[0]?.count ?? 0);
    if (tableCount === 0) {
      throw new Error(
        "This database is empty. Baselining it would permanently skip the migrations that build the schema — run `migrate` instead.",
      );
    }

    // Executable equivalence proof: compare the physical legacy schema to the
    // exact 0001 Drizzle snapshot before writing any migration history.
    await assertBaselineSnapshotEquivalent(client, ADOPTION_SNAPSHOT_PATH);

    await client.query(`CREATE SCHEMA "${MIGRATIONS_SCHEMA}"`);
    await client.query(
      `CREATE TABLE "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
         id SERIAL PRIMARY KEY,
         hash text NOT NULL,
         created_at bigint
       )`,
    );

    for (const migration of adoptionMigrations) {
      await client.query(
        `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (hash, created_at) VALUES ($1, $2)`,
        [migration.hash, migration.folderMillis],
      );
    }

    await client.query("COMMIT");
    inTransaction = false;

    console.log(
      `[baseline] physical schema matches ${ADOPTION_CUTOFF_TAG}; marked exactly ${adoptionMigrations.length} historical migration(s) as applied.`,
    );
    console.log(
      `[baseline] migrations after ${ADOPTION_CUTOFF_TAG} remain pending; run \`pnpm --filter @workspace/db run migrate\` now.`,
    );
  } catch (error) {
    if (inTransaction) {
      await client.query("ROLLBACK").catch(() => {});
      inTransaction = false;
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("[baseline] FAILED:", error);
  process.exit(1);
});
