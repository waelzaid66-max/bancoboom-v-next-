#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Expo Web Export — console workflow for Replit
# Produces artifacts/banco-mobile/static-build/web/index.html
# so that Mobile Serve shows the real app instead of the QR landing page.
#
# Run via: "Expo Web Build" workflow in Replit (outputType=console)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LOG=/tmp/expo-web-build.log

echo "=== Expo Web Build Started: $(date) ===" | tee "$LOG"

CLERK_KEY="${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"
DOMAIN="${REPLIT_DEV_DOMAIN:-${REPLIT_INTERNAL_APP_DOMAIN:-localhost}}"

echo "  Domain : $DOMAIN" | tee -a "$LOG"
echo "  Output : artifacts/banco-mobile/static-build/web/" | tee -a "$LOG"

cd artifacts/banco-mobile

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$CLERK_KEY" \
EXPO_PUBLIC_DOMAIN="$DOMAIN" \
EXPO_WEB_BASE_URL="/banco-mobile" \
node node_modules/expo/bin/cli export \
  --output-dir static-build/web \
  --platform web \
  2>&1 | tee -a "$LOG"

cd - > /dev/null

if [ -f "artifacts/banco-mobile/static-build/web/index.html" ]; then
  echo "" | tee -a "$LOG"
  echo "✅ Expo web export ready — restart Mobile Serve to serve the real app" | tee -a "$LOG"
else
  echo "❌ Export completed but index.html not found" | tee -a "$LOG"
  exit 1
fi

echo "=== Done: $(date) ===" | tee -a "$LOG"
