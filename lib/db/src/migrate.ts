import { fileURLToPath } from "node:url";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

/**
 * Applies committed SQL migrations to the database named by DATABASE_URL.
 *
 * This is what replaces `drizzle-kit push --force` as the way a schema reaches
 * production. The difference is not cosmetic:
 *
 *   push --force  compares the schema file to the live database and applies
 *                 whatever diff it computes, silently accepting the destructive
 *                 half of that diff. A renamed column looks like a dropped one
 *                 plus a new one, so the data in it is gone with no prompt and
 *                 no record that it ever happened.
 *
 *   migrate       runs the exact SQL that was written, reviewed and committed,
 *                 in order, once each, recording what it applied. Two databases
 *                 that have run the same migrations are in the same shape, and
 *                 a bad migration is a file you can read before it runs.
 *
 * Deliberately NOT using the shared pool from ./index: that pool is sized for a
 * long-lived API process (DB_POOL_MAX defaults to 20). A migration runner is a
 * one-off task that should hold exactly one connection and give it back, or a
 * `docker compose run` that finishes leaves connections parked on a Postgres
 * that other containers still need.
 */

const MIGRATIONS_FOLDER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    // Fail closed. A migration runner that silently does nothing when the
    // database is unreachable is worse than one that stops: the deploy goes
    // green and the schema is quietly a version behind.
    throw new Error(
      "DATABASE_URL is not set — refusing to run migrations against an unknown database.",
    );
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const db = drizzle(client);
    const startedAt = Date.now();

    // pg_trgm must exist before 0000 creates its gin_trgm_ops indexes. Without
    // it a fresh database fails with 42704 (ResolveOpClass) and rolls back to
    // zero tables. This cannot be a forward migration: the journal runs 0000
    // first and 0000 is what fails. It cannot be an edit to 0000 either, because
    // baseline.ts hashes applied migrations. Idempotent, so it is safe on every
    // deploy including one that changed nothing.
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    console.log(`[migrate] applying migrations from ${MIGRATIONS_FOLDER}`);

    // Drizzle records applied migrations in drizzle.__drizzle_migrations and
    // skips any it has already seen, so this is safe to run on every deploy —
    // including a deploy that changed nothing.
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    console.log(`[migrate] done in ${Date.now() - startedAt}ms`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("[migrate] FAILED:", error);
  // Non-zero exit is the whole point: it stops a deploy from bringing up an API
  // that expects columns the database does not have.
  process.exit(1);
});
