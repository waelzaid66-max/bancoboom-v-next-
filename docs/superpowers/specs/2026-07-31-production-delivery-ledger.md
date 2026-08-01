# Production delivery ledger — sibling agent handoff (2026-07-31)

**Owner workstream:** messenger / maps / notifications wiring  
**Branch:** `cursor/production-wiring-messenger-maps-1e3d` · **PR:** #30  
**Sibling:** delivery / full-system inventory (stabilize) — use this ledger; do not re-invent Fixed status.

**Hard rules (do not violate):**
- No fake screenshots or vanity metrics
- No deleting product features — complete wiring or track honestly
- Materials-only when on materials; never erase filters; keep `MiniAppBottomNav`
- Icons via `@/components/icons`
- Do not invent mute/block/WS schema without Owner

---

## Fixed (verified in code + guards)

| ID | Summary |
|----|---------|
| MSG-01/02/03 | Listing/company/assistant chat chrome (`listingId`/`role`) |
| MSG-04 | Poll-only docs (no false WebSocket) |
| MSG-06 | Soft-send: commit on POST + seed RQ cache |
| MSG-07 / 07b | Paged poll + older `before=` + absorb + scroll P1s |
| MSG-08 / 08c | Report abuse ticket + soft-hide; Hide copy inbox+thread+web |
| MSG-09/10/12/15/16 | Error UI · reply retry · import support · empty CTA · maxLength |
| MSG-11 / 11b | Email → workspace messages; website media/mark-read/soft-send |
| MSG-14 / 14b | Openable video/audio + gallery video picker |
| NOTIF-01/03/05/06/07/08/09 | Role stamp · unregister · unread · badge · backoff · label · fallback |
| NOTIF-04 | Expo receipt prune (`DeviceNotRegistered` only) |
| MAP-01–07/09/10 | Latch · iframe geo · circle · clusters · web near-me · locate Alert · Leaflet inline · edit pin · bridge |
| MAP-08 | `sort=nearest` + Near-me gate (no silent recommended lie) |

**Guards:** `artifacts/banco-mobile/tests/production-wiring-guard.test.mjs` · `messenger-wiring-guard.test.mjs` · `notification-routing` (existing)

---

## Tracked / deferred (real gaps — Owner / ops / schema)

| ID | Why blocked |
|----|-------------|
| MSG-05 | WS/typing/presence — product decision (G47 poll stays until then) |
| MSG-08b | Hard block-user — needs ban schema |
| MSG-13 | Per-thread mute — needs schema |
| MSG-14c | Voice recorder UI — API ready, no recorder |
| NOTIF-02 / 10 | EAS/APNs/FCM + env secrets — ops |
| NOTIF-04b | Durable cross-process push queue |
| MAP-07b | OSM tiles require network (by design) |
| MAP-08b | Draw-area polygon filter — product deferred |

---

## Pollution cleaned this wave

| Was | Now |
|-----|-----|
| Inbox long-press labeled Delete while API soft-hides | `chat.hideTitle` / `hideThread` |
| Website “Delete conversation” for soft-hide | Hide copy (EN/AR) |
| `nearest` selectable without coords → silent recommended | Alert + require Near me; disable nearest when near-me off |
| Inventory §C claimed missing Discover map chips | Chips exist in `SearchDiscover.tsx` |
| Website thread ignored `media_url` / mark-read by length | Open links + newest-id + soft-send |
| Offer `useState` mid-component | Hoisted with other state |

---

## Do not fake

- Do not claim WebSocket chat
- Do not claim hard delete of conversations
- Do not claim nearest sort without near-me coords
- Do not claim push delivery certified without ops proof (NOTIF-02)
- Do not delete filters / mini-app nav / materials scope to “simplify” inventory

---

## Key paths

| Area | Path |
|------|------|
| Mobile thread | `artifacts/banco-mobile/app/messages/[id].tsx` |
| Mobile inbox | `artifacts/banco-mobile/app/(tabs)/messages.tsx` |
| Website thread | `artifacts/banco-website/components/workspace/MessageThreadPanel.tsx` |
| Filters / nearest | `artifacts/banco-mobile/components/search/FilterSheet.tsx` |
| Maps vendor | `artifacts/banco-mobile/components/search/mapVendorInline.ts` |
| Search nearest | `artifacts/api-server/src/services/SearchService.ts` |
| Push receipts | `artifacts/api-server/src/services/PushService.ts` |
| Spec inventory | `docs/superpowers/specs/2026-07-31-production-messenger-maps-inventory.md` |
| Per-problem reports | `docs/superpowers/specs/2026-07-31-production-problem-reports.md` |
