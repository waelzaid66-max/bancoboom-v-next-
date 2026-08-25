# VNX-RECON-01 — Cross-Repo Capability Sweep

## Decision

`BANCO-RECON-02 / DELIVERABLE 7` inventoried four legacy repositories and
concluded `CODE_COUNT=0` for three of them, the fourth reporting only
`artifacts/api-server/dist/*.mjs` compiled output. Its own closing line:

> FINDING_ONLY_NO_REPAIR=The only missing CODE paths are legacy compiled
> dist/*.mjs artifacts from aws-virgen; this inventory does not authorize
> copying or restoring them.

That conclusion is upheld for the repositories it covered. This batch does two
things it did not: it closes a **method gap** and a **scope gap**.

| Field | Evidence |
| --- | --- |
| Base | `c9f9ab0` on `main` |
| Product commit | None — measurement only, no product delta |
| Prior authority | `BANCO-RECON-02 / DELIVERABLE 7`, `recon/inventory-20260824` |
| Scope added | `banco.store` (203 commits), `bancotoday` (7 commits) — neither inventoried before |
| Method added | Exported-symbol comparison across divergent shared paths |
| Classification | One `RECOVER` candidate; everything else `ALREADY_PRESERVED` or `INTENTIONALLY_REJECT` |

## Reproduced defect

**The method gap.** The prior inventory compares path presence plus identical
content SHA. That pair cannot express a shared path whose content *differs* —
and across a **re-imported** lineage it can never match anything, because there
is no shared commit at all:

```
merge-base(bancotoday HEAD, origin/main) = none — separate histories entirely
```

So every shared path reads "divergent" and the word carries no information.
Measured: `bancotoday` has 267 divergent paths, 187 of them `.ts`/`.tsx`. Under
the old method they are invisible; under a naive reading they look like 187
losses. Both readings are wrong.

Exported symbols survive a re-import where SHAs do not. The question that can
actually be answered is: **does this repository export this symbol anywhere?**

**The scope gap.** `banco.store` and `bancotoday` were never inventoried.

## Candidate change

No product change. Two instruments added to `audit/tools/`:

1. `cross-repo-orphan.sh` — classifies every legacy source path as `MISSING`,
   `DIVERGENT`, or `IDENTICAL` against all destination refs.
2. `legacy-symbol-diff.sh` — for divergent paths, lists exported symbols present
   in the legacy copy and absent from the destination's entire export surface,
   declarations and re-exports alike.

## Verification ledger

| Repository | Paths examined | MISSING | DIVERGENT | IDENTICAL |
| --- | --- | --- | --- | --- |
| `bancotoday` | 2,091 | 67 | 267 | 1,757 |
| `banco.store` | 1,140 | 112 | 224 | 804 |

| Symbol sweep | Result |
| --- | --- |
| Destination export surface | 42,029 distinct symbols |
| `bancotoday` divergent-path symbols absent here | **1** |
| `banco.store` divergent-path symbols absent here | **0** |
| `banco.store` missing-path symbols absent here | **9**, in 3 files |

### Every candidate, adjudicated

| Symbol / file | Verdict |
| --- | --- |
| `MAX_IMAGE_BYTES`, `MAX_VIDEO_BYTES`, `assertImagesWithinSizeLimit`, `assertVideosWithinSizeLimit` | `ALREADY_PRESERVED` — extracted to `services/mediaSizeGuard.ts` with its own `ListingService.videoSizeGuard.test.ts` |
| `CURRENCY_BY_MARKET`, `MARKET_COUNTRIES`, `currencyForMarket`, `DEFAULT_MARKET_COUNTRY`, `EXTRA_CURRENCIES` | `ALREADY_PRESERVED` — moved to `lib/taxonomy/src/markets.ts` |
| `CreateImportOrder201` | `SUPERSEDE` — the endpoint's success status changed `201 Created` → `200 OK`; the destination also gained `CreateImportOrderBodyDetails`. A deliberate contract change |
| `ListingMap`, `listingMap.shared.ts` (6 symbols) | `INTENTIONALLY_REJECT` — measured unused in `banco.store`'s own listing screen (0 references). The destination deep-links instead, with the reason in source: *"No in-app map, no Maps API key"* |
| `icons.ts` | `ALREADY_PRESERVED` — successor `components/icons.tsx` |
| **`authRedirect.ts` — 3 symbols** | **`RECOVER` candidate — see below** |

## The one genuine gap

`artifacts/banco-mobile/lib/authRedirect.ts` exists in `banco.store` and has no
successor here. It carried two capabilities:

```
isAllowedSignedOutPath(pathname)   one central whitelist: /profile and /legal/*
savePendingAuthRedirect(href)      remember the intended target, AsyncStorage
consumePendingAuthRedirect()       + an in-memory mirror for the same-process flow
```

Its own comment states the reason for the disk write: *"OAuth / in-app-browser
round trips can recreate JS state."*

**The walling is preserved, differently.** 21 screens each check `isSignedIn` and
render a sign-in panel pointing at `/(tabs)/profile`. That is more explicit per
screen, and it is 21 copies of one rule with no central list — a new screen that
forgets the check is walled by nothing.

**The return destination is absent.** Measured on `app/(tabs)/profile.tsx`: the
only param read is `authMode`; after successful auth the router pushes to the
onboarding href. Nothing carries or restores an intended target. A user who
deep-links to a listing, is sent to sign in, and succeeds, lands on the profile
tab rather than the listing.

This is a UX regression, not a security one, and whether it was dropped
deliberately is `UNPROVEN`. It is recorded for the product owner to adjudicate;
no repair is authorised by this batch.

## Explicitly unproven

- **This sweep proves absence of exported symbols, not absence of behaviour.**
  A capability implemented entirely inside a non-exported function, or as JSX in
  a screen, is invisible to it. The `authRedirect` finding surfaced because that
  module exported its API; a private equivalent elsewhere would not have.
- ~~The four repositories in the prior inventory were not re-swept with the~~
  ~~symbol method.~~ **Closed by the addendum below: all four were re-swept.**

- No CI evidence. Per `VNX-CI-02`, Actions has not executed a step since
  2026-08-14; every result here is a local execution.

## Review notes — two failures of this batch's own instruments

- **Sampling.** The first destination scan read `head -400` of 824 refs — 48%.
  It reported 316 divergent paths where the full scan reports 267: **49 false
  divergences from my own truncation**, caught before publication by asking what
  the sample covered.
- **Correction #55, re-export blindness.** The first symbol pass matched only
  `export function|const|class|type|interface|enum NAME` and could not see
  `export { NAME } from "./elsewhere"`. It reported the four upload-size-limit
  symbols as lost when they had been extracted and re-exported. **Five of its
  six findings dissolved on verification — an 83% false-positive rate.** The tool
  now resolves the destination's entire export surface, declarations and
  re-exports together, and re-running it drops all five and keeps the one real
  result.

> Both are recorded because the number a tool prints is worth nothing until
> someone has tried to break it. Every finding in the table above was verified
> individually against the destination tree before it was written down.

## Carry-forward findings

- `bancotoday` and `banco.store` share **no commit** with this repository. They
  are re-imports, not forks. Any future cross-repo claim that reasons from
  ancestry is unsound for them.
- 169 of the 179 missing paths across both repositories are documentation
  (`.md`, `.txt`). The legacy repositories hold audit and handoff records that do
  not exist here — a records gap, not a code gap.
- Replit still holds five commits on `release/reconciled-rc-20260823` that exist
  in no GitHub ref. That is unrelated to this sweep and remains the most urgent
  loss risk on the board, because that workspace is ephemeral.

## Release boundary

This batch adds instruments and changes no product source.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.

---

# Addendum — the four prior repositories re-swept, and the gap closed

## Decision

The owner directed both follow-ups. The four repositories `BANCO-RECON-02`
covered were re-swept with the symbol method, and the one genuine gap was
restored under a mutation-proven contract.

| Field | Evidence |
| --- | --- |
| Base | `7fe8656` on `main` |
| Product commit | The commit containing this addendum |
| Repositories re-swept | `bancoboom`, `bancoboomstor`, `banco-with-wael`, `aws-virgen` |
| Source paths examined | 8,849 across the four |
| Classification | 5 × `SUPERSEDE`/`ALREADY_PRESERVED` · 1 × `RECOVER`, executed |

## Verification ledger — the re-sweep

| Repository | Paths | MISSING | DIVERGENT | Symbols absent here |
| --- | --- | --- | --- | --- |
| `bancoboom` | 2,033 | 8 | 250 | **0** |
| `bancoboomstor` | 2,628 | 19 | 1 | **0** |
| `banco-with-wael` | 2,568 | 77 | 2 | **0** |
| `aws-virgen` | 1,620 | 146 | 340 | **6** |

`BANCO-RECON-02`'s `CODE_COUNT=0` conclusion is **upheld for three of the four**
under the stricter method. `aws-virgen` produced six candidates, each adjudicated
individually:

| Symbol | Verdict |
| --- | --- |
| `notifyPaymentSuccess`, `schedulePaymentSuccess`, `schedulePaymentFailed` | `SUPERSEDE` — the legacy form was `void notifyPaymentSuccess(...).catch(...)`, fire-and-forget off the transaction, lost on crash. This repository enqueues inside the transaction via `enqueueBillingReceipt(tx, …)` and drains through `processBillingReceiptOutbox`. Strictly more durable |
| `getSocialLinksForUserId` | `ALREADY_PRESERVED` — `socialLinks` lives in the schema, validators and `ListingService`; the named ProfileService helper was inlined |
| `marketCountryConditions` | `ALREADY_PRESERVED` — market filtering is inline in `SearchService` (lines 706–759) |
| **`notificationRequiresAuth`** | **`RECOVER` — restored below** |

## The gap, measured before repair

Two symbols from two different legacy repositories answer one question — what
may a signed-out user reach — and both were absent:

```
banco.store   isAllowedSignedOutPath · savePendingAuthRedirect · consumePendingAuthRedirect
aws-virgen    notificationRequiresAuth
```

Measured consequences on `main` before this batch:

- `lib/notificationRouting.ts` exported `routeForNotification` and
  `routeForNotificationItem` and **carried no auth gate at all**.
- Three push destinations had no `isSignedIn` check of their own:
  `app/messages/[id].tsx`, `app/import/order/[id].tsx`, `app/bookings.tsx`.
- `setAuthFailureHandler` returns early for any code other than
  `ACCOUNT_DELETED`, so a plain 401 routes nobody anywhere.
- `app/(tabs)/profile.tsx` reads only `authMode` and pushes to the onboarding
  href after success — no intended target is carried or restored.

**Severity is a journey defect, not a security one, and that was verified rather
than assumed:** the server guards every one of those routes —
`conversations.ts` 8 × `requireAuth`, `import-orders.ts` 9 ×, `bookings.ts` 3 ×.
No data was reachable. What was lost is that a signed-out user tapping a push,
or deep-linking to a listing, is sent to sign in and then abandoned on the
profile tab.

## RED → GREEN evidence

`lib/authRedirect.ts` restored, with `notificationRequiresAuth` placed beside the
whitelist rather than in the routing module — separating them is how they drifted
apart. Contract executed against a real storage stub, not asserted about:

| Contract | Result |
| --- | --- |
| Only `/profile` and `/legal/*` reachable signed-out; `/legalese` and `/profiles` are not | PASS |
| `/listing/*` is the only guest-openable push destination; `/listings/mine` is not | PASS |
| An empty destination fails closed | PASS |
| The target survives a round trip and is consumed exactly once, disk cleared | PASS |
| A cold start reads the target from disk with no in-memory mirror — the OAuth case | PASS |
| Unavailable storage degrades to memory and never throws | PASS |

Mutation-proven load-bearing, each executed and reverted:

| Mutation | Result |
| --- | --- |
| Widen the legal gate to a bare `startsWith("/legal")` | **FAIL** — `/legalese` caught |
| Let an unknown push destination through without auth | **FAIL** |
| Stop clearing the consumed target | **FAIL** — a second read would replay it |

## Explicitly unproven

- **The module is restored and contract-tested; it is not yet wired.** No screen
  calls `savePendingAuthRedirect` and `profile.tsx` does not consume it. Wiring
  changes a user-visible journey across 21 screens and belongs with the product
  owner, not with a recovery batch.
- The three unguarded destination screens are **recorded, not fixed**. Adding a
  gate to them is the same product decision.
- No CI evidence. Per `VNX-CI-02`, Actions has not executed a step since
  2026-08-14.

## Verification ledger — battery

| Gate | Result |
| --- | --- |
| `test:auth-redirect` | 5/5 PASS, wired into the mobile chain |
| Mobile guard packs | **43/43** PASS (42 before this batch), each executed independently |
| Chain integrity | 247/247 PASS |
| Root TypeScript | PASS, exit 0 |
