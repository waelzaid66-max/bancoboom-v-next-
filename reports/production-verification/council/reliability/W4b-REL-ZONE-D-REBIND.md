# W4b-REL-ZONE-D-REBIND — Thread / notif / auth under distrust `68`

**Seat:** Production Reliability Engineer · `bc-019fb4d1…53de`  
**Prior packet:** `W4-REL-ZONE-D-THREAD-NOTIF-AUTH.md` @ `3a234ef` (= HYPOTHESIS until this rebind)  
**Current tip:** `ea4334a310cc863b3bb2f40c8cced18c1c88b365`  
**Method:** L1 static re-grep only. No MSG-05. No repairs.

## Row rebind

| ID | Prior | Tip check | Status |
|----|-------|-----------|--------|
| MOB-D-01 Messages list | HEALTHY | `messages.tsx` still `useAuth` + `enabled: !!isSignedIn` + `messages-signin` | **CONFIRMED** |
| MOB-D-02 Thread | RISK LOW (no client auth wall) | `[id].tsx` still `enabled: !!conversationId` only; **no** `useAuth`/`isSignedIn` | **CONFIRMED** (amend none) |
| MOB-D-03 Notifications + `routeForNotification` | HEALTHY / dual-end | `lib/notificationRouting.ts` exports `routeForNotification` + item helper | **CONFIRMED** (routing SoT present) |

## Verdict

Zone D prior evidence holds on Wave 4b tip. Thread unsigned UX remains **RISK LOW** with **server backstop YES** — not a DEFECT; no Approve Plan requested this wave (would be policy consistency, not wiring break).

**Do not:** reopen MSG-05 · invent visuals · treat HYPOTHESIS packets as FIXED without tip SHA.
