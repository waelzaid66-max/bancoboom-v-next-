#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-preview}"
PLATFORM="${2:-android}"
ACTION="${3:-build}"

case "$PROFILE" in
  development|simulator|preview|production) ;;
  *) echo "BANCO_EAS_INVALID: profile must be development, simulator, preview, or production" >&2; exit 2 ;;
esac

case "$PLATFORM" in
  android|ios|all) ;;
  *) echo "BANCO_EAS_INVALID: platform must be android, ios, or all" >&2; exit 2 ;;
esac

case "$ACTION" in
  build|build-and-submit) ;;
  *) echo "BANCO_EAS_INVALID: action must be build or build-and-submit" >&2; exit 2 ;;
esac

if [[ "$ACTION" == "build-and-submit" && "$PROFILE" != "production" ]]; then
  echo "BANCO_EAS_INVALID: store submission is allowed only with the production profile" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$REPO_ROOT/artifacts/banco-mobile"

for command_name in git node pnpm; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "BANCO_EAS_INVALID: required command not found: $command_name" >&2
    exit 1
  }
done

if [[ ! -f "$MOBILE_DIR/eas.json" || ! -f "$MOBILE_DIR/app.json" ]]; then
  echo "BANCO_EAS_INVALID: BANCO Mobile EAS configuration is incomplete" >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
  echo "BANCO_EAS_INVALID: release builds require a clean Git worktree" >&2
  git status --short >&2
  exit 1
fi

GIT_SHA="$(git rev-parse HEAD)"
GIT_BRANCH="$(git branch --show-current || true)"
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"

case "${ORIGIN_URL%.git}" in
  *waelzaid66-max/bancoboom-v-next-) ;;
  *) echo "BANCO_EAS_INVALID: origin is not the BANCO vNEXT repository" >&2; exit 1 ;;
esac

if [[ -z "${EXPO_TOKEN:-}" ]]; then
  echo "BANCO_EAS_INVALID: EXPO_TOKEN is required in the execution environment" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/banco-eas.XXXXXX")"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM HUP

log() { printf 'BANCO_EAS: %s\n' "$*"; }

log "repo=$ORIGIN_URL"
log "branch=${GIT_BRANCH:-detached}"
log "git_sha=$GIT_SHA"
log "profile=$PROFILE platform=$PLATFORM action=$ACTION"

pnpm run mobile:preflight
pnpm run mobile:verify

cd "$MOBILE_DIR"
EAS=(pnpm exec eas)

ACCOUNT="$(${EAS[@]} whoami --non-interactive 2>/dev/null | tail -n 1)"
[[ -n "$ACCOUNT" ]] || {
  echo "BANCO_EAS_INVALID: Expo authentication failed" >&2
  exit 1
}
log "expo_account=$ACCOUNT"

BUILD_JSON="$TMP_DIR/build.json"
"${EAS[@]}" build \
  --profile "$PROFILE" \
  --platform "$PLATFORM" \
  --non-interactive \
  --wait \
  --json \
  --message "BANCO ${GIT_SHA}" \
  >"$BUILD_JSON"

mapfile -t BUILD_IDS < <(
  node - "$BUILD_JSON" <<'NODE'
const fs = require("node:fs");
const file = process.argv[2];
const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
const candidates = Array.isArray(parsed)
  ? parsed
  : Array.isArray(parsed.builds)
    ? parsed.builds
    : [parsed];
const ids = candidates.map((build) => build?.id).filter(Boolean);
if (ids.length === 0) {
  console.error("BANCO_EAS_INVALID: EAS build returned no build ID");
  process.exit(1);
}
for (const id of ids) console.log(id);
NODE
)

if [[ "${#BUILD_IDS[@]}" -eq 0 ]]; then
  echo "BANCO_EAS_INVALID: no EAS build identities were captured" >&2
  exit 1
fi

for BUILD_ID in "${BUILD_IDS[@]}"; do
  VIEW_JSON="$TMP_DIR/view-$BUILD_ID.json"
  "${EAS[@]}" build:view "$BUILD_ID" --json >"$VIEW_JSON"

  BUILD_ROW="$(node - "$VIEW_JSON" "$GIT_SHA" <<'NODE'
const fs = require("node:fs");
const file = process.argv[2];
const expectedSha = process.argv[3];
const build = JSON.parse(fs.readFileSync(file, "utf8"));
const id = build.id;
const platform = String(build.platform ?? "").toLowerCase();
const status = String(build.status ?? "").toLowerCase();
const commit = build.gitCommitHash ?? build.gitCommit?.hash ?? build.metadata?.gitCommitHash;
if (!id || !["android", "ios"].includes(platform)) {
  console.error("BANCO_EAS_INVALID: build metadata is missing id/platform");
  process.exit(1);
}
if (!commit || commit !== expectedSha) {
  console.error(`BANCO_EAS_INVALID: build ${id} is not bound to expected Git SHA ${expectedSha}; received ${commit ?? "missing"}`);
  process.exit(1);
}
if (status !== "finished") {
  console.error(`BANCO_EAS_INVALID: build ${id} did not finish successfully; status=${status || "missing"}`);
  process.exit(1);
}
process.stdout.write(`${platform}\t${id}`);
NODE
)"

  BUILD_PLATFORM="${BUILD_ROW%%$'\t'*}"
  VERIFIED_ID="${BUILD_ROW#*$'\t'}"
  log "verified_build platform=$BUILD_PLATFORM id=$VERIFIED_ID git_sha=$GIT_SHA"

  if [[ "$ACTION" == "build-and-submit" ]]; then
    if [[ "$BUILD_PLATFORM" == "ios" ]]; then
      node - "$MOBILE_DIR/eas.json" <<'NODE'
const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const ascAppId = config?.submit?.production?.ios?.ascAppId;
if (typeof ascAppId !== "string" || ascAppId.trim() === "") {
  console.error("BANCO_EAS_INVALID: submit.production.ios.ascAppId must be configured before non-interactive iOS submission");
  process.exit(1);
}
NODE
    fi

    "${EAS[@]}" submit \
      --profile production \
      --platform "$BUILD_PLATFORM" \
      --id "$VERIFIED_ID" \
      --non-interactive \
      --wait
    log "submitted_build platform=$BUILD_PLATFORM id=$VERIFIED_ID"
  fi
done

log "complete git_sha=$GIT_SHA builds=${#BUILD_IDS[@]}"
