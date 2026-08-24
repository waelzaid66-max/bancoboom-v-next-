# VNX-CAR-02 — Cars Icon Contract Pinned

## Decision

Owner direction, 2026-08-24: *«حافظ على الايقونات في قسم السيارات ومسارتها»* —
preserve the Cars section icons and the path they resolve through, ahead of a
header regeneration that the owner intends to hand to another agent.

The existing zero-loss guard was measured against that instruction and does not
satisfy it. It pins fourteen `testID`s and **zero icons**. A regenerated header
that kept every identifier while replacing every glyph would leave the pack
green. This batch closes that gap before any regeneration begins.

| Field | Evidence |
| --- | --- |
| Base | `1c18f08` on `main` |
| Product commit | `f1a4365` (guard only — no product source delta) |
| Guarded surface | `components/search/car/CarsHomeHeader.tsx` |
| Base capability | 14 `testID`s pinned; 0 icons, 0 import paths, 0 category glyphs |
| Classification | `ALREADY_PRESERVED` in product; protection added with no product delta |

## Reproduced defect

The guard's coverage was measured, not assumed:

```
testIDs pinned by car-dock-zero-loss   14
icons pinned                            0
import paths pinned                     0
vehicle category glyphs pinned          0
```

`VehicleGlyph` was asserted as a component name only. Nothing prevented the
twenty-one category strip from being regenerated with five entries, nothing
prevented `@/components/icons` from being swapped for `@expo/vector-icons`, and
nothing prevented every chrome glyph from changing meaning.

## Implemented invariant

The contract now pinned, and mandatory for any regeneration:

```
import authority   @/components/icons                        (lucide-backed shim)
                   @/components/search/car/VehicleGlyph

chrome icons (7)   bell (notifications)   user (profile)
                   sliders (filters)      bookmark (save search)
                   x (clear)              search
                   map/list pair — BOTH glyphs must survive, or the
                   active mode becomes invisible

category glyphs    cars suv electric motorcycles trucks buses vans heavy
(21, exact count)  boats yachts ships aircraft jets helicopters agricultural
                   construction emergency military classic luxury more
```

Each chrome icon is pinned by name **and** by the control it belongs to, so a
rename that preserves the glyph but moves its meaning still fails. The category
list is pinned by key **and** by exact count, so a regenerated strip cannot
silently drop the long tail.

## RED → GREEN evidence

Mutation is the only proof a guard is load-bearing. Three mutations, each
executed and reverted:

| Mutation | Result |
| --- | --- |
| Remove the `boats` category from `CAR_CATEGORIES` | **FAIL** — guard holds |
| Swap the import to `@expo/vector-icons` | **FAIL** — guard holds |
| Replace the `bell` glyph with `circle` | **FAIL** — guard holds |

## Verification ledger

| Gate | Result |
| --- | --- |
| `test:car-dock-zero-loss` | 8/8 PASS |
| `test:car-hero-honesty` | PASS |
| Mobile guard packs | 42/42 PASS, each executed independently |
| Chain integrity | 247/247 PASS |
| Production confidence | 26/26 PASS |
| Root TypeScript | PASS, exit 0 |

## Explicitly unproven

- This guard reads source text. It proves the glyph names and the import path
  survive; it does not prove the rendered result is visually correct on a
  device, at 320–430, or in RTL.
- It does not pin colour, size, spacing, or layout. A regeneration can still
  change the look while satisfying this contract — that is intentional, since
  the owner asked for the icons and their resolution path, not a pixel freeze.
- No CI evidence exists for this batch. Per `VNX-CI-02`, Actions has not
  executed a step since 2026-08-14.

## Carry-forward findings

- The same class applies to the other four section headers. Property, Stay,
  Facilities and Materials each carry a `testID` contract and none pins its
  icons. This batch does not extend to them; it is bounded to the section the
  owner named.
- The Cars header regeneration the owner requested is blocked on an input, not
  on this contract: the reference image referred to as attached did not reach
  this agent. No generation was attempted from a description.

## Release boundary

This batch adds protection at the commit containing this report and changes no
product source.
It does not certify browser/WebView provider behavior, Android/iOS devices,
PostgreSQL migrations or scale, Clerk, storage, Paymob, push/email delivery,
Docker/Coolify runtime, backup/restore, rollback, EAS signing, or store release.
Production remains NO-GO until the external gates in
`CANONICAL-PRODUCTION-GATE-MATRIX.md` are exercised on one immutable commit.
