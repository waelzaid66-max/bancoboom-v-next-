# W4-REL-09-CHAIR-EXECUTE — Profile wait for /me

**Executor:** Chair (force-exec under Owner mobile mandate; Reliability verifies)  
**Date:** 2026-07-31  
**Approve Plan:** `W4-CHAIR-APPROVE-PLAN-REL09.md`

## Change

- `profile.tsx`: account-type picker effect returns while `meQuery.isPending`
- `chooseAccountType("individual")`: no dismiss/write while role unknown and `/me` pending/fetching
- `lib-hardening.test.mjs`: asserts `meQuery.isPending` + `meQuery.isFetching`

## Explicit non-changes

AuthGate redesign, Saved tab policy, FI flows, visual claims.
