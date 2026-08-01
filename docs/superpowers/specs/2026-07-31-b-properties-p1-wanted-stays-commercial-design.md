# B-PROPERTIES P1 — Wanted · Stays · Commercial (RE only)

**Date:** 2026-07-31  
**Scope:** `/section/real-estate` only — no Cars / Stay shell rewrite / Import / API schema / MiniAppBottomNav  
**Status:** Owner said «كمل بدقة» on audit gaps — implement this slice

---

## Goal

Close the three reachable-chrome gaps left after P0 offer strip:

1. **Wanted** (`listingMode=buy` → `is_request`) visible again  
2. **Stays** entry to `/section/booking` without remounting the desks wall  
3. **Commercial** honest subtype picker (`office` / `shop` / `warehouse` / `commercial_land`)

---

## Design (compact — Stay-grade, not desks wall)

### Wanted
- Independent toggle chip beside the offer strip (same band, not a 4th offer engine).
- Toggles `listingMode` `all` ↔ `buy` via existing `selectListingMode`.
- Composes with sale/rent + propertyType (API already supports `is_request` + `offer_type`).

### Stays
- One real icon hit in Band A (calendar) → `router.push("/section/booking")`.
- No brochure, no remount of `ReServiceDesks`.

### Commercial
- Band D “Commercial” opens an in-header modal listing the four API types.
- Selecting a row sets `propertyType` to that exact enum (never fake `commercial`).
- Band D lights Commercial when any of the four is active.

### Explicitly deferred
- Remounting full `ReServiceDesks` wall  
- Deep residential types in Band D (stay in FilterSheet)  
- Deleting orphan `ReServiceDesks.tsx` (leave file; not imported)

---

## Success
- Wanted / Stays / Commercial all reachable from RE first paint  
- Bottom nav untouched  
- Guards + typecheck + i18n + icons green  
