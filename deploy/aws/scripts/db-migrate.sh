#!/usr/bin/env bash
# BANCO — apply the database schema on AWS.
#
# The project uses Drizzle in PUSH mode (lib/db: `drizzle-kit push`), not
# versioned SQL migration files. Push is idempotent and additive-by-default; the
# schema history in this codebase has only ever ADDED tables/columns/enum values.
#
# IMPORTANT: pg_trgm must exist (fuzzy search). RDS lets you CREATE EXTENSION as
# the master user. The app also self-heals this at boot (ensureDbExtensions),
# but we create it here first so search works from the first request.
#
#   DATABASE_URL=postgresql://... deploy/aws/scripts/db-migrate.sh
set -euo pipefail
DATABASE_URL="${DATABASE_URL:?set DATABASE_URL}"

echo "==> Ensuring pg_trgm extension"
if command -v psql >/dev/null 2>&1; then
  psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
else
  echo "   (psql not found locally; the app also ensures the extension at boot)"
fi

echo "==> Applying Drizzle migrations"
# Was `push-force`. This caller is NOT in the adoption table in
# lib/db/MIGRATIONS.md — that table lists three, this is a fourth, found by
# sweeping every runtime file. Same risk as the others: `push` diffs the schema
# file against the live database and `--force` suppresses the prompt that
# catches a rename, so a renamed column leaves with its data and no log line.
#
# ONE-TIME PREREQUISITE for an existing database, or this dies on the first
# CREATE TABLE — loudly, writing nothing:
#     DATABASE_URL=... pnpm --filter @workspace/db run baseline
pnpm --filter @workspace/db run migrate

echo "==> (First deploy only) Seeding baseline data — NOT demo inventory"
echo "   SAFE on production (reference / brands / admin only):"
echo "     pnpm --filter @workspace/api-server run seed:reference"
echo "     pnpm --filter @workspace/api-server run seed:car-brands"
echo "     pnpm --filter @workspace/api-server run seed:admin   # grants ADMIN_EMAILS staff role"
echo "   BLOCKED in production by default (demo users/listings/wallets):"
echo "     pnpm --filter @workspace/api-server run seed"
echo "   Escape hatch for intentional demo DBs only: BANCO_ALLOW_DEMO_SEED=1"
echo "✅ Schema applied."
