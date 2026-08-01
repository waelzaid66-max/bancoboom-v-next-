# W4b-AUD-41 — Peer REL-11 (MOB-C-09)

- Tip SHA: `ba5f61e34fd130565089f40ac9f592730cab7138`
- Seat: Production Auditor
- Chair execute: `W4-REL-11-CHAIR-EXECUTE.md` · D-18
- Reliability VERIFY: `W4b-REL-11-VERIFY.md` (align)

## Dual-end / defect closure checks

| Check | Evidence | Pass |
|-------|----------|------|
| Branch `is_request` | `edit/[id].tsx:170` `const isRequest = !!listing.is_request` | **YES** |
| Sale still requires price>0 | `:172-174` | **YES** |
| Request omits `base_price_cash` | `:193` spread only if defined | **YES** |
| Never send `0` for requests | undefined path — no zero | **YES** |
| Hide price field | `:377-393` `!listing.is_request ? … edit-listing-price` | **YES** |
| Guard | `section-miniapp-guard` MOB-C-09/REL-11 | **YES** (73/73 tip sources) |
| Blast radius | AuthGate/currency/create untouched | **YES** |

## Auditor JUDGMENT
**ALREADY_FIXED_ON_TIP** · peer **PASS** · do not re-implement.

Does **not** close MOB-C-10 (AuthGate) — backlog / REL-12 ask only.
