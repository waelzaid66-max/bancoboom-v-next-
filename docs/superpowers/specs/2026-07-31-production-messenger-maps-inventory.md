# Production inventory — messenger, notifications, maps (2026-07-31)

**Branch:** `cursor/production-wiring-messenger-maps-1e3d`  
**Rule:** No deletes of product features — complete wiring, report every gap, fix blockers first.  
**Related open drafts (do not close/forget):** #12 #15 #17 #18 #19 #20 #21 #22 #25

## Wave status (this branch)

### Wave 4 (audit hardening)
MSG-07b sliding-window absorb + newest-id mark-read + older-load gate · MSG-14 media open · MSG-08 report+hide · NOTIF-04 receipts · NOTIF-08 label · hub support copy · merge main

### Wave 5 (precision audit + MSG-14b)
Near-bottom autoscroll · Android prepend gate · hide copy honesty · poll-wins dedupe · before cursor id tie-break · DeviceNotRegistered-only prune · chat video picker

### Wave 6 (precision + maps)
MSG-07b P1 scroll/prepend/anchor · MAP-07 vendored Leaflet · MAP-08 `nearest` sort · MAP-10 bridge guards

### Wave 7 (honesty + website parity + sibling ledger)
Inbox hide copy · nearest gated on Near me · website thread media/mark-read/soft-send · offer state hoist · Discover inventory truth · delivery ledger for sibling agent


| ID | Problem | Severity | Status |
|----|---------|----------|--------|
| MSG-01 | Listing→chat dropped `listingId`/`role` (share/offer unwired) | High | **Fixed** |
| MSG-02 | Company→chat same drop | High | **Fixed** |
| MSG-03 | Assistant→chat no `listingId` forward | Medium | **Fixed** (role never invented) |
| MSG-04 | Docs claimed WebSocket; chat is poll-only G47 | Medium | **Fixed** (`DEPLOY_COOLIFY.md`) |
| MSG-06 | Send OK + refetch fail → duplicate retry | High | **Fixed** (commit on POST + seed cache) |
| MSG-07 | Unbounded history every poll | High | **Fixed** (`limit`/`before` + mobile page 400) |
| MSG-09 | Thread error looks like empty chat | Medium | **Fixed** (`isError` + retry) |
| MSG-10 | Reply retry drops `reply_to_id` | Medium | **Fixed** (pending stores reply) |
| MSG-16 | No client `maxLength` (server 4k) | Low | **Fixed** (`maxLength={4000}`) |
| NOTIF-01 | Message push/in-app missing recipient `role` (mark-sold) | High | **Fixed** (server stamp + router) |
| NOTIF-03 | Soft sign-out left push token | High | **Fixed** (unregister before soft signOut) |
| NOTIF-09 | Unknown notification tap → null | Medium | **Fixed** (fallback `/notifications`) |
| MAP-01 | `?map=1` latch required page pins → Discover map stuck | High | **Fixed** (open on results) |
| MAP-02 | Web map iframe no geolocation permission | Medium | **Fixed** (`allow="geolocation"`) |
| MAP-03 | Near-me radius circle removed from `mapHtml` | High | **Fixed** (restore circle + hosts) |
| MAP-04 | `/search/map` clusters lack price/bookable | High | **Fixed** (server emits + client prefer) |
| MAP-06 | Web locate failure silent | Medium | **Fixed** (Alert parity) |
| MSG-07b | Older-page load via `before=` + sliding-window absorb | Medium | **Fixed** (audit harden) |
| MSG-11 | Email CTA path mismatch | Medium | **Fixed** (workspace messages) |
| MSG-11b | Website thread text-only; mark-read by length; no soft-send | Medium | **Fixed** (media links + newest-id + cache seed) |
| MSG-12 | Import support generic inbox | Medium | **Fixed** (support tickets) |
| MSG-15 | Inbox empty no browse CTA | Low | **Fixed** |
| MAP-05 | Web near-me null | Medium | **Fixed** (browser geolocation) |
| MAP-09 | Edit missing MapPinPicker | Medium | **Fixed** |
| NOTIF-05 | Unread capped at 100 | Medium | **Fixed** (full count) |
| NOTIF-06 | OS badge missing in push | Medium | **Fixed** |
| NOTIF-07 | Push register single-attempt | Medium | **Fixed** (backoff retry) |
| MSG-14 | Video/audio rendered as broken image | Medium | **Fixed** (openable attachment) |
| MSG-14b | Video picker still images-only | Low | **Fixed** (gallery images+videos + media_kind) |
| MSG-08 | No report-message / hide from thread | High | **Fixed** (support ticket + soft-hide) |
| MSG-08c | Inbox soft-hide labeled Delete | Medium | **Fixed** (`chat.hide*` copy; website Hide) |
| NOTIF-04 | No Expo receipt processing | High | **Fixed** (receipt prune; durable retry = 04b) |
| NOTIF-08 | “In-app” toggle also suppresses push | Medium | **Fixed** (label honesty) |
| MAP-07 | CDN Leaflet/MarkerCluster dependency | Medium | **Fixed** (inlined vendor; OSM tiles still network) |
| MAP-08 | No sort=nearest / silent fallback without near-me | Product | **Fixed** (Haversine + FilterSheet gate; draw-area = 08b) |
| MAP-10 | No map interaction guards | Low | **Fixed** (bridge locate/viewport guards) |

Guards: `test:messenger-wiring` · `test:production-wiring` · existing `test:notification-routing`

---

## A. Messenger — remaining gaps (not deleted; tracked)

| ID | Gap | Severity | Notes |
|----|-----|----------|-------|
| MSG-05 | Poll-only (3s/8s/15s) — no WS/typing/presence | Product | G47; needs Owner decision before rewrite |
| MSG-08b | No hard block-user (mutual ban) | High | Soft-hide + report exist; ban needs schema |
| MSG-13 | No per-thread mute | Medium | Global prefs only; needs schema |
| MSG-14c | Audio / voice-note recorder | Low | API accepts audio; no recorder UI yet |

**Architecture (keep):** HTTP polling · participant auth · listing-anchored conversations · inbox already passes listingId+role.

---

## B. Notifications — remaining gaps

| ID | Gap | Severity | Notes |
|----|-----|----------|-------|
| NOTIF-02 | EAS/APNs/FCM device delivery not certified | Blocker (ops) | External credentials |
| NOTIF-04b | No durable cross-process push retry queue | Medium | In-process receipt prune done |
| NOTIF-10 | API base / Clerk env required for any delivery | Blocker (ops) | Cloud/EAS secrets |

---

## C. Maps — per section

**Stack (all browse maps):** Leaflet 1.9.4 + MarkerCluster 1.5.3 **inlined** via `mapVendorInline.ts` · OSM tiles (network) · WebView/iframe · `GET /v1/search/map` · **not** react-native-maps.

| Section | Map | Latch | Sync filters | Features shown | Gaps |
|---------|-----|-------|--------------|----------------|------|
| Cars | Yes (shared) | Fixed MAP-01 | Yes | Pins, clusters, locate, near circle, filters, nearest | — |
| Real estate | Yes + Discover Explore | Fixed MAP-01 | Yes | Same + Discover CTA + section chips | Off-page open always `?focus=booking` |
| Booking/Stays | Yes (best latch) | OK | Yes | Rent filters + bookable emerald pins + near circle + StayCard overlay | — |
| Facilities | Yes | Fixed MAP-01 | Yes | Industrial tint + Discover chip | — |
| Materials | Yes + header map | Fixed MAP-01 | Yes | Industrial tint + header map + Discover chip | — |
| Car Import hub | Indirect via cars+import engine | N/A | Via cars | Cars map when `?engine=import` | No shipment geo map |

**Discover map chips:** Present in `SearchDiscover.tsx` (`exploreMapCar` / materials / factories / stays) — not missing.

### Shared map gaps (tracked, not erased)

| ID | Gap | Severity |
|----|-----|----------|
| ~~MAP-08b~~ | ~~No draw-area polygon filter~~ | ✅ **Shipped 2026-08-03** |
| MAP-07b | OSM raster tiles still require network | Medium (by design) |
| ~~MAP-11~~ | ~~Map controls drawn under MiniAppBottomNav~~ | ✅ **Fixed 2026-08-03** |
| ~~MAP-12~~ | ~~Bookable pin used a system emoji, not a drawn glyph~~ | ✅ **Fixed 2026-08-03** |

> **2026-08-03 — this table is now empty except one item that is by design.**
>
> **MAP-08b (draw area).** `GET /v1/search/map` takes a bounding box and has no
> polygon parameter, which is why this sat deferred. It ships as a split: the
> server narrows to the shape's BOX, which it genuinely supports, and the exact
> inside/outside test runs in `lib/geoArea.ts` on points already returned. Same
> answer, no invented API. The page draws and reports corners; it never decides
> what is inside, so there is one implementation of that maths and it has tests.
>
> The count is only called exact when every marker inside the shape is a single
> listing — a cluster sits at the centroid of what it holds, so one inside the
> shape can hold listings outside it. Otherwise the caption reads "N+ · zoom in
> for the exact count", and zooming resolves clusters into pins, so the exact
> number is reachable rather than withheld.
>
> **MAP-11 and MAP-12 were found from the owner's screenshots**, not from this
> ledger — the locate button was sliced in half by the bottom bar and the OSM
> attribution was buried under it, and the bookable pin borrowed a system emoji
> that renders differently on every handset. Numbered here so the ledger stays
> the whole story.
>
> **MAP-07b stays open and should.** OSM tiles are map DATA. The libraries are
> vendored locally (MAP-07); the tiles cannot be, and no map renders offline
> without a licensed offline tile pack. Not a defect — a property.

---

## D. Open draft PR ledger (do not forget)

| PR | Topic |
|----|--------|
| #12 | Phase Zero audit docs |
| #15 | Car import W3 docs upload |
| #17 | Discover no force cars |
| #18 | UI density |
| #19 | Banks honesty |
| #20 | Stay honesty |
| #21 | Messenger listing chrome (continued by this branch) |
| #22 | B-PROPERTY (+ some map/notif overlap) |
| #25 | Materials B-CORE |
| #26 | Merged production wiring wave 1–2 |
| #30 | This branch — waves 3–7 production wiring |

---

## E. Features & capabilities matrix (keep — never erase)

### Messenger
- Inbox poll 8s · thread poll 3s · tab unread 15s  
- Listing-anchored conversations · share listing card · price offer / accept-decline  
- Reactions · reply quotes · image/video attach · mark-sold (seller + listingId)  
- Soft-hide conversation (inbox + thread, honest Hide copy) · participant auth  
- Website thread: media open links · newest-id mark-read · soft-send cache seed  

### Notifications
- In-app feed · push registration (Expo) · typed deep links · mute prefs  
- Message role stamp for mark-sold · car_import / booking / billing routes  

### Maps
- Per-section browse maps · market-country framing · locate-me · near-me radius chips + **circle**  
- Page pins + server clusters · price/bookable on singles · FilterSheet sync  
- Create + edit MapPinPicker (MAP-09) · `sort=nearest` gated on Near me  
- Discover multi-section map producers (RE primary + car/materials/factories/stays chips)  
- Shared `lib/mapLatch.ts` + web near-me (`lib/nearMe.ts`) · inlined Leaflet vendor  
