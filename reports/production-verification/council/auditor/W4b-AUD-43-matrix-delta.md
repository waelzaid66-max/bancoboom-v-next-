# W4b-AUD-43 — Matrix delta proposals (Chair absorb)

- Tip SHA: `ba5f61e34fd130565089f40ac9f592730cab7138`
- Rule: no FIXED without dual-end + tip SHA

| Zone | Surface | Proposed flip | Basis |
|------|---------|---------------|-------|
| C | listings/create | FIXED REL-10 (keep) | AUD REL-10 peer + Rel VERIFY |
| C | listings/edit | **FIXED REL-11** price/request; MOB-C-10 RISK remain | AUD-41 PASS |
| C | listings/mine | RISK MEDIUM AuthGate (MOB-C-10) — unchanged | no dual-end client gate |
| C | listing/[id] | HEALTHY static / NEEDS_RUNTIME (rebind from HYPOTHESIS) | skeptic C-11 + prior C-01 peer; no contradicting tip defect |
| E | banks/RFQ/supply/invest/onboard/requests | **HEALTHY** @ `ba5f61e34fd130565089f40ac9f592730cab7138` | AUD-42 |
| A | Profile | FIXED REL-09 (keep) | prior peer |
| * | Live | NOT_CUTOVER | AUD-44 |

**Do not** stamp MOBILE_DEVICE_GO · **Do not** FIXED MOB-C-10 without Approve REL-12.
