# LISTINGS / MEDIA — CURRENT LIFECYCLE FORENSIC

Date: 2026-08-21
Repository: `waelzaid66-max/bancoboom-v-next-`
Canonical evidence base: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Audit branch: `audit/cross-repo-continuation-20260821`
Mode: FORENSIC ONLY — NO PRODUCT CODE CHANGE
Production decision: NO-GO

## 1. PURPOSE

This report continues the current cross-repo recovery audit at the Listings / Media boundary. It does not assume that older council, manager, or agent reports remain current. Every material conclusion below was rebound to CURRENT canonical source.

The producer → persistence/API → consumer chains reviewed here are:

- Mobile create listing → upload/verify → API create → immutable storage finalization → listing/media persistence → public serving.
- Mobile edit listing → full desired media payload → API update → media replacement → final-object serving.
- My Listings → managed-list API → archive/reactivate/sold/delete/renew.
- Dealer bulk listing management → bulk activate/archive/delete.
- Admin moderation → rejected/flagged/pending/admin states → seller owner-management/detail consumers.
- Listing price DB type → ListingDetail response → mobile Edit hydration.

No deploy, merge, tag, DB write, provider write, or Product patch is authorized by this report.

---

## 2. CURRENT CAPABILITY THAT MUST BE PRESERVED

Listings/media is not a missing or skeletal capability.

CURRENT source already contains:

- listing create/edit/mine mobile surfaces;
- media picker, image normalization, upload timeouts/retries, progress and abort support;
- video native-file upload handling;
- pre-publish media verification;
- upload claims bound to the presigning Clerk identity;
- deterministic immutable final object identities;
- private finalization before listing transaction persistence;
- post-commit public ACL finalization for listing media;
- stored metadata/type/size validation;
- first-party serving URL authorization;
- public/private media-purpose ACL separation;
- transactional listing/media replacement;
- owner-scoped listing delete/update;
- archive/reactivate/sold/renew controls;
- DB FK cascades from listings into listing_media, payment_options, interactions and other children.

Therefore the correct recovery strategy is bounded lifecycle hardening. Do NOT rebuild uploads, ListingMediaEditor, ListingService, or listing management wholesale.

---

## 3. STALE HISTORICAL FINDINGS RECHECKED

The July 31 Listings skeptic report correctly identified historical deep-link/category problems at that time, but those claims are not all current defects.

CURRENT `listingCreateTaxonomy.ts` now contains `resolveCreateDeepLinkCategory()` and correctly resolves:

- `car` → `car`
- `real_estate` → `real_estate`
- `industrial` / `facilities` → `industrial`
- `materials` / `raw_materials` → `raw_materials`

`sectionEmptyPostRequestCategory()` also preserves the seller-facing raw-material distinction.

Result: do NOT reopen old MOB-C-01/MOB-C-02 as CURRENT defects or use them as justification for another taxonomy rewrite.

---

# 4. CURRENT FINDINGS

## LIST-LIN-01 — SELLER CAN OVERRIDE ADMIN MODERATION AUTHORITY

Status: CONFIRMED DEFECT
Severity: P1 / HIGH
Boundary: API authority / moderation / seller listing lifecycle

### Current admin authority

`AdminService.moderateListing()` can place a listing into administrative states and flags:

- `reject` → `status = rejected`
- `flag` → `status = flagged`, `isFlagged = true`, reason set
- `approve` / `unflag` → `status = active`, flag cleared
- `archive` → `status = archived`

The schema also carries additional moderation states such as `pending_review`, `pending_approval`, and `approved`.

### Current seller write path

`ListingService.updateListing()` resolves ownership but does not read or guard the listing's current moderation state before seller mutation. It accepts seller lifecycle status `active | sold | archived` and later writes:

- normalized `isFlagged`;
- normalized `flagReason`;
- seller-supplied lifecycle `status` when present.

That means a seller can take a row whose current state was set by moderation and attempt to push it back into seller-controlled lifecycle.

This is not just a UI issue. It is an API authority boundary defect.

### Bulk path

`BulkActionSchema` explicitly allows:

- `activate`
- `archive`
- `delete`

Dealer `POST /dealer/listings/bulk` is authenticated as a dealer and delegates to `bulkUpdateListingStatus()`.

For `activate`, `bulkUpdateListingStatus()` writes `status = active` to owner-scoped rows with no moderation-state guard.

Therefore dealer bulk activation is a second server path capable of bypassing moderation state.

### Required repair characteristics

Do not solve this by blocking every non-active listing. `sold ↔ active` and seller archive/reactivate may be legitimate product lifecycle.

The repair must separate seller-controlled states from moderation-controlled states and protect administrative flags independently.

Minimum invariant:

- seller mutations must never transition `rejected`, `flagged`, `pending_review`, `pending_approval` or another moderation-held state into a public/seller-controlled state without an authorized moderation transition;
- seller content edits must not clear an existing administrative flag as a side effect of re-normalization;
- bulk activate must enforce the same authority boundary;
- tests must prove both single-listing and bulk paths.

Admin `archive` requires a policy decision because the DB does not currently encode whether `archived` came from seller lifecycle or an admin enforcement action. Do not invent provenance silently.

Production consequence: BLOCKING.

---

## LIST-LIN-02 — REMOVED/DELETED FINAL LISTING MEDIA REMAINS PUBLICLY ADDRESSABLE

Status: CONFIRMED LIFECYCLE DEFECT
Severity: P1 / HIGH
Boundary: listing DB reference → immutable object → ACL/serving → retirement

### What is correct today

New first-party listing media is copied into a deterministic immutable final identity.

`finalizePublicUpload()` writes a trusted public ACL:

- owner = caller
- visibility = public
- mediaPurpose = public-media

The serving controller deliberately fast-paths trusted public media. Once that ACL exists, anonymous read authorization does not depend on a live listing-media row.

Temporary presigned upload identities are cleaned after immutable finalization. That part is separate and must be preserved.

### Edit removal gap

`updateListing()` reads previous media and transactionally replaces `listing_media` with the client's desired media set.

This keeps the DB consistent, but it does not calculate retired final URLs and does not delete, demote, or otherwise retire a final public object that has been removed from the listing.

Result: after a seller removes a photo during Edit, the DB reference disappears but the immutable object can remain anonymously readable through its prior serving URL because its trusted public ACL remains.

### Explicit listing delete gap

`deleteListing()` owner-checks and deletes the listing row.

The DB FK cascade correctly removes `listing_media` rows and related DB children, but no final-object retirement occurs.

Dealer bulk delete has the same storage-side gap.

This is not an orphan-row problem in PostgreSQL. It is a DB-reference-to-object-storage lifecycle gap.

### Why the repair cannot blindly delete URLs

A final first-party URL is owner-bound and may potentially be referenced elsewhere. Any retirement implementation must prove that the object is no longer referenced before deleting or making it private.

A safe solution must therefore be reference-aware and idempotent. It must cover at least:

- removed media after listing edit;
- explicit single listing delete;
- dealer bulk delete;
- duplicate URL use as image + video poster thumbnail;
- safe retry after partial provider failure;
- S3 and Replit provider parity;
- legacy listing media that may not carry the new trusted ACL metadata.

Do not blindly delete every old URL immediately after a DB transaction.

### Account-deletion note

`UserService.deleteAccount()` explicitly purges chat/story/KYC media but preserves existing listing references while tombstoning/anonymizing the user. Whether listing media should later be retained, privatized, or deleted under account deletion is a separate retention/product-policy decision. Do not silently combine that policy with explicit listing deletion.

Production consequence: BLOCKING for explicit listing/media removal correctness and privacy expectations.

---

## LIST-LIN-03 — OWNER MANAGEMENT CONTRACT CANNOT REPRESENT MODERATION STATES

Status: CONFIRMED DEFECT
Severity: P1 / HIGH RELIABILITY
Boundary: moderation persistence → owner read API → response validation → mobile/dealer consumer

### Database/admin reality

Listings can contain states beyond the seller lifecycle enum, including:

- `draft`
- `pending_approval`
- `pending_review`
- `approved`
- `rejected`
- `flagged`

Admin moderation writes at least rejected/flagged and reads moderation queues from these states.

### Owner detail mismatch

`getListingDetail()` intentionally allows the owner to read their own non-active listing.

It then returns the raw DB listing status.

But `ListingDetailSchema.status` accepts only:

- `active`
- `sold`
- `archived`

`getListingHandler()` validates the service result against that schema before returning it. A valid owner listing in an administrative state therefore crosses a response-contract mismatch and can become HTTP 500 instead of a usable owner view.

### Owner/dealer managed-list mismatch

`getDealerListings()` returns raw listing status and, when no status filter is supplied, can return any state belonging to that owner.

Both dealer listing controller and role-agnostic `/me` managed listing controller validate those rows with `DealerListingItemSchema`.

That schema likewise accepts only `active | sold | archived | null`.

Therefore a seller whose listing was moderated can lose the management surface itself because the response validator cannot represent the persisted state.

### Required repair characteristics

Do NOT make public browse accept administrative statuses. Public feed/search/detail visibility gates should remain strict.

The owner-management contract must explicitly represent the states an owner is allowed to observe, with honest UX semantics. Generated API/OpenAPI clients must stay synchronized.

Then add regression tests for at least rejected, flagged, and pending_review through:

- owner detail;
- role-agnostic managed list;
- dealer managed list where applicable.

Production consequence: BLOCKING for moderation + seller management journey.

---

## LIST-LIN-04 — `numeric` PRICE IS DROPPED FROM LISTING DETAIL / EDIT HYDRATION

Status: CONFIRMED SOURCE DEFECT
Severity: P1 / MEDIUM-HIGH USER JOURNEY
Boundary: PostgreSQL numeric → service serialization → ListingDetail → mobile Edit

`listings.base_price_cash` is declared with Drizzle `numeric()` and the surrounding code treats it as a decimal string:

- create stores `String(...)`;
- update stores `String(...)`;
- dealer response exposes `price_raw` as string;
- formatting helpers accept string values.

However `getListingDetail()` currently serializes the raw editable price as:

`typeof listing.base_price_cash === "number" ? listing.base_price_cash : null`

That is inconsistent with the schema mapping used everywhere around it.

The mobile Edit screen hydrates its price field only when `listing.price_cash` is a JavaScript number. For a normal sale listing this can therefore become null/empty even though `price_display` is correct.

The same Edit screen requires a positive sale price before Save, so an unrelated title/photo/location edit can force the seller to re-enter an already-existing price.

### Required repair characteristics

Normalize the DB decimal explicitly at the API boundary and validate finiteness/range. Do not change the DB money column to floating-point merely to satisfy the mobile shape.

The API contract may continue exposing a numeric `price_cash` if conversion is explicit and safe; monetary persistence must remain decimal/string-safe.

Add tests proving a persisted decimal price becomes a valid ListingDetail `price_cash` and hydrates Edit.

Production consequence: seller Edit journey is not certified.

---

## LIST-LIN-05 — BULK ACTION RESULT CAN OVERSTATE ACTUAL MUTATIONS

Status: CONFIRMED LOW-SEVERITY ACCURACY GAP
Severity: P2 / LOW

`bulkUpdateListingStatus()` returns `updated: listingIds.length` rather than the count of rows actually modified/deleted.

Ownership filtering prevents cross-owner mutation, so this is not the primary authorization defect. But a request containing stale/non-owned IDs can report more successful changes than actually occurred.

Do not prioritize this ahead of LIST-LIN-01..04, but the eventual bounded bulk repair should return actual affected-row truth.

---

# 5. DB CASCADE VERDICT

The source schema confirms `listing_media.listing_id` uses `ON DELETE CASCADE`, as do core children such as payment options and interactions.

Therefore explicit listing deletion does not leave those DB child rows behind.

This closes the narrow question of PostgreSQL orphan rows. It does NOT close final object-storage retirement.

---

# 6. RUNTIME / EXECUTABLE EVIDENCE STILL REQUIRED

Source findings above are sufficient to keep release NO-GO, but final repairs must still be proven in executable environments.

Required runtime evidence includes:

1. Real PostgreSQL listing journey against the final candidate SHA.
2. Create sale listing with multiple media → read publicly.
3. Edit remove one final image → remaining listing correct; retired URL policy verified.
4. Edit add/replace media → immutable identity and ACL verified.
5. Explicit listing delete → DB cascade + object retirement verified.
6. Dealer bulk delete and bulk activate negative moderation tests.
7. Admin reject/flag → seller single update cannot republish or clear admin flag.
8. Admin reject/flag/pending state → owner detail and managed lists return valid explicit state, not 500.
9. Existing decimal sale price → ListingDetail `price_cash` → mobile Edit hydration.
10. S3 provider path on the actual Coolify/staging topology.
11. Physical Android/iOS Edit/Mine media journey.
12. Exact-SHA CI execution with real job steps, not pre-runner `steps=null` failures.

---

# 7. EXECUTION ORDER AFTER FORENSIC CLOSE

These findings do not change the global fact that Gate-1 PostgreSQL baseline adoption remains the highest P0 release-control blocker.

Recommended bounded implementation order after release authority/manager coordination:

1. Gate-1 DB baseline adoption authority — P0.
2. LIST-LIN-01 moderation authority boundary — P1.
3. LIST-LIN-03 owner moderation-state response contracts — P1 and coupled to #2.
4. LIST-LIN-02 reference-aware final-media retirement — P1.
5. LIST-LIN-04 decimal price serialization/edit hydration — focused fix.
6. LIST-LIN-05 actual bulk mutation count — low-risk accuracy repair.

LIST-LIN-01 and LIST-LIN-03 should be designed together because a protected moderation state is useless if the owner-management API cannot represent it.

LIST-LIN-02 must remain separate from moderation logic and separate from account-deletion retention policy.

---

# 8. FINAL FORENSIC VERDICT

Listings capability: PRESENT / SUBSTANTIAL
Create/Edit/Mine wiring: PRESENT
DB child deletion integrity: PRESENT via FK cascades
Upload ownership/finalization foundation: PRESENT
Public-media retirement after reference removal: BROKEN
Seller vs admin moderation authority: BROKEN
Owner representation of moderation states: BROKEN
Editable numeric price serialization: BROKEN
Provider/device/exact-SHA proof: OPEN

Production: NO-GO

No Product code changed in this report.
