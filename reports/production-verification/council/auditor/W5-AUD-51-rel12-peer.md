# W5-AUD-51 — Peer REL-12 (MOB-C-10 AuthGate)

- Tip SHA: **`a9f5c358149c473019a0c07fcbaea087d143422a`**
- Seat: Production Auditor · Protocol `68` (producer + consumer)
- Chair execute: `W5-REL-12-CHAIR-EXECUTE.md` · **D-20**
- Reliability: VERIFY-only seat (do not re-code) — Auditor peer aligns

## Dual-end closure checks

| Check | Producer / consumer | Evidence (tip path:line) | Pass |
|-------|---------------------|--------------------------|------|
| Edit uses Clerk auth | `useAuth` → `isSignedIn` | `edit/[id].tsx:3`, `:55` | **YES** |
| Edit does not hydrate while unsigned | query `enabled` | `edit/[id].tsx:66-67` `enabled: !!id && !!isSignedIn` | **YES** |
| Edit unsigned wall + CTA | UI → Profile | `edit/[id].tsx:243-260` `testID="edit-listing-signin"` | **YES** |
| Edit save refuses unsigned | early return | `edit/[id].tsx:169` `if (!isSignedIn \|\| !id \|\| …)` | **YES** |
| Mine uses Clerk auth | `useAuth` | `mine.tsx:2`, `:81` | **YES** |
| Mine skips managed-list while unsigned | load gate | `mine.tsx:114-118` `if (!isSignedIn) { setItems([]); … return }` | **YES** |
| Mine unsigned wall + CTA | UI → Profile | `mine.tsx:342-364` `testID="my-listings-signin"` | **YES** |
| Header create/requests hidden unsigned | chrome | `mine.tsx:317-338` | **YES** |
| i18n EN+AR keys | strings | `i18n.ts` `mine.signIn*` · `editListing.signIn*` | **YES** |
| Guard contract | static test | `section-miniapp-guard.test.mjs:1581-1603` `MOB-C-10 / REL-12` | **YES** |
| REL-11 preserved | request price omit/hide | `edit/[id].tsx:173-196`, `:399+` | **YES** (no regression) |

## Blast radius

| Surface | Touched by REL-12? |
|---------|-------------------|
| Create / taxonomy / REL-10 | **No** |
| Currency / markets SoT | **No** |
| App-wide AuthGate redesign | **No** (mine+edit only — matches D-20 Rejected) |
| API ownership | **No** (client gate only; server still owns authz) |

## Auditor JUDGMENT

**ALREADY_FIXED_ON_TIP** · peer **PASS** · do **not** re-implement.

Does **not** equal Live Certified. Does **not** close Zone E/F rebinds (AUD-53 / SUP-20). Visuals: **UNVERIFIED_VISUAL** (no device).
