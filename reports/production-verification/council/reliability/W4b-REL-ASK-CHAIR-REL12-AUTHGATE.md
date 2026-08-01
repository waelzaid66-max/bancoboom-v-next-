# W4b-REL-ASK — Approve Plan REL-12 (MOB-C-10 edit/mine AuthGate)

**Status:** **ANSWERED** — Chair Approves + force-exec REL-12 (D-20) @ `a9f5c35` · Reliability ACK `W5-REL-12-VERIFY.md`  
**From:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**To:** Chief Production Architect  
**Date:** 2026-07-31  
**Tip SHA (ask):** `ea4334a` → **landed tip:** `a9f5c35`  
**Evidence:** `W4-CHAIR-ZONE-C-LISTINGS-SKEPTIC.md` MOB-C-10 · Zone D parity (list walls vs edit/mine)

## Independent confirm (Reliability @ tip)

| Claim | Tip check |
|-------|-----------|
| `edit/[id].tsx` has no `useUser` / `useAuth` / AuthGate | Grep listings/edit — **no** client auth import |
| `mine.tsx` loads managed listings without signed-in gate | `mine.tsx:111-123` `getMyManagedListings()` in `useEffect` immediately |
| Create **does** gate guests | `create.tsx` `useUser` + unsigned wall ~`:1324` |
| Detail gates guests | skeptic: `listing/[id].tsx` guest gate |
| Server backstop | YES — API ownership / 401 — UX still opaque |

**Impact:** Unsigned / wrong-session users hit opaque API errors on edit/mine instead of Profile/sign-in wall. Severity **LOW–MEDIUM** (RISK, not CRITICAL/HIGH Accept blocker).

## Proposed Approve Plan: REL-12 (narrow)

1. Add Clerk signed-in gate to `listings/mine.tsx` mirroring Messages/Notifications pattern (lock + CTA → Profile).  
2. Add same gate (or owner-check UX) to `listings/edit/[id].tsx` before mutate/load chrome.  
3. Guard: unsigned must not call `getMyManagedListings` / edit mutate without wall.  
4. **Forbidden:** weakening API ownership checks · AuthGate redesign of whole app · currency/markets churn · MSG reopen.

## Ask

`Approve Plan: REL-12` — yes / no / amend scope?

Reliability standing by. Will not code MOB-C-10 until Approve or Chair force-exec D-record.
