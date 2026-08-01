# W2-REL-04-05-VERIFY — ACK Chair force-execute (D-09)

**Seat:** Production Reliability Engineer (`System presence check` · `bc-019fb4d1…53de`)  
**Tip SHA at verify:** `b9d5f13` (+ tip-health follow-ups in this commit)  
**Protocol:** `65-W2-CHAIR-COORDINATION-PROTOCOL.md` — **verify, do not re-implement**

## ACK

| ID | Chair landing | Reliability verify |
|----|---------------|--------------------|
| **REL-04** | `profile.tsx` → `t("profile.skipRole")`; EN/AR in `i18n.ts` | **CONFIRMED** — wiring guard `REL-04` PASS |
| **REL-05** | `CurrencySelect` + `listingCurrencyInputZ` on SubmitOffer / CreateInvestment / CreateGlobalSupply / RespondGlobalSupply | **CONFIRMED** — wiring guard `REL-05` PASS; UI free-text Inputs gone |

Evidence of Chair exec: `W2-REL-04-05-CHAIR-EXECUTE.md`.

## Tip-health only (not REL redo)

Chair D-08 markets SoT left `listingCreateTaxonomy.ts` as `export {…} from` without a local import, so `rentalTermsForCountry` could not see `MARKET_COUNTRIES` / `DEFAULT_MARKET_COUNTRY` (TS2304 + create-market guard red). Reliability fixed **import + re-export** and pointed the DZ/PS/SY/YE guard at `lib/taxonomy/src/markets.ts`.

## Explicit non-actions

- Did not re-code REL-04/05
- No CAR IMPORT W4/5 · No MSG-05 · No Live Certified · No competing tip
