import fs from "node:fs";

import type pg from "pg";

type SnapshotColumn = {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey?: boolean;
};

type SnapshotTable = {
  name: string;
  columns: Record<string, SnapshotColumn>;
  indexes?: Record<string, { name: string }>;
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
};

function normalizedType(type: string): string {
  const compact = type.trim().toLowerCase().replace(/,\s+/g, ",").replace(/\s+/g, " ");
  if (compact === "timestamp") return "timestamp without time zone";
  if (compact === "timestamptz") return "timestamp with time zone";
  if (compact === "serial") return "integer";
  if (compact === "bigserial") return "bigint";
  if (compact.startsWith("varchar(")) return compact.replace(/^varchar/, "character varying");
  return compact;
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

export async function assertBaselineSnapshotEquivalent(
  client: pg.Client,
  snapshotPath: string,
): Promise<void> {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as DrizzleSnapshot;
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
           a.attnotnull AS not_null
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
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
    }
  }
  assertSameSet("public column set", expectedColumnKeys, actualColumns.keys());

  const indexRows = await client.query<{ indexname: string }>(`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
  `);
  const actualIndexes = new Set(indexRows.rows.map((row) => row.indexname));
  for (const table of expectedTables) {
    for (const index of Object.values(table.indexes ?? {})) {
      if (!actualIndexes.has(index.name)) {
        throw new Error(`[baseline] schema equivalence failed: missing index ${index.name}`);
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
