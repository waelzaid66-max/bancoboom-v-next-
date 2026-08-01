# B-PROPERTIES — mini-app header identity (RE only)

**Date:** 2026-07-31  
**Scope:** `/section/real-estate` only — do not touch Cars, Stay, Import, API, DB, auth  
**Status:** Awaiting owner approval of logo picks + header bands

---

## Goal

Build the missing Real Estate mini-app chrome layer so identity + filters sit **inside** one balanced header (Stay-grade), not a crushed strip of buttons.

Owner mockup philosophy (inspiration, not pixel-copy):
- Centered **B-PROPERTIES** identity
- Search pill with **filter inside**
- Property-type pills under search
- Listings below — header must **not** eat half the screen

---

## Logo picks (from owner kit — only these)

| Piece | Asset | Role |
|-------|-------|------|
| Lightning **B** | `assets/images/b-mark.png` (cropped from official `boom-logo.png`) | Lead mark of wordmark |
| Word **PROPERTIES** | Typography (Inter Bold, accent `#B81E3C`) | Completes **B-PROPERTIES** |
| House + keys ring | `assets/images/property-mark.png` (cropped from boom second **O**) | Property seal next to wordmark |
| **BANCO** | existing `assets/images/banco-logo.png` | `POWERED BY` row (same pattern as Stay) |

### Explicitly NOT used

- Full **B-OOM** word / “BANCO OWNERS OPEN MARKET”
- Handshake **O**
- “GROUP COMPANIES”
- Car silhouette / unrelated kit labels

Name on screen: **B-PROPERTIES** (matches owner mockup).

---

## Header bands (Stay-parity proportions)

New presentational component: `components/search/property/PropertyHomeHeader.tsx`  
Mounted **only** when `category === "real_estate"` inside `SectionSearchApp` (or thin RE shell). Stay’s `StaysHomeHeader` untouched.

| Band | Content | Approx height |
|------|---------|----------------|
| A | Back · save-search (real actions only) | ~40px |
| B | `[b-mark] PROPERTIES [property-mark]` · POWERED BY · `banco-logo` · one short tagline | ~72–88px |
| C | Search pill + filter control **inside** pill (opens existing `FilterSheet`) | ~50px |
| D | Type tabs: All · Apartments · Villas · Commercial · Land → real `propertyType` criteria | ~48px |

Optional atmosphere: `categories/real_estate.jpg` as **cropped** hero behind Band B only (gradient), not a full-bleed half-screen banner.

`topPad`: `Math.max(insets.top, Platform.OS === "web" ? 12 : 0)` — never fake `67`.

---

## Filter merge (fixes crushed chips)

| Today (broken UX) | After |
|-------------------|--------|
| Search + filter as separate header icons | Filter lives **in** search pill (Stay pattern) |
| Service desks + wrapping engine chips + type pill stacked | Desks strip removed from first paint; offer sale/rent via FilterSheet or one compact control if still needed |
| 16 types always fighting for space | Band D = 5 primary types only; rest stay in `FilterSheet` |

All actions remain real: existing criteria, `FilterSheet`, map latch, routes. No dead taps. Icons only from `@/components/icons` registry.

---

## Non-goals

- Fake stats row (25,640…) unless live API totals exist later  
- Hamburger / bell / heart unless wired to real existing routes  
- New brand system outside BANCO  
- Touching `/section/car`, `/section/booking`, `/import/*`

---

## Success

- First viewport: balanced B-PROPERTIES identity + search/filter + types + listings  
- Android/iOS/Expo: registry icons only; PNG marks from official logos  
- `test:section-guard`, `test:icons`, `test:i18n`, typecheck green  
- Cars + Stay byte-identical outside RE chrome path
