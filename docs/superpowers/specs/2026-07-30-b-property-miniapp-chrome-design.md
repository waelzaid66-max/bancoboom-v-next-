# B-PROPERTY — Real Estate mini-app chrome (UI-only)

**Date:** 2026-07-30  
**Repo:** `waelzaid66-max/banco-with-wael`  
**Scope:** `/section/real-estate` only  
**Status:** Approved approach — organize inside existing screen; real layers only

---

## Goal

Reorganize the Real Estate section UX so users see **listings first**, with tools compacted into professional controls — without breaking BANCO architecture, APIs, search, maps, favorites, booking, messenger, bottom nav, Cars, or Booking/STAY.

## Non-goals

- New app / new marketplace / new brand system  
- Touching `/section/car`, `/section/booking`, `/import/*`  
- Changing search engine, API, DB, auth, payments, analytics  
- Fake hubs, dead buttons, or unregistered routes  
- Large hero banners that steal vertical space  
- In-app listing map SDK (listing map remains external Linking)

## What “real layers” means here

| Layer | Mechanism (already real) |
|-------|---------------------------|
| Section browse | Stack: `/section/real-estate` → `SectionSearchApp` |
| Filters | RN Modal: `FilterSheet` + pickers |
| List ↔ map | In-screen `mapMode` (not a new route) |
| Listing | Stack: `/listing/[id]` |
| Media / contact | Existing modals + `/messages/[id]` |

No parallel route tree like CAR IMPORT unless every destination already exists and is wired.

## Identity

- Compact mark only: **B-PROPERTY** (BANCO “B” + PROPERTY)  
- Accent: existing `sectionTheme` `real_estate` (`#B81E3C`)  
- Icons: `components/icons.tsx` registry only  
- Header stays small: back · icon · title · micro brand · short subtitle · search · filters  
- `MiniAppBottomNav` unchanged and always present

## Chrome decisions (measured, not taste)

From `sectionChrome.ts` measurement: 16 property-type chips overflow a phone width or consume multiple rows (~163px) before results.

| Axis | Shape | Why |
|------|-------|-----|
| Offer تمليك / إيجار | **chips** (keep) | Few values, flicked constantly |
| مطلوب | single chip (keep) | Existing RE behavior |
| Property type (16) | **pill** (change) | Many values; set occasionally; frees vertical space |
| Market / sort | primary strip (keep) | Already compact |
| Refinements | `FilterSheet` (keep) | Hidden until needed |

## Implementation units

1. `app/section/real-estate.tsx` — declare `chrome={{ engines: "chips", propertyType: "pill" }}`  
2. `SectionSearchApp` — honor `axisShape(chrome, "propertyType")`; pill uses `FilterPillSelect` + existing `selectRePropertyType`; keep `testID="re-type-strip"`  
3. RE-only micro brand line in header (i18n keys) — no height blow-up  
4. Guard test: lock RE `propertyType: "pill"` + `axisShape(chrome, "propertyType")`  
5. Do not edit Cars / Stay files

## Success criteria

- Listings appear higher on first paint  
- Every control still drives real criteria / sheets / routes  
- `test:section-guard`, `test:icons`, `test:i18n`, mobile typecheck pass  
- Cars + Booking/STAY byte-identical in behavior  
- No API or search-contract changes

## Wave 2 (implemented)

- `SmartAssetCard` RE path: accent price, wanted badge, shorter photo, denser stack  
- Rent terms → `FilterPillSelect` (`section-rental-pill`) — same `rentalTerm` axis  
- Removable active-filter chips (`re-active-filters`) — clear real criteria only  

## Wave 3 — مكاتب (service desks)

Compact horizontal `ReServiceDesks` inside `/section/real-estate` (not a new hub route):

| Desk | Real action |
|------|-------------|
| Buy / Rent | `selectEngine(sale\|rent)` |
| Apartments / Villas / Lands | `update({ propertyType })` |
| Commercial | modal → office / shop / warehouse / commercial_land |
| Map | map latch (`wantMap` / `mapMode`) |
| Stays | `/section/booking` |
| Request | `/listings/create?request=1` |
| More | open `FilterSheet` |

Also: seed `?property_type=` (composes with `?engine=sale|rent`).

## Wave 4 — production audit fixes (publish gate)

| Fix | Why |
|-----|-----|
| Typecheck: desk icons via Ionicons registry names | CI Typecheck was FAILING on Feather `"business"` |
| Keep user-selected `propertyType` (no facet wipe) | Desk/sheet taps were silently cleared at count=0 |
| `propertyTypeOptions={RE_TYPE_PRIMARY}` on RE FilterSheet | Stop twinhouse/clinic drift vs pill/desks |
| Map latch opens on `inResultsView` (not only page pins) | `?map=1` / desk-map served more users via server clusters |
| Web map locate_error → Alert + Settings | Parity with native; no dead locate |
| Map pin `?focus=booking` only when bookable/unknown | Honest booking chrome |
| Notification routing tests for booking/listing/message | Gate coverage |

## Explicit deferrals

- Nested `/real-estate/*` hub tree like CAR IMPORT  
- New Projects / Developer / Project / Contract / Closing payment / Compare desks (no routes yet)  
- Off-page map pin price/`is_bookable` without API cluster fields (backend follow-up)  
- Stay header / BOOM STAY wordmark
