#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# BANCO EAS Build + Submit — integrated native app publishing via Expo
#
# Usage:
#   bash scripts/eas-build.sh [profile] [platform]
#
# Profiles:
#   simulator   → iOS .app + Android APK (internal, no store creds needed)
#   preview     → Android APK signed internally (for testers)
#   production  → Android AAB + iOS IPA for store submission
#
# Platform:  android | ios | all  (default: android)
#
# Examples:
#   bash scripts/eas-build.sh simulator ios
#   bash scripts/eas-build.sh preview android
#   bash scripts/eas-build.sh production all
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROFILE="${1:-preview}"
PLATFORM="${2:-android}"
EAS="/home/runner/workspace/node_modules/.bin/eas"
PROJECT_DIR="$(cd "$(dirname "$0")/../artifacts/banco-mobile" && pwd)"

log() { echo "▶ $*"; }
ok()  { echo "✅ $*"; }
err() { echo "❌ $*" >&2; exit 1; }

# ── Auth check ────────────────────────────────────────────────────────────────
if [ -z "${EXPO_TOKEN:-}" ]; then
  err "EXPO_TOKEN not set. Add it to Replit Secrets."
fi

log "Authenticated as: $(EXPO_TOKEN="$EXPO_TOKEN" "$EAS" whoami 2>/dev/null | tail -1)"

# ── Build ─────────────────────────────────────────────────────────────────────
log "Starting EAS build — profile=$PROFILE platform=$PLATFORM"

cd "$PROJECT_DIR"

EXPO_TOKEN="$EXPO_TOKEN" "$EAS" build \
  --profile "$PROFILE" \
  --platform "$PLATFORM" \
  --non-interactive \
  2>&1

ok "Build submitted to EAS. Monitor at: https://expo.dev/accounts/waelzaid/projects/banco-mobile/builds"

# ── Optional auto-submit for production ──────────────────────────────────────
if [ "$PROFILE" = "production" ]; then
  read -rp "Submit to stores automatically? [y/N] " SUBMIT_CONFIRM
  if [[ "$SUBMIT_CONFIRM" =~ ^[Yy]$ ]]; then
    log "Submitting to store..."
    EXPO_TOKEN="$EXPO_TOKEN" "$EAS" submit \
      --profile production \
      --platform "$PLATFORM" \
      --non-interactive
    ok "Submitted!"
  fi
fi
