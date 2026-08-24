#!/usr/bin/env bash
# Run EVERY `test:*` script in a package independently, never fail-fast.
#
# Correction #52 (2026-08-24): banco-mobile's `test` script is a 42-link `&&`
# chain. Under `comment-dependency-prover` the 17th link failed by design (a
# declared prose assertion), so the remaining 25 packs never executed and the
# package was reported CLEAN on 17/42 of itself — the self-referential
# denominator, in the audit's own instrument.
#
# Usage: run-all-packs.sh <package-dir>
set -uo pipefail
dir="$1"
mapfile -t scripts < <(node -e '
  const s = require(process.argv[1] + "/package.json").scripts || {};
  for (const k of Object.keys(s)) if (/^test:/.test(k)) console.log(k);
' "$dir")

failed=0
for s in "${scripts[@]}"; do
  if ! pnpm -C "$dir" run "$s" 2>&1; then
    # NOT a TAP line: the prover harvests `^not ok N - <name>` as assertion
    # names, so a synthetic one gets counted as a finding. Signal the failed
    # pack as a TAP comment and let the exit code carry the verdict.
    echo "# PACK FAILED: $s"
    failed=1
  fi
done
exit $failed
