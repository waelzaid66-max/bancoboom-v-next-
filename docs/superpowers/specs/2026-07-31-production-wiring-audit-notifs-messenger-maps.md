# Production wiring audit — notifications · messenger · maps · B-PROPERTIES

**Date:** 2026-07-31  
**Scope:** Complete inventory + fixes. **No deletions** of product files.  
**Owner ask:** توصيلات النوتفكيشنز والماسنجر والخرائط لكل قسم · جرد كامل · إكمال بدون مسح

---

## A. Full problem inventory (nothing forgotten)

### A1 — B-PROPERTIES chrome (prior waves)
| # | Problem | Status |
|---|---------|--------|
| 1 | Sale/rent unreachable after header merge | **Fixed** — offer strip |
| 2 | rentalTerm chicken-egg | **Fixed** — rent unlocks pill + sheet |
| 3 | FilterSheet duplicated offer engines | **Fixed** — refinements-only |
| 4 | Mobile `rental_term` ungated on sale | **Fixed** — rent-only gate |
| 5 | Commercial = office only (fake highlight) | **Fixed** — subtype picker |
| 6 | Wanted buried in FilterSheet | **Fixed** — header chip |
| 7 | Stays / Request / Map desks retired | **Fixed** — Band A hits (map+stays+request) |
| 8 | Deep types only in FilterSheet | **Fixed** — More picker |
| 9 | ReServiceDesks deleted | **Restored on disk**, not remounted (owner: no delete) |
| 10 | Bottom nav risk | **Verified** identical to main |

### A2 — Maps (all sections)
| # | Problem | Status |
|---|---------|--------|
| 11 | RE header no map after desks retirement | **Fixed** — `re-header-map` |
| 12 | Stay header no map | **Fixed** — `stays-header-map` |
| 13 | Web locate broken (no iframe geolocation) | **Fixed** — `allow="geolocation"` |
| 14 | Stay `mapAnchorKey` clears map (breaks `?map=1`) | **Fixed** — `wantMap` guard |
| 15 | Car / facilities / materials map FAB | **OK** via shared `SectionSearchApp` |
| 16 | Discover `?map=1` only for RE | **Deferred P1** — producers for other sections |
| 17 | Stay map card uses SmartAssetCard not StayCard | **Deferred P1** |
| 18 | Import hub has no map surface | **OK by design** — car `?engine=import` |

### A3 — Notifications + messenger
| # | Problem | Status |
|---|---------|--------|
| 19 | Listing chat drops `listingId`/`role` | **Fixed** — `openInAppChat` forwards both |
| 20 | Message push missing `role` (mark-sold) | **Fixed** — server stamps + router forwards |
| 21 | Listing pings → `/listing/[id]` | **OK** (not section — correct) |
| 22 | Lead → listing not requests inbox | **Deferred P1** |
| 23 | Saved RE search → Search tab melt | **Deferred P1** |
| 24 | Messages empty no CTA | **Deferred P2** |

---

## B. Wiring map (production)

```
Notifications → routeForNotification
  message → /messages/[id]?listingId&role
  listing_* → /listing/[id]
  booking → /bookings?role
  …

Listing detail → openInAppChat
  createConversation → /messages/[id] + listingId + viewer_role

RE header Band A
  map → setWantMap / setMapMode
  stays → /section/booking
  request → /listings/create?request=1

Section maps (RE/car/factories/materials)
  FAB section-map-toggle + SearchResultsMap (+ .web geolocation)

Stay maps
  FAB stays-map-toggle + header stays-header-map + wantMap latch
```

---

## C. Explicit non-goals / deferred
- Remounting desks wall (Stay-parity header owns entries)
- Deleting `ReServiceDesks.tsx` (kept)
- MiniAppBottomNav changes
- DB Vitest without DATABASE_URL in agent env

---

## D. Gates
section-guard · notification-routing · typecheck · i18n · icons
