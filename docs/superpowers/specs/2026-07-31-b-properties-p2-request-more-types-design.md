# B-PROPERTIES P2 — Request · More types · desks retirement

**Date:** 2026-07-31  
**Scope:** `/section/real-estate` only — MiniAppBottomNav untouched  
**Status:** Completing deferred audit gaps (owner: «كمل صح بدقة أعلى»)

---

## Goal

Finish remaining reachable-chrome gaps without remounting the desks wall:

1. **Request** — real create-request route from Band A  
2. **More types** — Band D picker for deep residential/hotel types  
3. **Retire** orphan `ReServiceDesks.tsx` (logic absorbed into header)

---

## Design

### Band A actions (LTR: back · … · stays · request · save)
| Hit | Action |
|-----|--------|
| calendar | `router.push("/section/booking")` |
| document-text | `router.push("/listings/create?request=1")` |
| bookmark | existing save-search |

### Band D tabs
`All · Apartments · Villas · Commercial · Land · More`

- Commercial → modal of `office|shop|warehouse|commercial_land`
- More → modal of `studio|chalet|townhouse|duplex|penthouse|hotel`
- Sentinels `__commercial__` / `__more__` never become `propertyType`
- Active highlight: group membership for commercial/more

### ReServiceDesks
Delete file. No importers. Guards assert absence + no remount.

---

## Non-goals
- Fake stats, new API enums, bottom-nav changes, Cars/Stay shell edits
