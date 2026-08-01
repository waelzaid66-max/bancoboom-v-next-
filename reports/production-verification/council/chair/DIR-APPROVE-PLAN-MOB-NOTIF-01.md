# DIR-APPROVE-PLAN — MOB-NOTIF-01 (Expo Go SDK 53)

**Director** · 2026-07-31 · Evidence: PIO deep-dive + live log `expo-notifications` ERROR on Android Expo Go

## Approve
| ID | Change | Forbidden |
|----|--------|-----------|
| MOB-NOTIF-01a | `index.tsx`: remove static `import * as Notifications`; badge only via safe helper; no-op Expo Go + web | No push rewrite · no remove PushNotificationsBridge |
| MOB-NOTIF-01b | `usePushNotifications.tsx`: do not call remote APIs / setNotificationHandler on Expo Go (`StoreClient`) | No invent new push stack · keep UV-03 device UNVERIFIED |

## Success
- Grep: no static Notifications import in `index.tsx`
- `isExpoGo` / StoreClient guard remains
- mobile-resilience + production-wiring PASS

## EXECUTE now
Director lands with redistribute docs.
