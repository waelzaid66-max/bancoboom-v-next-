# `A-8` resolved, five more branches judged, and the box is closed — 174 commits, every gate green

**The two baseline implementations agreed on the rule and disagreed on the number. One of them proves its number; the other asserts it. That decides it.**

**Then: one `fix/` branch turned out to be RED by design and was backed out, one maps branch turned out to be entirely superseded and nothing was taken from it, three more dead guards were found — and my own union tool was quietly re-arming the RED guard I had excluded.**

`origin/local/audit-union-20260823` · 174 commits · 92 files · pushed. **2026-08-23.**

---

# §1 · `A-8` — the written comparison, and the resolution

**Both branches rewrite `lib/db/src/baseline.ts` and `MIGRATIONS.md`. Both implement the same rule: baseline stamps a historical *prefix* only; every later migration must run through `migrate`. They disagree on where the prefix ends.**

| | `fix/db-baseline-adoption-20260821` | `audit/db-adoption-guard-20260822` |
|---|---|---|
| size | 18 commits · 9 files · `baseline.ts` **314 lines** | 3 commits · 3 files · **166 lines** |
| prefix | **`0000` → `0001_minor_stingray`** | `0000` → **`0003_typical_human_robot`** |
| how the prefix is defended | git **blob SHA** per migration + a cutover commit + an operator confirmation env | a tag list, with a comment saying never to extend it |
| **equivalence proof** | ✅ **executes the prefix into a reference schema and compares before stamping** | 🔴 none |
| concurrency | ✅ advisory lock blocking table/index DDL | 🔴 none |
| tests | ✅ 14-case matrix, wired into CI | 🔴 none |

## Why the smaller number wins

**`0002` and `0003` are one line each:**
```sql
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp;
ALTER TABLE "users" ADD COLUMN "show_presence" boolean DEFAULT true NOT NULL;
```
**Stamping them as applied when they were not leaves two columns missing behind a green journal.**

> **The decisive asymmetry is not the number — it is what happens when the number is wrong.** *`fix/db-baseline-adoption` **refuses**: its equivalence check compares the executed prefix against the live schema and stops. `audit/db-adoption-guard` **stamps**: it has nothing to check the list against.*

**And the second branch already knows this.** *Its own comment says an over-stamped database "must be reconciled explicitly rather than teaching baseline to skip new work" — while its list reaches two migrations further. Its other change is a readiness probe for `messages.client_message_id`, added because* ***"a pre-journal database that is accidentally stamped past the historical adoption prefix must not receive traffic"***. *That is a defence against its own failure mode.*

## Resolution — nothing discarded

**`lib/db/*` ← `fix/db-baseline-adoption-20260821`.** *`baseline` adoption matrix **14/14**, including "proven `0000..0001` schema baselines only to cutoff; migrate owns every later migration" and "baseline source uses a lock mode that blocks concurrent table/index DDL".*

**`health.ts` ← the readiness probe from `audit/db-adoption-guard-20260822`**, taken on its own merits and cited in place.

---

# §2 · The other five, judged one at a time

| branch | verdict |
|---|---|
| `fix/eas-production-provenance-20260822` | ✅ merged clean |
| `fix/api-test-db-safety-20260822` | ✅ merged — **conflict resolved by hand, see below** |
| `fix/miniapp-web-viewport-shell-20260823` | ✅ merged — conflict on `custom-fetch.ts` resolved to the union's version, which is this branch's own work **plus** the widening fix |
| `fix/gate3-listing-moderation-authority-20260821` | 🔴 **merged, then reverted** |
| `fix/maps-tile-failure-state-v2-20260821` | 🔴 **superseded — merged, nothing taken** |

## `fix/gate3-…` — a `fix/` branch that is RED by design

```
Test Files  3 failed | 93 passed        Tests  46 failed | 525 passed
FAIL ListingModerationAuthority.gate3.test.ts
  > RED: DealerListingItemSchema represents owner-visible status pending_review
  > RED: dealer listings controller response remains consumable for rejected      …
```
**Every failing title begins `RED:`.** *The work is deliberately red; the branch is simply not named `test/*`. **Backed out** — a RED-by-design branch never enters an assembly that claims green (condition ⑬).*

> **The naming convention is the only thing that stops this, and here it did not.** *I merged it, ran the suite, and the suite told me. That is what the suite is for.*

## `fix/maps-tile-failure-state-v2` — superseded in both directions

```
v2      if (msg.type === "ready" || msg.type === "error") setReady(true);
union   error is TERMINAL — fail closed; tile_error is a degraded ready map
        and can never revive a failed bootstrap

v2      hardcoded AR/EN alert strings inline
union   t("search.mapUnavailableTitle") / t("search.mapUnavailableBody")
```
**v2 is 8 commits behind canonical, and `fix/maps-bootstrap-fail-closed` already absorbed its tile handling and improved it twice.** *Taking v2 would reintroduce the fail-open bootstrap the other branch exists to remove.*

**Its `mapHtmlTileGuard.ts` and `map-tile-failure-guard.test.mjs` are not additive either** — *run against the kept components the guard fails **2 of 5**, because it asserts they consume v2's own bridge rewrite.* **Shipping a failing guard to keep a file was not an option, so the merge takes nothing and says so.**

## The runner conflict, resolved by hand

`fix/api-test-db-safety` **rewrites `run-api-tests-local.mjs` from ~72 to ~380 lines**: it provisions a **random disposable child database** per run, refuses an inherited `DATABASE_URL`, and demands an explicit arming contract —
```
BANCO_API_TEST_ADMIN_URL · BANCO_API_TEST_DISPOSABLE_CONFIRM=CREATE_DROP_RANDOM_CHILD_DB
BANCO_API_TEST_EXPECT_HOST · _PORT · _DATABASE
```
**The baseline branch had added three lines to the *old* runner. The rewrite would have silently dropped them, so they were re-inserted:**
```js
console.log("\nRunning fail-closed legacy baseline adoption matrix…");
run("pnpm", ["--filter", "@workspace/db", "run", "test:baseline-adoption"], testEnv);
```
> ***A rewrite is where additions go to die.*** *Nothing warns you: both sides are correct, and the union is what neither side wrote.*

---

# §3 · Three more dead guards — the third batch today

`fix/miniapp-web-viewport-shell-20260823` shipped three guard files and **defines no script for any of them**:
```
account-deletion-preservation-guard.test.mjs      4 pass
account-deletion-terminal-state-guard.test.mjs    4 pass
miniapp-web-viewport-shell.test.mjs               3 pass
```
**All three pass. All three are now in the aggregate.** *They were green and unread — this time nothing was being hidden, but nothing was being protected either.*

**Running total for one day of merging: ten guard files that nothing executed, across four branches.**

---

# §4 · ⚠️ My RED convention and my own union tool disagreed

**I excluded the failing profile-role guard as `test:red:profile-role`. The next `package.json` merge put it straight back into the green aggregate — because `audit/tools/union-mobile-package-json.mjs` rebuilds `scripts.test` so that ***every*** `test:*` key is invoked, which is the whole reason it exists (condition ⑦).**

**Two of my own rules, both correct, cancelling each other.** *Renamed to `red:profile-role`: defined, runnable by name, outside the namespace the resolver sweeps.*

> **A convention that lives only in a prefix is not a convention — it is a coincidence waiting for a tool.**

---

# §5 · And why `P0-1` was invisible to CI all along

`.github/workflows/ci.yml:85`
```yaml
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```
**CI provisions the extension by hand before migrating.** *So the migrator's missing `CREATE EXTENSION` never bites in CI — and a real deploy against a fresh database fails at `0000` with `gin_trgm_ops does not exist`. **Found by reading the workflow while checking something else.** The green CI badge and the failing deploy were both telling the truth about different databases.*

---

# §6 · The battery, on the finished assembly

```
chain-integrity-gate                    247/247 passed
production-confidence (CI mode)          24/24 passed
root  pnpm run typecheck                 exit 0
root  pnpm run test  (recursive)         exit 0   ·  45 packages/scripts at "# fail 0"
api-server suite (disposable child DB)  518 passed | 3 skipped | 0 failed
baseline adoption matrix                 14/14
mobile guard pack                        41 green scripts, all 41 invoked
seller workspace parity                  40/40, both surfaces
guard-reachability                      166 of 167 — the 1 is the declared RED guard
```

**13 branches merged · 1 reverted as RED · 1 taken as superseded-with-nothing · all nine P0 patches applied.**

---

# §7 · What is still outside the box

| | |
|---|---|
| 🔴 `red:profile-role` | fails on its own source branch; needs `fix/profile-visible-role-authority-red-20260822` finished |
| 🔴 `fix/gate3-listing-moderation-authority-20260821` | RED by design — treat as `test/*`, land the implementation first |
| 🟠 `fix/maps-tile-failure-state-v2-20260821` | superseded; safe to delete once its author confirms |
| 🟠 9 `test/*` RED-by-design branches | correct as they are |
| 🟠 29 fully-merged branches | deletable, verified on a non-shallow clone |
| ⚪ owner decisions | ratify vNext as the deploy repository · open one failed CI run and read the annotation banner |

**Sequencing, unchanged and not negotiable:** *`fix/replit-build-integrity-p0-20260822` is in this assembly and must stay in whatever ships first, or the Cars header lands and the owner still sees nothing.*

---

# §8 · Standing

**Register: 34 classes · 9 at P0 · 1 at P2 · 45 corrections published.**

> **Every judgement in this report was reversible until a gate ran.** *Two branches I merged in good faith came straight back out — one because its own tests are red on purpose, one because a better version of it was already in the box. Neither would have been visible from the diff.*

---
*The baseline comparison written from both implementations' source, both prefix lists, and the contents of the two migrations they disagree about. The RED branch identified by running the suite, not by reading the branch name — which is what concealed it. The maps branch judged by reading the conflicting hunks on both sides, and its guard run against the kept components before being rejected. The runner's lost baseline step found by diffing what each side added to the same file. Each newly wired guard run before being added to the aggregate. The `test:red:` sweep reproduced, explained from the resolver's own contract, and fixed by renaming rather than by weakening the resolver. The CI extension line found by reading the workflow. Nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
