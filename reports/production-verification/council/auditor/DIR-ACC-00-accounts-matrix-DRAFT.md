# DIR-ACC-00 — Accounts matrix DRAFT (read-only · Intelligence)

- Master ID: **ACC-00** (`88` Track F)  
- Seat: Production Intelligence  
- Tip: `main` @ **`3d4773b`**  
- Stamp: `2026-07-31T18:18Z`  
- Mode: **DRAFT checklist only** · zero product code · no fake device PASS  
- Surfaces sampled: `artifacts/banco-mobile/app/(tabs)/profile.tsx` · `settings.tsx`

---

## Legend

| Mark | Meaning |
|------|---------|
| CODE | Path/handler exists in tip source (static) |
| PARTIAL | Some states handled; matrix incomplete |
| UNVERIFIED | Needs shot/log/device — **do not claim PASS** |
| OPEN | Known gap / missing path |
| N/A | Not applicable on this surface |

---

## Matrix (DRAFT)

| Cell | Guest | Individual | Dealer | Company/FI | Evidence note | Status |
|------|-------|------------|--------|------------|---------------|--------|
| Register email/password | — | CODE `handleSignUp` | CODE | CODE | `profile.tsx` SignUp | **UNVERIFIED** device |
| Login email/password | — | CODE `handleSignIn` | CODE | CODE | status `complete` | **UNVERIFIED** |
| MFA `needs_second_factor` | — | PARTIAL | PARTIAL | PARTIAL | handled in sign-in (~L570) · not all surfaces proven | **UNVERIFIED** |
| `needs_new_password` / first_factor / identifier | — | OPEN? | OPEN? | OPEN? | AUTH-01 Master — full machine not dual-end proven | **OPEN** / AUTH-01 |
| OAuth Google/Apple/Facebook UI | — | CODE buttons | CODE | CODE | `handleOAuth` · live tenant social may be **empty** (PIO/UV-04) | **UNVERIFIED** · likely dead on live |
| OTP / email code | — | PARTIAL | PARTIAL | PARTIAL | tied to MFA path | **UNVERIFIED** |
| Magic link | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | not grepped as primary path this draft | **UNVERIFIED** |
| Password reset | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | settings/profile — needs dedicated path audit | **UNVERIFIED** |
| JWT / session restore | — | CODE Clerk hooks | CODE | CODE | session-restore tests exist historically | **UNVERIFIED** tip re-run |
| Refresh / race | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | UV / AUTH | **UNVERIFIED** |
| Logout | — | CODE `signOut` | CODE | CODE | profile menu | **UNVERIFIED** shot |
| Sign out other sessions | — | CODE flag | CODE | CODE | `signOutOfOtherSessions: true` seen | **UNVERIFIED** |
| Delete account | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | settings expected — path audit pending | **UNVERIFIED** |
| Restore account | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | | **UNVERIFIED** |
| Push register/removal | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | UV-03 · needs FCM/APNs | **UNVERIFIED** |
| Expired session | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | | **UNVERIFIED** |
| Device change | — | UNVERIFIED | UNVERIFIED | UNVERIFIED | UV-01/02 | **UNVERIFIED** |
| Business / Dealer upgrade | — | OPEN MOB-07 | CODE path? | — | Master MOB-07 | **OPEN** |
| FI / Banks role | — | N/A | N/A | UNVERIFIED | Banks brochure sacred | **UNVERIFIED** |

---

## Honest Sign-Off inputs

- **No cell above is Live PASS.**  
- Physical Android/iPhone · APNs · FCM · prod OAuth · real network = required for UV-* / ACC-00 CLOSE.  
- Next: Director may ASSIGN Intelligence to deepen one column with Replit logs **or** ASSIGN UX DIR-03 shots first.

---

## ASK_DIRECTOR

1. Priority after DIR-02 PASS: deepen ACC-00 Guest→Login→MFA with Replit logs, or wait DIR-03 shots?  
2. Confirm MOB-05 → **CLOSED** on Master `88`.

— Intelligence · ACC-00 DRAFT
