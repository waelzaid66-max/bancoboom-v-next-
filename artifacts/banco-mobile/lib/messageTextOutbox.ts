const OUTBOX_VERSION = 1 as const;
const OUTBOX_KEY_PREFIX = "banco:messenger:text-outbox:v1:u:";

export const MESSAGE_TEXT_OUTBOX_MAX_ENTRIES = 100;
export const MESSAGE_TEXT_OUTBOX_MAX_BODY_CHARS = 200_000;
export const MESSAGE_TEXT_OUTBOX_AUTO_RETRY_MS = 24 * 60 * 60 * 1000;
export const MESSAGE_TEXT_OUTBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000, 120_000, 300_000];

export type MessageTextOutboxState = "queued" | "retrying" | "failed";
export type MessageTextOutboxHoldReason =
  | "auth"
  | "permanent"
  | "protocol"
  | "stale"
  | null;

export type MessageTextOutboxEntry = {
  ownerUserId: string;
  clientMessageId: string;
  conversationId: string;
  body: string;
  createdAt: number;
  attemptCount: number;
  nextAttemptAt: number;
  autoRetryUntil: number;
  state: MessageTextOutboxState;
  holdReason: MessageTextOutboxHoldReason;
  lastStatus: number | null;
};

type MessageTextOutboxEnvelope = {
  v: typeof OUTBOX_VERSION;
  ownerUserId: string;
  updatedAt: number;
  entries: MessageTextOutboxEntry[];
};

export type MessageTextOutboxErrorDecision =
  | { kind: "abort" }
  | { kind: "auth"; status: number }
  | { kind: "permanent"; status: number | null }
  | { kind: "retry"; status: number | null; retryAfterMs: number | null };

export function messageOutboxStorageKey(userId: string): string {
  return `${OUTBOX_KEY_PREFIX}${encodeURIComponent(userId)}`;
}

export function messageOutboxOwnerFromStorageKey(key: string): string | null {
  if (!key.startsWith(OUTBOX_KEY_PREFIX)) return null;
  const encoded = key.slice(OUTBOX_KEY_PREFIX.length);
  if (!encoded) return null;
  try {
    const ownerUserId = decodeURIComponent(encoded);
    return ownerUserId && ownerUserId.length <= 256 ? ownerUserId : null;
  } catch {
    return null;
  }
}

export function createMessageTextOutboxEntry(input: {
  ownerUserId: string;
  clientMessageId: string;
  conversationId: string;
  body: string;
  now: number;
}): MessageTextOutboxEntry {
  const ownerUserId = input.ownerUserId.trim();
  const conversationId = input.conversationId.trim();
  const body = input.body.trim();

  if (!ownerUserId || ownerUserId.length > 256) {
    throw new Error("Message outbox requires a valid owner.");
  }
  if (!UUID_RE.test(input.clientMessageId)) {
    throw new Error("Message outbox requires a UUID client_message_id.");
  }
  if (!conversationId || conversationId.length > 256) {
    throw new Error("Message outbox requires a valid conversation.");
  }
  if (!body || body.length > 4_000) {
    throw new Error("Message outbox text must contain 1 to 4000 characters.");
  }
  if (!Number.isFinite(input.now) || input.now <= 0) {
    throw new Error("Message outbox requires a valid creation time.");
  }

  return {
    ownerUserId,
    clientMessageId: input.clientMessageId,
    conversationId,
    body,
    createdAt: input.now,
    attemptCount: 0,
    nextAttemptAt: input.now,
    autoRetryUntil: input.now + MESSAGE_TEXT_OUTBOX_AUTO_RETRY_MS,
    state: "queued",
    holdReason: null,
    lastStatus: null,
  };
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseEntry(
  value: unknown,
  ownerUserId: string,
  now: number,
): MessageTextOutboxEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.ownerUserId !== ownerUserId) return null;
  if (typeof raw.clientMessageId !== "string" || !UUID_RE.test(raw.clientMessageId)) {
    return null;
  }
  if (
    typeof raw.conversationId !== "string" ||
    !raw.conversationId ||
    raw.conversationId.length > 256
  ) {
    return null;
  }
  if (typeof raw.body !== "string" || !raw.body || raw.body.length > 4_000) {
    return null;
  }
  if (!finiteNumber(raw.createdAt) || now - raw.createdAt > MESSAGE_TEXT_OUTBOX_RETENTION_MS) {
    return null;
  }
  if (
    !Number.isInteger(raw.attemptCount) ||
    (raw.attemptCount as number) < 0 ||
    (raw.attemptCount as number) > 10_000 ||
    !finiteNumber(raw.nextAttemptAt) ||
    !finiteNumber(raw.autoRetryUntil)
  ) {
    return null;
  }
  const lastStatus =
    raw.lastStatus === null ||
    (Number.isInteger(raw.lastStatus) && (raw.lastStatus as number) >= 100)
      ? (raw.lastStatus as number | null)
      : null;
  const holdReason: MessageTextOutboxHoldReason =
    raw.holdReason === "auth" ||
    raw.holdReason === "permanent" ||
    raw.holdReason === "protocol" ||
    raw.holdReason === "stale"
      ? raw.holdReason
      : null;
  let state: MessageTextOutboxState =
    raw.state === "failed" ? "failed" : "queued";
  let normalizedHold = holdReason;
  if (now > raw.autoRetryUntil && state !== "failed") {
    state = "failed";
    normalizedHold = "stale";
  }

  return {
    ownerUserId,
    clientMessageId: raw.clientMessageId,
    conversationId: raw.conversationId,
    body: raw.body,
    createdAt: raw.createdAt,
    attemptCount: raw.attemptCount as number,
    nextAttemptAt: raw.nextAttemptAt,
    autoRetryUntil: raw.autoRetryUntil,
    state,
    holdReason: normalizedHold,
    lastStatus,
  };
}

export function parseMessageTextOutbox(
  raw: string | null,
  ownerUserId: string,
  now: number,
): MessageTextOutboxEntry[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const envelope = value as Record<string, unknown>;
  if (
    envelope.v !== OUTBOX_VERSION ||
    envelope.ownerUserId !== ownerUserId ||
    !Array.isArray(envelope.entries)
  ) {
    return [];
  }

  const entries: MessageTextOutboxEntry[] = [];
  const ids = new Set<string>();
  let bodyChars = 0;
  for (const candidate of envelope.entries) {
    const entry = parseEntry(candidate, ownerUserId, now);
    if (!entry || ids.has(entry.clientMessageId)) continue;
    if (entries.length >= MESSAGE_TEXT_OUTBOX_MAX_ENTRIES) break;
    if (bodyChars + entry.body.length > MESSAGE_TEXT_OUTBOX_MAX_BODY_CHARS) break;
    ids.add(entry.clientMessageId);
    bodyChars += entry.body.length;
    entries.push(entry);
  }
  // The serialized array order is the durable FIFO authority. UUIDs are
  // random, so sorting equal-millisecond entries by UUID can reverse two taps
  // after relaunch.
  return entries;
}

export function serializeMessageTextOutbox(
  ownerUserId: string,
  entries: MessageTextOutboxEntry[],
  now: number,
): string {
  const envelope: MessageTextOutboxEnvelope = {
    v: OUTBOX_VERSION,
    ownerUserId,
    updatedAt: now,
    entries,
  };
  return JSON.stringify(envelope);
}

export function assertMessageTextOutboxCapacity(
  entries: MessageTextOutboxEntry[],
  nextBody: string,
): void {
  if (entries.length >= MESSAGE_TEXT_OUTBOX_MAX_ENTRIES) {
    throw new Error("Message outbox is full. Retry or discard an unsent message first.");
  }
  const bodyChars = entries.reduce((total, entry) => total + entry.body.length, 0);
  if (bodyChars + nextBody.length > MESSAGE_TEXT_OUTBOX_MAX_BODY_CHARS) {
    throw new Error("Message outbox storage limit reached.");
  }
}

export function nextMessageTextOutboxDelay(attemptCount: number): number {
  const base = RETRY_DELAYS_MS[Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_MS.length - 1)];
  // Full jitter prevents many reconnecting clients from retrying together.
  return Math.max(250, Math.floor(Math.random() * base));
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  return Number.isInteger(status) ? (status as number) : null;
}

function retryAfterMs(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const headers = (error as { headers?: unknown }).headers;
  if (!headers || typeof (headers as Headers).get !== "function") return null;
  const raw = (headers as Headers).get("retry-after");
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, 15 * 60 * 1_000);
  }
  const date = Date.parse(raw);
  if (!Number.isFinite(date)) return null;
  return Math.min(Math.max(date - Date.now(), 0), 15 * 60 * 1_000);
}

export function classifyMessageTextOutboxError(
  error: unknown,
): MessageTextOutboxErrorDecision {
  const name =
    error && typeof error === "object" && typeof (error as { name?: unknown }).name === "string"
      ? (error as { name: string }).name
      : "";
  if (name === "AbortError") return { kind: "abort" };

  const status = errorStatus(error);
  if (status === 401) return { kind: "auth", status };
  if (status === 408 || status === 425 || status === 429 || (status !== null && status >= 500)) {
    return {
      kind: "retry",
      status,
      retryAfterMs: status === 429 ? retryAfterMs(error) : null,
    };
  }
  if (status !== null && status >= 400 && status < 500) {
    return { kind: "permanent", status };
  }
  if (error instanceof TypeError || name === "ResponseParseError" || status === null) {
    return { kind: "retry", status, retryAfterMs: null };
  }
  return { kind: "permanent", status };
}

function decodeBase64Url(value: string): string | null {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  let bits = 0;
  let bitCount = 0;
  let output = "";
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index < 0) return null;
    bits = (bits << 6) | index;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      output += String.fromCharCode((bits >> bitCount) & 0xff);
    }
  }
  return output;
}

export function clerkTokenBelongsToUser(token: string, userId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = decodeBase64Url(parts[1]);
  if (!payload) return false;
  try {
    const parsed = JSON.parse(payload) as { sub?: unknown };
    return parsed.sub === userId;
  } catch {
    return false;
  }
}

export function eligibleMessageTextOutboxEntry(
  entries: MessageTextOutboxEntry[],
  now: number,
): MessageTextOutboxEntry | null {
  const heads = new Map<string, MessageTextOutboxEntry>();
  for (const entry of entries) {
    if (!heads.has(entry.conversationId)) heads.set(entry.conversationId, entry);
  }
  return (
    [...heads.values()]
      .filter(
        (entry) =>
          entry.state !== "failed" &&
          entry.nextAttemptAt <= now &&
          entry.autoRetryUntil >= now,
      )
      .sort(
        (a, b) =>
          a.createdAt - b.createdAt || a.clientMessageId.localeCompare(b.clientMessageId),
      )[0] ?? null
  );
}
