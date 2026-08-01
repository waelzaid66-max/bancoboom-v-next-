# W6-SUP-32 — Amend Worlds + Maps do-not-delete (gap CLOSED)

**Seat:** Idle / Support (Chair-amended on absorb)  
**Parent:** W6-SUP-30  
**Tip:** `cursor/section-wiring-audit-e37c` post Maps #11 land  
**Date:** 2026-07-31  

## World 7 / mini-app #11 (amended)

| Field | Value |
|-------|--------|
| Route | **`/section/maps`** |
| Host | `app/section/maps.tsx` → `components/search/maps/MapsHubApp.tsx` |
| Discover primary | `/(tabs)/search` → `/section/maps` |
| Feeds | Per-section `?map=1` **intentional duplication** |

Owner count = **11 mini-apps** including Maps.

## Do-not-delete (additions)

| Path | Role |
|------|------|
| `app/section/maps.tsx` | Maps mini-app route |
| `components/search/maps/MapsHubApp.tsx` | Maps hub (Leaflet consumer) |
| Prior SUP-30 vendor + SearchResultsMap + mapLatch list | **still binding** |

## Gap status

Discover Maps → RE misroute: **CLOSED** on this tip (was open in SUP-30 §3).

## SUP-33

Standby — docs only until next Chair packet.
