#!/usr/bin/env bash
# Cross-repo orphan inventory, extended.
#
# The prior inventory compared PATH presence plus identical CONTENT. That pair
# cannot see a shared path whose content DIFFERS - a legacy repo holding a
# different (possibly newer) version of a file we also have is invisible to it.
# This adds that third class.
set -uo pipefail
SRC="$1"; NAME="$2"; DEST=/workspace/vnext

# every blob path+sha reachable from any ref in the source repo
git -C "$SRC" rev-list --all | while read -r c; do git -C "$SRC" ls-tree -r "$c"; done \
  | awk '{print $3"\t"$4}' | sort -u > "/tmp/src-$NAME.tsv"

# destination: path -> set of content shas across all refs
git -C "$DEST" rev-list --all 2>/dev/null | while read -r c; do git -C "$DEST" ls-tree -r "$c"; done \
  | awk '{print $3"\t"$4}' | sort -u > "/tmp/dst-$NAME.tsv"

cut -f2 "/tmp/dst-$NAME.tsv" | sort -u > "/tmp/dstpaths-$NAME"
cut -f1 "/tmp/dst-$NAME.tsv" | sort -u > "/tmp/dstshas-$NAME"

missing=0; divergent=0; identical=0
: > "/tmp/report-$NAME.txt"
cut -f2 "/tmp/src-$NAME.tsv" | sort -u | while read -r p; do
  case "$p" in */node_modules/*|*/dist/*|*.lock|*.png|*.jpg|*.jpeg|*.gif|*.svg|*.ico) continue;; esac
  if ! grep -qxF "$p" "/tmp/dstpaths-$NAME"; then
    echo -e "MISSING\t$p" >> "/tmp/report-$NAME.txt"
  else
    # shared path: is ANY source sha for it present in destination?
    hit=0
    while read -r s; do grep -qxF "$s" "/tmp/dstshas-$NAME" && { hit=1; break; }; done < <(awk -F'\t' -v pp="$p" '$2==pp{print $1}' "/tmp/src-$NAME.tsv")
    [ "$hit" -eq 1 ] && echo -e "IDENTICAL\t$p" >> "/tmp/report-$NAME.txt" || echo -e "DIVERGENT\t$p" >> "/tmp/report-$NAME.txt"
  fi
done
echo "REPO $NAME"
echo "  source paths examined: $(grep -c . "/tmp/report-$NAME.txt")"
for k in MISSING DIVERGENT IDENTICAL; do echo "  $k: $(grep -c "^$k" "/tmp/report-$NAME.txt" || echo 0)"; done
