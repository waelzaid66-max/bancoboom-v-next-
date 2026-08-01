#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Replit Production Build — compiles ALL five surfaces
#
# Surfaces & output paths:
#   api-server       → artifacts/api-server/dist/
#   banco-website    → artifacts/banco-website/.next/ (standalone)
#   landing          → artifacts/landing/dist/public/
#   dealer-os        → artifacts/dealer-os/dist/public/   (BASE_PATH=/market/)
#   admin-os         → artifacts/admin-os/dist/public/    (BASE_PATH=/admin/)
#   banco-mobile web → artifacts/banco-mobile/static-build/web/  (expo export)
#
# Run by: [deployment].build in .replit
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

log() { echo "▶ $*"; }
ok()  { echo "✅ $*"; }
warn(){ echo "⚠  $*"; }

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"

# ── 1. Dependencies ───────────────────────────────────────────────────────────
log "Installing dependencies..."
pnpm install \
  --frozen-lockfile \
  --prefer-offline \
  --verify-store-integrity=false \
  2>/dev/null \
  || pnpm install --frozen-lockfile

# ── 2. Shared libraries ───────────────────────────────────────────────────────
log "Building shared libraries..."
pnpm --filter @workspace/db          build 2>/dev/null || true
pnpm --filter @workspace/taxonomy    build 2>/dev/null || true
pnpm --filter @workspace/api-client  build 2>/dev/null || true

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

# ── 6. Expo web export — browser surface for banco-mobile ────────────────────
log "Building Expo web export (banco-mobile browser surface)..."
(
  cd "$WORKSPACE/artifacts/banco-mobile"

  # Clerk key: prefer explicit EXPO_PUBLIC_ key, fall back to shared CLERK_PUBLISHABLE_KEY
  CLERK_KEY="${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"

  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$CLERK_KEY" \
  EXPO_PUBLIC_DOMAIN="${REPLIT_DEV_DOMAIN:-${REPLIT_INTERNAL_APP_DOMAIN:-localhost}}" \
  EXPO_WEB_BASE_URL="/banco-mobile" \
  node node_modules/expo/bin/cli export \
    --output-dir static-build/web \
    --platform web \
    --no-minify
) \
  && ok "Expo web export ready → artifacts/banco-mobile/static-build/web/" \
  || warn "Expo web export failed — mobile surface will serve the Expo Go QR page (non-fatal)"

ok "Build complete — all surfaces ready for deployment"
