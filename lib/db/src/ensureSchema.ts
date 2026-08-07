import { sql } from "drizzle-orm";
import { db } from "./index";

// Notification enum values added after the initial pg enum was created. Applied
// idempotently on boot so environments that lag behind drizzle-kit push still
// accept them (billing wave + car-import lifecycle).
//
// This is the SECOND authority on these values — the first is
// `notificationTypeEnum` in schema/index.ts (and migration 0000). The two only
// stay safe while this list is a SUBSET of that enum: this runs
// `ALTER TYPE ... ADD VALUE IF NOT EXISTS`, so a value here that the schema does
// not define would be added to the live type and then drift from the code that
// reads it. Exported so a guard can assert the subset relationship and the two
// authorities can never disagree. (Remove this net entirely once every
// environment is migration-adopted — see lib/db baseline/migrate.)
export const ADDITIVE_NOTIFICATION_ENUM_VALUES = [
  "payment_success",
  "payment_failed",
  "subscription_expiring",
  "car_import",
] as const;

/**
 * Idempotent schema patches for environments that lag behind drizzle-kit push
 * (local Windows push quirks, shared dev DBs, or partial migrations). Safe to
 * call on every api-server boot and before the integration test suite.
 */
export async function ensureSchemaPatches(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS upload_claims (
      object_path text PRIMARY KEY,
      clerk_id text NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS upload_claims_clerk_id_idx ON upload_claims (clerk_id)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS upload_claims_expires_at_idx ON upload_claims (expires_at)`,
  );

  for (const value of ADDITIVE_NOTIFICATION_ENUM_VALUES) {
    await db.execute(
      sql.raw(`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '${value}'`),
    );
  }

  // FI lifecycle schema (migration 0004) — idempotent so lagging environments
  // still serve lifecycle queries on boot without requiring drizzle-kit push.
  await db.execute(sql.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fi_workspace_status') THEN
        CREATE TYPE fi_workspace_status AS ENUM ('draft','pending_review','active','suspended');
      END IF;
    END$$
  `));
  await db.execute(sql.raw(`
    ALTER TABLE financing_intermediaries
      ADD COLUMN IF NOT EXISTS workspace_status fi_workspace_status NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS workspace_owner_user_id text REFERENCES users(id) ON DELETE SET NULL
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS fi_lifecycle_events (
      id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
      intermediary_id text NOT NULL REFERENCES financing_intermediaries(id) ON DELETE CASCADE,
      from_status fi_workspace_status,
      to_status fi_workspace_status NOT NULL,
      actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
      reason text,
      created_at timestamp DEFAULT now()
    )
  `));
  await db.execute(sql`CREATE INDEX IF NOT EXISTS fi_lifecycle_events_intermediary_idx ON fi_lifecycle_events (intermediary_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS fi_lifecycle_events_created_at_idx ON fi_lifecycle_events (created_at DESC)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS financing_intermediaries_workspace_owner_uniq ON financing_intermediaries (workspace_owner_user_id) WHERE workspace_owner_user_id IS NOT NULL`);
}
