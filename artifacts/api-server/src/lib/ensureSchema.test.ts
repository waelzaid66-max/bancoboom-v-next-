import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { ensureSchemaPatches, ADDITIVE_NOTIFICATION_ENUM_VALUES } from "@workspace/db";
import { notificationTypeEnum } from "@workspace/db/schema";
import { db } from "../__tests__/helpers";

describe("ensureSchemaPatches (P0 C-01)", () => {
  it("ensures upload_claims table and indexes exist", async () => {
    await ensureSchemaPatches();

    const columns = await db.execute<{ column_name: string }>(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'upload_claims'
      ORDER BY column_name
    `);
    const names = columns.rows.map((r) => r.column_name);
    expect(names).toEqual(
      expect.arrayContaining(["clerk_id", "created_at", "expires_at", "object_path"]),
    );

    const indexes = await db.execute<{ indexname: string }>(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'upload_claims'
    `);
    const indexNames = indexes.rows.map((r) => r.indexname);
    expect(indexNames.some((n) => n.includes("clerk_id"))).toBe(true);
    expect(indexNames.some((n) => n.includes("expires_at"))).toBe(true);
  });

  // ج-٤ (owner inventory): ensureSchemaPatches is a SECOND authority on the
  // notification enum, beside notificationTypeEnum (schema/index.ts + migration
  // 0000). Two authorities are only safe while they cannot disagree. This does
  // `ALTER TYPE ... ADD VALUE IF NOT EXISTS`, so a value listed here that the
  // schema does NOT define would be added to the live pg type and then drift
  // from every code path that reads the schema enum. Lock the boot-patch list to
  // a SUBSET of the schema — no DB needed, this fails at the source the moment
  // the two lists disagree.
  it("boot-patch enum list stays a subset of the schema enum (no second authority drift)", () => {
    const schemaValues = new Set<string>(notificationTypeEnum.enumValues);
    const stray = ADDITIVE_NOTIFICATION_ENUM_VALUES.filter(
      (v) => !schemaValues.has(v),
    );
    expect(
      stray,
      `ensureSchema.ts would ALTER the live type to add ${JSON.stringify(stray)}, which notificationTypeEnum does not define — add them to the schema enum (and a migration), or drop them from the boot patch`,
    ).toEqual([]);
  });

  // And the two paths must actually CONVERGE at runtime: after the boot patch
  // runs, the live pg enum must contain every additive value. This is what
  // proves a lagging (push-built) environment really is brought up to the
  // schema's notification set on boot — the whole reason the net exists.
  it("live notification_type enum contains every boot-patched value after ensureSchemaPatches", async () => {
    await ensureSchemaPatches();
    const { rows } = await db.execute<{ label: string }>(sql`
      SELECT e.enumlabel AS label
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'notification_type'
    `);
    const live = new Set(rows.map((r) => r.label));
    for (const value of ADDITIVE_NOTIFICATION_ENUM_VALUES) {
      expect(live.has(value), `live enum missing ${value}`).toBe(true);
    }
  });
});
