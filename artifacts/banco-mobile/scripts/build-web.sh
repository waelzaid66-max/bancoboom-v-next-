#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Build Expo web export for the browser surface.
#
# Output: artifacts/banco-mobile/static-build/web/
# The serve.js server automatically serves this when it exists.
# Without it, serve.js shows the Expo Go QR landing page.
#
# Usage:
#   pnpm --filter @workspace/banco-mobile run build:web
#   BASE_PATH=/banco-mobile pnpm --filter @workspace/banco-mobile run build:web
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Clerk key: prefer EXPO_PUBLIC_, fall back to shared CLERK_PUBLISHABLE_KEY
CLERK_KEY="${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"

if [ -z "$CLERK_KEY" ]; then
  echo "⚠  CLERK_PUBLISHABLE_KEY not set — Clerk features will not work in web build"
fi

# Domain: use Replit domain when available
DOMAIN="${REPLIT_DEV_DOMAIN:-${REPLIT_INTERNAL_APP_DOMAIN:-${EXPO_PUBLIC_DOMAIN:-localhost}}}"
BASE="${EXPO_WEB_BASE_URL:-/banco-mobile}"

echo "▶ Building Expo web export..."
echo "  Domain : $DOMAIN"
echo "  BasePath: $BASE"
echo "  Output : $PROJECT_DIR/static-build/web/"

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$CLERK_KEY" \
EXPO_PUBLIC_DOMAIN="$DOMAIN" \
EXPO_WEB_BASE_URL="$BASE" \
node "$PROJECT_DIR/node_modules/expo/bin/cli" export \
  --output-dir "$PROJECT_DIR/static-build/web" \
  --platform web

if [ -f "$PROJECT_DIR/static-build/web/index.html" ]; then
  echo "✅ Expo web export ready — serve.js will now serve the real app"
else
  echo "❌ Export completed but index.html missing"
  exit 1
fi
