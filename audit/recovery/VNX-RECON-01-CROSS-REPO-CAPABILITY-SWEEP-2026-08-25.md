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
- The four repositories in the prior inventory were **not** re-swept with the
  symbol method. Their `CODE_COUNT=0` rests on the older path+SHA method, which
  this batch has just shown to be blind to the divergent class.
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
