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

# Canonical clean-clone behavior must work without Replit. Expo's normal LAN
# transport is the correct default for a physical phone on the same network.
# Replit is the exception: its public Expo proxy terminates the external route,
# while Metro itself remains localhost-scoped inside the workspace.
expo_host_mode="${BANCO_EXPO_HOST_MODE:-}"
if [[ -z "$expo_host_mode" ]]; then
  if [[ -n "${REPLIT_EXPO_DEV_DOMAIN:-}" || -n "${REPLIT_DEV_DOMAIN:-}" ]]; then
    expo_host_mode="localhost"
  else
    expo_host_mode="lan"
  fi
fi

case "$expo_host_mode" in
  lan|localhost|tunnel)
    ;;
  *)
    echo "BANCO_EXPO_DEV_INVALID: BANCO_EXPO_HOST_MODE must be lan, localhost, or tunnel; received: $expo_host_mode" >&2
    exit 2
    ;;
esac

# Do NOT set CI=1 here — that disables Metro hot-reload and collapses the
# interactive dev menu. expo start handles non-TTY environments gracefully.

exec pnpm exec expo start "--${expo_host_mode}" --port "${PORT:-8081}" "$@"
