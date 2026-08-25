#!/usr/bin/env bash
# Which EXPORTED symbols exist in a legacy repo's copy of a shared path and in
# no version of that path here?
#
# Why this exists: a path-presence + content-SHA inventory cannot express lost
# capability across a RE-IMPORTED lineage. bancotoday and bancoboom-v-next- share
# no commit at all, so every shared path reads "divergent" and the word means
# nothing. Exported symbols survive re-import; SHAs do not.
#
# Correction #55 (2026-08-25): the first version matched only
# `export function|const|class|type|interface|enum NAME` and was blind to
# `export { NAME } from "./elsewhere"`. It reported four upload-size-limit
# symbols as lost from ListingService.ts when they had been extracted to
# mediaSizeGuard.ts and re-exported - preserved, and better organised. Five of
# its six findings dissolved on verification. Re-exports and `export *` are now
# resolved repo-wide rather than per-file, so the question asked is "does this
# repo export this symbol anywhere", not "does this file declare it".
#
# Usage: legacy-symbol-diff.sh <legacy-bare-repo> <report.tsv> [dest]
set -uo pipefail
SRC="${1:?legacy repo}"; REPORT="${2:?DIVERGENT report}"; DEST="${3:-/workspace/vnext}"

decl='export (async )?(function|const|class|type|interface|enum) [A-Za-z_][A-Za-z0-9_]*'
reexp='export \{[^}]*\}'

# Every symbol this destination exports ANYWHERE, declarations and re-exports.
{ grep -rhoE "$decl" --include=*.ts --include=*.tsx "$DEST" 2>/dev/null | awk '{print $NF}'
  grep -rhoE "$reexp" --include=*.ts --include=*.tsx "$DEST" 2>/dev/null \
    | tr -d '{}' | sed 's/export//' | tr ',' '\n' | awk '{print $1}'
} | grep -vE '^$' | sort -u > /tmp/dest-symbols.txt

echo "destination exports $(wc -l < /tmp/dest-symbols.txt) distinct symbols"
grep "^DIVERGENT" "$REPORT" | cut -f2 | grep -E '\.(ts|tsx)$' | while read -r p; do
  only=$(git -C "$SRC" show "HEAD:$p" 2>/dev/null | grep -ohE "$decl" | awk '{print $NF}' | sort -u \
         | comm -23 - /tmp/dest-symbols.txt)
  [ -n "$only" ] && { echo "── $p"; echo "$only" | sed 's/^/     absent here: /'; }
done
exit 0
