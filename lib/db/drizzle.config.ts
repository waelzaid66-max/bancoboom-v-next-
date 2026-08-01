import { defineConfig } from "drizzle-kit";

/**
 * Only the drizzle-kit commands that actually open a connection may demand a
 * DATABASE_URL.
 *
 * This file used to throw unconditionally at import time, which was correct
 * while `push` was the only command in use — but it silently blocks `generate`,
 * which reads the schema file and writes SQL without ever touching a database.
 * The practical effect was that you could not author a migration without first
 * pointing at a live database, which is exactly backwards: writing the SQL is
 * the step that should be reviewable offline, before anything is connected to.
 */
const CONNECTING_COMMANDS = new Set(["push", "pull", "introspect", "studio"]);
const isConnecting = process.argv.some((arg) => CONNECTING_COMMANDS.has(arg));

if (isConnecting && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Relative path keeps drizzle-kit working on Windows (absolute paths can fail
  // schema discovery — see audit/rc1/08-db-push.log).
  schema: "./src/schema/index.ts",
  // Versioned SQL migrations live here and are committed. Without `out`,
  // drizzle-kit has nowhere to write them, which is why this repo had 71 tables
  // and zero migration files: every schema change was applied by `push --force`,
  // leaving no record of what shape production is actually in and no way back.
  //
  // `generate` writes a numbered .sql file plus a journal entry; `migrate`
  // applies only the ones a database has not seen. The two together are what
  // make a schema change reviewable before it runs and repeatable across the
  // dev / test / production databases.
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Empty only on the offline commands guarded above; anything that connects
    // has already failed loudly by the time execution reaches here.
    url: process.env.DATABASE_URL ?? "",
  },
});
