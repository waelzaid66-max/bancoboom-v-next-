# W8-AUD-82 — Peer VERIFY · D-W8-03 Discover melt severed @ `main`

- Seat: Production Auditor · Protocol `68`
- Orders: `81` §4/§6 · `82` · Approve `W8-APPROVE-PLAN-TRANCHE-B` · CLOSED stamp · status `83`
- **SoT:** `main` @ **`0893b8bcc2d8be87be6ca37e5092a2f1e45ef67b`** (handoff) · land `2afccf8` · CLOSED tip `841ee01`
- Stamp: `2026-07-31T15:50Z`
- Mode: VERIFY only · **zero product code**

## Success criteria (Approve)

| Criterion | Tip evidence | Pass |
|-----------|--------------|------|
| `SearchDiscover` Props = `{ onExploreMap }` only | `SearchDiscover.tsx` interface · destructure `{ onExploreMap }` | **YES** |
| No melt props passed from host | overlay `<SearchDiscover onExploreMap={exploreOnMap} />` only (`search.tsx:613`) | **YES** |
| Comment documents removal | `search.tsx:483-485` Tranche B note | **YES** |
| `exploreOnMap` → `/section/maps` | `search.tsx:490-493` · not RE | **YES** |
| FAB still Maps | `exploreOnMap()` on discover FAB | **YES** |
| `browseBrand` kept for FilterSheet + CarPicker | `onBrowseBrand={browseBrandChip}` on FilterSheet · CarPicker `onSelect` → browseBrand | **YES** |
| No Stay/RE/Import product edits in land | `2afccf8` touches search.tsx + SearchDiscover + docs only | **YES** |

## Dual-end

| Producer | Consumer | Verdict |
|----------|----------|---------|
| Discover map CTA/FAB | `/section/maps` hub | **PASS** |
| Discover section cards | SECTION_ROUTE mini-apps | **PASS** (unchanged) |
| FilterSheet brand chips | host `browseBrand` (catalogue, not Discover) | **PASS** — allowed |

## Guards @ main `0893b8b`

```
section-miniapp-guard   77/77 PASS
materials-core-guard     8/8 PASS
production-wiring-guard 47/47 PASS
```

**JUDGMENT:** D-W8-03 **FIXED_ON_MAIN** · peer **PASS**. STUDY-01 Discover dormant melt **CLOSED**. Open product DEFECT register empty (HOLDs only).

Posture per `81`/`82`/`83`: **STANDBY** · ASK Chair before any next World.
