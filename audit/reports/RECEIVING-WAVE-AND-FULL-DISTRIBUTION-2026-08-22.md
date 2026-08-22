# The receiving wave — 14 branches merged, six gates green, and the two decisions that turned out to be one

**The owner asked for the biggest wave, complete distribution, and proof that receiving and merging is clean. This report is the proof first and the orders second, because the orders are only worth what the evidence behind them is worth.**

**Everything below was executed today against a real PostgreSQL 16 and a real merge tree. No figure in this document is quoted from an earlier report.**

`canonical @ 4f2c81c` — **frozen since 2026-08-21 10:27, now 34 hours.** **2026-08-22.**

---

# §1 · ✅ RECEIVED AND MERGED — `local/owner-assembly-20260822`, pushed

**14 branches · 116 commits · zero manual conflicts.**

```
audit/current-truth-20260821                     audit/cross-repo-continuation-20260821
fix/maps-bootstrap-fail-closed-20260821          fix/android-api36-release-compliance-20260822  (union)
fix/recent-search-chrome-20260821      (union)   polish/discover-five-portals-20260821          (union)
fix/api-test-db-safety-20260822                  fix/auth-account-deleted-retry-20260822
test/push-send-retry-p0-red-20260822             test/marketplace-token-normalization-red-20260822
fix/account-deletion-resume-red-20260822         fix/profile-visible-role-authority-red-20260822
audit/db-adoption-guard-20260822                 staging/certify-pr30-pr42-20260822
```

**Six gates, measured on the merged tree, not on the branches:**

| Gate | Result |
|---|---|
| dependency security | **0 blocking** (2 narrowly waived, `image-size` Metro build-time) |
| chain integrity | **245/245** |
| production confidence | **26/26** |
| mobile render | **127/127**, 18 suites |
| mobile guards | **35 of 38 executed** — see §3 |
| **API suite vs real PostgreSQL 16** | **515 passed · 3 skipped · 0 failed** (94 files) |

**The API figure moved from 505 to 515.** Ten new integration tests entered the trunk-candidate today and every one of them passes on the merged tree.

> **Receiving is clean. Merging is clean. The bottleneck is not the merge — it is that nothing is promoting the result.**

---

# §2 · 🔴 THE MERGE CONFLICT THAT DELETES GUARDS — solved, deterministically

**Three of fourteen merges collided on `artifacts/banco-mobile/package.json`.** Every collision was the same shape: two branches each added a guard, and each rewrote the single-line `test` aggregate. **Taking either side keeps that branch's guard and silently deletes the other's.** The guard file survives. The `test:` script survives. Nothing runs it.

**This is not hypothetical — it is the documented origin of guards already shipped dead.**

**It is now resolved by a rule, not by judgement.** `audit/tools/union-mobile-package-json.mjs` unions both sides and **rebuilds the aggregate from the union of `test:*` keys**, so a guard cannot be dropped by a merge even by accident. It exits non-zero if any guard is left uninvoked, and it refuses to guess when both sides changed the same key differently.

**Result across three collisions: 35 guards in, 35 guards invoked, 0 dropped.**

**ORDER — every agent, effective now:** resolve `banco-mobile/package.json` with that tool. **Do not hand-merge that file.**

---

# §3 · 🔴 THREE DEAD GUARDS ARE IN THE TRUNK CANDIDATE — and all three pass

**Measured on the merged tree:**

```
tests/*.test.mjs files present:            38
referenced by some test:* script:          35
NEVER EXECUTED BY ANYTHING:                 3
```

| Never-run guard | Branch | Run by hand |
|---|---|---|
| `account-deletion-preservation-guard.test.mjs` | `fix/account-deletion-resume-red` | **PASS** (4 ok) |
| `account-deletion-terminal-state-guard.test.mjs` | `fix/account-deletion-resume-red` | **PASS** (4 ok) |
| `profile-visible-role-authority-guard.test.mjs` | `fix/profile-visible-role-authority-red` | **PASS** (1 ok) |

> **The fixes are correct. The protection is absent.** These guards pass, which means the invariant holds today — and nothing will tell anyone the day it stops holding.

**Plus a fourth on a branch not yet merged:** `test/android-notification-icon-red-20260822` ships `android-notification-icon-compliance.test.mjs` with `package.json` untouched.

**Running total: eight guards shipped dead in this project.** Four found earlier, four found today.

**And the credit where it is due:** `fix/android-api36-release-compliance` and `polish/discover-five-portals` **both wired their guards into the aggregate correctly.** The practice is being adopted — unevenly, by branch, with nothing enforcing it.

---

# §4 · 🔴 WHY IT KEEPS HAPPENING — measured across all 64 branches, not inferred

```
branches checked:                     64
branches with a root `test` script:    0
```

**Root `package.json` has `build` (recursive) and `typecheck` (recursive). It has no `test` at all — on canonical and on every single branch.**

**CI invokes exactly three test commands, all by explicit filter:**
```
ci.yml:99    pnpm --filter @workspace/api-server  run test
ci.yml:140   pnpm --filter @workspace/banco-mobile run test
ci.yml:142   pnpm --filter @workspace/api-server  run test:seed-guard
```

> **Everything a guard needs in order to run is: be an `src/**/*.test.ts` in api-server, or be named in one string in one file in banco-mobile. Everything else in this monorepo — `lib/**`, `scripts/**`, every ops gate — is unreachable by CI no matter how well written it is.**

**`A-0a` — a recursive root `test` — was ordered in the last wave. Sixty-four branches later, zero have it.** It remains the single highest-leverage unexecuted line in the project.

---

# §5 · ✅ GATE 4 — the first executable specification of the deletion defect

`test/listing-deletion-retention-red-20260822` is **RED by design and correctly so.** Held out of the assembly; verified separately against a real database:

```
RED × seller listing deletion must preserve the buyer/seller thread and message history
RED × ... must preserve booking transaction history with a detached listing reference
RED × ... must preserve moderation/report evidence with a detached listing reference
RED × ... must preserve captured lead history with a detached listing reference
RED × deleteListing must hand first-party media to a durable storage-reclamation path
```

**Five failures. Reproducible. `ListingService.ts` deletes the row and lets the cascade take everything.**

> **This matrix was written independently and it lands on exactly the five items I filed as `LIST-LIN-02` — threads, bookings, reports, leads, media.** Two agents reached the same five from different directions. **That is the strongest form of confirmation available here, and it upgrades P-21 from an argument to a test.**

**ORDER:** this branch is the acceptance criterion for the P-21 fix. **It must stay RED until the fix lands and must never be merged to make a tree green.** DONE means these five pass with no edit to the test file.

---

# §6 · ⚠️ CORRECTION #22 — owner decision #1 is narrower than I have been saying

**I have been asking the owner to decide which repository deploys. I test-merged `release/production-assembly-20260821` (58 commits) into the green assembly and measured what happens:**

```
merge: CLEAN
chain: 240/245  ← five FAILED
```

```
[FAIL] P-canonical-deploy-repo-deployment-sot
[FAIL] P-canonical-deploy-repo-coolify-now
[FAIL] P-canonical-deploy-repo-go-live
[FAIL] P-canonical-deploy-repo-coolify-compose
[FAIL] P-canonical-deploy-repo-coolify-guide
      why: "Every live deployment surface must name bancoboomstor as the only canonical repository"
```

**The repository already answers the question — in fourteen assertions**, covering 13 deployment documents plus `DUAL_REPO_STATUS.md`, introduced `66771d6`, **Codex, 2026-08-09**, unchanged on canonical since.

**And here is the fact that decides it:**

```
bancoboomstor  — last commit on main:  a3db5bd  2026-08-09 16:11
bancoboom-v-next-                    :  64 branches, ~600 commits, all of them since
```

**The pin was written on the same day `bancoboomstor` received its final commit.** vNext already carries that exact head as `recovery/source-bancoboomstor-a3db5bd8`. **The code moved thirteen days ago and never went back.**

> **So the decision is not "choose a repository." It is "ratify what already happened."** The release branch is **substantively right and mechanically incomplete**: it repoints **5 of 13 documents and 0 of 14 assertions.**

**ORDER — and this is the part that matters:** the flip is **one commit that changes the 13 documents and the 14 assertions together.** **Nobody may delete or weaken those assertions to make the release branch pass.** *That is exactly the mistake I made once already in this engagement, and the colleague was right to stop me.* Until the owner says the word, `release/production-assembly-20260821` is **HOLD — 58 commits blocked on one sentence.**

---

# §7 · 🔴 TWO COLLISIONS BETWEEN AGENTS — both proven, both silent

## ① The same script key points at two different gates

```
fix/deployment-sot-next-20260821       "ops:deployment-sot-guard": "node scripts/deployment-sot-guard.mjs"
release/production-assembly-20260821   "ops:deployment-sot-guard": "node scripts/release-sot-gate.mjs"
```
**Whoever merges second picks which gate the project has, in a package.json conflict, with no test to notice.**

**And both are already dead:** `grep -c` for that key in `ci.yml` on both branches returns **0**. Two agents each built a deployment gate; neither is invoked by anything.

## ② Two competing baseline-adoption implementations

`fix/db-baseline-adoption-20260821` (18 commits) **cannot merge** into the assembly:
```
CONFLICT  lib/db/src/baseline.ts
CONFLICT  lib/db/MIGRATIONS.md
CONFLICT  scripts/run-api-tests-local.mjs
```
`audit/db-adoption-guard-20260822` rewrote the same two files, and the API-test-safety work rewrote the same runner. **Three agents, one file each, no coordination.**

**ORDER:** Space A owns `lib/db/**` and `scripts/run-api-tests-local.mjs`. **One of these two baseline implementations survives; the other rebases onto it.** The owning agents produce a written comparison before either merges — not a merge commit that picks a winner by accident.

---

# §8 · THE BRANCH LEDGER — 64 branches, and 15 of them are noise

| Class | Count | Evidence |
|---|---|---|
| **Byte-identical duplicates** | **4** | 8 car-header branches → **4 distinct trees**. `9936b3e4` appears on 3 branches; `63284472` on 2. |
| **Empty — 0 commits ahead of canonical** | **5** | `fix/profile-visible-role-authority` · `polish/native-mobile-uiux-wave` · `fix/maps-bootstrap-error` · `fix/sot-lock-vnext-only` · `recovery/coworker-maps` |
| **Superseded scratch namespaces** | **4** | `probe/` `tmp/` `staging/car-*` ×2 |
| **Stale RC** | **2** | `ci/final-rc-*` |
| **History rewritten on a shared remote** | **1** | `fix/car-header-unified-dock-v2-20260821` took a **forced update** today; the previous head `5df3f9b` is **not an ancestor** of the new one. |

**ORDER:** delete the 15. **And no force-push to a shared branch, ever** — if the work changed, it is a new branch.

---

# §9 · 🔴 THE CAR-HEADER FAMILY — eight branches, four implementations, none satisfies the contract

```
canonical                                    testID="cars-home-header"  ×1   ← the literal, present today
fix/car-header-clean-splice-20260822         ×0
fix/car-header-unified-dock-v2-20260821      ×0
fix/car-header-zero-loss-surgical-20260821   ×0
probe/car-header-surgical-exec-790160c       ×0
```

**All four distinct implementations drop the literal the section guard has asserted since 2026-08-01. All four add `cars-hero-band`.** *They are solving the scroll problem and losing the identity while doing it, four separate times.*

**This is 44 commits and three weeks spent on a two-character regression, and it is still not fixed.**

**ORDER — one branch, one line, everything else deleted:** keep `testID="cars-home-header"` as a literal on the header element and give the scroll slot `cars-hero-band` on a **second element or a separate attribute**. **Both identities coexist.** This is not an owner decision; canonical answers it.

---

# §10 · THE WAVE — six spaces, all parallel, no dependencies except one

| Space | Task | Status | Blocks |
|---|---|---|---|
| **A** | **`A-0a` root recursive `test`** — `"test": "pnpm -r --if-present run test"` + the assertion | **0 of 64 branches** | **every guard in this repository** |
| **A** | Wire the **3 dead guards** into the mobile aggregate; then the glob runner so no future guard needs a `package.json` edit | 8 shipped dead | §3 |
| **A** | `A-1` `pg_trgm` in `migrate.ts` before `migrate()` + assertion · `A-2` `.gitignore` credential pin + assertion | not started | fresh deploy · a public repo |
| **A** | Reconcile the **two baseline-adoption implementations**; one survives | conflicting | §7② |
| **B** | Hydrate both web surfaces from `price_raw` once C ships it | blocked on C | — |
| **C** | **`price_raw` on the listing-detail response — one line** | not started | **B, and the P0 price corruption** |
| **C** | **The Gate-4 retention fix** — the five RED assertions are the spec, verbatim | spec exists | P-21 |
| **C** | The **16 SQL concurrency assertions** + `TRUST_PROXY_HOPS`, per-site, never blanket | not started | P-22 |
| **D** | **One** car-header branch; emit the literal; delete the other seven | 4 impls, 0 correct | §9 |
| **D** | Restore the RE `propertyType` fallback byte-for-byte, then pin every section's strips | lost in `9c0ddb1` | cross-section loss |
| **D** | Split the map-bridge negative test so the latch cannot mask it | 3 lines | P-23 |
| **E** | Resolve the `ops:deployment-sot-guard` key collision; wire the surviving gate into CI | 2 gates, both dead | §7① |
| **E** | Fix the stale `SearchService.ts:408` comment | trivial | prevents a rebuild of working code |

**Every one of these can start now.** **`A-0a` is the one that makes the other twelve real** — until it lands, a guard is a suggestion.

---

# §11 · THE STANDARD — unchanged, and now enforced by the merge itself

**① DONE = the full battery on a tree containing your work.** Not your own test.
```
security 0 blocking · chain 245+/245+ · confidence 26/26 · mobile 127+/127+ · API 515+/515+ vs real PostgreSQL
```
**② Prove your guard executes. Paste the count.** "The file exists" is not evidence, and it has now failed eight times.
**③ Static guard AND a real mount.**
**④ Pin the control in the same commit that changes it.**
**⑤ A guard's `why` outranks its `test`.**
**⑥ Never weaken a guard to match source** — including the 14 deploy-repo assertions.
**⑦ `banco-mobile/package.json` resolves by `audit/tools/union-mobile-package-json.mjs`, never by hand.**
**⑧ One branch per unit of work. No `probe/` `tmp/` `staging/` on the shared remote. No force-push to a shared branch.**
**⑨ Label `RUNTIME_UNPROVEN` honestly.**
**⑩ `lib/**` and `scripts/run-api-tests-local.mjs` belong to Space A.**
**⑪ Cross-audit before handover.**
**⑫ Use the ten-state vocabulary.**
**⑬ A RED-by-design branch never enters an assembly that claims green.** *Held `test/listing-deletion-retention-red` out today for exactly this reason.*

---

# §12 · WHAT REMAINS WITH THE OWNER

| # | Decision | What it costs you |
|---|---|---|
| **1** | **Ratify vNext as the deploy repository** — the code has been there alone for 13 days and `bancoboomstor` has not moved since 2026-08-09. Say yes and one commit flips 13 documents and 14 assertions together, unblocking 58 held commits. | **One sentence.** |
| **2** | **Open one failed CI run and read the annotation banner.** Until CI executes, every figure in this project is one machine on Node 22 against a Node 24 target. | **Ten seconds.** |

**And schedule the runtime week:** a device, a browser, live credentials, a deploy rehearsal with a restore actually performed, and an Android build that proves API 36 compiles.

---

# §13 · STANDING

**Register: 27 classes, 9 at P0. Twenty-two corrections published against my own record.**

**Production: `NO-GO`** — the P0 price corruption is untouched, the web workspace still cannot create a listing, and the deletion cascade now has five failing tests proving it.

**But the receiving line is not the problem.** Fourteen branches came in today, all fourteen merged, all six gates green, API up ten tests, and the tree is pushed at `local/owner-assembly-20260822`.

> **Sixty-four branches. Zero merged to canonical in 34 hours. Finished, verified, green work is sitting in a queue while the team opens new branches.**
>
> **The throughput problem is not capacity and it never was. It is that nothing promotes.**

---
*Every figure produced today by execution: a real merge tree, a PostgreSQL 16 instance created for this run, and the official disposable-database runner. The release-branch verdict produced by test-merging it and reading the gate, not by reasoning about it. The deploy-repository question resolved by reading what the assertions say and when the other repository last moved — a check that should have preceded two days of escalation. The car-header verdict produced by counting the literal in each of the four distinct trees. No file modified outside `audit/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
