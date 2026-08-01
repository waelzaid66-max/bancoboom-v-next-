# W4-REL — Zone D: Thread · Notifications routing · Auth journeys

**Seat:** Reliability (static verify only — evidence, no repairs)  
**Wave order:** `67-MOBILE-SUCCESS-AUDIT-WAVE4.md` §5 Reliability item 2  
**Tip branch:** `cursor/final-production-acceptance-e37c` (PR **#32**)  
**Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05` (`git rev-parse HEAD` @ `/workspace`)  
**Method:** L1 static wiring under `artifacts/banco-mobile/` only. No device run. No code changes.  
**Status legend:** `HEALTHY` | `RISK` | `DEFECT` | `UNVERIFIED_VISUAL`  
**Severity (RISK/DEFECT only):** `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`  
**Frozen / do-not-fight:** Charter §4 frozen items; MSG-05 WebSocket; no inventing visuals; no reopen of Zone A Messages HEALTHY without contradicting tip evidence.

---

## MOB-D-01 — Messages list tab

- **Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05`
- **Route:** `/(tabs)/messages` — file `artifacts/banco-mobile/app/(tabs)/messages.tsx`; tab registered `app/(tabs)/_layout.tsx:307`; unread badge from `useListConversations` when signed in — `_layout.tsx:106-114`, `:217`, `:265-284`
- **Primary CTAs (testID → destination):**
  | testID / control | destination / effect |
  |---|---|
  | `messages-signin` | `/(tabs)/profile` — `messages.tsx:145-156` |
  | `conversation-{id}` | `/messages/[id]` with `id`, `name`, `listingId`, `role` — `:165-175`, `:187` |
  | Long-press hide | `deleteMut` soft-hide + `t("chat.*")` Alert — `:77-101` |
  | `messages-retry` | `query.refetch()` — `:283-294` |
  | `messages-browse` | `/(tabs)/search` — `:305-316` |
- **Auth gate:** Full unsigned wall — lock icon + `t("messages.signIn*")` + CTA to Profile — `:133-159`. List query `enabled: !!isSignedIn` — `:60-67`.
- **Empty / loading / error:** Loading skeletons `:265-276`; error + retry `:277-295`; empty inbox + browse CTA `:296-317`.
- **Connections:** `useListConversations` / `useDeleteConversation` / `getListConversationsQueryKey`; thread stack screen `app/_layout.tsx:307-309` → `app/messages/[id].tsx`.
- **Status:** HEALTHY
- **Severity:** n/a
- **Server backstop?** YES (conversations API requires auth; client also hard-gates unsigned)
- **Evidence (path:line):** `artifacts/banco-mobile/app/(tabs)/messages.tsx:60-67`, `:133-159`, `:165-175`, `:265-317`; `artifacts/banco-mobile/app/(tabs)/_layout.tsx:106-114`, `:307`; `artifacts/banco-mobile/app/_layout.tsx:307-309`
- **Recommended owner:** none
- **Repair shape:** none — aligns with Chair Zone A MOB-A-04 HEALTHY; no contradicting tip evidence.

---

## MOB-D-02 — Conversation / thread screen

- **Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05`
- **Route:** `/messages/[id]` — `artifacts/banco-mobile/app/messages/[id].tsx`; Stack `app/_layout.tsx:307-309`
- **Primary CTAs (testID → destination):**
  | testID / control | destination / effect |
  |---|---|
  | `thread-back` | `router.back()` — `[id].tsx:1009-1013` |
  | `thread-mark-sold` | seller-only when `role=seller` + `listingId` — `:118-121`, `:1027-1057`, `:648+` |
  | `thread-retry` | `query.refetch()` — `:1078-1089` |
  | `thread-load-older` | `getMessages` with `before=` (MSG-07b) — `:1138-1147` |
  | `message-send` / `message-input` / `message-attach` / `message-emoji-toggle` | optimistic `sendMessage` / media / emoji — `:1217-1293`, deliver `:326-377` |
  | `message-share-listing` / `message-offer` | listing chrome when `listingId` present — `:1232-1242` |
  | `chat-listing-{id}` | `/listing/{id}` — `:751-760` |
  | `offer-accept-*` / `offer-decline-*` | quote-reply accept/decline — `:862-871` |
  | `action-reply` / `action-copy` / `action-report` / `action-hide-thread` | sheet actions; hide → `deleteConversation` + `router.back()` — `:1545-1592`, `:495-509` |
  | `react-{emoji}` | allowlisted reactions mirroring server — `:54-56`, `:1532` |
- **Auth gate:** **No client `useAuth` / `isSignedIn`.** Query `enabled: !!conversationId` only — `:161-171`. Unsigned / unauthorized deep-link relies on API failure → error UI (`query.isError && !query.data`) — `:1072-1090`. Composer remains mounted below error/list (send fails → pending `failed`) — `:369-373`, input bar `:1197+`.
- **Empty / loading / error:** Loading spinner `:1068-1071`; error + `thread-retry` `:1072-1090`; empty thread `t("messages.threadEmpty")` `:1150-1162`; older-page spinner / load CTA `:1133-1148`.
- **Connections:** Inbox params `id`/`name`/`listingId`/`role` — messages list `:165-175`; listing `openInAppChat` forwards same — `listing/[id].tsx:544-552`; company DM same contract — `business/company/[id].tsx:76-84`; push/in-app message type via `routeForNotification` — `notificationRouting.ts:21-34`. Poll + mark-read + React Query keys as above.
- **Status:** RISK
- **Severity:** LOW
- **Server backstop?** YES — messages/send/read/delete require authenticated session; client surfaces error/failed send rather than silent success.
- **Evidence (path:line):** `artifacts/banco-mobile/app/messages/[id].tsx:108-121`, `:161-171`, `:326-377`, `:1009-1162`, `:1197-1293`; `artifacts/banco-mobile/app/_layout.tsx:307-309`; entry params `artifacts/banco-mobile/app/(tabs)/messages.tsx:165-175`; `artifacts/banco-mobile/app/listing/[id].tsx:544-552`; `artifacts/banco-mobile/app/business/company/[id].tsx:62-84`
- **Recommended owner:** Auditor/none (policy consistency with Messages/Notifications destination walls — not a wiring DEFECT; server backstop present; do not expand into MSG-05)
- **Repair shape:** none this wave unless Chair Approve Plan for an explicit unsigned lock on `/messages/[id]` mirroring list/notifications. Do not invent visual defects; do not touch frozen items.

---

## MOB-D-03 — Notifications screen + `routeForNotification`

### MOB-D-03a — Notifications feed screen

- **Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05`
- **Route:** `/notifications` — `artifacts/banco-mobile/app/notifications.tsx`; Stack `app/_layout.tsx:310-313`
- **Primary CTAs (testID → destination):**
  | testID / control | destination / effect |
  |---|---|
  | `notifications-back` | `router.back()` or `replace("/(tabs)")` — `:139-149` |
  | `notifications-mark-all` | `markNotificationsRead({})` — `:105-114`, `:155-160` |
  | `notifications-settings` | `/settings` — `:162-169` |
  | `notifications-signin` | `replace("/(tabs)/profile")` — `:186-197` |
  | `notifications-retry` | `query.refetch()` — `:272-283` |
  | `notification-{id}` | `routeForNotificationItem(n)` then `router.push(dest)` — `:116-124`, `:207-217` |
- **Auth gate:** Unsigned lock + Profile CTA — `:174-200`. Query `enabled: !!isSignedIn` — `:86-93`.
- **Empty / loading / error:** Loading `ActivityIndicator` `:262-265`; error + retry `:266-284`; empty copy `:285-294`; pull-to-refresh `:302-303`.
- **Connections:** Shared SoT `routeForNotification` / `routeForNotificationItem` — `lib/notificationRouting.ts`; Feed bell → `/notifications` (Zone A); mark-read invalidates `getListNotificationsQueryKey`.
- **Status:** HEALTHY
- **Severity:** n/a
- **Server backstop?** YES (list/mark-read auth-gated)
- **Evidence (path:line):** `artifacts/banco-mobile/app/notifications.tsx:86-93`, `:116-124`, `:139-200`, `:262-308`; `artifacts/banco-mobile/app/_layout.tsx:310-313`
- **Recommended owner:** none
- **Repair shape:** none

### MOB-D-03b — `routeForNotification` SoT (+ push tap)

- **Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05`
- **Route:** N/A (lib helper) — `artifacts/banco-mobile/lib/notificationRouting.ts`
- **Primary CTAs (testID → destination):** N/A — destinations by type/payload:
  | type / condition | Href |
  |---|---|
  | `message` + `conversation_id` | `/messages/[id]` (+ optional `listingId`, stamped `role`) — `:21-34` |
  | `rfq` + `rfq_id` | `/rfq/[id]` — `:37-38` |
  | `investment` + `investment_id` | `/business/investments/[id]` — `:41-45` |
  | `global_supply` + `request_id` | `/business/global-supply/[id]` — `:48-52` |
  | `booking` | `/bookings` + `role` guest|host — `:57-64` |
  | payment / subscription | `/billing` — `:67-72` |
  | `car_import` | `/import/order/[id]` or `/import-tracking` — `:78-82` |
  | `financing_lead_id` | `/business/banks` — `:87-88` |
  | `listing_id` fallback | `/listing/[id]` — `:92-93` |
  | `review` (no listing) | `/(tabs)/profile` — `:96-97` |
  | `system` follower / `open_notifications` | `/notifications` — `:102-103` |
  | NOTIF-09 unknown/incomplete | `/notifications` (never null) — `:106-108` |
- **Auth gate:** N/A at router; push registration only when signed-in + notifications enabled — `usePushNotifications.tsx:138-205`. Tap handler shares SoT — `:71-90`, `:207-215`.
- **Empty / loading / error:** Cold-start `navigateWhenReady` retry — `:59-66`; Expo Go / web / sim degrade silent — `:36-37`, `:93-97`.
- **Connections:** In-app feed `routeForNotificationItem` — `notifications.tsx:26`, `:121-122`; push `routeForNotification` — `usePushNotifications.tsx:14`, `:88`. Guards: `tests/notification-routing.test.mjs`, `tests/mobile-resilience.test.mjs:50-84`, `tests/production-wiring-guard.test.mjs:186-193`. Prior W1-AUD-06 ALREADY_FIXED_ON_TIP — do not reopen.
- **Status:** HEALTHY
- **Severity:** n/a
- **Server backstop?** YES (payload stamps from server; unknown → feed fail-closed)
- **Evidence (path:line):** `artifacts/banco-mobile/lib/notificationRouting.ts:15-117`; `artifacts/banco-mobile/hooks/usePushNotifications.tsx:59-90`, `:138-215`; `artifacts/banco-mobile/app/notifications.tsx:116-124`; `artifacts/banco-mobile/tests/notification-routing.test.mjs:13-115`; `artifacts/banco-mobile/tests/mobile-resilience.test.mjs:50-84`
- **Recommended owner:** none
- **Repair shape:** none — do not invent enum routes without server stamps; combinatorial device matrix remains Zone G / UNVERIFIED_VISUAL.

---

## MOB-D-04 — Auth journeys relevant to messaging

- **Tip SHA:** `3a234ef267efa142bdcd730002814e2089f76d05`
- **Route:** Cross-cutting (Messages unsigned gate · listing/company chat entry · soft sign-out / push unregister)
- **Primary CTAs (testID → destination):**
  | Journey | Evidence |
  |---|---|
  | Unsigned Messages tab | lock + `messages-signin` → Profile — `messages.tsx:133-159` |
  | Unsigned Notifications | lock + `notifications-signin` → Profile — `notifications.tsx:174-200` |
  | Listing guest wall (blocks chat CTA surface) | `isLoaded && !isSignedIn` wall + `listing-guest-signin` → Profile — `listing/[id].tsx:589-668`; signed `openInAppChat` → thread with listingId/role — `:520-561` |
  | Company DM unsigned | `!isSignedIn` → Profile before `createConversation` — `business/company/[id].tsx:62-67` |
  | Soft ACCOUNT_DELETED (NOTIF-03) | `setAuthFailureHandler` → unregister push then `signOut` — `app/_layout.tsx:119-138` |
  | Explicit sign-out (Profile menu) | `unregisterCachedPushTokenBestEffort` then `signOut` — `profile.tsx:1264-1273` |
  | Explicit sign-out (Settings) | same unregister-before-signOut — `settings.tsx:474-485`; helper `lib/unregisterPushBestEffort.ts:9-18` |
  | Push bridge signed-out path | local cache clear only; comment requires unregister **before** `signOut` — `usePushNotifications.tsx:195-200` |
- **Auth gate:** Messages/Notifications destination walls present. Listing/company gate chat entry. Thread itself lacks client unsigned wall (see MOB-D-02 RISK LOW). AuthGate modal (`useAuthGate`) is Feed/Search listing-open chokepoint — not used on Messages tab (intentional destination-gate pattern per Zone A).
- **Empty / loading / error:** Covered on list/notifications; soft-delete sign-out is best-effort (catch still signs out) — `_layout.tsx:131-134`.
- **Connections:** QueryClient clear on `userId` change prevents cross-user message/notif bleed — `_layout.tsx:112-117`. Guard: `tests/production-wiring-guard.test.mjs:181-184` (NOTIF-03).
- **Status:** HEALTHY
- **Severity:** n/a
- **Server backstop?** YES (`ACCOUNT_DELETED` 401; push unregister; conversation APIs auth-required)
- **Evidence (path:line):** `artifacts/banco-mobile/app/(tabs)/messages.tsx:133-159`; `artifacts/banco-mobile/app/notifications.tsx:174-200`; `artifacts/banco-mobile/app/listing/[id].tsx:520-561`, `:589-668`; `artifacts/banco-mobile/app/business/company/[id].tsx:62-84`; `artifacts/banco-mobile/app/_layout.tsx:112-138`; `artifacts/banco-mobile/app/(tabs)/profile.tsx:1264-1273`; `artifacts/banco-mobile/app/settings.tsx:474-485`; `artifacts/banco-mobile/lib/unregisterPushBestEffort.ts:9-18`; `artifacts/banco-mobile/hooks/usePushNotifications.tsx:195-200`; `artifacts/banco-mobile/tests/production-wiring-guard.test.mjs:181-184`
- **Recommended owner:** none
- **Repair shape:** none — soft sign-out push path already tip-wired; do not fight #32 unregister-before-signOut contract.

---

## Visual layer (Zone D)

- **Status:** UNVERIFIED_VISUAL
- **Note:** No screenshots/device captures attached this packet. Per Wave 4 §0/§1: do not invent pixel defects.

---

## Rollup

| ID | Surface | Status | Severity | Server backstop | Owner |
|----|---------|--------|----------|-----------------|-------|
| MOB-D-01 | Messages list tab | HEALTHY | — | YES | none |
| MOB-D-02 | Conversation / thread | RISK | LOW | YES | Auditor/none |
| MOB-D-03a | Notifications screen | HEALTHY | — | YES | none |
| MOB-D-03b | `routeForNotification` + push | HEALTHY | — | YES | none |
| MOB-D-04 | Messaging auth + soft sign-out | HEALTHY | — | YES | none |
| D-visual | Device screenshots | UNVERIFIED_VISUAL | — | n/a | Owner/device |

**Zone D L1 verdict:** No DEFECT with clear wrong-destination / missing-gate-without-backstop wiring. One **RISK LOW** (thread lacks client unsigned wall; API backstop yes). No Reliability repair recommended without Chair Approve Plan. Absorb into #32 docs only.
