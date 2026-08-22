#!/usr/bin/env bash
# Full mergeability matrix: every branch that shares canonical's history, put
# through the gates that discriminate. Results appended one line at a time so
# progress is readable while it runs.
set -u
cd /workspace/vnext
S=/tmp/claude-0/-home-user/f6297c04-894d-514b-beac-9d1e559d64d3/scratchpad
OUT=$S/matrix.tsv
C=origin/canonical/vnext-assembly
: > "$OUT"

branches=$(git branch -r --format='%(refname:short)' | grep -v HEAD | grep -v '^origin$' | grep -v canonical | while read b; do
  n=$(git rev-list --count $C..$b 2>/dev/null); [ "${n:-0}" -eq 0 ] && continue
  case "${b#origin/}" in audit/independent-production-audit-*|local/owner-assembly-*) continue;; esac
  [ -n "$(git merge-base $C $b 2>/dev/null)" ] || continue
  echo "$b"
done)

total=$(echo "$branches" | wc -l)
i=0
for b in $branches; do
  i=$((i+1))
  s=${b#origin/}
  n=$(git rev-list --count $C..$b)
  git checkout -q --detach $b 2>/dev/null || { printf "%s\t%s\tCHECKOUT-FAIL\t-\t-\t-\n" "$s" "$n" >> "$OUT"; continue; }
  if pnpm install --frozen-lockfile >/dev/null 2>&1; then inst=ok; else inst=LOCKFILE-RED; fi
  ch=$(node scripts/chain-integrity-gate.mjs 2>&1 | grep -oE '[0-9]+/[0-9]+ passed' | head -1); ch=${ch:-ERROR}
  if pnpm run typecheck > $S/m-tc.log 2>&1; then tc=ok; else tc="RED:$(grep -c 'error TS' $S/m-tc.log)"; fi
  if (cd artifacts/banco-mobile && pnpm run test > $S/m-mob.log 2>&1); then mb=ok; else
     f=$(grep -cE '^not ok' $S/m-mob.log 2>/dev/null); j=$(grep -oE '[0-9]+ failed' $S/m-mob.log | head -1)
     mb="RED:${f:-?}${j:+/$j}"
  fi
  printf "%s\t%s\t%s\t%s\t%s\t%s\n" "$s" "$n" "$inst" "$ch" "$tc" "$mb" >> "$OUT"
  echo "[$i/$total] $s  install=$inst chain=$ch typecheck=$tc mobile=$mb"
done
git checkout -q local/owner-assembly-20260822-r2
pnpm install --frozen-lockfile >/dev/null 2>&1
echo DONE > $S/matrix.done
