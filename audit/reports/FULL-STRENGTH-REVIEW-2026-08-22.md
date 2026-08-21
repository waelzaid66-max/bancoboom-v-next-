# Full-strength review — everything, verified at runtime

Maximum-depth pass over all agent work. **Every claim below was executed against the shipped services and a live PostgreSQL 16.13, not read.** `canonical @ 4f2c81c`, **2026-08-22.**

**Four results. One settles the P0 beyond argument. One finds the root cause of `GUARD-01` and corrects my own order for it. One says the car-header work is finished. One is about the trunk.**

---

## 1 · ✅ The P0 is now proven through the real API. Not a simulation.

Everything I had published on the price defect was traced through source and a reproduction of the formatter. **That was not good enough for a P0, so I ran the actual services against a real database:** create a listing, read its detail, apply the web form's exact regex chain, call `updateListing`, read it back.

```
display="1.50M EGP" | price_cash=null | hydrated="1.50" | wrote=1.5 | AFTER="1.5 EGP"
```

**Every link confirmed by execution:**

| Step | Result |
|---|---|
| `createListing()` at **1,500,000 EGP** | ✅ persisted |
| `getListingDetail()` → `price_display` | `"1.50M EGP"` |
| `getListingDetail()` → `price_cash` | **`null`** — measured, exactly as claimed |
| Web chain `replace(/[^\d.]/g,"")` → `Number()` | `1.5` |
| `updateListing()` then re-read | **`"1.5 EGP"`** |

**A 1,500,000 EGP listing became 1.5 EGP through the shipped API.** There is no longer any interpretation involved. **P0 confirmed at the highest evidence standard available to me.**

---

## 2 · 🔴 `GUARD-01` — I found the root cause, and my own order for it was incomplete

### The root cause is architectural, not carelessness

The two workspaces discover tests differently:

| Workspace | Mechanism | Consequence |
|---|---|---|
| `api-server` | `vitest.config` → `include: ["src/**/*.test.ts"]` | **glob — a new test runs automatically** |
| `banco-mobile` | **32 explicit** `"test:X": "node --test tests/Y.test.mjs"` scripts | **no glob — a new guard is inert until two manual edits** |

**That asymmetry is why gate3's 16 RED tests appeared in my API run with no `package.json` change, while a new mobile guard silently does nothing.** Agents work across both workspaces and naturally carry the auto-discovery assumption into the one that lacks it.

### And it is happening right now, on branches created *after* I filed `GUARD-01`

| Branch | New guard files | Wired into any script |
|---|---|---|
| `fix/account-deletion-resume-red` | **2** | ❌ **0** — `package.json` not touched at all |
| `fix/profile-visible-role-authority-red` | **1** | ❌ **0** |
| `fix/gate3-listing-moderation` | 1 (`.test.ts`) | ✅ auto-discovered — **correct by convention** |
| `polish/discover-five-portals` | 1 | ✅ wired |
| `fix/maps-bootstrap-fail-closed` | 1 | ✅ wired (`test:map-bootstrap`) |

I verified the two unwired branches are genuinely inert: `git grep` across `package.json`, `scripts/` and `.github/` returns **zero references** for both guards.

**Their content is good.** `account-deletion-terminal-state-guard` has **1 failing assertion** — genuinely RED, correctly capturing my `ACC-LIN-02` finding. `account-deletion-preservation-guard` passes — a preservation guard locking what must not be lost. **Both are correct work. Both will never execute.**

### ⚠️ Correction to my own order — my thirteenth

**I ordered:** *"enumerate every `test:*` key in `package.json`, assert each appears in the aggregate `test` script."*

**That is insufficient, and these branches prove it.** Enumerating `test:*` keys finds nothing to complain about when a guard file **has no key at all**. My assertion would have passed while both new guards sat dead on disk.

**Corrected order — the guard must close both directions:**

```
① every  tests/*.test.mjs  on disk  →  has a  test:*  script
② every  test:*  script              →  appears in the aggregate `test` chain
```

**Direction ① is the one that catches what just happened, and it is the one I left out.**

*(Canonical is currently consistent — 31 guard files, 32 `test:*` scripts — so this closes the gap before it opens, rather than after.)*

**Better still, if you want the class gone rather than guarded:** give `banco-mobile` a glob runner like `api-server` has. A guard that must be remembered is a guard that will be forgotten; a guard that is discovered cannot be.

---

## 3 · ✅ The car-header work is **finished**. One decision stands between it and green.

**At 42 commits the agents have cleared every blocker I named except the one no agent may decide.**

| Gate | At 16 commits | At 35 | **At 42** |
|---|---|---|---|
| Security | 0 blocking | 0 blocking | ✅ **0 blocking** |
| Chain | 245/245 | 🔴 244/245 | ✅ **245/245** |
| Confidence | 🔴 24/26 | 🔴 24/26 | 🟡 **25/26** |
| Mobile | FAIL | FAIL | 🔴 **FAIL — exactly one test** |

```
not ok 46 - B-oom Car mounts CarsHomeHeader Stay-parity shell
```

**That is the entire remaining failure surface. One test. The `testID` contract.**

**They resolved everything else, including two things I ordered:**
- `4b2d7c6 test(car): use supported accessibility-state assertion` — **took the `toBeSelected()` correction**
- The `P-car-compact-strip` chain failure — fixed, and `9c30a58 test(car): make zero-loss guard syntax-agnostic without weakening invariants` is precisely the right instinct for a file-bound guard
- The `TS2322 SearchSort → SortKey` type break — gone

**And the decision itself is untouched at commit 42, exactly as it was at commit 4:**

```
CarsHomeHeader.tsx:267        testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
section-miniapp-guard:1445    assert.match(header, /testID="cars-home-header"/)
```

> **Thirty-eight commits of engineering have been spent working around a question that one sentence from the owner closes. The work is done. It is waiting.**

**ORDER — one of two, and only the owner may choose:**
- **(a)** restore a literal `testID="cars-home-header"` the guard can see, keeping the ternary for the scroll slot
- **(b)** update the guard's `test` **and** its `why` to describe the two-slot contract

**Both are defensible engineering. Choosing neither has been the single most expensive decision on this project.**

---

## 4 · 🔴 The trunk has not moved in over a day, and the branch count is now 51

```
canonical @ 4f2c81c   last commit: 2026-08-21T10:27
remote branches:      51
```

**Every batch I have received in this window is good work.** Maps exceeded its order. Car-header cleared four of five blockers. Account-deletion and profile-role opened correct RED phases. Gate3's RED matrix is exemplary.

**None of it has landed.** A fifth car-header branch appeared (`staging/car-clean-semantic-splice-20260822`) while the previous four already held identical blobs.

> **This is now the largest risk in the project, and it is larger than any defect in my register.** Nine branches were pending when I first counted; there are more now, the trunk is static, and each new branch is measured against a base that is drifting further from what will eventually be merged. **Verification performed on a stale base is verification of something you will not ship.**

**ORDER — merge what is already accepted, today:**
1. `audit/current-truth` + `audit/cross-repo-continuation` — **docs only, zero risk, accepted since my last pass**
2. `fix/db-baseline-adoption` — **API 505/505, baseline 14/14**, blocked by two sentences in `MIGRATIONS.md`
3. `fix/maps-bootstrap-fail-closed` — blocked by **one registry entry**

**Three merges. Two of them need a sentence and a line. Do them before adding another branch.**

---

## 5 · Consolidated acceptance state

| Branch | State | Exact blocker |
|---|---|---|
| `audit/*` ×2 | ✅ **ACCEPT — merge now** | none |
| `fix/db-baseline-adoption` | 🟡 **ONE FIX** | two sentences in `MIGRATIONS.md` |
| `fix/maps-bootstrap-fail-closed` | 🟡 **ONE FIX** | one render-coverage registry entry *(web-host port is a follow-up)* |
| `fix/car-header-*` ×5 | 🟡 **ONE DECISION** | the `testID` contract — **owner only** |
| `fix/account-deletion-resume-red` | 🟡 **WIRE IT** | 2 guards, 0 scripts — currently inert |
| `fix/profile-visible-role-authority-red` | 🟡 **WIRE IT** | 1 guard, 0 scripts — currently inert |
| `fix/gate3-listing-moderation` | ⏸️ **HOLD** | RED by design; needs GREEN |
| `polish/discover-five-portals` | 🔴 **REJECT** | fails its own guard — `missing discover-map-car` |
| `release/production-assembly` | 🔴 **REJECT** | breaks the SOT lock — owner decision first |
| `fix/maps-tile-failure-state-v2` (PR #4) | ❌ **CLOSE** | superseded |
| `probe/*` · `staging/*` ×3 | 🧹 **DELETE** | identical blobs to the authoritative branch |

---

## 6 · The honest state

**The engineering is not the problem.** In this window the agents produced a fail-closed state machine with a revival latch, RTL and a11y I never asked for; cleared a chain regression, a type break and a file-bound guard; and opened two correct RED phases against my own findings within hours of receiving them.

**Four things are the problem, and none of them is code:**

1. **One unmade decision** — 38 commits and five branches deep
2. **One structural asymmetry** — mobile guards must be remembered, API tests are discovered
3. **A static trunk** — 51 branches, nothing merged in a day
4. **My own incomplete order** — corrected above, before it was built against

**Production: `NO-GO`, unchanged.** But nothing in this pass moved the project further from shipping. **Three of the four items above are closed by a sentence, a glob, and three merges.**

---
*Round-trip proof executed via `createListing` → `getListingDetail` → `updateListing` against a disposable PostgreSQL 16.13; test data removed afterwards. Guard wiring verified by `git grep` across `package.json`, `scripts/` and `.github/`. Discovery asymmetry read from `vitest.config` and `package.json` directly. Every gate figure executed at the branch head named. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
