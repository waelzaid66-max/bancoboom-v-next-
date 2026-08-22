import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

/**
 * One-time adoption step for a database that already has the historical schema.
 *
 * The production database was originally built by `drizzle-kit push`, so its
 * pre-migration objects can exist without drizzle.__drizzle_migrations rows.
 * Pointing `migrate` at such a database as-is fails on the first already-existing
 * object. Baseline records ONLY the migration prefix that formed the verified
 * adoption snapshot; every migration added after that prefix must execute
 * normally through `migrate`.
 *
 * This is deliberately stricter than "stamp every migration currently in the
 * folder". Later migrations contain data reconciliation, outbox tables and
 * Messenger idempotency state. Marking those as applied merely because a
 * database is non-empty can create a false-green migration journal while the
 * live schema/data is incomplete.
 *
 * Run once per existing pre-journal database, after independent equivalence
 * proof and backup, then run `migrate` immediately afterwards:
 *   pnpm --filter @workspace/db run baseline
 *   pnpm --filter @workspace/db run migrate
 *
 * A brand-new empty database must NOT be baselined — it needs all migrations to
 * actually run.
 */

const MIGRATIONS_FOLDER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);

// Historical adoption snapshot verified before later product migrations were
// introduced. Never silently extend this list when a new migration is added.
// If a pre-journal database contains objects newer than this prefix, reconcile
// that database explicitly rather than teaching baseline to skip new work.
const ADOPTION_BASELINE_TAGS = [
  "0000_fantastic_warbird",
  "0001_minor_stingray",
  "0002_violet_miss_america",
  "0003_typical_human_robot",
] as const;

// Matches drizzle-orm's node-postgres migrator exactly. If these drift, drizzle
// will not see the rows this script writes and will try to re-run everything.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

type MigrationJournal = {
  entries?: Array<{ tag?: string }>;
};

function adoptionMigrationCount(): number {
  const journalPath = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");
  let journal: MigrationJournal;

  try {
    journal = JSON.parse(readFileSync(journalPath, "utf8")) as MigrationJournal;
  } catch (error) {
    throw new Error(`Failed to read migration journal at ${journalPath}`, { cause: error });
  }

  const actualPrefix = (journal.entries ?? [])
    .slice(0, ADOPTION_BASELINE_TAGS.length)
    .map((entry) => entry.tag ?? "");

  const expectedPrefix = [...ADOPTION_BASELINE_TAGS];
  if (
    actualPrefix.length !== expectedPrefix.length ||
    actualPrefix.some((tag, index) => tag !== expectedPrefix[index])
  ) {
    throw new Error(
      `Migration journal no longer matches the historical adoption prefix. ` +
        `Expected ${expectedPrefix.join(", ")}; got ${actualPrefix.join(", ") || "<empty>"}. ` +
        `Refusing to baseline because silently expanding/reordering the adoption set can skip real migrations.`,
    );
  }

  return expectedPrefix.length;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set — refusing to baseline an unknown database.");
  }

  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (migrations.length === 0) {
    throw new Error(
      `No migrations found in ${MIGRATIONS_FOLDER} — run \`pnpm --filter @workspace/db run generate\` first.`,
    );
  }

  const adoptionCount = adoptionMigrationCount();
  if (migrations.length < adoptionCount) {
    throw new Error(
      `Only ${migrations.length} migration(s) were loaded, but the historical adoption prefix requires ${adoptionCount}. Refusing to baseline.`,
    );
  }
  const migrationsToStamp = migrations.slice(0, adoptionCount);

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    // Guard: only an already-populated database may be baselined. `public`
    // tables are counted rather than a specific table name so this stays true
    // if the schema is renamed later. Non-empty is NOT equivalence proof; the
    // operator must complete that proof before running this command.
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

    await client.query(`CREATE SCHEMA IF NOT EXISTS "${MIGRATIONS_SCHEMA}"`);
    await client.query(
      `CREATE TABLE IF NOT EXISTS "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
         id SERIAL PRIMARY KEY,
         hash text NOT NULL,
         created_at bigint
       )`,
    );

    const { rows: already } = await client.query<{ hash: string }>(
      `SELECT hash FROM "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"`,
    );
    const seen = new Set(already.map((r) => r.hash));

    let stamped = 0;
    for (const migration of migrationsToStamp) {
      if (seen.has(migration.hash)) continue;
      await client.query(
        `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (hash, created_at) VALUES ($1, $2)`,
        [migration.hash, migration.folderMillis],
      );
      stamped += 1;
    }

    console.log(
      `[baseline] database has ${tableCount} tables; marked ${stamped} historical adoption migration(s) as applied (${already.length} journal row(s) already existed).`,
    );
    console.log(
      `[baseline] adoption prefix ends at ${ADOPTION_BASELINE_TAGS.at(-1)}; later migrations were NOT stamped and must run through \`migrate\`.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("[baseline] FAILED:", error);
  process.exit(1);
});
