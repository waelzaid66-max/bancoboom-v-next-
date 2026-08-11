// Messenger Wave 1 — listing chrome param handoff (no WebSocket).
//
// Owner «محدّث وغير مربوط»: share/offer lived in the thread but listing→chat
// and company→chat dropped listingId/role. Inbox already passed them.
// G47: chat stays poll-only — this suite must never require a WS client.
//
// Run: pnpm --filter @workspace/banco-mobile run test:messenger-wiring

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listing = fs.readFileSync(path.join(root, "app/listing/[id].tsx"), "utf8");
const company = fs.readFileSync(
  path.join(root, "app/business/company/[id].tsx"),
  "utf8",
);
const inbox = fs.readFileSync(path.join(root, "app/(tabs)/messages.tsx"), "utf8");
const thread = fs.readFileSync(path.join(root, "app/messages/[id].tsx"), "utf8");
// The tabs layout carries the unread badge, which polls the same query key as
// the inbox — it is what keeps the count live once the inbox pauses off-screen.
const layout = fs.readFileSync(path.join(root, "app/(tabs)/_layout.tsx"), "utf8");
const assistant = fs.readFileSync(path.join(root, "app/assistant.tsx"), "utf8");
const appLayout = fs.readFileSync(path.join(root, "app/_layout.tsx"), "utf8");
const outbox = fs.readFileSync(
  path.join(root, "context/MessageOutboxContext.tsx"),
  "utf8",
);
const outboxCodec = fs.readFileSync(
  path.join(root, "lib/messageTextOutbox.ts"),
  "utf8",
);
const settings = fs.readFileSync(path.join(root, "app/settings.tsx"), "utf8");
const profile = fs.readFileSync(path.join(root, "app/(tabs)/profile.tsx"), "utf8");

function pushParamsWindow(src, marker) {
  const at = src.indexOf(marker);
  assert.ok(at > 0, `missing marker: ${marker}`);
  // params object typically sits within a few hundred chars after pathname.
  return src.slice(at, at + 900);
}

test("inbox → thread still passes listingId + role (reference path)", () => {
  const w = pushParamsWindow(inbox, 'pathname: "/messages/[id]"');
  assert.match(w, /listingId:\s*item\.listing_id/);
  assert.match(w, /role:\s*item\.viewer_role/);
});

test("listing → chat passes listingId + role from createConversation", () => {
  const w = pushParamsWindow(listing, "createConversation({ listing_id: id })");
  assert.match(
    w,
    /listingId:\s*res\.data\?\.listing_id/,
    "listing openInAppChat must pass listingId (unlocks share/offer)",
  );
  assert.match(
    w,
    /role:\s*res\.data\?\.viewer_role/,
    "listing openInAppChat must pass viewer_role",
  );
});

test("company → chat passes listingId + role from createConversation", () => {
  const w = pushParamsWindow(
    company,
    "createConversation({ listing_id: profile.latest_listing_id })",
  );
  assert.match(w, /listingId:\s*res\.data\?\.listing_id/);
  assert.match(w, /role:\s*res\.data\?\.viewer_role/);
});

test("thread gates share/offer on listingId (chrome that was unwired)", () => {
  assert.match(thread, /testID="message-share-listing"/);
  assert.match(thread, /testID="message-offer"/);
  assert.match(
    thread,
    /params\.listingId\s*\?[\s\S]*?message-share-listing/,
  );
});

test("assistant conversation action may forward listingId but never invents role", () => {
  const w = pushParamsWindow(assistant, 'pathname: "/messages/[id]"');
  assert.match(w, /a\.conversation_id/);
  // Optional listingId from action only.
  assert.match(w, /a\.listing_id\s*\?\s*\{\s*listingId:\s*a\.listing_id/);
  assert.doesNotMatch(w, /role:\s*/);
});

test("mobile chat stays poll-only (G47 — no WebSocket client)", () => {
  // Scan messenger surfaces for accidental WS introduction.
  for (const [label, src] of [
    ["thread", thread],
    ["inbox", inbox],
  ]) {
    assert.doesNotMatch(
      src,
      /WebSocket|new\s+WebSocket|socket\.io|useWebSocket/,
      `${label} must remain poll-only (G47)`,
    );
  }
  assert.match(
    thread,
    /refetchInterval:\s*3000/,
    "thread poll interval contract",
  );
  // The inbox still polls at 8s — but only while it is on screen. Tab screens
  // stay mounted after their first visit, so an ungated interval kept firing
  // from every other screen in the app for the rest of the session. The badge
  // in (tabs)/_layout.tsx owns the background cadence for the same query key.
  //
  // Asserting the gated form, not the bare number: the contract this guard
  // exists to protect is "poll-only at 8s", and that is intact. The off branch
  // must be exactly `false` — `isFocused ? 8000 : 8000` would read as gated and
  // poll just as hard.
  assert.match(
    inbox,
    /refetchInterval:\s*isFocused\s*\?\s*8000\s*:\s*false/,
    "inbox poll interval contract (8s while focused, paused otherwise)",
  );
  assert.match(
    layout,
    /refetchInterval:\s*\d+/,
    "the tab badge must keep its own interval — it is what stops the unread count going stale once the inbox pauses",
  );
});

test("private chat media stays in-app and sends scoped auth headers", () => {
  assert.match(thread, /useAuthenticatedMediaHeaders/);
  assert.match(thread, /authenticatedMediaSource\(mediaUrl, mediaRequestHeaders\)/);
  assert.match(thread, /FullscreenImageViewer/);
  assert.match(thread, /requestHeaders=\{mediaRequestHeaders\}/);
  assert.doesNotMatch(
    thread,
    /mediaKind === "video" \|\| mediaKind === "audio"\) \{\s*void Linking\.openURL/,
    "video must use the authenticated native viewer rather than an external public URL",
  );
});

test("MSG-06/10 deliver seeds cache and preserves reply on retry", () => {
  assert.match(thread, /setQueryData/);
  assert.match(thread, /reply_to_id\?: string/);
  assert.match(thread, /maxLength=\{4000\}/);
});

test("one logical send keeps one UUID across POST, retry, and poll reconciliation", () => {
  assert.match(thread, /import \* as Crypto from "expo-crypto"/);
  assert.match(thread, /const tempId = Crypto\.randomUUID\(\)/);
  assert.doesNotMatch(thread, /const tempId = `t-\$\{Date\.now\(\)\}`/);
  assert.match(thread, /client_message_id:\s*tempId/);
  assert.match(thread, /message\.client_message_id/);
  assert.match(thread, /committed\.has\(message\.tempId\)/);
  assert.match(thread, /deliver\(m\.tempId/);
});

test("VNX-07A persists body-only attempts under one owner-bound root processor", () => {
  assert.match(appLayout, /<MessageOutboxProvider>[\s\S]*?<AuthTokenBridge\s*\/>/);
  assert.match(outbox, /await persist\(ownerUserId, next\)/);
  assert.match(outbox, /clerkTokenBelongsToUser\(token, entry\.ownerUserId\)/);
  assert.match(outbox, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(outbox, /signal:\s*controller\.signal/);
  assert.match(outbox, /Promise\.race\(\[/);
  assert.match(outbox, /acknowledgedRef\.current\.has\(entry\.clientMessageId\)/);
  assert.match(outbox, /acknowledgementCleanupError\(error, attempt\)/);
  assert.match(
    outbox,
    /generationRef\.current !== generation[\s\S]*?purgingRef\.current[\s\S]*?response\.data\?\.client_message_id/,
  );
  assert.match(outbox, /await commitEntries\([\s\S]*?seedAcknowledgement\(entry, response\)/);
  assert.match(outbox, /response\.data\?\.client_message_id !== entry\.clientMessageId/);
  assert.match(outbox, /response\.data\?\.conversation_id !== entry\.conversationId/);
  assert.match(outbox, /biometricRef\.current\.hydrated/);
  assert.match(outboxCodec, /MESSAGE_TEXT_OUTBOX_MAX_ENTRIES = 100/);
  assert.match(outboxCodec, /MESSAGE_TEXT_OUTBOX_RETENTION_MS/);
  assert.match(outboxCodec, /serialized array order is the durable FIFO authority/);
  assert.doesNotMatch(outbox, /media_url|listing_ref_id|localUri|signed[_-]?url/i);
});

test("VNX-07A leaves replies and media on their existing paths", () => {
  assert.match(thread, /if \(!replyId\) \{[\s\S]*?await enqueueText\(/);
  assert.match(thread, /void deliver\(tempId, \{ body, reply_to_id: replyId \}\)/);
  assert.match(thread, /await deliver\(tempId, \{[\s\S]*?media_url:/);
  assert.doesNotMatch(
    outboxCodec,
    /reply_to_id|media_url|media_kind|listing_ref_id|localUri/,
  );
  assert.match(thread, /draftRevisionRef\.current === submittedDraftRevision/);
  assert.match(thread, /replyRevisionRef\.current === submittedReplyRevision/);
  assert.match(thread, /conversationIdRef\.current === submittedConversationId/);
});

test("VNX-07A coordinates explicit logout, delete, switch, and tombstone teardown", () => {
  assert.match(settings, /try\s*\{[\s\S]*?await prepareForSignOut\(\)[\s\S]*?outboxCleanupErrorTitle/);
  assert.match(settings, /resumeAfterSignOutFailure\(\)[\s\S]*?outboxCleanupErrorTitle/);
  assert.match(settings, /await signOut\(\)[\s\S]*?resumeAfterSignOutFailure\(\)/);
  assert.match(settings, /await suspendForAccountDeletion\(\)[\s\S]*?await deleteAccount\(\)/);
  assert.match(settings, /await purgeAfterAccountDeletion\(\)\.catch\([\s\S]*?outboxCleanupAfterDeleteBody/);
  assert.match(settings, /resumeAfterAccountDeletionFailure\(\)/);
  assert.match(profile, /try\s*\{[\s\S]*?await prepareForSignOut\(\)[\s\S]*?outboxCleanupErrorTitle/);
  assert.match(profile, /resumeAfterSignOutFailure\(\)/);
  assert.match(
    appLayout,
    /code !== "ACCOUNT_DELETED"[\s\S]*?await prepareForSignOut\(\)[\s\S]*?messageOutboxTombstonePurge[\s\S]*?await signOut\(\)/,
  );
  assert.match(outbox, /if \(!current\.isLoaded\) return/);
  assert.match(outbox, /await activeFlush\?\.catch\(\(\) => \{\}\)/);
  assert.match(outbox, /await purgeStoredOwner\(previousOwner\)/);
  assert.match(outbox, /AsyncStorage\.getAllKeys\(\)/);
  assert.match(outbox, /serializeMessageTextOutbox\(ownerUserId, \[\], Date\.now\(\)\)/);
});

test("listing contact never silently no-ops when phone missing", () => {
  assert.match(
    listing,
    /listing\.contactUnavailable/,
    "Call/WhatsApp without phone must Alert contactUnavailable",
  );
});

test("company chat failure surfaces Alert (not haptic-only)", () => {
  assert.match(company, /Alert\.alert/);
  assert.match(company, /business\.company\.messageFail/);
});

test("Stay hub publish deep-links to real_estate create wizard", () => {
  const hub = fs.readFileSync(path.join(root, "app/rentals/hub.tsx"), "utf8");
  assert.match(
    hub,
    /listings\/create\?category=real_estate/,
    "Stay host add-unit must not open bare /listings/create (wrong category risk)",
  );
});

test("create publish syncs primary phone to /me when profile phone empty", () => {
  const create = fs.readFileSync(path.join(root, "app/listings/create.tsx"), "utf8");
  assert.match(create, /updateMe\(\{\s*phone:\s*cleanPhones\[0\]\s*\}\)/);
});
