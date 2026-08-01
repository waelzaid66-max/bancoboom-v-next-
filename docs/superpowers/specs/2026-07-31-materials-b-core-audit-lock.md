# Materials B-CORE — audit & lock (2026-07-31)

**Branch:** `cursor/materials-hub-layer-1e3d`  
**Scope:** `/section/materials` only  
**Status:** Refactored after owner audit request — pollution removed, filters horizontally compressed

## Verdict

B-CORE upper identity stays. Browse filters are **smart horizontal chips** under the header (wrap, `flexGrow: 0`). The search **sliders** open `FilterSheet` for listingMode + refinements. Overbuilt chrome (type circle, ghost testIDs, fat mid-brand market pill, materials-only `MarketCountryButton` tone API) is removed.

## Locked (admitted correct — keep)

| Contract | Why |
|----------|-----|
| Materials only — no other sections | Owner hard scope |
| `MiniAppBottomNav` untouched (BANCO 5 tabs) | Never mock Marketplace/+ |
| No `collapseInlineStrips` | Filters compressed, not erased |
| No vanity counts (2450 / 18400 / 930) | Honesty |
| No fake hub home / services grid entry | Rejected earlier |
| Icons via `@/components/icons` | Project rule |
| FilterSheet still has listingMode + material + origin | Open/close refinements |
| Commodity strip when `all \| raw_material` | Real sourcing axis |
| B-CORE wordmark + cropped industrial seal | Identity |
| Micro market `🇪🇬 EGP` beside BANCO | Not a mid-brand pill |

## Removed as pollution

| Item | Reason |
|------|--------|
| Type-cycle circle above search | Already have sliders → FilterSheet; wrecked strip |
| Ghost `industrial-type-*` 1×1 hits | Test theater |
| Origin jammed into header Band D with giant type tabs | Strip conflict |
| `MarketCountryButton` `compact` / `onDark` API | Shared-component pollution; unused |
| WAIT / contradictory design stubs as active plan | Superseded by this lock |

## Current filter architecture

1. **Header:** search + **Filters (sliders)** → `FilterSheet`  
2. **Smart axis strip (wrap):** industrial types + origin chips (`materials-type-strip` / `materials-origin-strip`)  
3. **Commodity strip (scroll):** Steel / Aluminum / … when raw/all  
4. **FilterSheet:** listingMode + material + origin + price + industry + …

## Gaps / bugs checked

| Check | Result |
|-------|--------|
| `selectIndustrialType` / `selectOrigin` / `selectMaterial` wired | Pass |
| Machine/production clears commodity strip via `showMaterialChrome` | Pass |
| Other sections still use default header + primary strip | Pass |
| Bottom nav mount unchanged | Pass |
| Guard tests materials-core + section-miniapp | Pass |
| Real Expo web `/section/materials` screenshot | After this commit |

## Do not regress

- Do not reintroduce type-circle / hub home / collapseInlineStrips / vanity stats  
- Do not touch `MiniAppBottomNav` or non-materials sections for this work  
