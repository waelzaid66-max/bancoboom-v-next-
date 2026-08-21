import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

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

type SnapshotColumn = {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey?: boolean;
  default?: unknown;
  generated?: { as: string; type: string };
};

type SnapshotIndex = {
  name: string;
  isUnique?: boolean;
};

type SnapshotTable = {
  name: string;
  columns: Record<string, SnapshotColumn>;
  indexes?: Record<string, SnapshotIndex>;
  foreignKeys?: Record<string, { name: string }>;
  compositePrimaryKeys?: Record<string, { name: string }>;
  uniqueConstraints?: Record<string, { name: string }>;
  checkConstraints?: Record<string, { name: string }>;
};

type SnapshotEnum = {
  name: string;
  schema: string;
  values: string[];
};

type DrizzleSnapshot = {
  tables: Record<string, SnapshotTable>;
  enums: Record<string, SnapshotEnum>;
};

type ActualColumn = {
  table_name: string;
  column_name: string;
  data_type: string;
  not_null: boolean;
  default_expr: string | null;
  generated_kind: string;
};

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

function normalizedType(type: string): string {
  const compact = type.trim().toLowerCase().replace(/,\s+/g, ",").replace(/\s+/g, " ");
  if (compact === "timestamp") return "timestamp without time zone";
  if (/^timestamp\(\d+\)$/.test(compact)) return `${compact} without time zone`;
  if (compact === "timestamptz") return "timestamp with time zone";
  if (compact === "serial") return "integer";
  if (compact === "bigserial") return "bigint";
  if (compact === "varchar") return "character varying";
  if (compact.startsWith("varchar(")) return compact.replace(/^varchar/, "character varying");
  return compact;
}

function stripOuterParens(value: string): string {
  let current = value.trim();
  while (current.startsWith("(") && current.endsWith(")")) {
    const inner = current.slice(1, -1).trim();
    let depth = 0;
    let balanced = true;
    for (const char of inner) {
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      if (depth < 0) {
        balanced = false;
        break;
      }
    }
    if (!balanced || depth !== 0) break;
    current = inner;
  }
  return current;
}

function normalizedDefault(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  let text = stripOuterParens(String(value).trim());
  text = text.replace(/::(?:"?[a-zA-Z0-9_]+"?\.)?"?[a-zA-Z0-9_ ]+"?(?:\[\])?$/u, "");
  return stripOuterParens(text).replace(/\s+/g, " ");
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function assertSameSet(label: string, expected: Iterable<string>, actual: Iterable<string>): void {
  const left = sorted(expected);
  const right = sorted(actual);
  if (left.length !== right.length || left.some((value, index) => value !== right[index])) {
    const expectedOnly = left.filter((value) => !right.includes(value));
    const actualOnly = right.filter((value) => !left.includes(value));
    throw new Error(
      `[baseline] schema equivalence failed for ${label}; missing=[${expectedOnly.join(", ")}], unexpected=[${actualOnly.join(", ")}]`,
    );
  }
}

async function assertBaselineSnapshotEquivalent(client: pg.Client): Promise<void> {
  const snapshot = JSON.parse(fs.readFileSync(ADOPTION_SNAPSHOT_PATH, "utf8")) as DrizzleSnapshot;
  const expectedTables = Object.values(snapshot.tables);

  const tableRows = await client.query<{ table_name: string }>(`
    SELECT table_name
      FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name
  `);
  assertSameSet(
    "public table set",
    expectedTables.map((table) => table.name),
    tableRows.rows.map((row) => row.table_name),
  );

  const columnRows = await client.query<ActualColumn>(`
    SELECT c.relname AS table_name,
           a.attname AS column_name,
           format_type(a.atttypid, a.atttypmod) AS data_type,
           a.attnotnull AS not_null,
           pg_get_expr(d.adbin, d.adrelid) AS default_expr,
           a.attgenerated AS generated_kind
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND a.attnum > 0
       AND NOT a.attisdropped
     ORDER BY c.relname, a.attnum
  `);

  const actualColumns = new Map<string, ActualColumn>();
  for (const row of columnRows.rows) actualColumns.set(`${row.table_name}.${row.column_name}`, row);

  const expectedColumnKeys: string[] = [];
  for (const table of expectedTables) {
    for (const column of Object.values(table.columns)) {
      const key = `${table.name}.${column.name}`;
      expectedColumnKeys.push(key);
      const actual = actualColumns.get(key);
      if (!actual) throw new Error(`[baseline] schema equivalence failed: missing column ${key}`);
      if (normalizedType(actual.data_type) !== normalizedType(column.type)) {
        throw new Error(
          `[baseline] schema equivalence failed: ${key} type expected=${column.type} actual=${actual.data_type}`,
        );
      }
      if (actual.not_null !== Boolean(column.notNull)) {
        throw new Error(
          `[baseline] schema equivalence failed: ${key} nullability expected=${column.notNull ? "NOT NULL" : "NULL"} actual=${actual.not_null ? "NOT NULL" : "NULL"}`,
        );
      }

      const expectedGenerated = Boolean(column.generated);
      const actualGenerated = actual.generated_kind === "s";
      if (expectedGenerated !== actualGenerated) {
        throw new Error(
          `[baseline] schema equivalence failed: ${key} generated expected=${expectedGenerated} actual=${actualGenerated}`,
        );
      }

      if (!expectedGenerated) {
        const expectedDefault = normalizedDefault(column.default);
        const actualDefault = normalizedDefault(actual.default_expr);
        if (expectedDefault !== actualDefault) {
          throw new Error(
            `[baseline] schema equivalence failed: ${key} default expected=${expectedDefault ?? "<none>"} actual=${actualDefault ?? "<none>"}`,
          );
        }
      }
    }
  }
  assertSameSet("public column set", expectedColumnKeys, actualColumns.keys());

  const indexRows = await client.query<{ indexname: string; is_unique: boolean }>(`
    SELECT index_class.relname AS indexname,
           index_meta.indisunique AS is_unique
      FROM pg_index index_meta
      JOIN pg_class index_class ON index_class.oid = index_meta.indexrelid
      JOIN pg_class table_class ON table_class.oid = index_meta.indrelid
      JOIN pg_namespace n ON n.oid = table_class.relnamespace
     WHERE n.nspname = 'public'
  `);
  const actualIndexes = new Map(indexRows.rows.map((row) => [row.indexname, row]));
  for (const table of expectedTables) {
    for (const index of Object.values(table.indexes ?? {})) {
      const actual = actualIndexes.get(index.name);
      if (!actual) {
        throw new Error(`[baseline] schema equivalence failed: missing index ${index.name}`);
      }
      if (actual.is_unique !== Boolean(index.isUnique)) {
        throw new Error(
          `[baseline] schema equivalence failed: index ${index.name} uniqueness expected=${Boolean(index.isUnique)} actual=${actual.is_unique}`,
        );
      }
    }
  }

  const constraintRows = await client.query<{
    table_name: string;
    constraint_name: string;
    constraint_type: string;
  }>(`
    SELECT table_name, constraint_name, constraint_type
      FROM information_schema.table_constraints
     WHERE table_schema = 'public'
  `);
  const constraints = new Map(
    constraintRows.rows.map((row) => [`${row.constraint_type}:${row.constraint_name}`, row]),
  );

  for (const table of expectedTables) {
    for (const fk of Object.values(table.foreignKeys ?? {})) {
      if (!constraints.has(`FOREIGN KEY:${fk.name}`)) {
        throw new Error(`[baseline] schema equivalence failed: missing foreign key ${fk.name}`);
      }
    }
    for (const unique of Object.values(table.uniqueConstraints ?? {})) {
      if (!constraints.has(`UNIQUE:${unique.name}`)) {
        throw new Error(`[baseline] schema equivalence failed: missing unique constraint ${unique.name}`);
      }
    }
    for (const check of Object.values(table.checkConstraints ?? {})) {
      if (!constraints.has(`CHECK:${check.name}`)) {
        throw new Error(`[baseline] schema equivalence failed: missing check constraint ${check.name}`);
      }
    }

    const expectsPrimaryKey =
      Object.values(table.columns).some((column) => Boolean(column.primaryKey)) ||
      Object.keys(table.compositePrimaryKeys ?? {}).length > 0;
    if (expectsPrimaryKey) {
      const hasPk = constraintRows.rows.some(
        (row) => row.table_name === table.name && row.constraint_type === "PRIMARY KEY",
      );
      if (!hasPk) {
        throw new Error(`[baseline] schema equivalence failed: missing primary key on ${table.name}`);
      }
    }
  }

  const enumRows = await client.query<{
    enum_name: string;
    enum_label: string;
    enum_order: number;
  }>(`
    SELECT t.typname AS enum_name,
           e.enumlabel AS enum_label,
           e.enumsortorder AS enum_order
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
     ORDER BY t.typname, e.enumsortorder
  `);

  const actualEnums = new Map<string, string[]>();
  for (const row of enumRows.rows) {
    const values = actualEnums.get(row.enum_name) ?? [];
    values.push(row.enum_label);
    actualEnums.set(row.enum_name, values);
  }
  const expectedEnums = new Map(
    Object.values(snapshot.enums).map((entry) => [entry.name, entry.values]),
  );
  assertSameSet("public enum set", expectedEnums.keys(), actualEnums.keys());
  for (const [name, values] of expectedEnums) {
    const actual = actualEnums.get(name) ?? [];
    if (values.length !== actual.length || values.some((value, index) => value !== actual[index])) {
      throw new Error(
        `[baseline] schema equivalence failed: enum ${name} expected=[${values.join(",")}] actual=[${actual.join(",")}]`,
      );
    }
  }
}

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

    await assertBaselineSnapshotEquivalent(client);

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
