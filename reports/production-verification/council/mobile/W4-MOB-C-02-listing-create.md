> **SUPERSEDED vs tip `7d49cbd`.** See `W4-AUD-PRESENTATION-TO-CHAIR-ANTIPOLLUTION.md` + `W4-MOB-REL10-PEER.md`. Do not treat this file as SoT.

# MOB-C-02 — Listing create

- Tip SHA: `3a234ef267efa142bdcd730002814e2089f76d05`
- Route: `/listings/create` · `artifacts/banco-mobile/app/listings/create.tsx`
- Primary CTAs (testID → destination):
  - `create-go-profile` → `/(tabs)/profile` (guest) · `:1321-1340`
  - `create-back` / `create-prev` / `create-next` → wizard · `:950+`, `:2811+`
  - `create-submit` → `createListing(body)` · `:1129-1177`, `:2824+`
  - `create-view-listing` → `/listing/${createdId}` · `:1455-1463`
  - `create-boost` → `/plans` · `:1421-1434`
  - `create-done` → `/(tabs)` · `:1476-1480`
  - `create-post-another` → `resetForm()` · `:1471`
- Auth gate: guest wall after Clerk loaded · `:1321`. Server `POST /v1/listings` `requireAuth`.
- Empty / loading / error: guest wall; validation/API inline error; success surface.
- Connections:
  - `?request=1` + `?category=` seed intent · `:195-210`
  - Product empty-CTA paths use REL-07 → `car` | `real_estate` | `industrial` (not browse keys)
  - Submit maps UI via `apiCategoryForUi` · taxonomy `:70-72`
  - Draft identity-scoped · `:355+`
  - Market/currency → `specs.market_country` / `specs.currency`
- Status: **HEALTHY** (primary product paths)
- Related note (not merge-blocker): deep-link allowlist still accepts browse aliases `facilities` | `materials` cast into `UiListingCategory` · `:203-210`. **No in-app emitter** found (REL-07 sends `industrial`). → treat as **RISK LOW** hygiene only.
- Severity (RISK): **LOW**
- Server backstop? **YES** (auth + category enum/normalization on write)
- Evidence: `create.tsx:195-210`, `:1321-1340`, `:1139`; `SectionSearchApp.tsx:167-173`, `:1226-1228`; `listingCreateTaxonomy.ts:30-72`
- Recommended owner: Reliability (optional alias map) — **not** Accept §E blocker
- Repair shape: optional normalize `facilities`/`materials` → `industrial` / `raw_materials` before setState; guard test. **No Auditor repair.**
- Visual: **UNVERIFIED_VISUAL**
