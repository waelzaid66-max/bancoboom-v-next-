# W4 — Peer: MOB-A-06 / REL-09

- Tip SHA: `3a234ef267efa142bdcd730002814e2089f76d05`
- Seat: Production Auditor
- Chair ruling (D-14): severity **MEDIUM** (not HIGH) — server `DEMOTE_BLOCKED`
- REL-09: Chair force-exec `d3c255d` + Zone A adjudication `3a234ef`

## Independent verify

| Check | Result |
|-------|--------|
| Heal effect waits `meQuery.isPending` | **PASS** · `profile.tsx:349-364` |
| Skip→individual blocked while role unknown + pending/fetching | **PASS** · `profile.tsx:722-733` |
| Elevated client Alert retained | **PASS** · `:734-744` |
| Server S4 `DEMOTE_BLOCKED` retained | **PASS** · `UserService.ts:194-211` |
| Guard asserts `meQuery.isPending` + `isFetching` | **PASS** · `lib-hardening.test.mjs` (32/32) |
| Accounts S4 client+server | **PASS** · `accounts-clerk-journey.test.mjs` |

## Severity challenge

**Agree with Chair MEDIUM.** Independent read confirms silent role wipe is server-blocked; residual risk was UX dismiss-then-error. REL-09 closes client race. Do **not** reopen as HIGH.

## Status

**ALREADY_FIXED_ON_TIP** · peer **PASS** · no Ask dispute
