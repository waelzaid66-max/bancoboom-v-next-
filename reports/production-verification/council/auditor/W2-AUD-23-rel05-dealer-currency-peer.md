# W2-AUD-23 — Peer-review REL-05 (dealer currency D-07)

## Finding AUD-23
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO** (REL-05 not landed on tip yet)
- Evidence (tip `34aef42`):
  - D-07 policy: investment / RFQ / global-supply writes use same allowlist as listings
  - Listing API uses `listingCurrencyAllowlist` via `SUPPORTED_LISTING_CURRENCY_SET` — present
  - Dealer free-text currency Inputs still present (Wave 1 AUD-09 evidence paths):
    - `dealer-os/.../investment-form-sheet.tsx`
    - `dealer-os/.../rfqs.tsx`
    - `dealer-os/.../global-supply.tsx`
  - No dealer `CurrencySelect` / allowlist import found on tip yet
- User impact: B2B writers can still store garbage currency codes until REL-05
- Regressions if wrong fix: Blocking legitimate USD/EUR extras (already in allowlist) or inventing second list
- Recommended owner: **Reliability** (REL-05) per D-07
- Recommended fix shape: UI select from `listingCurrencyAllowlist()`; API validate same set; no second catalog

## Auditor action
Peer-review after Reliability commit; confirm free-text gone + invalid rejected.
