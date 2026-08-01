# W4-CHAIR-ZONE-C — Listings skeptic (independent)

**Role:** Chair’s independent skeptic — do **not** trust prior council HEALTHY claims.  
**Scope:** Zone C listings on tip (read-only).  
**Date:** 2026-07-31  
**Sources re-read:**

| File | Role |
|------|------|
| `artifacts/banco-mobile/app/listing/[id].tsx` | Detail |
| `artifacts/banco-mobile/app/listings/create.tsx` | Create wizard |
| `artifacts/banco-mobile/app/listings/edit/[id].tsx` | Edit |
| `artifacts/banco-mobile/app/listings/mine.tsx` | Mine |
| Cross-check | `SectionSearchApp.emptyPostRequestCreateCategory`, `listingCreateTaxonomy` (REL-01 markets SoT) |

**Cross-check contract (Chair):**

1. `emptyPostRequestCreateCategory` → `car | real_estate | industrial`
2. Create **must ACCEPT** `category=industrial` **and** UI `materials` / `facilities` mapping
3. Must **not** break REL-01 currency / market taxonomy imports

**Verdict (skeptic):** Zone C is **not** end-to-end HEALTHY. REL-07 is half-landed: SectionSearchApp emits `category=industrial`; create **ignores** it. Zone B HEALTHY for empty CTAs is **overclaimed** relative to create.

---

## MOB-C-01

- **Status:** DEFECT
- **Severity:** HIGH (REL-07 / AUD-SEC-01 end-to-end break)
- **Evidence:**
  - Producer: `artifacts/banco-mobile/components/search/SectionSearchApp.tsx:167-173` — facilities/materials → `"industrial"`; CTA `:1226-1228` → `/listings/create?request=1&category=${createCategory}`
  - Consumer: `artifacts/banco-mobile/app/listings/create.tsx:200-207` — `deepCategory` accepts only `real_estate|car|facilities|materials|raw_materials` — **no `industrial`**
- **What prior agents might have missed:** Zone B / REL-07 guards assert the **helper + CTA URL** only (`section-miniapp-guard.test.mjs:1489-1511`). Nobody asserted create **consumes** `category=industrial`. Static “HEALTHY empty CTA” stops at router.push.
- **Fix risk:** Adding `industrial` to `deepCategory` is **low** if remapped to UI `industrial` only. Do **not** invent a fifth API category. Avoid changing `emptyPostRequestCreateCategory` without Chair — that touches Zone B / REL-07 guards. Prefer create-side accept + optional materials/facilities remap (see MOB-C-02/04).

---

## MOB-C-02

- **Status:** DEFECT
- **Severity:** HIGH (type lie → render/API crash path)
- **Evidence:** `create.tsx:200-210` casts `facilities` / `materials` as `UiListingCategory`, but taxonomy UI enum is only `car|real_estate|industrial|raw_materials` (`listingCreateTaxonomy.ts:30-36`). No remap. `visibleSpecFieldsFor` / `requiredSpecKeysFor` index `SPEC_FIELDS_BY_UI[ui]` / `REQUIRED_SPEC_KEYS[ui]` (`:336-384`) — invalid UI key → `undefined` then `.filter` / spread throw when details step mounts. `apiCategoryForUi` only maps `raw_materials` → `industrial` (`:70-72`); raw `facilities`/`materials` would POST illegal API category.
- **What prior agents might have missed:** Accepting UI browse slugs in the allowlist looks “compatible” in a grep; they never ran the path through `SPEC_FIELDS_BY_UI`. No live caller currently sends `facilities`/`materials` (CTA sends `industrial`), so this is a **latent landmine** plus wrong allowlist vs Chair contract.
- **Fix risk:** Remap `facilities→industrial`, `materials→raw_materials` (and accept `industrial`) is **localized** to create deep-link seed. Do **not** expand API enum. Do **not** change browse `Category` types in search. Changing SectionSearchApp to emit `materials`/`facilities` instead of `industrial` would **require** Zone B/REL-07 test updates — higher blast radius.

---

## MOB-C-03

- **Status:** DEFECT
- **Severity:** MEDIUM (section lock / deep-link intent melt)
- **Evidence:** Comment at `create.tsx:192-194` — “Explicit intent outranks a stale draft”. Restore at `:380-381`: `if (d.category) setCategory(d.category)` **else** `deepCategory`. Request mode honors `?request=1` (`:387-389`); **category deep link does not** when draft has any category. Combined with MOB-C-01 (`industrial` never seeds), facilities/materials empty-CTA → request form often opens with **stale draft category** (e.g. car).
- **What prior agents might have missed:** They validated `startAsRequest` override and assumed category was equally forced. Comment ≠ code.
- **Fix risk:** Forcing `deepCategory` when present is **medium** — may surprise users mid-draft. Safer: force category only when `request=1` or when deep category differs from draft, and clear incompatible specs. Touches draft restore only; do not change draft serialization schema casually (other surfaces use `listingDraft`).

---

## MOB-C-04

- **Status:** RISK
- **Severity:** MEDIUM (materials section intent collapse)
- **Evidence:** `emptyPostRequestCreateCategory` maps **both** facilities and materials → `industrial` (`SectionSearchApp.tsx:167-173`). Create’s seller UI treats `raw_materials` as a distinct 4th category that submits as industrial + `industrial_type=raw_material` (`create.tsx:145-146`, `:1109-1110`). Even after MOB-C-01 fix, materials empty-CTA cannot auto-select **raw materials** while producer only sends `industrial`.
- **What prior agents might have missed:** Zone B treated “industrial” as sufficient section lock. Seller taxonomy is **four** UI cats; API is **three**. Materials≠facilities on create.
- **Fix risk:**
  - Create-only: accept `materials`/`facilities` with remap (MOB-C-02) **and** teach SectionSearchApp to emit those UI slugs — **touches REL-07 tests**.
  - Or keep producer as `industrial` and accept UX that materials request starts as industrial (factory subtypes) — product call, not a silent “HEALTHY”.

---

## MOB-C-05

- **Status:** HEALTHY
- **Evidence:** `listingCreateTaxonomy.ts:176-193` imports + re-exports `MARKET_COUNTRIES`, `DEFAULT_MARKET_COUNTRY`, `CURRENCY_BY_MARKET`, `EXTRA_CURRENCIES`, `currencyForMarket` from `@workspace/taxonomy/markets`. Create uses `currencyForMarket` / `DEFAULT_MARKET_COUNTRY` (`create.tsx:78-79`, `:245-248`, `:1158-1160`). Edit uses same (`edit/[id].tsx:36-38`, `:105-108`, `:191`). Guard: `tests/create-listing-market-guard.test.mjs` asserts compact market/currency chrome + taxonomy SoT.
- **What prior agents might have missed:** N/A — this matches REL-01 / D-08. Do **not** “fix” by inlining a parallel currency list.
- **Fix risk:** Any create/edit currency change must keep **import+re-export** pattern (W2-REL lesson: re-export-only broke `rentalTermsForCountry`). Parallel catalogs = REL-01 regression.

---

## MOB-C-06

- **Status:** HEALTHY
- **Evidence:** Create auth gate `create.tsx:1321-1349` — `isLoaded && !isSignedIn` → sign-in required + profile CTA. Me/subscription queries gated on `isSignedIn` (`:173-185`).
- **What prior agents might have missed:** Gate is client-only; server still must enforce (assumed API). Guest can deep-link URL but cannot submit UI.
- **Fix risk:** Weakening gate breaks publish safety. Do not remove without Clerk+API dual check review.

---

## MOB-C-07

- **Status:** HEALTHY (static) / NEEDS_RUNTIME (lead reveal)
- **Evidence:** Phone seed from `/me` `accountPhone` (`create.tsx:176`, `:338-353`). Submit stamps `specs.contact_phones` E.164 (`:1087-1088`). Best-effort profile SoT sync `updateMe({ phone })` when account had none (`:1177-1180`). Detail buyer phone prefers `me.phone` over Clerk (`listing/[id].tsx:191-207`); seller reveal via `contact_token` + `contactLead` (`:409-516`).
- **What prior agents might have missed:** Sync is fire-and-forget `.catch(() => {})` — failures silent. Static wiring looks correct; Call/WhatsApp after first publish needs runtime.
- **Fix risk:** Making `updateMe` blocking on publish couples create to profile API latency/failures — careful. Do not put raw phones on public listing payload (reveal-token contract).

---

## MOB-C-08

- **Status:** HEALTHY (for valid UI categories only)
- **Evidence:** Submit `category: apiCategoryForUi(category)` (`create.tsx:1139`). Industrial type + raw_materials → `industrial_type` (`:1104-1111`). Request path skips seller specs / price / payment_options (`:1003-1005`, `:1093-1097`, `:1152`). Market stamp always; currency only if not request (`:1154-1160`). Origin logistics for car/industrial only (`:1167-1173`) — **not** raw_materials (intentional gap vs materials browse origin).
- **What prior agents might have missed:** Builder is sound **if** `category` is a real `UiListingCategory`. Invalid deep-link cats (MOB-C-02) poison this path. Origin omitted for `raw_materials` may be product-ok (materials origin often in specs) — confirm before “fixing” logistics onto raw_materials (search filters interact).
- **Fix risk:** Changing `apiCategoryForUi` or industrial_type constants affects feed grouping, search industrial filters, and preview (`buildPreviewFeedItem`). High interconnection — regress tests required.

---

## MOB-C-09

- **Status:** **FIXED REL-11** (Chair D-18) — was DEFECT
- **Severity:** was MEDIUM (buyer-request edit broken)
- **Evidence (pre-fix):** Edit `onSave` required `base_price_cash > 0` always (`edit/[id].tsx`) and always PATCHed `base_price_cash`. Create omits price for `is_request`.
- **Repair:** Skip gate + hide price field when `listing.is_request`; omit `base_price_cash` from PATCH (never send `0`). Guard in `section-miniapp-guard.test.mjs`. See `W4-REL-11-CHAIR-EXECUTE.md`.
- **Still open:** MOB-C-10 client AuthGate (not part of REL-11).
- **What prior agents might have missed:** EDIT-MEDIA-DEAD repair + market chrome were checked; request-price parity with create was not.
- **Fix risk:** Skip price requirement / omit `base_price_cash` when `listing.is_request` — **low** if mirrored to API update rules. Sending `0` may trigger price-drop side effects in `ListingService` — verified; omit instead.

---

## MOB-C-10

- **Status:** **FIXED REL-12** (Chair D-20) — was RISK
- **Severity:** was LOW–MEDIUM (UX / opaque failure)
- **Evidence (pre-fix):** `edit/[id].tsx` and `mine.tsx` had **no** client auth gate. Mine called `getMyManagedListings` immediately.
- **Repair:** `useAuth` walls + no managed-list/edit hydrate while unsigned; guards in section-miniapp-guard. API ownership unchanged.
- **What prior agents might have missed:** Inconsistency across listing surfaces; “API will 401” ≠ product auth UX.
- **Fix risk:** Adding Clerk gates is low blast radius. Do not weaken API ownership checks as a substitute.

---

## MOB-C-11

- **Status:** HEALTHY (static) / NEEDS_RUNTIME
- **Evidence:** Detail guest lock (`listing/[id].tsx:245-251`, `:589-668`). Contact/finance/chat use `contact_token` (`:415-532`). Owner controls edit/sold/archive (`:1246+`). Price via server `price_display` (not client currency rewrite) (`:1068`).
- **What prior agents might have missed:** Guest lock means deep links from share require sign-in before any fetch — intentional; runtime needed for token mint + reveal.
- **Fix risk:** Showing public detail without auth would reopen phone/PII policy. Do not “fix” by returning phones on GET listing.

---

## MOB-C-12

- **Status:** HEALTHY (static) / NEEDS_RUNTIME
- **Evidence:** Mine: load managed list, delete, bump (429 cooldown), status archive/sold/reactivate (`mine.tsx:111-220`). Invalidates my/managed/detail queries + `bumpListings` (`:95-108`). Empty/error/create CTAs present.
- **What prior agents might have missed:** Status/delete cache invalidation was a prior gap; code now notifies. Runtime still needed for 429/ownership.
- **Fix risk:** Changing status enum strings without chat/detail parity breaks owner controls on three screens.

---

## MOB-C-13

- **Status:** RISK
- **Severity:** LOW
- **Evidence:** `handleSubmit` revalidates `for (const s of [1, 2, 3, 4])` (`create.tsx:995-1001`). Steps are `0..3`. Step `0` (category) skipped in loop (covered by early `if (!category)`). Step `4` is no-op (`validateStep` returns null). Off-by-one / dead index — smell, not primary outage.
- **What prior agents might have missed:** Comment says “every prior step”; indices disagree.
- **Fix risk:** Changing to `[0,1,2,3]` is trivial; ensure `setStep(s)` never lands on invalid step.

---

## MOB-C-14

- **Status:** HEALTHY
- **Evidence:** Edit market/currency compact controls + `currencyForMarket` / `EXTRA_CURRENCIES` follow-market rule (`edit/[id].tsx:388-427`). Specs PATCH merges only `market_country` + `currency` (`:190-191`) — does not wipe other specs.
- **What prior agents might have missed:** Merge comment is correct only if API merge semantics hold — NEEDS_RUNTIME to confirm server merge, but client intent matches REL-01.
- **Fix risk:** Replacing merge with full specs replace would wipe contact_phones / industrial_type — **do not**.

---

# Skeptic rollup

### Actually safe (static tip evidence)

| Area | Note |
|------|------|
| REL-01 markets/currency SoT on create+edit | Import+re-export from `@workspace/taxonomy/markets`; no parallel catalog in these screens |
| Create auth gate | Signed-in required before wizard |
| Submit builder for **valid** UI cats | `apiCategoryForUi`, request vs sell, industrial_type for raw_materials |
| Phone SoT wiring shape | Seed from `/me`; optional `updateMe`; detail prefers `me.phone` |
| Detail contact_token architecture | Reveal not on public GET |
| Mine mutation → cache bump wiring | Present |
| Edit media editor mounted | No longer dead import |

### Only “looks OK statically” (do not stamp HEALTHY)

| Area | Why |
|------|-----|
| Zone B empty CTA → create category lock | Producer HEALTHY; **consumer rejects `industrial`** (MOB-C-01) |
| facilities/materials deep-link “support” | Accept without remap → invalid UI cat (MOB-C-02) |
| “Explicit intent outranks draft” | True for `request=1` only; category draft wins (MOB-C-03) |
| Materials section request UX | Collapses to industrial API slug; cannot select raw_materials automatically (MOB-C-04) |
| Phone lead reveal after publish | Best-effort updateMe; needs device/runtime |
| Edit of `is_request` listings | Price>0 gate blocks (MOB-C-09) |
| Edit/mine auth UX | No client gate (MOB-C-10) |
| Specs merge on edit | Client assumes server merge |

### Do not trust prior HEALTHY if it claimed

- REL-07 **closed end-to-end** for facilities/materials post-request → create
- Create “accepts industrial + materials/facilities mapping”
- Edit parity with create for buyer requests

### Safe vs dangerous fixes

| Safe-ish | Dangerous |
|----------|-----------|
| Accept `industrial` in `deepCategory`; remap `facilities→industrial`, `materials→raw_materials` | Changing API category enum; parallel currency catalogs |
| Honor deep category over draft when `request=1` | Blocking publish on `updateMe` without UX |
| Edit: skip price require when `is_request` | Full specs replace on edit; relaxing contact_token |
| Add authGate to edit/mine | Weakening server ownership / currency allowlists |

**Chair action bias:** Treat MOB-C-01 (+02/03) as the Wave-4 listings blocker before any Zone C HEALTHY stamp. REL-01 currency path is the part that is actually safe to leave alone.
