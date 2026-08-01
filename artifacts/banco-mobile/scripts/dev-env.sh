#!/usr/bin/env bash
# Safe Expo `pnpm dev` launcher for Replit / local shells.
#
# Critical: never assign EXPO_PUBLIC_CLERK_* from an empty CLERK_* variable —
# that previously wiped a valid publishable key already present in the
# environment and left Clerk unable to boot (fail-closed social + broken auth).
set -euo pipefail

# Copy Clerk secrets into the Expo-public names only when the source is set.
if [[ -n "${CLERK_PUBLISHABLE_KEY:-}" ]]; then
  export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$CLERK_PUBLISHABLE_KEY"
fi
if [[ -n "${CLERK_PROXY_URL:-}" ]]; then
  export EXPO_PUBLIC_CLERK_PROXY_URL="$CLERK_PROXY_URL"
fi

# Replit packager hostnames — only when present (local `expo start` stays usable).
if [[ -n "${REPLIT_EXPO_DEV_DOMAIN:-}" ]]; then
  export EXPO_PACKAGER_PROXY_URL="https://${REPLIT_EXPO_DEV_DOMAIN}"
fi
if [[ -n "${REPLIT_DEV_DOMAIN:-}" ]]; then
  export EXPO_PUBLIC_DOMAIN="${EXPO_PUBLIC_DOMAIN:-$REPLIT_DEV_DOMAIN}"
  export REACT_NATIVE_PACKAGER_HOSTNAME="$REPLIT_DEV_DOMAIN"
fi
if [[ -n "${REPL_ID:-}" ]]; then
  export EXPO_PUBLIC_REPL_ID="$REPL_ID"
fi

# Do NOT set CI=1 here — that disables Metro hot-reload and collapses the
# interactive dev menu. expo start handles non-TTY environments gracefully.

exec pnpm exec expo start --localhost --port "${PORT:-8081}" "$@"
