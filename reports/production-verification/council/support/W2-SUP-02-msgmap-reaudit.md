# W2-SUP-02 — Messenger/maps re-audit (AUD-MSGMAP-REAUDIT)

**Seat:** Idle / Support (Owner-requested re-audit of this seat’s prior work)  
**Tip:** `cursor/final-production-acceptance-e37c` @ `34aef42`  
**Date:** 2026-07-31  
**Mode:** Evidence only — no code. Does **not** replace Auditor AUD-20→25.

Charter §4 labels items ACCEPTED; Owner asked for first-principles re-check. This packet is that check against **tip code**.

---

## A — Owner early mandates

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| R0-01 | No WebSocket client in mobile chat | **PASS** | No WS client under `banco-mobile`; thread `refetchInterval: 3000` in `messages/[id].tsx` |
| R0-02 | No feature deletion to simplify (spot) | **UNVERIFIED** | Needs full product diff vs pre-wave; not executed as binary diff this packet |
| R0-03 | Soft-hide Hide copy (inbox+thread) | **PASS** | `messages.tsx` `handleHide` + `chat.hide*`; thread hide sheet; guard bans `handleDelete` |
| R0-04 | Icons via `@/components/icons` on touched files | **UNVERIFIED** | Spot-check FilterSheet/messages use `@/components/icons`; not whole-tree |
| R0-05 | Materials/filters/MiniAppBottomNav not erased by this seat | **PASS** (spot) | Section apps still use MiniAppBottomNav; filters present |
| R0-06 | Secrets never committed | **PASS** (spot) | No secret paste in this seat’s PRs; Coolify path documented |

## B — Messenger

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| R1-01 | listingId/role listing→chat / company / inbox | **PASS** | messenger-wiring-guard + inbox params |
| R1-02 | Soft-send seeds cache on POST | **PASS** | `[id].tsx` MSG-06 `setQueryData` before soft refetch |
| R1-03 | Thread limit + before older pages | **PASS** | `THREAD_PAGE=400`; `before: oldest.id`; ConversationService |
| R1-04 | newest-id mark-read mobile | **PASS** | `newestId` / `lastNewestIdRef` in thread |
| R1-04b | newest-id mark-read website | **PASS** | `MessageThreadPanel` `lastNewestIdRef` (absorbed tip lineage) |
| R1-05 | Report abuse ticket + soft-hide | **PASS** | createSupportTicket abuse; deleteConversation hide |
| R1-06 | Video/audio openable + video picker | **PASS** | Linking.openURL; mediaTypes images+videos; guards |
| R1-07 | MSG-05 not claimed done | **PASS** | Poll-only; Wave2 forbids WS |

## C — Notifications

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| R2-01 | Message role stamp | **PASS** | ConversationService + routing guards |
| R2-02 | Soft sign-out unregister push | **PASS** | NOTIF-03 guard |
| R2-03 | DeviceNotRegistered-only prune | **PASS** | PushService `isDeadDeviceError`; guard |
| R2-04 | Device delivery certified | **UNVERIFIED** | OPS/EAS — Owner Coolify/EAS proof required |

## D — Maps / search honesty

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| R3-01 | Latch + Leaflet inline + nearest gate | **PASS** | mapLatch; mapVendorInline; FilterSheet nearestNeedsNearMe |
| R3-02 | Server nearest without coords honesty | **OPEN** | SearchService still soft-falls to recommended if raw API; client gated |
| R3-03 | No draw-area / offline OSM claim | **PASS** | MAP-08b / MAP-07b still deferred in docs |

## E — Process

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| R4-01 | #30 superseded after #32 merge | **OPEN** | #32 not merged to main yet; #30 still OPEN |
| R4-02 | #34/#38 evidence only | **PASS** | This seat docs-only on support branch |
| R4-03 | No feature commits without Chair | **PASS** | This packet docs-only |

---

## Summary for Chair

| Result | Count |
|--------|------:|
| PASS | 18 |
| UNVERIFIED | 3 |
| OPEN | 3 |
| FAIL | **0** |

**Recommendation:** Accept messenger/maps tip landings as **code-verified** for listed PASSes. Do **not** stamp device push or live cutover. Optional Reliability: server hard-fail `sort=nearest` without coords (R3-02) — needs Approve Plan. Close #30 after #32 merges (R4-01).

**Honesty:** This is a support re-audit, not a substitute for Auditor AUD-20→25. Visual AUD-08/24 remains UNVERIFIED without Owner screenshots.
