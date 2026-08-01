# W1-AUD-09 — Dashboard / dealer consistency vs mobile rules

## Finding AUD-09
- Severity: **MEDIUM**
- Status: **OPEN_IN_REPO**
- Evidence:
  - Mobile listing create binds currency via `CURRENCY_BY_MARKET` / override (`create.tsx`).
  - Tip API now enforces listing `specs.currency` allowlist (REL-01).
  - Dealer OS free-text currency inputs (no shared allowlist):
    - `artifacts/dealer-os/src/components/investment-form-sheet.tsx` — `<Input value={currency} …>`
    - `artifacts/dealer-os/src/pages/rfqs.tsx` — offer currency Input
    - `artifacts/dealer-os/src/pages/global-supply.tsx` — response currency Input
  - Admin revenue page displays server `revenue.currency` (read path) — not a write risk.
  - Role/RBAC server-side gates exist; dashboard vs mobile role UX deep compare: partial — **UNVERIFIED** beyond currency write surface.
- User impact: Dealer/B2B clients can submit non-market currency strings on investment/RFQ/supply payloads if API does not enforce those DTOs the same way as listings.
- Regressions if wrong fix: Blocking legitimate exotic quote currencies for B2B without product decision.
- Recommended owner: Architect (policy: same allowlist vs freer B2B quotes) → Reliability
- Recommended fix shape: Decide policy. If same market set: reuse `SUPPORTED_LISTING_CURRENCY_SET` (or shared taxonomy export) on dealer forms + matching API validators. If B2B freer: document exception explicitly in COUNCIL-DECISIONS.
