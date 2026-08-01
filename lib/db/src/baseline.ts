import { fileURLToPath } from "node:url";
import path from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

/**
 * One-time adoption step for a database that already has the schema.
 *
 * The production database was built by `drizzle-kit push`, so its 71 tables
 * exist but nothing recorded how they got there. Pointing `migrate` at it as-is
 * would fail on the first statement — `CREATE TABLE "users"` against a users
 * table that is already there — and the deploy would stop with the schema
 * perfectly fine and the tooling convinced it was broken.
 *
 * This marks the existing migrations as already applied WITHOUT executing them,
 * which is exactly what they would have recorded had they been the thing that
 * created these tables. From that point on, `migrate` only ever runs migrations
 * written after adoption, and dev / test / production converge.
 *
 * Run once per existing database, then never again:
 *   pnpm --filter @workspace/db run baseline
 *
 * A brand-new empty database must NOT be baselined — it needs the migrations to
 * actually run. The guard below enforces that rather than trusting the operator
 * to remember which kind of database they are pointed at.
 */

const MIGRATIONS_FOLDER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);

// Matches drizzle-orm's node-postgres migrator exactly. If these drift, drizzle
// will not see the rows this script writes and will try to re-run everything.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

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

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    // Guard: only an already-populated database may be baselined. `public`
    // tables are counted rather than a specific table name so this stays true
    // if the schema is renamed later.
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
    for (const migration of migrations) {
      if (seen.has(migration.hash)) continue;
      await client.query(
        `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (hash, created_at) VALUES ($1, $2)`,
        [migration.hash, migration.folderMillis],
      );
      stamped += 1;
    }

    console.log(
      `[baseline] database has ${tableCount} tables; marked ${stamped} migration(s) as applied (${already.length} were already recorded).`,
    );
    console.log("[baseline] `migrate` will now only run migrations written from here on.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("[baseline] FAILED:", error);
  process.exit(1);
});
