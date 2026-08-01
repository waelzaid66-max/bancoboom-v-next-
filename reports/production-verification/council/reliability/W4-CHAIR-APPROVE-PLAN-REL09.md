# W4-CHAIR-APPROVE-PLAN — Mobile REL-09

**Chair:** Chief Production Architect  
**Date:** 2026-07-31  
**Defect:** MOB-A-06  

## Severity adjudication

Auditor/Zone-A packet said **HIGH**. Chair downgrades to **MEDIUM**:

- Server `UserService` already throws `DEMOTE_BLOCKED` for elevated → `individual` (S4).
- Client race can still: show picker too early, dismiss gate, then surface error — bad UX / confusing state, not silent role wipe.

## Approved repair (REL-09) — narrow

1. Do **not** set `needsAccountType(true)` while `/me` is still pending/loading.
2. In `chooseAccountType("individual")`, if `/me` role is not yet available and query still loading/fetching → **return without dismissing gate**.
3. Keep existing elevated client Alert + server backstop.
4. Extend guard test asserting wait-for-`/me` / no dismiss-before-role-known.
5. **Forbidden:** unrelated profile refactors, AuthGate redesign (MOB-A-05/07 stay backlog).

## Owner

Reliability implements on tip (or Chair force-exec if lag). Auditor peer-reviews after.
