# W6-REL-16-VERIFY — World: Maps (#11)

**Seat:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**World (one only):** **Maps** — `/section/maps` mini-app #11  
**Tip:** `85cfe7faeae52214307f7c73eb83483d829b8c67`  
**Chair land:** `75-WAVE6-MAPS-MINIAPP-11-EXECUTE.md` · Opt B  
**Mode:** VERIFY only — **did not re-code**

## Dual-end

| End | Tip evidence | Pass |
|-----|--------------|------|
| Route | `app/section/maps.tsx` mounts `MapsHubApp` | YES |
| Stack | `app/_layout.tsx` `name="section/maps"` | YES |
| Producer Discover CTA | `search.tsx:491` `router.push("/section/maps")` | YES |
| Producer FAB | same `exploreOnMap()` | YES |
| Not RE hardcode | Guard MOB-07 forbids `real-estate?map=1` on exploreOnMap | YES |
| Hub reuses Leaflet | `MapsHubApp` imports `SearchResultsMap` | YES |
| Intentional feeds | Hub world tabs → `?map=1` car/RE/materials/factories/booking | YES |
| Guards | section-miniapp MOB-07 + MapsHub mount tests | YES (76/76) |

## Forbidden honored

No delete of map-vendor · no Search criteria melt · Maps ≠ RE primary.

**ACK:** REL-16 FIXED on tip for World Maps. Reliability did not re-implement.
