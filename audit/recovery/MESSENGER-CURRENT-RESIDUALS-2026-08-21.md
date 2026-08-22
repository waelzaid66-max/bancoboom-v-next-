# MESSENGER — CURRENT RESIDUAL FORENSIC

Date: 2026-08-21
Repository: `waelzaid66-max/bancoboom-v-next-`
Canonical evidence base: `canonical/vnext-assembly@4f2c81cc553938e808a98adb84d00ecfc76732c5`
Audit branch: `audit/cross-repo-continuation-20260821`
Mode: FORENSIC ONLY — NO PRODUCT CODE CHANGE
Production decision: NO-GO

## 1. PURPOSE

This report rechecks the Messenger state after VNX-02 / VNX-03 / VNX-07A / VNX-07B and separates:

1. integrity work that is genuinely present in CURRENT source;
2. runtime/device/provider proof that is still missing;
3. capabilities that remain intentionally pending under VNX-07C;
4. newly identified lifecycle/scalability defects that are not merely missing features.

No historical COMPLETE label is treated as device/live production proof.

---

# 2. CURRENT MESSENGER FOUNDATION — PRESERVE

## 2.1 Server message idempotency is real

CURRENT `ConversationService` accepts a stable client UUID for one logical send. Before mutable validation/rate/storage work it looks for the same `(conversation, sender, client_message_id)` and returns the original durable message when found.

The DB also has a unique index on exactly that tuple, so a concurrent race elects one message rather than duplicating unread counters/notification events.

This applies to the server send contract generally, not text only: text, attachment, reply and listing-share payloads all pass through the same `sendMessage` authority.

## 2.2 Send/read serialization and unread projection are present

Conversation send and mark-read operate against a participant-locked conversation row. VNX-07B's source implementation is present in canonical ancestry.

Do not rewrite this mechanism when fixing later Messenger features.

## 2.3 Notification dispatch durability is present

The message and message-notification outbox marker are committed transactionally. The worker has:

- message-key idempotency;
- per-channel checkpoints;
- retry backoff;
- in-app thread cooldown suppression;
- global notification preference check for email.

Therefore a process stop after the message transaction may delay notification delivery, but the source work item is not intentionally lost.

## 2.4 First-party chat media is private

The server checks upload ownership and media policy, creates an immutable private final identity before the durable message reference, and serves the object through conversation-participant authorization.

Do not make chat media public to simplify rendering.

## 2.5 Thread history pagination exists

Mobile fetches a bounded newest window and explicitly loads older messages by cursor. The server handles same-timestamp cursor ordering using `(created_at, id)` and validates the anchor inside the same conversation.

## 2.6 Normal body-text has a durable client outbox

`MessageOutboxContext` is account-bound, persisted in AsyncStorage, session/identity guarded, biometric/app-state aware, retry-capable, and uses stable `client_message_id` values.

This is the VNX-07A boundary. It must not be overstated as a universal Messenger outbox.

---

# 3. CURRENT DEFECTS / RISKS

## MSG-LIN-01 — HARD LISTING DELETE CASCADES THROUGH CONVERSATIONS AND MESSAGE HISTORY

Status: CONFIRMED DATA-LIFECYCLE DEFECT / POLICY BREAK
Severity: P1 / HIGH
Boundary: Listings → Messenger persistence

### Source chain

The DB schema defines:

- `conversations.listing_id` → `listings.id` with `ON DELETE CASCADE`;
- `messages.conversation_id` → `conversations.id` with `ON DELETE CASCADE`;
- message notification outbox rows also cascade from the message/conversation.

At the same time, current listing management exposes true hard deletion (`deleteListing()` and dealer bulk `delete`).

Therefore deleting one listing can physically delete all conversations rooted in that listing and then all messages in those conversations.

### Why this is inconsistent with CURRENT Messenger semantics

Messenger's own user-facing "delete conversation" does NOT hard-delete the conversation. It intentionally soft-hides only the requesting participant's copy, preserves the counterparty's thread, and allows a later message to surface the thread again.

`createConversation()` also states that withdrawn/flagged inventory should not allow a new thread while existing participant threads remain readable.

A hard listing delete currently bypasses that preservation model at the FK layer.

### Additional impact

- Buyer and seller can lose negotiation history because the seller deletes inventory.
- Existing reply/reaction/read history disappears.
- Pending message-notification rows disappear with the cascade.
- Private chat-media DB references disappear without a corresponding listing-delete chat-media cleanup path, creating storage-orphan risk.
- Any other feature that treats an existing conversation as proof of prior interaction can lose that evidence.

### Required repair characteristics

Do not simply remove all cascades without designing listing identity after deletion.

The repair needs an explicit durable-thread model. Safe patterns include a retained listing tombstone/snapshot reference or nullable historical listing linkage, but the exact model must be chosen against product/retention law.

Required invariant: seller inventory deletion must not silently erase the counterparty's Messenger history unless there is an explicit, authorized retention policy saying that it must.

Add a PostgreSQL journey that creates listing → conversation → messages → hard-deletes listing and asserts the intended conversation/message/history behavior.

Production consequence: BLOCKING until policy and data behavior are explicit.

---

## MSG-LIN-02 — NON-NORMAL-TEXT SENDS ARE NOT IN THE DURABLE MOBILE OUTBOX

Status: CONFIRMED CAPABILITY / RESILIENCE GAP
Severity: P1 / MEDIUM-HIGH for weak-network mobile UX
Boundary: mobile producer → persisted retry state

The durable root outbox has only `enqueueText({ conversationId, clientMessageId, body })` and stores `MessageTextOutboxEntry`.

The normal composer body-text path uses it only when there is no reply target.

The following remain screen-local/in-memory send flows:

- reply text;
- image;
- video;
- listing share;
- any future audio/voice payload.

They still use stable `client_message_id` on the server, so ordinary retry within the same screen is idempotent. This is good and must be preserved.

But the client's pending operation itself is not durable across app/process restart.

Example boundary:

1. media is picked/uploaded;
2. the pending message exists only in screen state;
3. app/process dies before a durable successful send is observed;
4. the root text outbox cannot resume that logical send.

The server idempotency foundation prevents duplicates when the same UUID is reused; the missing part is durable client persistence of the non-text logical operation and its upload/finalization state.

This is exactly the distinction VNX-07C must preserve: do not claim VNX-07A completed all send types.

---

## MSG-LIN-03 — BLOCK CAPABILITY IS ABSENT FROM CURRENT RUNTIME AUTHORITY

Status: CONFIRMED MISSING CAPABILITY
Severity: P1 / SAFETY-PRODUCT GAP if block is release scope

Current conversation routes expose:

- list/create conversation;
- soft-hide conversation;
- get/send messages;
- react;
- mark read.

No current block endpoint, block relationship table/field, participant-send guard, or mobile block control was found.

That means an existing participant relationship remains sendable subject to ordinary auth/rate/abuse controls. There is no user-level "this participant may no longer message me" authority.

Do not fake block client-side. If delivered, it must be a server authorization rule checked by send/create/contact surfaces as appropriate.

---

## MSG-LIN-04 — PER-THREAD MUTE IS ABSENT; NOTIFICATION WORKER CANNOT HONOR IT

Status: CONFIRMED MISSING CAPABILITY
Severity: P2 / PRODUCT GAP unless required for launch

Current notification preferences are type-level/global. Message notification processing checks global channel preference and cooldown but no conversation-specific mute state.

No current conversation participant mute field/table/endpoint was found.

Therefore adding a mute icon to mobile without persistence and worker enforcement would be cosmetic and incorrect.

A real mute design must specify whether it suppresses:

- push/in-app notification creation;
- email;
- badge unread count;
- all or selected channels;
- duration or permanent state.

Unread message state should normally remain truthful even when delivery alerts are muted; do not silently equate mute with read.

---

## MSG-LIN-05 — VOICE CONTRACT/RENDER PATH EXISTS, BUT NO CURRENT VOICE RECORDER PRODUCER

Status: PARTIAL CAPABILITY
Severity: P2 / VNX-07C GAP

The API and DB can represent `media_kind = audio`, the server accepts/private-finalizes audio media, notifications have voice preview copy, and mobile can infer/render an audio attachment as an externally-opened media item.

However no current mobile recording stack/producer was found (no voice recording lifecycle that records, previews, cancels, uploads and sends an audio message).

Therefore "voice messages supported" would be an overclaim. The lower transport/contract pieces exist; the primary UX producer is missing.

Any future implementation also belongs under the durable non-text design in MSG-LIN-02 rather than creating a third independent retry model.

---

## MSG-LIN-06 — NO REALTIME/TYPING TRANSPORT; CURRENT PRODUCT IS POLLING

Status: CONFIRMED CURRENT ARCHITECTURE / PENDING CAPABILITY
Severity: P2 unless realtime is mandatory launch scope

Current mobile thread polls messages every 3 seconds.

Inbox polls the full conversation list every 8 seconds while focused, while the tab layout polls the same conversation-list query every 15 seconds for the unread badge.

No current typing event transport or typing state authority was found, and no current WebSocket/SSE realtime Messenger path was identified in this wave.

This must be described honestly as polling, not realtime.

Do not replace stable polling just to satisfy a label unless realtime/typing is an explicit owner launch requirement; if implemented, preserve idempotent server writes and polling fallback behavior.

---

## MSG-LIN-07 — CONVERSATION INBOX API IS UNBOUNDED AND REFETCHED REPEATEDLY

Status: CONFIRMED SCALABILITY RISK
Severity: P1 / MEDIUM-HIGH for high-volume seller/dealer accounts
Boundary: API query shape → mobile polling cost

`listConversations(clerkId)` currently returns every visible conversation for the user in one query. The route accepts no pagination cursor/limit.

The service then additionally loads counterparties/presence and listing thumbnails across that whole result.

Mobile consumers repeatedly request that complete set:

- Messages tab: every 8 seconds while focused;
- tab unread badge: every 15 seconds while signed in.

For ordinary consumers this can look fine. For a dealer/company account with a large historical inbox, response size, DB work, `IN (...)` thumbnail lookup, JSON processing and radio/network cost grow without a bound.

This is a production-scale issue, not evidence that current small-data UI is broken.

### Required repair characteristics

Do not break the unread badge while paginating the inbox.

A mature design needs:

- cursor-paged conversation list;
- a separate cheap unread aggregate or equivalent metadata authority;
- deterministic recency ordering;
- no full-history polling merely to compute the badge;
- website/mobile/generated-client parity;
- load tests with high-volume dealer histories.

---

# 4. CURRENT FEATURES VERIFIED AS PRESENT, NOT RESIDUALS

The following should not be reopened as if missing:

- create/list conversation;
- unread counters;
- mark read;
- stable client message IDs;
- idempotent retry at server/DB level;
- transactionally enqueued notification work;
- private first-party chat attachments;
- image/video attachment producer;
- reply/quote;
- emoji reactions;
- shared listing cards;
- long-thread message pagination;
- soft-hide conversation semantics;
- presence privacy decision and rendered presence states;
- message reporting/support path;
- seller mark-sold affordance when opened in seller listing context;
- normal body-text durable mobile outbox.

These are still subject to final exact-SHA/device/provider verification; presence in source is not the same as production certification.

---

# 5. REQUIRED EXECUTABLE JOURNEYS

Before Messenger can be certified on a final candidate SHA:

1. PostgreSQL two-account send → retry same UUID → one durable message, one unread increment, one notification work item.
2. Concurrent send/read serialization journey.
3. Reconnect/app-restart normal-text outbox journey on physical device.
4. Media send with real object storage → recipient authenticated read → unauthorized third-party deny.
5. App termination during image/video/reply send → behavior explicitly verified after durable non-text implementation.
6. Listing delete while thread exists → intended history-retention behavior.
7. Blocked participant send/create negative journeys after block implementation.
8. Muted thread notification behavior after mute implementation.
9. High-volume conversation-list pagination/load test.
10. Android and iOS physical device thread: image/video, reactions, reply, listing share, unread/read, offline/reconnect.
11. Push/email provider delivery and dedupe on real staging configuration.
12. Exact-SHA CI with executable steps.

---

# 6. PRIORITY

Global release priority still starts with Gate-1 PostgreSQL baseline adoption P0.

Within Messenger, the recommended order is:

1. MSG-LIN-01 — decouple hard listing delete from destructive chat-history loss.
2. MSG-LIN-02 — generalize durable client operation model for reply/media/share/voice.
3. MSG-LIN-03 — server-authoritative block.
4. MSG-LIN-04 — server-authoritative per-thread mute.
5. MSG-LIN-07 — paginated inbox + cheap unread aggregate.
6. MSG-LIN-05 — voice producer built on the durable non-text model.
7. MSG-LIN-06 — realtime/typing only if launch scope requires it, with polling fallback.

Do not combine all seven into one rewrite. They cross different persistence and authority boundaries and require separate rollbackable batches.

---

# 7. FINAL VERDICT

Messenger core send/read integrity: PRESENT / SUBSTANTIAL
Normal text durability: PRESENT
Server idempotency for all current send payloads: PRESENT
Notification dispatch durability: PRESENT
Private chat-media authority: PRESENT
Long-thread pagination: PRESENT
Hard listing-delete chat-history safety: BROKEN / UNDEFINED
Durable non-text client send lifecycle: INCOMPLETE
Block: MISSING
Per-thread mute: MISSING
Voice producer: MISSING / lower layers partial
Realtime/typing: NOT PRESENT; polling is current architecture
Inbox scalability: UNBOUNDED / OPEN
Provider/device/exact-SHA proof: OPEN

Production: NO-GO

No Product code changed in this report.
