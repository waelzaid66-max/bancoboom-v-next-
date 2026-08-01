# W1-REL-00 — Tip re-verify (TEMPLATE)

Reliability Engineer: copy to `W1-REL-00-tip-reverify.md`, run on tip SHA, paste outputs.

- Tip SHA:
- `pnpm run typecheck`:
- Mobile pack / production-wiring:
- `node scripts/chain-integrity-gate.mjs`:
- `node scripts/production-confidence-check.mjs --skip-typecheck`:
- `pnpm ops:live-cutover -- --allow-placeholders` (expect NOT_CUTOVER until OPS):
- Verdict: TIP_HEALTHY | TIP_REGRESSED
