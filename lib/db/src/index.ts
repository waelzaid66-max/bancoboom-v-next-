import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Pool sizing for multi-market / multi-replica Coolify deploys.
// Defaults keep a single API container healthy; raise DB_POOL_MAX when you
// scale API replicas so Postgres connections stay under the server max_connections.
const poolMax = Number(process.env.DB_POOL_MAX ?? 20);
const idleTimeoutMillis = Number(process.env.DB_POOL_IDLE_MS ?? 30_000);
const connectionTimeoutMillis = Number(process.env.DB_POOL_CONNECT_MS ?? 10_000);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 20,
  idleTimeoutMillis: Number.isFinite(idleTimeoutMillis) ? idleTimeoutMillis : 30_000,
  connectionTimeoutMillis: Number.isFinite(connectionTimeoutMillis)
    ? connectionTimeoutMillis
    : 10_000,
});
export const db = drizzle(pool, { schema });

export { ensureSchemaPatches } from "./ensureSchema";
export * from "./schema";
