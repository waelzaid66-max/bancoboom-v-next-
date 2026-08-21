# Merge rehearsal — three branches are not merge-ready, two silent traps proven

I rehearsed the full merge of all nine live branches into a local assembly built on `canonical @ 4f2c81c`, running the gate battery after every step. Executed **2026-08-21 19:40 UTC**.

**This is not analysis. Every claim below was produced by running the merge and the gates.**

**Result: 2 branches merged clean and are green. 3 branches fail their own gates standalone. 2 conflicts hide silent regressions that a normal resolution would ship.**

---

## 1 · What merged clean — verified green

`local/owner-assembly-20260821`, built on `4f2c81c`:

| Merged | Commits | Result |
|---|---|---|
| `audit/current-truth-20260821` | 11 | ✅ clean, docs only |
| `audit/cross-repo-continuation-20260821` | 11 | ✅ clean, docs only |
| `fix/gate3-listing-moderation-authority-20260821` | 2 | ✅ clean |
| `fix/recent-search-chrome-20260821` | 11 | ⚠️ conflict — resolved, see §3 |

**Battery on the assembled head:**

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ exit 0 |
| Dependency security | ✅ **0 blocking** |
| Chain integrity | ✅ **245 / 245** |
| Production confidence | ✅ **26 / 26** |
| Mobile full pack (`pnpm test`) | ✅ **exit 0** |
| Mobile render | ✅ **124 / 124** across 17 suites |

---

## 2 · 🔴 Three branches fail their own gates — standalone, not from my merge

**In every case I re-ran the gate on the branch by itself, at its own head, to be certain the failure is the branch's and not my merge's.**

### ① `fix/car-header-unified-dock-v2-20260821` — breaks a guard it claims to honour

```
tests/section-miniapp-guard.test.mjs   92 pass · 1 FAIL   (standalone, at branch head)
not ok 46 - B-oom Car mounts CarsHomeHeader Stay-parity shell
The input did not match the regular expression /testID="cars-home-header"/
```

The branch rewrites `CarsHomeHeader.tsx` from 1193 → 783 lines and converts

```tsx
testID="cars-home-header"
```
into
```tsx
testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
```

The value still reaches the tree at runtime, so the **render** test was updated and passes — but `section-miniapp-guard.test.mjs:1445` asserts the **source text**, and that literal no longer exists.

**The branch's own file docstring says: _"every existing testID/callback remains stable."_ The guard that enforces exactly that claim now fails.**

I checked what else moved, and the rest is sound: **handlers 15 → 15, no loss; i18n keys 7 → 9, gained.** The only lost surface is that one literal. **This is a small fix, but it is yours to choose** — restore the literal, or update the guard deliberately if the `cars-hero-band` split is intended. I did not choose for you.

### ② `fix/deployment-sot-next-20260821` — the guard it adds fails on its own branch

```
node scripts/deployment-sot-guard.mjs   →  EXIT 1   (standalone, at branch head)
- docs/DEPLOYMENT_PLAN.md: does not name current BANCO BOOM NEXT repo or canonical branch
Historical/audit records are intentionally out of scope. Fix only operator-facing live deployment authorities.
```

**The guard contradicts itself.** `LIVE_AUTHORITIES` at line 13 includes `docs/DEPLOYMENT_PLAN.md`, but that file's own line 3 reads:

> **SUPERSEDED (reconciled 2026-08-09):** … This file is historical; do **not** deploy Coolify from it.

So the guard flags an explicitly-superseded historical document as a live deployment authority, then prints a message saying historical records are out of scope. **The document is behaving correctly; the guard's file list is wrong.** Either drop `DEPLOYMENT_PLAN.md` from the list, or teach the guard to skip files carrying a `SUPERSEDED` header — which is what its own message already implies it intends.

The other five authorities pass.

### ③ `fix/db-baseline-adoption-20260821` — excellent code, blocked by two doc regexes

```
node scripts/production-confidence-check.mjs   →  25/26   (standalone, at branch head)
Failed: migration operator docs:
  lib/db/MIGRATIONS.md: must distinguish an existing pre-journal database
  lib/db/MIGRATIONS.md: must require independent schema-equivalence proof before baseline
```

**The cause is wording, not weakening.** The branch renamed the heading `### Existing pre-journal database` → `### Existing historical pre-journal database`, which breaks `/existing\s+pre-journal\s+database/i`, and it removed the prose sentence *"independently prove its live schema is equivalent…"* — **because that requirement was promoted from prose into enforced code.**

**I verified that claim rather than accepting it.** See §4 — it is true, and this is the strongest work in the batch.

**Recommendation: restore the two exact phrases in `MIGRATIONS.md`.** It costs nothing, keeps the operator instruction explicit alongside the automated proof, and turns 25/26 back to 26/26. Updating the two assertions instead is defensible but weakens a written operator control that a human still reads before a one-way database operation.

---

## 3 · 🔴 Two conflicts that hide silent regressions

Both are cases where the **natural** resolution — take the incoming branch — silently deletes a control, with **every gate still reporting green.**

### Trap A — resolving PR #5's conflict "theirs" deletes the C-4 guard, and nothing catches it

`fix/recent-search-chrome` is based on `1ccdbac`, 8 commits behind, so its `artifacts/banco-mobile/package.json` predates C-4. The merge conflicts on the aggregate `test` script.

I applied the wrong resolution deliberately and measured the result:

```
listed in aggregate test script:  false      ← test:language-sync gone
script key still defined:         false      ← the key itself gone
guard file still on disk:         true       ← dead file, nothing runs it

chain-integrity-gate.mjs   →  245/245 PASS
render-coverage-guard      →      6/6 PASS
```

**The C-4 language-sync guard can be removed from the pipeline entirely, and every gate reports green.**

The guard tries to protect itself — `language-sync-guard.test.mjs:80` asserts it is listed in the aggregate script — but **it only runs from that aggregate script.** Remove it from the list and the self-check can never fire. `render-coverage-guard` knows the file by name but only calls `existsSync` on it (line 151), so a dead file on disk satisfies it.

**And this is not one guard's problem. I measured all of them:**

```
guards in banco-mobile:            32
pinned by a chain assertion:        0
```

**Zero of thirty-two mobile guards are pinned by the chain gate.** Any one can be dropped from the aggregate `test` script and chain integrity still reports 245/245.

**Recommended fix — one assertion, not thirty-two:** add a chain assertion that reads `artifacts/banco-mobile/package.json`, enumerates every `test:*` key, and asserts each appears in the aggregate `test` script. It is self-maintaining: every future guard is covered on the day it is added, with no per-guard bookkeeping.

**My resolution in the local copy:** union — `{...theirs.scripts, ...head.scripts}` with the aggregate taken from canonical and `test:recent-search-chrome` inserted before `test:render`. Verified afterwards: **no script key lost from either side, and every guard defined is listed in the aggregate.**

### Trap B — resolving the SOT collision either way silently disables one gate

The two scripts are **not interchangeable.** I read both:

| Script | What it actually checks |
|---|---|
| `scripts/deployment-sot-guard.mjs` | six **live deployment authority files** exist and name the current repo + canonical branch |
| `scripts/release-sot-gate.mjs` | `release/production/manifest.json` — `repository`, `canonicalBranch`, `coolify.sourceRepository` |

Different scopes, different subjects. **Taking either side of the conflict deletes the other check outright.**

**The resolution is not a judgement call — the release branch already supplies the answer.** It defines `release:verify` pointing at `release-sot-gate.mjs`. So the two gates can keep their own names with nothing lost:

```jsonc
"ops:deployment-sot-guard": "node scripts/deployment-sot-guard.mjs",
"release:verify":           "node scripts/release-sot-gate.mjs"
```

Its `ops:deployment-sot-guard` entry was **redundant with its own `release:verify`** — same script, two names — while displacing the only deployment-scoped check.

**And the union immediately earned its keep.** With both wired, `release:verify` passes (`RELEASE_SOT_GATE_PASS`, `assemblyBaseSha=4f2c81c` — correctly pinned to current canonical) and `ops:deployment-sot-guard` fails on `DEPLOYMENT_PLAN.md` — the §2② finding. **A one-sided resolution would have hidden that failure rather than fixed it.**

Also restored: the **trailing newline** on root `package.json`, which `fix/deployment-sot-next` had stripped.

---

## 4 · ✅ The db-baseline work is the strongest in the batch — and I runtime-verified it

The `MIGRATIONS.md` text the confidence gate misses was replaced by something better. **I checked the code, then ran it against a real database.**

**Wiring, traced:**

```
lib/db/src/baseline.ts:9    import { assertBaselineSchemasEquivalent } from "./baselineEquivalence.ts";
lib/db/src/baseline.ts:268  await assertBaselineSchemasEquivalent(client, referenceSchema, "public");
lib/db/src/baseline.ts:223  await client.query("BEGIN");
lib/db/src/baseline.ts:227  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", …)
lib/db/src/baseline.ts:302  await client.query("ROLLBACK").catch(() => {});
```

`baselineEquivalence.ts` (365 lines) executes the pinned historical `0000 + 0001` SQL into an isolated reference schema and compares it against `public` across relations, columns, types, defaults and generated expressions, constraints, index definitions, enum order, sequences, triggers, policies and RLS state — inside one transaction, under an advisory transaction lock, rolling back on mismatch.

**So the manual instruction "independently prove the schema is equivalent" became an executable proof that fails closed. That is a genuine strengthening.**

### Runtime verification — the first in this engagement

These suites are integration tests that refuse to run without `DATABASE_URL`, so they have never been executed by anyone here. **I started a disposable PostgreSQL 16.13 and ran them.**

```
lib/db/src/baseline-adoption.test.mjs        12 tests · 12 pass · 0 fail   (11.1 s)
lib/db/src/baseline-hybrid-state.test.mjs     2 tests ·  2 pass · 0 fail
```

Including:

```
ok 11 - critical 0004..0007 hashes are never stamped without their physical guarantees
ok 12 - proven 0000..0001 schema baselines only to cutoff; migrate owns every later migration
ok  1 - baseline source uses a lock mode that blocks concurrent table/index DDL
ok  2 - current FI boot-patch shape is classified as hybrid and rejected without journal writes
```

**14/14 against a real PostgreSQL.** Every gate figure in this engagement to date has been static; this is the first behaviour actually witnessed running. The wiring into `scripts/run-api-tests-local.mjs` is correct — after `check`, before `migrate`.

**This branch deserves to land. It is two restored sentences away from 26/26.**

---

## 5 · Corrected merge order

Revised by what the rehearsal actually showed:

**Ready now — proven green together:**
1. `audit/current-truth` · `audit/cross-repo-continuation` — docs, zero code
2. `fix/gate3-listing-moderation-authority`
3. `fix/recent-search-chrome` — **union resolution, §3 Trap A. Do not take "theirs".**

**One small fix each, then ready:**
4. `fix/db-baseline-adoption` — restore two sentences in `MIGRATIONS.md`
5. `fix/car-header-unified-dock-v2` — restore the testID literal, or update the guard deliberately
6. `fix/deployment-sot-next` — drop `DEPLOYMENT_PLAN.md` from `LIVE_AUTHORITIES`, or skip `SUPERSEDED` files

**Last, and only with the union resolution:**
7. `release/production-assembly` — **§3 Trap B. Keep both gates under their own names.**

**Do not merge:** `fix/maps-tile-failure-state-v2` (PR #4) — superseded by `5f44c86`, would regress canonical. **Retire:** both `ci/final-rc-*`, `fix/car-header-unified-dock` v1, `maint/safe-batch-01`.

**Before any of it:** add the one chain assertion from §3 Trap A. It closes the class, not the instance — and it protects every merge in this list.

---

## 6 · Standing verdict

**Work quality: high.** The db-baseline adoption is the best-engineered change I have reviewed in this program, and it is now the only work here with runtime evidence behind it.

**Merge readiness: not yet.** Three of nine branches fail their own gates standalone. All three failures are small and none is architectural.

**The real risk is not the failures — it is the two conflicts that pass.** A wrong resolution on either deletes a control while every gate reports green. That is the class of defect this audit exists to catch, and both are now proven by execution rather than argued.

**Production: `NO-GO`** — unchanged. CI still cannot execute; the 2026-09-09 waiver still has 19 days.

---
*Merge rehearsal executed on a local branch built from `4f2c81c`. Every failure re-confirmed standalone at the branch's own head. Wrong resolutions applied deliberately and measured. Database suites run against a disposable PostgreSQL 16.13. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
