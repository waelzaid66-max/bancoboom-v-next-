import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

import { assertBaselineSchemasEquivalent } from "./baselineEquivalence.ts";

/**
 * One-time adoption step for the historical push-built database lineage.
 *
 * Commit 9f3e5c59 moved real database paths from schema push to committed
 * migrations while the journal contained exactly 0000 + 0001. This command
 * therefore adopts only that immutable historical boundary. It executes those
 * two pinned migration files into an isolated reference schema, compares the
 * complete logical PostgreSQL definitions with the live public schema, stamps
 * exactly 0000..0001, and leaves 0002+ for the normal migrator.
 *
 * This command is terminal and fail-closed. Any existing Drizzle schema/journal,
 * source-contract drift, wrong database name, empty database, or schema mismatch
 * aborts the transaction without writing migration history.
 */

const DB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_FOLDER = path.join(DB_DIR, "migrations");
const JOURNAL_PATH = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");

const CUTOVER_COMMIT = "9f3e5c59fbf11014c78b06cf01262fc8e2949bb0";
const ADOPTION_CUTOFF_TAG = "0001_minor_stingray";
const ADOPTION_CONFIRM_ENV = "BANCO_BASELINE_ADOPTION_CONFIRM";
const EXPECT_DATABASE_ENV = "BANCO_BASELINE_EXPECT_DATABASE";
const REQUIRED_CONFIRMATION = `${CUTOVER_COMMIT}:${ADOPTION_CUTOFF_TAG}`;
const ADVISORY_LOCK_KEY = `banco:baseline-adoption:${CUTOVER_COMMIT}:${ADOPTION_CUTOFF_TAG}`;

const HISTORICAL_JOURNAL_PREFIX = [
  { idx: 0, when: 1785574052921, tag: "0000_fantastic_warbird" },
  { idx: 1, when: 1785603125895, tag: ADOPTION_CUTOFF_TAG },
] as const;

const HISTORICAL_MIGRATION_BLOBS = [
  {
    tag: "0000_fantastic_warbird",
    gitBlobSha: "ebb11250698defd26aad82a85c49ee4c169e51b1",
  },
  {
    tag: ADOPTION_CUTOFF_TAG,
    gitBlobSha: "eb117c67f9f29d2976bd06ed5d85678c846a6394",
  },
] as const;

// Matches drizzle-orm's node-postgres migrator exactly. If these drift, Drizzle
// will not see the rows this script writes and will try to re-run the baseline.
const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function normalizedTextFile(filePath: string): Buffer {
  const source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  return Buffer.from(source, "utf8");
}

function gitBlobSha(filePath: string): string {
  const content = normalizedTextFile(filePath);
  return createHash("sha1")
    .update(`blob ${content.length}\0`)
    .update(content)
    .digest("hex");
}

function assertHistoricalSourceContract(): {
  cutoffIndex: number;
  adoptionSqlFiles: string[];
} {
  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8")) as {
    version?: string;
    dialect?: string;
    entries?: Array<{ idx: number; when: number; tag: string }>;
  };

  if (journal.version !== "7" || journal.dialect !== "postgresql") {
    throw new Error(
      `[baseline] migration journal format drifted; expected drizzle v7/postgresql at ${JOURNAL_PATH}.`,
    );
  }

  const entries = journal.entries ?? [];
  for (const expected of HISTORICAL_JOURNAL_PREFIX) {
    const actual = entries[expected.idx];
    if (
      !actual ||
      actual.idx !== expected.idx ||
      actual.when !== expected.when ||
      actual.tag !== expected.tag
    ) {
      throw new Error(
        `[baseline] historical cutover prefix drifted at index ${expected.idx}; refusing to reinterpret ${CUTOVER_COMMIT}.`,
      );
    }
  }

  const seenIndexes = new Set<number>();
  const seenTags = new Set<string>();
  for (const entry of entries) {
    if (seenIndexes.has(entry.idx) || seenTags.has(entry.tag)) {
      throw new Error("[baseline] migration journal contains duplicate indexes or tags.");
    }
    seenIndexes.add(entry.idx);
    seenTags.add(entry.tag);
  }

  const adoptionSqlFiles = HISTORICAL_MIGRATION_BLOBS.map(({ tag, gitBlobSha: expected }) => {
    const filePath = path.join(MIGRATIONS_FOLDER, `${tag}.sql`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`[baseline] historical migration file is missing: ${filePath}`);
    }
    const actual = gitBlobSha(filePath);
    if (actual !== expected) {
      throw new Error(
        `[baseline] immutable historical migration ${tag} changed; expected Git blob ${expected}, received ${actual}.`,
      );
    }
    return filePath;
  });

  return {
    cutoffIndex: HISTORICAL_JOURNAL_PREFIX.length - 1,
    adoptionSqlFiles,
  };
}

function rewritePublicSchema(sql: string, referenceSchema: string): string {
  const replacement = `${quoteIdentifier(referenceSchema)}.`;
  return sql
    .replaceAll('"public".', replacement)
    .replace(/\bpublic\./g, replacement);
}

async function executeMigrationSql(
  client: pg.Client,
  filePath: string,
  referenceSchema: string,
): Promise<void> {
  const sql = rewritePublicSchema(fs.readFileSync(filePath, "utf8"), referenceSchema);
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.query(statement);
  }
}

async function lockPublicTablesAgainstDdl(client: pg.Client): Promise<number> {
  const rows = await client.query<{ relation_name: string }>(`
    SELECT c.relname AS relation_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r', 'p')
     ORDER BY c.relname
  `);

  if (rows.rows.length === 0) return 0;

  const relations = rows.rows
    .map(({ relation_name }) => `${quoteIdentifier("public")}.${quoteIdentifier(relation_name)}`)
    .join(", ");

  // ACCESS SHARE only blocks ACCESS EXCLUSIVE and still permits both ordinary
  // and concurrent index creation. SHARE UPDATE EXCLUSIVE keeps normal DML
  // available while blocking ALTER/DROP plus CREATE INDEX and CREATE INDEX
  // CONCURRENTLY for the duration of the catalog comparison transaction.
  await client.query(`LOCK TABLE ${relations} IN SHARE UPDATE EXCLUSIVE MODE`);
  return rows.rows.length;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set — refusing to baseline an unknown database.");
  }

  if (process.env[ADOPTION_CONFIRM_ENV] !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `${ADOPTION_CONFIRM_ENV} must equal ${REQUIRED_CONFIRMATION} — refusing legacy adoption without the exact historical cutover confirmation.`,
    );
  }

  const expectedDatabase = process.env[EXPECT_DATABASE_ENV]?.trim();
  if (!expectedDatabase) {
    throw new Error(
      `${EXPECT_DATABASE_ENV} is required — refusing to infer the intended database from DATABASE_URL alone.`,
    );
  }

  const { cutoffIndex, adoptionSqlFiles } = assertHistoricalSourceContract();
  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (migrations.length <= cutoffIndex) {
    throw new Error(
      `[baseline] migration folder does not contain the historical set through ${ADOPTION_CUTOFF_TAG}.`,
    );
  }
  for (const expected of HISTORICAL_JOURNAL_PREFIX) {
    if (migrations[expected.idx]?.folderMillis !== expected.when) {
      throw new Error(
        `[baseline] Drizzle migration ordering drifted at ${expected.tag}; refusing to stamp a different history.`,
      );
    }
  }
  const adoptionMigrations = migrations.slice(0, cutoffIndex + 1);

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  let inTransaction = false;
  try {
    await client.query("BEGIN");
    inTransaction = true;
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query("SET LOCAL statement_timeout = '15min'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      ADVISORY_LOCK_KEY,
    ]);

    const identity = await client.query<{ database_name: string }>(
      "SELECT current_database() AS database_name",
    );
    const actualDatabase = identity.rows[0]?.database_name;
    if (actualDatabase !== expectedDatabase) {
      throw new Error(
        `[baseline] connected database is ${actualDatabase ?? "<unknown>"}, but ${EXPECT_DATABASE_ENV} requires ${expectedDatabase}.`,
      );
    }

    const existingDrizzleSchema = await client.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS exists",
      [MIGRATIONS_SCHEMA],
    );
    if (existingDrizzleSchema.rows[0]?.exists) {
      throw new Error(
        `[baseline] schema ${MIGRATIONS_SCHEMA} already exists; baseline is one-time only and will not fill, replace, or reinterpret an existing migration state.`,
      );
    }

    const tableCount = await lockPublicTablesAgainstDdl(client);
    if (tableCount === 0) {
      throw new Error(
        "This database is empty. Baselining it would skip the migrations that build the schema — run `migrate` instead.",
      );
    }

    const referenceSchema = `banco_baseline_ref_${process.pid}_${randomBytes(6).toString("hex")}`;
    await client.query(`CREATE SCHEMA ${quoteIdentifier(referenceSchema)}`);
    await client.query("SELECT set_config('search_path', $1, true)", [
      `${quoteIdentifier(referenceSchema)}, ${quoteIdentifier("public")}, pg_catalog`,
    ]);

    for (const filePath of adoptionSqlFiles) {
      await executeMigrationSql(client, filePath, referenceSchema);
    }

    await assertBaselineSchemasEquivalent(client, referenceSchema, "public");
    await client.query(`DROP SCHEMA ${quoteIdentifier(referenceSchema)} CASCADE`);
    await client.query("SELECT set_config('search_path', $1, true)", [
      `${quoteIdentifier("public")}, pg_catalog`,
    ]);

    await client.query(`CREATE SCHEMA ${quoteIdentifier(MIGRATIONS_SCHEMA)}`);
    await client.query(
      `CREATE TABLE ${quoteIdentifier(MIGRATIONS_SCHEMA)}.${quoteIdentifier(MIGRATIONS_TABLE)} (
         id SERIAL PRIMARY KEY,
         hash text NOT NULL,
         created_at bigint
       )`,
    );

    for (const migration of adoptionMigrations) {
      await client.query(
        `INSERT INTO ${quoteIdentifier(MIGRATIONS_SCHEMA)}.${quoteIdentifier(MIGRATIONS_TABLE)} (hash, created_at)
         VALUES ($1, $2)`,
        [migration.hash, migration.folderMillis],
      );
    }

    await client.query("COMMIT");
    inTransaction = false;

    console.log(
      `[baseline] ${actualDatabase}: executable schema matches ${CUTOVER_COMMIT}@${ADOPTION_CUTOFF_TAG}; stamped exactly ${adoptionMigrations.length} historical migration(s).`,
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
