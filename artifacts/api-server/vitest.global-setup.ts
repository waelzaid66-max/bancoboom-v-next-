/**
 * Reconcile critical schema drift before any DB-integration file runs. CI runs
 * drizzle push-force, but local/shared DBs may lag (especially on Windows).
 *
 * Dynamic import so pure unit tests (no DATABASE_URL) do not load `@workspace/db`
 * at module eval time (that package throws if DATABASE_URL is unset).
 */
export default async function globalSetup(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const { ensureSchemaPatches } = await import("@workspace/db");
  await ensureSchemaPatches();
}
