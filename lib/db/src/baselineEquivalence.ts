import type { Client } from "pg";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDefinition(value: string | null, localSchema: string): string | null {
  if (value === null) return null;

  let normalized = value;
  for (const schema of new Set([localSchema, "public"])) {
    normalized = normalized.replaceAll(`${quoteIdentifier(schema)}.`, "");
    normalized = normalized.replace(
      new RegExp(`\\b${escapeRegExp(schema)}\\.`, "g"),
      "",
    );
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function canonicalizeRows<T extends Record<string, unknown>>(
  rows: T[],
  localSchema: string,
  definitionKeys: string[] = [],
): JsonValue[] {
  return rows.map((row) => {
    const next: Record<string, JsonValue> = {};
    for (const [key, rawValue] of Object.entries(row)) {
      if (definitionKeys.includes(key)) {
        next[key] = normalizeDefinition(rawValue === null ? null : String(rawValue), localSchema);
      } else if (Array.isArray(rawValue)) {
        next[key] = [...rawValue].map((value) => String(value)).sort();
      } else if (
        rawValue === null ||
        typeof rawValue === "boolean" ||
        typeof rawValue === "number" ||
        typeof rawValue === "string"
      ) {
        next[key] = rawValue;
      } else {
        next[key] = String(rawValue);
      }
    }
    return next;
  });
}

function firstDifference(
  expected: JsonValue,
  actual: JsonValue,
  path = "$",
): string | null {
  if (Object.is(expected, actual)) return null;

  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      return `${path}: expected ${JSON.stringify(expected)}; actual ${JSON.stringify(actual)}`;
    }
    if (expected.length !== actual.length) {
      return `${path}.length: expected ${expected.length}; actual ${actual.length}`;
    }
    for (let index = 0; index < expected.length; index += 1) {
      const difference = firstDifference(expected[index], actual[index], `${path}[${index}]`);
      if (difference) return difference;
    }
    return null;
  }

  if (
    expected !== null &&
    actual !== null &&
    typeof expected === "object" &&
    typeof actual === "object"
  ) {
    const expectedObject = expected as Record<string, JsonValue>;
    const actualObject = actual as Record<string, JsonValue>;
    const expectedKeys = Object.keys(expectedObject).sort();
    const actualKeys = Object.keys(actualObject).sort();
    const keyDifference = firstDifference(expectedKeys, actualKeys, `${path}.__keys`);
    if (keyDifference) return keyDifference;

    for (const key of expectedKeys) {
      const difference = firstDifference(
        expectedObject[key],
        actualObject[key],
        `${path}.${key}`,
      );
      if (difference) return difference;
    }
    return null;
  }

  return `${path}: expected ${JSON.stringify(expected)}; actual ${JSON.stringify(actual)}`;
}

async function setInspectionSearchPath(client: Client, schema: string): Promise<void> {
  const searchPath =
    schema === "public"
      ? `${quoteIdentifier("public")}, pg_catalog`
      : `${quoteIdentifier(schema)}, ${quoteIdentifier("public")}, pg_catalog`;
  await client.query("SELECT set_config('search_path', $1, true)", [searchPath]);
}

async function captureSchema(client: Client, schema: string): Promise<JsonValue> {
  await setInspectionSearchPath(client, schema);

  const relations = await client.query<{
    relation_name: string;
    relation_kind: string;
    row_security: boolean;
    force_row_security: boolean;
    relation_options: string[] | null;
    view_definition: string | null;
    partition_key: string | null;
  }>(
    `SELECT c.relname AS relation_name,
            c.relkind::text AS relation_kind,
            c.relrowsecurity AS row_security,
            c.relforcerowsecurity AS force_row_security,
            c.reloptions AS relation_options,
            CASE WHEN c.relkind IN ('v', 'm') THEN pg_get_viewdef(c.oid, true) END AS view_definition,
            CASE WHEN c.relkind = 'p' THEN pg_get_partkeydef(c.oid) END AS partition_key
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
      ORDER BY c.relname`,
    [schema],
  );

  const columns = await client.query<{
    relation_name: string;
    ordinal: number;
    column_name: string;
    data_type: string;
    not_null: boolean;
    identity_kind: string;
    generated_kind: string;
    default_or_generated_expression: string | null;
    collation_schema: string | null;
    collation_name: string | null;
    storage_kind: string;
    compression_kind: string;
    statistics_target: number;
  }>(
    `SELECT c.relname AS relation_name,
            a.attnum AS ordinal,
            a.attname AS column_name,
            format_type(a.atttypid, a.atttypmod) AS data_type,
            a.attnotnull AS not_null,
            a.attidentity::text AS identity_kind,
            a.attgenerated::text AS generated_kind,
            pg_get_expr(d.adbin, d.adrelid, true) AS default_or_generated_expression,
            cn.nspname AS collation_schema,
            coll.collname AS collation_name,
            a.attstorage::text AS storage_kind,
            a.attcompression::text AS compression_kind,
            a.attstattarget AS statistics_target
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
       LEFT JOIN pg_collation coll ON coll.oid = a.attcollation AND a.attcollation <> 0
       LEFT JOIN pg_namespace cn ON cn.oid = coll.collnamespace
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum`,
    [schema],
  );

  const constraints = await client.query<{
    relation_name: string;
    constraint_name: string;
    constraint_type: string;
    definition: string;
    deferrable: boolean;
    initially_deferred: boolean;
    validated: boolean;
    no_inherit: boolean;
  }>(
    `SELECT c.relname AS relation_name,
            con.conname AS constraint_name,
            con.contype::text AS constraint_type,
            pg_get_constraintdef(con.oid, true) AS definition,
            con.condeferrable AS deferrable,
            con.condeferred AS initially_deferred,
            con.convalidated AS validated,
            con.connoinherit AS no_inherit
       FROM pg_constraint con
       JOIN pg_class c ON c.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
      ORDER BY c.relname, con.conname`,
    [schema],
  );

  const indexes = await client.query<{
    relation_name: string;
    index_name: string;
    definition: string;
    unique_index: boolean;
    primary_index: boolean;
    valid_index: boolean;
    ready_index: boolean;
    live_index: boolean;
    clustered_index: boolean;
    replica_identity_index: boolean;
    relation_options: string[] | null;
  }>(
    `SELECT table_rel.relname AS relation_name,
            index_rel.relname AS index_name,
            pg_get_indexdef(index_rel.oid, 0, true) AS definition,
            idx.indisunique AS unique_index,
            idx.indisprimary AS primary_index,
            idx.indisvalid AS valid_index,
            idx.indisready AS ready_index,
            idx.indislive AS live_index,
            idx.indisclustered AS clustered_index,
            idx.indisreplident AS replica_identity_index,
            index_rel.reloptions AS relation_options
       FROM pg_index idx
       JOIN pg_class index_rel ON index_rel.oid = idx.indexrelid
       JOIN pg_class table_rel ON table_rel.oid = idx.indrelid
       JOIN pg_namespace n ON n.oid = table_rel.relnamespace
      WHERE n.nspname = $1
      ORDER BY table_rel.relname, index_rel.relname`,
    [schema],
  );

  const triggers = await client.query<{
    relation_name: string;
    trigger_name: string;
    enabled_state: string;
    definition: string;
  }>(
    `SELECT c.relname AS relation_name,
            t.tgname AS trigger_name,
            t.tgenabled::text AS enabled_state,
            pg_get_triggerdef(t.oid, true) AS definition
       FROM pg_trigger t
       JOIN pg_class c ON c.oid = t.tgrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname`,
    [schema],
  );

  const policies = await client.query<{
    relation_name: string;
    policy_name: string;
    permissive: string;
    roles: string[];
    command: string;
    using_expression: string | null;
    check_expression: string | null;
  }>(
    `SELECT tablename AS relation_name,
            policyname AS policy_name,
            permissive,
            roles,
            cmd AS command,
            qual AS using_expression,
            with_check AS check_expression
       FROM pg_policies
      WHERE schemaname = $1
      ORDER BY tablename, policyname`,
    [schema],
  );

  const enums = await client.query<{
    enum_name: string;
    enum_label: string;
    enum_order: number;
  }>(
    `SELECT t.typname AS enum_name,
            e.enumlabel AS enum_label,
            e.enumsortorder::float8 AS enum_order
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = $1
      ORDER BY t.typname, e.enumsortorder`,
    [schema],
  );

  const sequences = await client.query<{
    sequence_name: string;
    data_type: string;
    start_value: string;
    minimum_value: string;
    maximum_value: string;
    increment_by: string;
    cycle: boolean;
    cache_size: string;
    owned_relation: string | null;
    owned_column: string | null;
  }>(
    `SELECT sequence_rel.relname AS sequence_name,
            format_type(sequence_data.seqtypid, NULL) AS data_type,
            sequence_data.seqstart::text AS start_value,
            sequence_data.seqmin::text AS minimum_value,
            sequence_data.seqmax::text AS maximum_value,
            sequence_data.seqincrement::text AS increment_by,
            sequence_data.seqcycle AS cycle,
            sequence_data.seqcache::text AS cache_size,
            owned_rel.relname AS owned_relation,
            owned_att.attname AS owned_column
       FROM pg_class sequence_rel
       JOIN pg_namespace n ON n.oid = sequence_rel.relnamespace
       JOIN pg_sequence sequence_data ON sequence_data.seqrelid = sequence_rel.oid
       LEFT JOIN pg_depend dep
              ON dep.classid = 'pg_class'::regclass
             AND dep.objid = sequence_rel.oid
             AND dep.refclassid = 'pg_class'::regclass
             AND dep.deptype IN ('a', 'i')
       LEFT JOIN pg_class owned_rel ON owned_rel.oid = dep.refobjid
       LEFT JOIN pg_attribute owned_att
              ON owned_att.attrelid = dep.refobjid
             AND owned_att.attnum = dep.refobjsubid
      WHERE n.nspname = $1
        AND sequence_rel.relkind = 'S'
      ORDER BY sequence_rel.relname`,
    [schema],
  );

  return {
    relations: canonicalizeRows(relations.rows, schema, ["view_definition", "partition_key"]),
    columns: canonicalizeRows(columns.rows, schema, ["data_type", "default_or_generated_expression"]),
    constraints: canonicalizeRows(constraints.rows, schema, ["definition"]),
    indexes: canonicalizeRows(indexes.rows, schema, ["definition"]),
    triggers: canonicalizeRows(triggers.rows, schema, ["definition"]),
    policies: canonicalizeRows(policies.rows, schema, ["using_expression", "check_expression"]),
    enums: canonicalizeRows(enums.rows, schema),
    sequences: canonicalizeRows(sequences.rows, schema, ["data_type"]),
  };
}

export async function assertBaselineSchemasEquivalent(
  client: Client,
  expectedSchema: string,
  actualSchema: string,
): Promise<void> {
  const expected = await captureSchema(client, expectedSchema);
  const actual = await captureSchema(client, actualSchema);
  const difference = firstDifference(expected, actual);
  if (difference) {
    throw new Error(`[baseline] schema equivalence failed at ${difference}`);
  }
}
