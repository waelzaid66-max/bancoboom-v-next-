# GATE 3 — LISTING MODERATION AUTHORITY

Date: 2026-08-21
Base: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Branch: `fix/gate3-listing-moderation-authority-20260821`
Mode: bounded Product hardening; no deletion/rewrite of existing listing/media capabilities.

## Current authority split

Seller lifecycle states:
- `active`
- `sold`
- `archived`

Moderation-held/admin states observed in current persistence/contracts:
- `pending_approval`
- `pending_review`
- `rejected`
- `flagged`

Additional persisted states that owner contracts must represent honestly:
- `draft`
- `approved`

## Current defect

`ListingService.updateListing()` owner-checks correctly but does not include current `status`, `isFlagged`, or `flagReason` in the owner row used to authorize mutations. It then writes normalization-derived `isFlagged`/`flagReason` and optionally seller-supplied `status`, allowing seller edits to overwrite moderation authority.

`bulkUpdateListingStatus(..., "activate")` directly writes `status="active"` to owner rows with no moderation-state predicate.

`ListingDetailSchema.status` and `DealerListingItemSchema.status` only represent `active|sold|archived`, while owner reads can legitimately return moderation-held states. This can convert a valid owner read into a response-contract failure.

## Transition matrix

| Current state | Seller content edit | Seller -> active | Seller -> sold | Seller -> archived | Admin moderation |
|---|---|---:|---:|---:|---|
| active | allow | allow/idempotent | allow | allow | allow |
| sold | allow | allow | allow/idempotent | allow | allow |
| archived | allow | allow | allow | allow/idempotent | allow |
| pending_approval | allow only without releasing hold/flag | deny | deny | deny until provenance policy is explicit | admin only |
| pending_review | allow only without releasing hold/flag | deny | deny | deny until provenance policy is explicit | admin only |
| rejected | allow only without releasing hold/flag | deny | deny | deny until provenance policy is explicit | admin only |
| flagged | allow only without releasing hold/flag | deny | deny | deny until provenance policy is explicit | admin only |
| draft | preserve current product behavior; no new publish rule invented in this gate | deny unless current producer contract proves otherwise | deny | deny | admin/system policy |
| approved | preserve persisted/readability semantics; do not silently equate to public `active` | deny unless current admin flow explicitly transitions it | deny | deny | admin/system policy |

### Hard invariant

A seller edit may update owned content while a row is moderation-held, but it must never:
- clear an existing administrative `isFlagged=true`;
- replace an administrative `flagReason` as a normalization side effect;
- transition a moderation-held state into `active|sold|archived`;
- use dealer bulk activate to bypass the same boundary.

Public browse remains strict `status=active` plus visibility gates. Expanding owner-facing schemas must not broaden public visibility.

## RED implementation evidence

Commit `c119222f7aaeae39482ee107fc5682f0f6494879` adds `ListingModerationAuthority.gate3.test.ts` covering:
- rejected -> active single-update rejection;
- admin flag preservation during content edit;
- bulk activate rejection for `rejected` + `pending_review`;
- preservation of legitimate `archived -> active` seller lifecycle;
- ListingDetail and DealerListingItem owner-visible moderation-state contract coverage;
- owner rejected detail + managed-list parseability.

PR: #14 (Draft).

## Bounded repair target

The first GREEN implementation should touch only the minimum authority/contract surfaces needed for LIST-LIN-01 + LIST-LIN-03 and generated contract artifacts required by the repository's API generation discipline.

Do not combine in this batch:
- final media retirement;
- listing deletion/conversation retention;
- price serialization;
- account deletion;
- migrations/schema changes;
- Maps/Search/Header work;
- UI redesign.

## Verification order

1. Gate-3 focused tests.
2. Existing listing lifecycle tests.
3. Admin moderation tests.
4. API response-contract tests / generation drift.
5. API typecheck/build.
6. Root `npm run build`.
7. PostgreSQL runtime journey on exact candidate SHA.

Current release verdict: `NO-GO` until this gate and independent Gate-1/Gate-2/runtime controls close.

Run npm run build
