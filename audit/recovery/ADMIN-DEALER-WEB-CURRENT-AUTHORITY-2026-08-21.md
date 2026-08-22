# ADMIN / DEALER / WEB — CURRENT AUTHORITY & PARITY AUDIT

Date: 2026-08-21
Repository: `waelzaid66-max/bancoboom-v-next-`
Canonical base inspected: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Audit branch before this report: `audit/cross-repo-continuation-20260821@6d2bfecd9fc87438bfbfa2242d720426c86e6d1f`
Mode: forensic continuation only. No Product code changed in this batch.

## Executive verdict

Admin server authorization is structurally coherent at the static CURRENT layer. Dealer and Web seller surfaces are not production-complete. The highest-confidence CURRENT defects are server-authority bypasses already captured in the Listings ledger plus broken seller create/edit journeys on the shipped web surfaces.

Production verdict remains **NO-GO**.

---

## 1. CI control status — red does not currently mean code failed

Current PR HEAD `6d2bfecd9fc87438bfbfa2242d720426c86e6d1f` triggered CI run `32479555189` (#85).

All seven jobs concluded `failure`:

- Typecheck & build
- API tests (Postgres)
- ESLint (scripts)
- GCP config gate
- Mobile regression (static)
- Production gates (static)
- Mobile bundle (Expo web export)

However every job returned `steps: null`. A direct steps fetch on the Typecheck job returned an empty array, and its logs endpoint returned 404/BlobNotFound. The immediately previous audit commit `a79a01ba45e6891e948e8265740b05bd5d1a45c6` shows the same seven-job, zero-step pattern.

Therefore the current red CI is **NO-EXECUTION evidence**, not evidence that these seven product commands ran and failed. Public GitHub status currently reports Actions operational, so the exact account/repository/runner-side cause remains external to this source audit and must not be guessed.

Do not mark Product code failed from these runs and do not waste retries until the account/repository-side cause is visible.

---

## 2. Admin authority — static CURRENT result

### HEALTHY at source-policy layer

Every `/v1/admin/*` route is first protected by `requireAdminRole`, and sensitive operations are then protected with a named server permission such as:

- `manage_roles`
- `ban_users`
- `verify_users`
- `moderate_listings`
- `manage_reports`
- `manage_support`
- `manage_payments`
- `view_finance`
- `manage_financing`

The server permission matrix in `artifacts/api-server/src/lib/permissions.ts` and the display-only mirror in `artifacts/admin-os/src/lib/permissions.ts` match on CURRENT. The client mirror is not the authority; the API guard is.

### What this audit does NOT certify

- live Clerk tenant configuration;
- production staff rows and role assignments;
- provider secrets;
- device/browser session behavior;
- final exact-SHA runtime.

No privilege-escalation claim is opened merely because the client keeps a mirror; CURRENT server enforcement is the real boundary.

---

## 3. Dealer moderation authority — P1 blocker (cross-ledger)

The Listings/Media audit already established a CURRENT server-authority defect:

- seller `updateListing()` can write seller-controlled status values without a moderation-state transition guard;
- Dealer bulk action explicitly accepts `activate | archive | delete`;
- `bulkUpdateListingStatus(..., "activate")` can reactivate an owner listing without proving the current moderation state is seller-reactivatable.

This means an admin `rejected` / `flagged` / review-controlled state is not yet a durable authority boundary.

This remains **P1** and must be repaired server-side, not hidden only in UI.

---

## 4. Dealer OS real-estate create — P1 functional defect

CURRENT server sale-listing validation requires the minimum attribute floors:

- car: `condition`;
- real_estate: `area`, `offer_type`, `property_type`, and conditionally `rooms`; rent also requires `rental_term`;
- industrial: `capacity`.

Dealer OS `ListingFormSheet` currently includes:

- car: includes `condition` → compatible with the base floor;
- industrial: includes `capacity` → compatible with the base floor;
- real_estate: includes `property_type`, `area`, `rooms`, bathrooms, finishing — but **does not include `offer_type`** and has no rent-term flow.

Therefore a new real-estate sale listing created from Dealer OS can reach the API without the required `offer_type` and fail server validation. A rent listing cannot satisfy the CURRENT server contract either.

This is not a visual parity issue; it is an end-to-end create failure.

### Dealer Edit price handling — NOT reopened

Dealer OS hydrates edit price from `DealerListing.price_raw`, not from the formatted display label, and only PATCHes price if the user actually changes it. That path is materially safer than the Web workspace path below. Do not replace it with display-price parsing.

Dealer Edit also preserves unknown specs by merging the original detail specs with the visible form fields before PATCH.

---

## 5. Banco Web + Banco Website create — P1 broken sale-listing journeys

Both deployable Next applications contain the same seller listing form implementation. The CURRENT file is byte-identical in both trees (same blob SHA observed during audit):

- `artifacts/banco-web/components/workspace/ListingCreateForm.tsx`
- `artifacts/banco-website/components/workspace/ListingCreateForm.tsx`

The shared current workspace taxonomy exposes:

### Car
Visible specs: make, model, year, mileage.

Missing required server floor: **`condition`**.

Result: normal sale-car create can be rejected by server validation.

### Real estate
Visible specs: property_type, area, rooms.

Missing required server floor: **`offer_type`**. Rent-specific `rental_term` is also absent.

Result: normal real-estate sale create can be rejected; rent cannot satisfy CURRENT contract.

### Industrial
Visible specs: industrial_type, equipment_type, condition.

Missing required server floor: **`capacity`**.

Result: normal industrial sale create can be rejected.

### Audit consequence

The existing `website-seller-workspace-parity-audit.mjs` is a presence/wiring check: it confirms the route/form/hooks exist. It does not prove that the generated payload satisfies server business validation. A passing static parity script therefore cannot certify seller create E2E.

Because the same implementation exists in both deployable Next services, the defect is duplicated across both surfaces.

---

## 6. Banco Web + Banco Website Edit — P1 price-corruption path

CURRENT API detail emits two concepts:

- `price_display`: human-readable and intentionally compact, e.g. values in thousands/millions are rendered with `K` or `M`;
- `price_cash`: intended raw numeric value.

The current detail implementation has a separate raw-value defect already captured by the Listings audit: PostgreSQL `numeric()` is represented by the service as a string in normal code paths, but `price_cash` is returned only when `typeof base_price_cash === "number"`, so it can become `null`.

The Web workspace does **not** use `price_cash` anyway. On edit hydration it takes `detail.price_display`, removes non-digit/non-dot characters, and stores the result as the editable price. It then always sends that parsed number back as `base_price_cash` on save.

Examples from the CURRENT formatter semantics:

- `1,500,000` → display about `1.50M EGP` → Web parses `1.50` → PATCH can write `1.5`;
- `2,000` → display about `2K EGP` → Web parses `2` → PATCH can write `2`.

Therefore an owner can change an unrelated field and persist a catastrophically reduced asking price.

This is a **P1 money/data integrity defect**.

It exists in both `banco-web` and `banco-website` because the form implementation is duplicated identically.

### Specs wipe hypothesis — CLOSED / not a defect

The Web form only sends visible spec keys, but CURRENT `updateListing()` merges `updates.specs` over the existing DB specs before normalization. Therefore this audit does **not** classify Web Edit as wiping hidden existing spec keys.

Do not claim a spec-wipe bug from the client payload shape alone.

---

## 7. Web Leads role mismatch — P2/P1 depending intended product contract

The general Web workspace shell and overview expose a Leads navigation item without first establishing that the signed-in account holds a dealer/company/enterprise role.

`LeadsPanel` calls the Dealer leads endpoint, while the entire Dealer API router is protected by `requireDealerRole` and rejects ordinary individual accounts.

At the same time, owner listing management is deliberately role-agnostic: an individual can own and manage listings through `/me` listing-management endpoints.

Therefore an individual seller can be shown a valid-looking Leads destination that resolves to a dealer-only 403/generic-error path.

This is at minimum a UX/authority parity defect. Product must choose one explicit contract:

1. Leads are available to every listing owner → expose an owner-scoped non-dealer leads API; or
2. Leads remain business/dealer-only → role-gate the Web navigation/surface and explain the entitlement.

Do not silently weaken `requireDealerRole` as a UI fix.

---

## 8. Duplicate shipped web surfaces — release risk, not repaired here

The repository contains both:

- `@workspace/banco-web`
- `@workspace/banco-website`

The historical Deployment Source of Truth lists both as deployable Coolify services. Their seller listing form currently shares the same broken blob, proving that a fix must account for both surfaces or establish a newer explicit canonical ownership decision.

No dedupe/refactor is authorized in this forensic batch.

A separate Release/Deploy wave must also reconcile the stale deployment document that still names `waelzaid66-max/bancoboomstor` as the only deploy SoT while the active recovery/canonical work is now in `bancoboom-v-next-`.

---

## 9. Required repair order

1. **P0 control plane:** restore executable GitHub Actions / collect exact-SHA CI evidence.
2. **P1 server authority:** moderation transition guards for seller update + dealer bulk activate; contract statuses must represent admin moderation states safely.
3. **P1 price integrity:** make `price_cash` an honest raw numeric contract and make both Web services hydrate/edit from raw value only; never parse `price_display` for writes.
4. **P1 create parity:** align `banco-web`, `banco-website`, and Dealer OS real-estate fields with CURRENT server validation floors.
5. **Role parity:** resolve individual seller Leads contract without weakening server authorization.
6. Runtime/browser/Postgres journeys after code repair.

No Product patch was made in this batch.
