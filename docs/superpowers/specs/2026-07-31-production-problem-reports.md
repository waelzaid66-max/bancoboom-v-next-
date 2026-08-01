# Per-problem reports — production wiring wave (2026-07-31)

Each item below is a standing problem report. **Nothing listed is deleted from the product** — only completed or tracked.

---

## MSG-01 / MSG-02 — Listing & company chat chrome unwired

**Symptom:** Chat from listing/company felt “updated but not connected”; Share listing / Offer missing.  
**Cause:** `router.push` dropped `listingId`/`role` while inbox passed them.  
**Fix:** Forward `res.data.listing_id` + `viewer_role` from `createConversation`.  
**Files:** `listing/[id].tsx`, `company/[id].tsx`, `messages/[id].tsx`  
**Test:** `test:messenger-wiring`  
**Status:** Fixed

---

## MSG-03 — Assistant→chat listingId

**Symptom:** Assistant open-chat ignored optional listing context.  
**Fix:** Forward `listingId` only; never invent role.  
**Status:** Fixed

---

## MSG-04 — False WebSocket docs

**Symptom:** Deploy docs claimed REST+WebSocket.  
**Fix:** Document poll-only / G47 in `DEPLOY_COOLIFY.md`.  
**Status:** Fixed

---

## MSG-06 — Duplicate send on refetch failure

**Symptom:** Message POSTed, refetch threw → bubble marked failed → retry POSTed again.  
**Cause:** `deliver()` coupled POST success to `await query.refetch()`.  
**Fix:** On POST success: drop pending, seed React Query cache from `sendMessage` response, soft-refetch (errors ignored).  
**Files:** `app/messages/[id].tsx`  
**Status:** Fixed

---

## MSG-07 — Unbounded history every poll

**Symptom:** Every 3s poll re-downloaded the entire thread.  
**Cause:** `getMessages` had no limit/cursor.  
**Fix:** Optional `limit` + `before` query params (OpenAPI + service + controller); mobile polls with `limit=400`. Website keeps full history (no limit).  
**Follow-up MSG-07b:** scroll-up older-page UI using `before=`.  
**Files:** `ConversationService.ts`, `conversationController.ts`, `openapi.yaml`, `api-client-react`, `messages/[id].tsx`  
**Status:** Fixed (page API); load-more UI tracked as MSG-07b

---

## MSG-09 — Thread error looks empty

**Symptom:** Failed thread load showed “Say hello…”.  
**Cause:** Only `isLoading` branched; error → empty list.  
**Fix:** Mirror inbox — `isError && !data` → error + Retry.  
**Status:** Fixed

---

## MSG-10 — Reply retry drops quote

**Symptom:** Failed quoted reply retried as bare body.  
**Cause:** `PendingMessage` omitted `reply_to_id`.  
**Fix:** Store + pass `reply_to_id` on send/retry (offers too).  
**Status:** Fixed

---

## MSG-16 — Client maxLength

**Symptom:** Typing past 4k failed only on server validation.  
**Fix:** `maxLength={4000}` on composer.  
**Status:** Fixed

---

## NOTIF-01 — Push/in-app message missing role

**Symptom:** Seller opening a message notification could not mark sold.  
**Cause:** Notification `data` had conversation + listing only.  
**Fix:** Server stamps `role: isBuyer ? "seller" : "buyer"`; mobile router forwards buyer|seller only (never invents).  
**Files:** `ConversationService.ts`, `notificationRouting.ts`  
**Test:** `test:production-wiring` + notification-routing append  
**Status:** Fixed

---

## NOTIF-03 — Soft sign-out left push token

**Symptom:** ACCOUNT_DELETED soft path signed out without unregistering Expo token.  
**Cause:** `_layout` AuthTokenBridge called `signOut` only; bridge clears local cache after auth dies.  
**Fix:** `unregisterCachedPushTokenBestEffort()` then `signOut`. Profile/settings paths already correct.  
**Files:** `app/_layout.tsx`  
**Status:** Fixed

---

## NOTIF-09 — Unknown tap dead

**Symptom:** Push with incomplete/unknown payload did nothing.  
**Cause:** `routeForNotification` returned `null`; `handleResponse` early-returned.  
**Fix:** Final fallback `/notifications` (typed routes unchanged).  
**Files:** `lib/notificationRouting.ts`  
**Status:** Fixed

---

## MAP-01 — Discover map latch stuck

**Symptom:** `/section/real-estate?map=1` stayed on list when page lacked pins.  
**Cause:** Latch required `hasPagePins` though server clusters need only results.  
**Fix:** Open map when `inResultsView`; clear latch on empty/error.  
**Files:** `SectionSearchApp.tsx`  
**Affects:** Cars, RE, Facilities, Materials (Stay already correct)  
**Status:** Fixed

---

## MAP-02 — Web locate blocked

**Symptom:** Locate control on web map ineffective.  
**Cause:** iframe missing `allow="geolocation"`.  
**Fix:** Add attribute on `SearchResultsMap.web.tsx`.  
**Status:** Fixed

---

## MAP-03 — Near-me radius circle missing

**Symptom:** Docs/MASTER-TRACKER claimed radius circle; map showed none.  
**Cause:** Removed in market-center restore (`a7a4b78`) while FilterSheet radius chips remained.  
**Fix:** Restore optional `near` arg on `buildMapHtml` + `L.circle`/`circleMarker`; pass from native+web hosts when near-me enabled.  
**Files:** `mapHtml.ts`, `SearchResultsMap.tsx`, `SearchResultsMap.web.tsx`  
**Status:** Fixed

---

## MAP-04 — Off-page cluster pins blank

**Symptom:** Zoomed-in single pins off the loaded page had no price / bookable tint.  
**Cause:** `MapCluster` was geo-only; client enriched only from current feed page.  
**Fix:** Server emits `price_display` / `is_bookable` / `category` for count===1; client prefers server fields, page lookup as fallback.  
**Files:** `SearchService.ts`, schemas, OpenAPI, client types, both map hosts  
**Status:** Fixed

---

## MAP-06 — Web locate silent fail

**Symptom:** Web locate deny/timeout only `console.warn`.  
**Fix:** `Alert.alert` parity with native copy.  
**Status:** Fixed

---

---

## MSG-07b — Older messages page

**Symptom:** Threads longer than 400 only showed the newest page; sliding poll window could drop the bridge between `older[]` and the newest page; mark-read keyed on length stuck at 400.  
**Fix:** Local `older[]` + `getMessages(..., { before })`; absorb vacated poll ids; gate loadOlder until first scroll-to-end; mark-read/scroll on newest message id; iOS `maintainVisibleContentPosition`.  
**Status:** Fixed

---

## MSG-11 — Email CTA path

**Symptom:** Message emails linked `/messages/:id` (mobile path on website host).  
**Fix:** `/workspace/messages/:id` (+ `/en/...` when lang=en).  
**Status:** Fixed

---

## MSG-12 — Import support generic inbox

**Symptom:** Support CTA opened empty messenger inbox.  
**Fix:** `createSupportTicket` with order context (order detail) / import category (hub). Hub copy uses `supportSentBodyHub`.  
**Status:** Fixed

---

## MSG-15 — Inbox empty browse CTA

**Fix:** Browse listings button → `/(tabs)/search`.  
**Status:** Fixed

---

## MAP-05 — Web near-me

**Fix:** Browser `navigator.geolocation` in `requestNearMeCoords` (native expo-location unchanged).  
**Status:** Fixed

---

## MAP-09 — Edit MapPinPicker

**Fix:** Optional pin tools on edit + PATCH `latitude`/`longitude` (both-or-neither).  
**Status:** Fixed

---

## NOTIF-05 — Unread capped at 100

**Fix:** SQL `count(*)` for unread; home/notifications read `meta.total`.  
**Status:** Fixed

---

## NOTIF-06 — Push badge

**Fix:** Expo payload `badge` = current unread count.  
**Status:** Fixed

---

## NOTIF-07 — Push register single-attempt

**Fix:** Backoff retries 0/2s/5s/15s.  
**Status:** Fixed

---

## MSG-14 — Non-image media as broken image

**Symptom:** Video/audio `media_url` forced through `<Image>`.  
**Fix:** Openable attachment chip via `Linking.openURL` (+ EN/AR copy).  
**Status:** Fixed (picker → MSG-14b also Fixed)

---

## MSG-08 — Report / hide

**Symptom:** No report-message or thread hide from chat sheet.  
**Fix:** Report → `createSupportTicket` category `abuse`; Hide chat → existing soft-hide `deleteConversation`.  
**Status:** Fixed (hard block-user → MSG-08b)

---

## NOTIF-04 — Expo receipts

**Symptom:** Only send-ticket `DeviceNotRegistered` pruned; APNs/FCM receipt failures ignored.  
**Fix:** Schedule `getReceipts` ~15s after ok tickets; prune dead devices.  
**Status:** Fixed (durable retry queue → NOTIF-04b)

---

## NOTIF-08 — Label honesty

**Symptom:** Toggle labeled “In-app” also muted push.  
**Fix:** Label “Alerts (in-app + push)” + settings hint; semantics unchanged by design.  
**Status:** Fixed

---

## Wave 5 — precision audit

**MSG-07b scroll yank:** Autoscroll only when near bottom; clear prepend gate on content-size (Android).  
**MSG-07b cursor:** `before` uses `(created_at, id)` tie-break + stable orderBy.  
**NOTIF-04 prune:** Only `DeviceNotRegistered` (never `InvalidCredentials`).  
**MSG-08 hide copy:** `chat.hideTitle` / `hideBody` instead of delete dialog.  
**MSG-14b:** Gallery `images`+`videos`, `uploadMediaAsset`, explicit `media_kind`, duration/size via `partitionPickedAssets`.  
**Status:** Fixed

---

## Wave 6 — higher precision + maps

**MSG-07b P1:** Do not arm `readyForOlder` on contentSizeChange; clear prepend on all-dupe pages; missing `before` anchor returns `[]`.  
**MAP-07:** Leaflet 1.9.4 + MarkerCluster inlined (`mapVendorInline.ts`); browse map + pin picker; OSM tiles remain network.  
**MAP-08:** Real `sort=nearest` (Haversine) when near_lat/lng present.  
**MAP-10:** Guards for locate_error / viewport / BANCO_MAP bridge.  
**Status:** Fixed

---

## Wave 7 — honesty + website parity

**MSG-08c:** Mobile inbox long-press uses `chat.hide*` (not Delete); website inbox copy says Hide.  
**MAP-08 gate:** FilterSheet refuses `nearest` without Near me (Alert → enable Near me); turning off Near me resets sort from nearest → recommended.  
**MSG-11b:** Website `MessageThreadPanel` opens media links, marks read by newest id, seeds cache on send (MSG-06 parity), `maxLength={4000}`, listing_ref chrome.  
**Hygiene:** Offer composer state hoisted with other `useState` in mobile thread.  
**Docs:** Inventory §C Discover chips corrected; delivery ledger for sibling agent.  
**Status:** Fixed

---

## Still open

MSG-05 / MSG-08b / MSG-13 / MSG-14c · NOTIF-02 / NOTIF-04b / NOTIF-10 · MAP-07b / MAP-08b
