# API suite runtime verification — and a correction to my own merge verdict

I brought up PostgreSQL 16.13 and ran the **full api-server integration suite** through the project's own harness (`scripts/run-api-tests-local.mjs`) — migrate, idempotent replay, seed, then Vitest. Executed **2026-08-21 20:20 UTC**.

**Two results. The first is the best news in this engagement. The second corrects a verdict I published three hours ago.**

---

## 1 · ✅ Canonical's API suite is fully green against a real database

```
canonical/vnext-assembly @ 4f2c81c

Validating committed migrations…
Applying committed migrations…
Replaying migrations (must be idempotent)…
Seeding reference data…
Running api-server tests…

Test Files   91 passed | 1 skipped (92)
     Tests  505 passed | 3 skipped (508)

[PASS] api-server integration suite
```

**505 tests, zero failures, against real PostgreSQL.** Migrations apply, **replay idempotently**, seed cleanly, and the entire service layer passes.

Combined with the 14/14 baseline-adoption result earlier today, **canonical now has genuine runtime evidence** — not static assertions. Every figure I have certified since 2026-08-14 was static; this is behaviour actually witnessed.

**This is the strongest single verification result the project has, and it should be recorded as such.**

*(Caveat, stated plainly: still Node 22 in this sandbox against CI's Node 24, and still no native render, no browser WebView, no live providers.)*

---

## 2 · ⚠️ Correction — `fix/gate3-listing-moderation-authority` is **not** merge-ready, and I said it was

**In `MERGE-REHEARSAL-AND-TRAPS-2026-08-21.md` I placed this branch in "Ready now — proven green together" and put it at position ③ of the merge order. That was wrong.**

With the same harness, on canonical **plus** that branch:

```
Test Files   1 failed | 91 passed | 1 skipped (93)
     Tests  16 failed | 512 passed | 3 skipped (531)

FAIL  src/services/ListingModerationAuthority.gate3.test.ts
  RED: a seller cannot reactivate an admin-rejected listing through updateListing
  RED: content edits cannot clear an existing administrative flag
  RED: dealer bulk activate cannot publish a moderation-held listing
  RED: ListingDetailSchema represents owner-visible status draft
  … 12 more, every one prefixed RED:
```

**The branch is doing exactly what it says it does, and the fault is mine, not theirs.** Its own report declares the intent:

> *"## RED implementation evidence … Commit `c119222` adds `ListingModerationAuthority.gate3.test.ts` … **PR: #14 (Draft).**"*

It is a **deliberate failing-test matrix** on a **Draft** PR, written to document three real defects before the fix:

| ID | Defect it pins |
|---|---|
| LIST-LIN-01 | `updateListing()` omits `status`/`isFlagged`/`flagReason` from the authorizing owner row, so **seller edits can overwrite moderation authority** |
| — | `bulkUpdateListingStatus(…, "activate")` writes `status="active"` with **no moderation-state predicate** |
| LIST-LIN-03 | `ListingDetailSchema` and `DealerListingItemSchema` represent only `active\|sold\|archived`, so a legitimate owner read of a moderation-held listing **fails the response contract** |

**That is good work and correct process.** RED-first on a Draft PR is precisely how a security-authority defect should be pinned. **Merging it to canonical would turn CI red** — the `API tests (Postgres)` job runs this suite. It must land only with, or after, its GREEN implementation.

### Why my rehearsal missed it — and this matters beyond this branch

**The static battery I have been certifying does not run the API suite.** Chain integrity, production confidence and the mobile render pack need no database. The API suite needs PostgreSQL, so it sits outside every gate figure I have published.

**A branch can therefore pass chain 245/245, confidence 26/26 and render 124/124 — as this one did — and still be red.** That is a real hole in my own verification, not just in this rehearsal, and I am recording it as such.

**Corrected rule, for me and for anyone reading my reports: no branch touching `artifacts/api-server` or `lib/db` is "verified" until the API suite has run against a real database.** From here I will run it before certifying any such branch.

---

## 3 · Corrected local assembly

Rebuilt without gate3, then verified with the API suite included:

| Merged | Commits |
|---|---|
| `audit/current-truth-20260821` | 11, docs only |
| `audit/cross-repo-continuation-20260821` | 11, docs only |
| `fix/recent-search-chrome-20260821` | 11, union resolution |

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ exit 0 |
| Dependency security | ✅ **0 blocking** |
| Chain integrity | ✅ **245 / 245** |
| Production confidence | ✅ **26 / 26** |
| Mobile full pack | ✅ **124 / 124**, exit 0 |
| **API suite vs real Postgres** | ✅ **505 / 505**, `[PASS]` |

---

## 4 · Corrected merge order

| Branch | Status | Gate |
|---|---|---|
| `audit/current-truth` · `audit/cross-repo-continuation` | ✅ **merge now** | docs only |
| `fix/recent-search-chrome` | ✅ **merge now** — union, never "theirs" | — |
| `fix/gate3-listing-moderation-authority` | 🔴 **hold — Draft, RED by design** | needs its GREEN implementation |
| `fix/db-baseline-adoption` | 🟡 two sentences in `MIGRATIONS.md` | then merge; code is runtime-proven 14/14 |
| `fix/car-header-unified-dock-v2` | 🟡 the `testID` decision | yours |
| `fix/deployment-sot-next` | 🟡 `LIVE_AUTHORITIES` fix | its own guard exits 1 |
| `release/production-assembly` | 🟡 last, union resolution | — |
| `fix/maps-tile-failure-state-v2` (PR #4) | ❌ **do not merge** | superseded; would regress `5f44c86` |

---

## 5 · The three Gate-3 defects deserve their own priority

Independently of the merge question, the defects that branch documents are **live on canonical right now**. The most serious:

> **A seller can overwrite an administrative moderation decision through an ordinary listing edit.**

That is an authority bypass in a marketplace — a rejected or flagged listing returning to `active` by seller action. It sits above the search and Messenger work in the directive I filed earlier. **The RED matrix is already written; what it needs is the GREEN implementation and a chain assertion pinning the authority predicate.**

---

## 6 · Standing

**Canonical: stronger than previously provable.** 505/505 API against real Postgres, 14/14 baseline adoption, 245/245 chain, 26/26 confidence, 124/124 render, 0 blocking.

**But `DEPLOY-01` is unchanged and still first:** a fresh database cannot be migrated at all without a manual `CREATE EXTENSION pg_trgm`. Every run above required me to create that extension by hand before the migrator would proceed — **which is itself the proof of the defect, repeated five times today.**

**Production: `NO-GO`.**

---
*Executed via `scripts/run-api-tests-local.mjs` against a disposable PostgreSQL 16.13, on canonical alone and on canonical plus each candidate branch. The correction in §2 is to this auditor's own published merge verdict and is recorded rather than quietly amended. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
