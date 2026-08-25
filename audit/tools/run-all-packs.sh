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
#
# Correction #54 (2026-08-25): this tool reproduced #52 inside itself. Given a
# RELATIVE package dir, the `require()` below threw, `mapfile` produced an empty
# list, the loop body never ran, and `exit $failed` returned 0 — reporting
# success having executed nothing. Two genuinely failing packs were reported as
# "0 failed" in a published battery. A runner that can pass without running is
# the same defect it was built to detect, so the script now resolves the path
# itself and refuses rather than assuming.
set -uo pipefail
dir="$(cd "${1:?usage: run-all-packs.sh <package-dir>}" 2>/dev/null && pwd)" || {
  echo "[REFUSED] not a directory: $1" >&2
  exit 2
}
[ -f "$dir/package.json" ] || { echo "[REFUSED] no package.json in $dir" >&2; exit 2; }

mapfile -t scripts < <(node -e '
  const s = require(process.argv[1] + "/package.json").scripts || {};
  for (const k of Object.keys(s)) if (/^test:/.test(k)) console.log(k);
' "$dir") || { echo "[REFUSED] could not read scripts from $dir" >&2; exit 2; }

# An empty pack list is never a pass. It means the discovery failed.
if [ "${#scripts[@]}" -eq 0 ]; then
  echo "[REFUSED] no test:* scripts found in $dir — refusing to report success" >&2
  exit 2
fi
echo "# discovered ${#scripts[@]} test:* scripts in $dir"

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
