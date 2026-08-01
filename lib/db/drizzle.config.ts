import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
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
    url: process.env.DATABASE_URL,
  },
});
