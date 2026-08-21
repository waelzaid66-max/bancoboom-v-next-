import fs from "node:fs";

import type { Client } from "pg";

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

export async function assertBaselineSnapshotEquivalent(
  client: Client,
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
