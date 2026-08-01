# W1-AUD-05 — Soft sign-out push unregister

## Finding AUD-05
- Severity: N/A
- Status: **ALREADY_FIXED_ON_TIP**
- Evidence:
  - Settings: `unregisterCachedPushTokenBestEffort()` before `signOut` (`app/settings.tsx` confirmSignOut).
  - Profile menu: same pattern (`app/(tabs)/profile.tsx` signout item).
  - `_layout.tsx` imports unregister helper for auth lifecycle.
- User impact: Prior NOTIF-03 risk closed on tip.
- Recommended owner: none
- Recommended fix shape: none.
