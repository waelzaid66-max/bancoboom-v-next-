#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Replit Production Build — compiles every surface claimed by replit-prod-start.
#
# This path is Replit-specific, but it must preserve the same fail-closed
# workspace identity and compile semantics as the canonical monorepo build.
# Replit remains a preview/diagnostic environment; this script is not a release
# certificate and does not replace exact-RC CI / Docker / Coolify acceptance.
#
# Surfaces & output paths:
#   api-server       → artifacts/api-server/dist/
#   banco-website    → artifacts/banco-website/.next/ (standalone)
#   landing          → artifacts/landing/dist/public/
#   dealer-os        → artifacts/dealer-os/dist/public/   (BASE_PATH=/market/)
#   admin-os         → artifacts/admin-os/dist/public/    (BASE_PATH=/admin/)
#   banco-mobile web → artifacts/banco-mobile/static-build/web/ (expo export)
#
# Run by: [deployment].build in .replit
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

log() { echo "▶ $*"; }
ok()  { echo "✅ $*"; }

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKSPACE"

# ── 0. Workspace identity / toolchain guard ──────────────────────────────────
# Keep Replit from building a wrong repo/worktree/pnpm version. This is the same
# guard used by the canonical root prebuild contract.
log "Verifying authoritative workspace..."
pnpm run workspace:verify
ok "Workspace verified"

# ── 1. Dependencies ───────────────────────────────────────────────────────────
log "Installing dependencies..."
pnpm install \
  --frozen-lockfile \
  --prefer-offline \
  --verify-store-integrity=false \
  2>/dev/null \
  || pnpm install --frozen-lockfile
ok "Dependencies installed"

# ── 2. Shared libraries ───────────────────────────────────────────────────────
# These are required compile authorities for downstream consumers. Never swallow
# their failures: a broken shared package must stop the deployment build here.
log "Building shared libraries..."
pnpm --filter @workspace/db run build
pnpm --filter @workspace/taxonomy run build
pnpm --filter @workspace/api-client run build
ok "Shared libraries built"

# ── 3. API server ─────────────────────────────────────────────────────────────
log "Building api-server..."
pnpm --filter @workspace/api-server run build
ok "api-server built"

# ── 4. Consumer web — Next.js standalone ─────────────────────────────────────
log "Building banco-website (Next.js standalone)..."
NEXT_STANDALONE=true pnpm --filter @workspace/banco-website run build
ok "banco-website built"

# ── 5. Vite SPAs — correct BASE_PATHs ────────────────────────────────────────
log "Building landing SPA (BASE_PATH=/)..."
pnpm --filter @workspace/landing run build

log "Building dealer-os SPA (BASE_PATH=/market/)..."
BASE_PATH=/market/ pnpm --filter @workspace/dealer-os run build

log "Building admin-os SPA (BASE_PATH=/admin/)..."
BASE_PATH=/admin/ pnpm --filter @workspace/admin-os run build

ok "All Vite SPAs built"

# ── 6. Expo web export — required browser surface for banco-mobile ───────────
# replit-prod-start advertises and serves /banco-mobile/. Therefore its export is
# required. If it cannot be produced, fail this build instead of reporting a
# misleading partial deployment success.
log "Building Expo web export (banco-mobile browser surface)..."
(
  cd "$WORKSPACE/artifacts/banco-mobile"

  # Clerk key: prefer explicit EXPO_PUBLIC_ key, fall back to shared
  # CLERK_PUBLISHABLE_KEY. The Expo app itself owns any missing-key warning.
  CLERK_KEY="${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"

  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$CLERK_KEY" \
  EXPO_PUBLIC_DOMAIN="${REPLIT_DEV_DOMAIN:-${REPLIT_INTERNAL_APP_DOMAIN:-localhost}}" \
  EXPO_WEB_BASE_URL="/banco-mobile" \
  node node_modules/expo/bin/cli export \
    --output-dir static-build/web \
    --platform web \
    --no-minify
)
ok "Expo web export ready → artifacts/banco-mobile/static-build/web/"

ok "Build complete — every claimed Replit deployment surface built successfully"
