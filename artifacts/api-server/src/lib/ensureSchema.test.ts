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

  // FI lifecycle upgrade-path: simulates a pre-0004 environment by dropping
  // the lifecycle columns/tables, then proves ensureSchemaPatches re-creates
  // them with the correct types so lagging environments boot cleanly.
  it("FI lifecycle schema survives a pre-0004 drop-and-repatch cycle", async () => {
    // Drop lifecycle artifacts in safe order (child FK tables first).
    await db.execute(sql`DROP TABLE IF EXISTS fi_lifecycle_events CASCADE`);
    await db.execute(sql`DROP INDEX IF EXISTS financing_intermediaries_workspace_owner_uniq`);
    await db.execute(sql`ALTER TABLE financing_intermediaries DROP COLUMN IF EXISTS workspace_owner_user_id`);
    await db.execute(sql`ALTER TABLE financing_intermediaries DROP COLUMN IF EXISTS workspace_status`);
    // Drop enum only after all dependents are gone.
    await db.execute(sql`DROP TYPE IF EXISTS fi_workspace_status CASCADE`);

    // Re-run the boot patch — must succeed without throwing.
    await expect(ensureSchemaPatches()).resolves.toBeUndefined();

    // Verify the enum was recreated with the expected labels.
    const { rows: enumRows } = await db.execute<{ label: string }>(sql`
      SELECT e.enumlabel AS label
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'fi_workspace_status'
      ORDER BY e.enumsortorder
    `);
    expect(enumRows.map((r) => r.label)).toEqual(["draft", "pending_review", "active", "suspended"]);

    // Verify workspace columns exist on financing_intermediaries.
    const colsResult = await db.execute<{ column_name: string; data_type: string; udt_name: string }>(sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'financing_intermediaries'
        AND column_name IN ('workspace_status', 'workspace_owner_user_id')
      ORDER BY column_name
    `);
    const colMap = Object.fromEntries(colsResult.rows.map((r) => [r.column_name, r]));
    expect(colMap["workspace_status"]).toBeDefined();
    expect(colMap["workspace_owner_user_id"]).toBeDefined();
    // workspace_owner_user_id must be uuid (FK to users.id which is uuid).
    expect(colMap["workspace_owner_user_id"]?.udt_name).toBe("uuid");

    // Verify fi_lifecycle_events table and its uuid primary key exist.
    const { rows: tableRows } = await db.execute<{ table_name: string }>(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'fi_lifecycle_events'
    `);
    expect(tableRows.length).toBe(1);

    const { rows: pkRows } = await db.execute<{ column_name: string; udt_name: string }>(sql`
      SELECT c.column_name, c.udt_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = 'fi_lifecycle_events'
        AND c.column_name = 'id'
    `);
    expect(pkRows[0]?.udt_name).toBe("uuid");

    // Verify the unique partial index was recreated.
    const { rows: idxRows } = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'financing_intermediaries'
        AND indexname = 'financing_intermediaries_workspace_owner_uniq'
    `);
    expect(idxRows.length).toBe(1);
  });

  // Regression: if a legacy FI user owns multiple intermediaries (permitted by
  // the old schema), the migration/ensureSchemaPatches backfill must not
  // violate the unique index — it leaves duplicate-owner rows with NULL
  // workspace_owner_user_id rather than aborting the upgrade.
  it("backfill tolerates a legacy user who owns multiple intermediaries", async () => {
    // Create a unique user to serve as the duplicate legacy owner.
    const { rows: userRows } = await db.execute<{ id: string }>(sql`
      INSERT INTO users (id, clerk_id, name, role)
      VALUES (gen_random_uuid(), 'test-dup-owner-' || gen_random_uuid()::text, 'Dup Owner', 'financial_institution')
      RETURNING id
    `);
    const userId = userRows[0]!.id;

    // Create two intermediaries with the same owner_user_id (legacy duplicate).
    const { rows: im1Rows } = await db.execute<{ id: string }>(sql`
      INSERT INTO financing_intermediaries (id, name, owner_user_id, is_active)
      VALUES (gen_random_uuid(), 'DupBank A', ${userId}::uuid, true)
      RETURNING id
    `);
    const { rows: im2Rows } = await db.execute<{ id: string }>(sql`
      INSERT INTO financing_intermediaries (id, name, owner_user_id, is_active)
      VALUES (gen_random_uuid(), 'DupBank B', ${userId}::uuid, false)
      RETURNING id
    `);
    const im1Id = im1Rows[0]!.id;
    const im2Id = im2Rows[0]!.id;

    // Drop the unique index so the backfill runs from scratch.
    await db.execute(sql`DROP INDEX IF EXISTS financing_intermediaries_workspace_owner_uniq`);
    await db.execute(sql`UPDATE financing_intermediaries SET workspace_owner_user_id = NULL WHERE id IN (${im1Id}::uuid, ${im2Id}::uuid)`);

    // The boot patch must not throw even with duplicate legacy owners.
    await expect(ensureSchemaPatches()).resolves.toBeUndefined();

    // Both rows must have workspace_owner_user_id = NULL (not backfilled) to
    // avoid violating the unique index. The unique index itself must exist.
    const { rows: dupRows } = await db.execute<{ id: string; workspace_owner_user_id: string | null }>(sql`
      SELECT id, workspace_owner_user_id
      FROM financing_intermediaries
      WHERE id IN (${im1Id}::uuid, ${im2Id}::uuid)
    `);
    for (const row of dupRows) {
      expect(row.workspace_owner_user_id).toBeNull();
    }

    // Unique index must still exist.
    const { rows: idxCheck } = await db.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'financing_intermediaries'
        AND indexname = 'financing_intermediaries_workspace_owner_uniq'
    `);
    expect(idxCheck.length).toBe(1);

    // Cleanup.
    await db.execute(sql`DELETE FROM financing_intermediaries WHERE id IN (${im1Id}::uuid, ${im2Id}::uuid)`);
    await db.execute(sql`DELETE FROM users WHERE id = ${userId}::uuid`);
  });
});
