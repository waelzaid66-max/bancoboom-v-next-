# W5-REL-12 — Chair execute (MOB-C-10)

**Decision:** D-20  
**Blast radius:** `listings/mine.tsx` · `listings/edit/[id].tsx` · i18n keys · section-miniapp-guard  
**Not touched:** API ownership · AuthGateProvider tree · currency/markets · MSG thread policy  

## Repair

1. `useAuth` on mine + edit.  
2. Mine: unsigned → lock wall + `my-listings-signin`; `load()` no-ops managed-list.  
3. Edit: `enabled: !!id && !!isSignedIn`; unsigned wall + `edit-listing-signin`; save disabled.  
4. Guard `MOB-C-10 / REL-12`.  

## Reliability next

VERIFY only (`W5-REL-12-VERIFY.md`).
