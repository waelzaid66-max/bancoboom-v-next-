# W4-REL-11 — Chair execute (MOB-C-09)

**Seat:** Chair force-exec  
**Decision:** D-18  
**Tip branch:** `cursor/final-production-acceptance-e37c`  
**Blast radius:** `artifacts/banco-mobile/app/listings/edit/[id].tsx` + one guard in `section-miniapp-guard.test.mjs`  
**Not touched:** API `updateListing`, currency/markets SoT, create wizard, AuthGate (MOB-C-10)

## Defect

Edit `onSave` always required `base_price_cash > 0` and always PATCHed price. Buyer `is_request` listings hydrate with empty/zero price → save blocked. Create omits price for requests.

## Repair

1. Branch on `listing.is_request`.  
2. Sale: keep `price > 0` require + send `base_price_cash`.  
3. Request: hide price field; **omit** `base_price_cash` from PATCH (never send `0` — avoids price-drop notify side effect).  
4. Keep market/currency specs patch (edit’s intentional multi-market chrome).  
5. Guard: `MOB-C-09 / REL-11: edit skips price gate for buyer requests`.

## Reliability next

VERIFY only (`W4b-REL-11-VERIFY.md`) — do not re-implement.
