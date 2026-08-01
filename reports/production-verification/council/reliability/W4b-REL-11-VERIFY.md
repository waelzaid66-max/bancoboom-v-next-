# W4b-REL-11-VERIFY — ACK Chair REL-11 (MOB-C-09)

**Seat:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**Tip SHA:** `ea4334a310cc863b3bb2f40c8cced18c1c88b365`  
**Landing:** Chair force-exec in D-18 / `W4-REL-11-CHAIR-EXECUTE.md` (commit family `2c36839`)  
**Protocol:** VERIFY only — **do not re-code**

## Defect closed

Edit of buyer `is_request` listings required `base_price_cash > 0` and always PATCHed price → save blocked / risk of `0` price-drop notify.

## Tip evidence (path:line)

| Check | Evidence | Pass |
|-------|----------|------|
| Branch on `is_request` | `edit/[id].tsx:170` `const isRequest = !!listing.is_request` | YES |
| Sale price gate | `:172-174` require `base_price_cash > 0` only when `!isRequest` | YES |
| Omit PATCH price | `:193` `...(base_price_cash !== undefined ? { base_price_cash } : {})` | YES |
| Hide price UI | `:377-393` `{!listing.is_request ? (… testID edit-listing-price) : null}` | YES |
| Guard | `section-miniapp-guard.test.mjs` `MOB-C-09 / REL-11` | YES |
| Blast radius | currency/markets SoT, create wizard, AuthGate untouched | YES |

## Explicit non-changes confirmed

- No API `updateListing` contract change  
- No MOB-C-10 AuthGate (still open — see REL-12 ask)  
- No currency allowlist / API category enum churn  

**ACK:** REL-11 matches D-18. Reliability did **not** re-code.
