# Correction #30 — my clone was shallow, and every branch ledger I published was measured against a truncated history

**I was one command away from telling the owner that seventeen branches sat on an unrelated history and should be deleted. I checked `.git/shallow` before writing it. It exists.**

**Those seventeen branches are not unrelated. They are fully merged. Every one of them.**

**2026-08-22.**

---

# §1 · What I was about to publish

**Measuring the branch ledger this evening, the numbers looked structural and alarming:**

```
canonical/vnext-assembly   total history = 18 commits
  root: e4b8f29  2026-08-11  "fix(ops): guard committed migration authority"

recovery/vnx-01-protection-chain   root: 89d28d3  2026-08-01
git merge-base canonical recovery/vnx-01   →   (empty)
```

**Seventeen branches with no common ancestor, 197–233 commits each, ~3,667 commits total.** I had the conclusion written: *canonical was re-rooted on 2026-08-11; the recovery branches are a stranded pre-consolidation lineage; merging one would delete 34,545 lines; delete them.*

**Every sentence of that was wrong, and the advice would have been destructive.**

---

# §2 · The check that stopped it

```
$ test -f .git/shallow && echo YES
YES

$ cat .git/shallow
e4b8f29727ca2d3c314196113a6db85b488d04cc

$ git cat-file -p e4b8f29 | head -2
tree 26c7ce38…
parent ef2f8a6e…          ← it HAS a parent
```

> **`e4b8f29` is not a root commit. It is the shallow boundary.** *`git rev-list --max-parents=0` reports it as a root because the clone stops there — the parent exists on the remote and not in my object store.*

**And once the boundary is a lie, everything built on it is a lie:** "canonical is 18 commits deep", "no merge base", "197 commits ahead" — all three are artifacts of a truncated clone, not facts about the repository.

---

# §3 · The real numbers

```
$ git fetch --unshallow origin
$ test -f .git/shallow  →  no
```

| | shallow clone | **real history** |
|---|---|---|
| canonical history depth | 18 commits | **252 commits** |
| canonical's root | `e4b8f29` 2026-08-11 | **`89d28d3` 2026-08-01** — *the same root as the recovery branches* |
| merge-base with `recovery/vnx-01` | **NONE** | `3668906` 2026-08-10 |
| `canonical..recovery/vnx-01` | **199** | **0** |
| `canonical..recovery/vnx-07` | 233 | **0** |
| `canonical..recovery/source-bancoboomstor` | 197 | **0** |

**One history. Always was.**

## The corrected ledger

```
branches FULLY MERGED into canonical (0 ahead) :  27
branches with real unmerged work               :  41   (874 commits)
```

**Twenty-seven branches are finished work sitting on the remote** — all seventeen `recovery/*`, both `codex/*`, `fix/nanoid-override`, `fix/maps-tile-failure-state`, `fix/maps-bootstrap-error`, `fix/sot-lock-vnext-only`, `polish/native-mobile-uiux-wave`, `fix/profile-visible-role-authority`, `recovery/coworker-maps`.

**They can be deleted — not because they are stranded, but because they are done.**

---

# §4 · ✅ What this does NOT change — checked rather than assumed

**My published "≈503 unmerged commits" figure was correct.** Real total is 874, of which **373 are my own** audit and assembly branches. **874 − 373 = 501.** *The branches carrying real work all had merge-bases above the shallow boundary, so their counts were never affected.*

**And my very first audit was right about this all along.** From 2026-08-13: *"all 19 recovery branches are 0-unmerged."* **That was true then and it is true now.** *This evening's shallow clone made me doubt a correct earlier measurement — and the correct response would have been to reconcile the contradiction rather than believe the newer number because it was newer.*

**The `git diff` evidence stands too**, because diffs do not depend on history depth: `canonical → recovery/vnx-07` still shows the branch carrying the **older, unserialized** mark-read implementation, and canonical carrying `FOR UPDATE` twice to the branch's once. **Canonical is the stronger tree. The recovery branches are superseded — which is exactly what "fully merged" means.**

---

# §5 · Why this is the most consequential error in the engagement

**Not because the number was wrong. Because of what I would have recommended.**

> **"Seventeen branches are on an unrelated history and carry nothing canonical lacks — delete them"** *is advice that, acted on, destroys 3,667 commits of recorded history on the strength of a clone flag.*

**It also fails my own standard three ways at once:**
- **I measured a property of my environment and reported it as a property of the repository.** *The same error as the two failures earlier today that turned out to be a stray worktree and a stopped database — except this one pointed outward instead of inward.*
- **I let a new measurement silently overturn an old one** without asking which was wrong.
- **I nearly published a structural claim without checking the cheapest possible disconfirming fact** — one `test -f`.

**The rule this produces:**

> **Before any claim about repository history — ancestry, merge state, commit counts, "unrelated" anything — verify the clone is complete.** `git rev-parse --is-shallow-repository`. **One command, and it invalidates or confirms every history-shaped claim in a report.**

---

# §6 · ORDER

**① Every agent: `git rev-parse --is-shallow-repository` before quoting an ancestry or merge-state figure.** *A shallow clone reports false roots, false "no merge base", and inflated ahead-counts — silently, with no warning.*

**② Delete the 27 fully-merged branches.** Seventeen `recovery/*`, two `codex/*`, and eight others. **This is now a safe operation and it was not obviously safe an hour ago.**

**③ The real queue is 41 branches / 501 commits of others' work**, not 58 / 4,541. **The throughput problem is real and it is smaller than my ledger said.**

---

# §7 · Standing

**Register unchanged at 29 classes. Thirty corrections published.**

**The finding I did not publish is the point of this report.** *An audit is only worth what its retractions are worth, and this one was caught by asking why a surprising structural result was surprising instead of writing it down.*

---
*Shallow state confirmed by `.git/shallow` and by reading the boundary commit's parent pointer before any conclusion was drawn. History re-measured after `git fetch --unshallow`, with the pre-correction figures preserved above rather than replaced. The prior 2026-08-13 finding located and reconciled instead of overwritten. The `git diff` evidence re-examined separately, since diffs are depth-independent and that part of the analysis survives. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
