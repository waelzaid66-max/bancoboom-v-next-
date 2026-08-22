# BANCO BOOM NEXT — Search / Discover / Saved Search Current-Lineage Audit

**Date:** 2026-08-21  
**Repository:** `waelzaid66-max/bancoboom-v-next-`  
**Canonical source audited:** `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`  
**Forensic continuation branch:** `audit/cross-repo-continuation-20260821`  
**Mode:** evidence-only / Product preservation lock / no Product patch

---

## 0. Authority and purpose

This is the next bounded forensic wave after Accounts/FI/Profile reconciliation. It does not authorize restoration of historical Discover rails, does not authorize merging stale PRs, and does not change Product/API/Mobile source.

The purpose is to answer one narrow question from CURRENT code:

> Is Saved Search merely present, or is the complete mobile → server → alert → reopen lifecycle internally consistent across rich section criteria and multiple devices?

Historical reports are evidence only. The CURRENT canonical source controls the findings below.

---

## 1. Preserved architecture — do not rewrite

The core Saved Search capability is real and substantially implemented.

### Mobile producer

Both shared Search and the isolated section mini-apps build a Saved Search snapshot and call `SessionContext.saveSearch()`.

Relevant current files:

- `artifacts/banco-mobile/app/(tabs)/search.tsx`
- `artifacts/banco-mobile/components/search/SectionSearchApp.tsx`
- `artifacts/banco-mobile/context/SessionContext.tsx`

`SectionSearchApp` preserves a full `SearchCriteria` snapshot, including section-specific axes rather than flattening every world into shared Discover state. This is correct anti-melt behavior and must be preserved.

### Mobile persistence

`SessionContext` persists searches under the signed-in/guest-scoped AsyncStorage key and keeps an optional `remoteId` after server creation.

### Server persistence

The current `/me` API has user-scoped saved-search CRUD:

- `POST /api/v1/me/saved-searches`
- `GET /api/v1/me/saved-searches`
- `PUT /api/v1/me/saved-searches/:id`
- `DELETE /api/v1/me/saved-searches/:id`

The controller and `ProfileService` scope mutations to the current user.

### Server matching + delivery

`AlertService` reads enabled saved searches when a listing is published, passes the stored criteria to `matchesSavedSearch()`, claims a match before enqueueing notification/email work, and rolls the claim back if enqueue fails.

`savedSearchMatch.ts` understands rich criteria including category, text, price, location, payment, engine/listing mode, market, car brand/model/fuel/transmission/year, industrial fields, origin, property type and rental term.

### Reopen consumer

`app/(tabs)/saved.tsx` prefers the rich criteria snapshot when present and converts it back to navigation parameters. Legacy six-field saves retain a fallback reopen path.

**Preservation verdict:** the architecture is not missing and must not be replaced with historical Discover JSX or a new parallel search store.

---

## 2. SS-LIN-01 — rich criteria identity collision

**Classification:** `CONFIRMED CURRENT SOURCE DEFECT`

Current `SessionContext.searchSignature()` identifies a saved search using only:

- `q`
- `category`
- `minPrice`
- `maxPrice`
- `location`
- `paymentType`

It ignores the rich `criteria` object even when the caller supplies it.

`isSearchSaved()` and `saveSearch()` both rely on this legacy signature.

This creates real collisions in the isolated mini-apps. For example, these are different user searches but share the same current identity when the six legacy fields are equal:

- Cars: Toyota vs BMW
- Cars: imported vs local
- Real estate: apartment vs villa
- Real estate: sale vs rent
- Materials: steel vs resin
- Different market countries
- Near-me enabled vs disabled
- Different industrial types, origin, sort, year/fuel/transmission or other rich axes

The second search can be shown as already saved or blocked from being independently saved even though the server matcher and reopen path distinguish the criteria.

**Required future correction:** version the client-side identity around a deterministic canonical representation of supported rich criteria while preserving legacy IDs already stored on devices. Do not break old saved-search removal/reopen during migration.

---

## 3. SS-LIN-02 — server/client reconciliation is missing

**Classification:** `CONFIRMED PARTIAL IMPLEMENTATION / CROSS-DEVICE SOURCE GAP`

The backend exposes `GET /me/saved-searches` and the generated API client already contains `listMySavedSearches()` / `useListMySavedSearches()`.

However CURRENT `SessionContext` hydrates saved searches from AsyncStorage only. Unlike saved listings, it does not perform a signed-in server pull/merge for Saved Search rows.

Consequences:

1. a search saved on device A can remain active on the server and continue driving alerts;
2. device B or a reinstalled app can authenticate as the same user and not display that server-side search;
3. the user may therefore receive a Saved Search alert for a search they cannot see or remove from the current device;
4. the source comment that Saved Search follows the same user across devices is stronger than the implemented mobile reconciliation path.

This is not a reason to replace local persistence. The correct future design is a deterministic server/local merge with clear ownership of IDs and conflict rules.

---

## 4. SS-LIN-03 — remote deletion depends on state-updater side effects

**Classification:** `SOURCE RELIABILITY RISK — BOUNDED PATCH CANDIDATE`

`removeSearch()` declares a local `removed` variable, assigns it inside the functional `setSavedSearches(prev => ...)` updater, and then immediately uses `removed?.remoteId` outside that updater to decide whether to call the server DELETE.

That couples a network side effect to assumptions about when React executes the state updater. It is unnecessary and fragile.

**Required future correction:** resolve/capture the target Saved Search from current state before scheduling the state mutation, then update local state/storage and issue the remote deletion from that deterministic captured value. Preserve best-effort offline behavior and add retry/reconciliation semantics rather than blocking local UI forever on a network failure.

This audit does not claim every current deletion fails; it classifies the sequencing itself as unsafe.

---

## 5. SS-LIN-04 — near-me Saved Search alert contract is misleading

**Classification:** `CAPABILITY / UX HONESTY GAP — FAIL-CLOSED MATCHING IS PRESERVED`

The server matcher intentionally returns no match when the saved criteria contain near-me coordinates/radius because the listing snapshot delivered to the matcher does not provide a trustworthy coordinate comparison context for that branch.

That fail-closed behavior is safer than generating false-positive alerts and must not be weakened casually.

But mobile creation currently asks the server to create the Saved Search with `alerts_enabled: true` for the same general path.

Therefore a user can save a near-me search that is represented as alert-enabled while its server matcher deliberately cannot match it.

Future correction requires one explicit contract choice:

- either support geospatial Saved Search matching end-to-end with tested coordinates/radius semantics;
- or surface near-me Saved Search as saved/reopenable but not alert-capable, with honest UI/API state.

Do not silently remove the matcher guard.

---

## 6. What is NOT missing

The following must not be reimplemented merely because older recovery material called Saved Search incomplete:

- full Saved Search create route;
- user-scoped server storage;
- rich matcher;
- notification/email trigger path;
- rich snapshot reopen;
- legacy saved-search compatibility;
- per-section Saved Search controls;
- Discover anti-melt separation.

The capability is `PARTIALLY INCONSISTENT`, not absent.

---

## 7. Discover / Recent Search boundary

This audit does **not** authorize restoring historical Discover strips.

CURRENT Discover remains a portal surface into isolated section/business mini-apps. The owner-law anti-melt boundary stays in force.

The open draft Recent Search PR is separate historical/divergent work and is not a merge candidate merely because recent-query persistence exists. Any future Recent Search UI must first be reconciled with CURRENT Discover composition and owner chronology.

Saved Search defects identified here are lifecycle defects; they are not evidence that Saved/Saved Search strips belong back on Discover.

---

## 8. Test debt exposed by this audit

A future bounded Saved Search patch must add direct tests for at least:

1. legacy six-field Saved Search still reopens and removes;
2. rich searches with equal legacy fields but different rich criteria remain independently saveable;
3. deterministic signature stability independent of object key order;
4. signed-in server hydration on a clean device;
5. merge/dedupe when the same row exists locally and remotely;
6. server-only row becomes visible/removable locally;
7. local-only offline row syncs when authentication/network becomes available;
8. remote deletion uses the correct `remoteId` independent of React update scheduling;
9. rich criteria survive save → server → hydrate → reopen;
10. near-me alert state is honest and fail-closed until geospatial matching is supported.

Existing `savedSearchMatch.test.ts` protects matcher behavior but does not close the mobile identity/cross-device lifecycle findings above.

---

## 9. Priority relative to current production blockers

The defects are real, but they do not outrank the current Gate-1 database adoption blocker.

Current order remains:

1. `P0` migration/baseline adoption authority;
2. exact deployment repository/branch/SHA authority through the Release/Deploy assembly lane;
3. bounded P1 current-source defects including account teardown, visible role authority, Maps bootstrap failure and Saved Search lifecycle consistency;
4. external runtime/provider/device certification.

No Saved Search Product patch is authorized by this report alone.

---

## 10. Current verdict

**Saved Search is not missing. It is a real, server-backed capability with four current consistency boundaries.**

| ID | Finding | Verdict |
|---|---|---|
| SS-LIN-01 | rich criteria ignored by client identity/dedupe | `CONFIRMED SOURCE DEFECT` |
| SS-LIN-02 | server rows are not hydrated/reconciled into mobile Saved Search state | `CONFIRMED PARTIAL IMPLEMENTATION` |
| SS-LIN-03 | remote deletion depends on state-updater side effect timing | `RELIABILITY RISK` |
| SS-LIN-04 | near-me row may be alert-enabled although matcher intentionally fail-closes | `CAPABILITY / UX HONESTY GAP` |

**Production verdict remains `NO-GO`.**

No Product/API/Mobile code changed in this forensic batch.

Next forensic lane: **Listings / Media lifecycle** — create/edit/publish/moderation/visibility → upload claim/finalization → API/DB → consumer cards/detail → delete/archive/cleanup, without changing Product until missing vs runtime-only vs preserved behavior is proven.
