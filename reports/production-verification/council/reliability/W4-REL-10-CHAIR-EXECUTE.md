# W4-REL-10-CHAIR-EXECUTE — Create↔section deep-link (MOB-C-01…04)

**Executor:** Chair (skeptic-driven; do not trust Zone B half-path HEALTHY)  
**Date:** 2026-07-31  
**Protocol:** `68-CHAIR-DISTRUST-INTERCONNECT-PROTOCOL.md`

## Change (narrow)

| File | Change |
|------|--------|
| `listingCreateTaxonomy.ts` | `resolveCreateDeepLinkCategory` + `sectionEmptyPostRequestCategory` |
| `SectionSearchApp.tsx` | Empty CTA uses shared SoT; materials→`raw_materials` |
| `listings/create.tsx` | Consume remap; `?request=1` forces deep category over draft |
| `section-miniapp-guard.test.mjs` | Producer+consumer guards |

## Explicit non-changes

- API category enum
- Currency / markets SoT
- Edit/mine auth (MOB-C-10 backlog)
- Edit request price gate (MOB-C-09 backlog — separate Approve)

## Reliability next

VERIFY only: `W4-REL-10-VERIFY.md` + full mobile pack. Do not re-implement.
