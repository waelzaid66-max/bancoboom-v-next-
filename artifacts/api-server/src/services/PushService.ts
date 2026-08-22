import { db } from "@workspace/db";
import { pushTokens, users, notifications } from "@workspace/db/schema";
import { eq, inArray, and, isNull, sql } from "drizzle-orm";

/**
 * PushService — registration + best-effort remote delivery of Expo push
 * notifications (Task #102). Every send is fire-and-forget: a push failure must
 * NEVER break the originating action or the in-app notification it accompanies.
 *
 * Delivery uses Expo's push service (https://exp.host/--/api/v2/push/send),
 * which needs no server-side secret for Expo push tokens. Tokens reported as
 * DeviceNotRegistered (on send tickets OR later receipts) are pruned so dead
 * devices stop being targeted.
 *
 * NOTIF-04: after a successful ticket, we schedule a receipt check (~15s) so
 * APNs/FCM delivery failures that only appear on receipts also prune tokens.
 * A durable cross-process retry queue is still tracked separately (ops / DB).
 */

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_ENDPOINT = "https://exp.host/--/api/v2/push/getReceipts";
// Expo accepts up to 100 messages per request.
const EXPO_CHUNK_SIZE = 100;
/** Expo docs: wait before fetching receipts; tickets are not receipts. */
const RECEIPT_DELAY_MS = 15_000;
const SEND_MAX_ATTEMPTS = 3;
const SEND_RETRY_DELAY_MS = [500, 1_500] as const;

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}

type ExpoTicket = {
  status: string;
  id?: string;
  message?: string;
  details?: { error?: string };
};

type ExpoReceipt = {
  status: string;
  message?: string;
  details?: { error?: string };
};

/** Loose validation of an Expo push token shape. */
export function isExpoPushToken(token: string): boolean {
  const t = token.trim();
  return (
    t.startsWith("ExponentPushToken[") ||
    t.startsWith("ExpoPushToken[") ||
    // Bare FCM/APNs tokens are rejected; we only support Expo tokens here.
    false
  );
}

/**
 * Persist a device's Expo push token for a user. `token` is globally unique:
 * re-registering the same device under a different user reassigns ownership so
 * a shared/handed-down device never leaks the previous user's notifications.
 */
export async function registerPushToken(
  clerkId: string,
  token: string,
  platform?: string | null,
): Promise<{ registered: boolean }> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });

  if (!isExpoPushToken(token)) {
    throw Object.assign(new Error("Invalid push token"), { code: "INVALID_DATA" });
  }

  await db
    .insert(pushTokens)
    .values({ userId: user.id, token: token.trim(), platform: platform ?? null })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: user.id, platform: platform ?? null, updatedAt: new Date() },
    });

  return { registered: true };
}

/**
 * Remove a device token (e.g. on sign-out). Scoped to the caller so a user can
 * only delete their own tokens. Idempotent.
 */
export async function unregisterPushToken(
  clerkId: string,
  token: string,
): Promise<{ removed: boolean }> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });

  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, token.trim()), eq(pushTokens.userId, user.id)));

  return { removed: true };
}

async function pruneTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  try {
    await db.delete(pushTokens).where(inArray(pushTokens.token, tokens));
  } catch (err) {
    console.error("[Push prune]", err);
  }
}

function isDeadDeviceError(error?: string): boolean {
  // Only DeviceNotRegistered means THIS token is dead. InvalidCredentials is a
  // project-level APNs/FCM config failure — pruning would wipe healthy devices.
  return error === "DeviceNotRegistered";
}

/**
 * NOTIF-04: fetch Expo push receipts and prune tokens that failed at the
 * provider. Best-effort — never throws to callers.
 */
export async function processPushReceipts(
  ticketIds: string[],
  tokenByTicketId: Map<string, string>,
): Promise<void> {
  if (ticketIds.length === 0) return;
  try {
    const res = await fetch(EXPO_RECEIPTS_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: ticketIds }),
    });
    if (!res.ok) {
      console.error("[Push receipts] Expo responded", res.status);
      return;
    }
    const json = (await res.json()) as {
      data?: Record<string, ExpoReceipt>;
    };
    const dead: string[] = [];
    for (const [ticketId, receipt] of Object.entries(json.data ?? {})) {
      if (receipt.status === "error" && isDeadDeviceError(receipt.details?.error)) {
        const token = tokenByTicketId.get(ticketId);
        if (token) dead.push(token);
      }
    }
    await pruneTokens(dead);
  } catch (err) {
    console.error("[Push receipts]", err);
  }
}

function scheduleReceiptCheck(
  ticketIds: string[],
  tokenByTicketId: Map<string, string>,
): void {
  if (ticketIds.length === 0) return;
  // Best-effort on warm Node / Fluid Compute. Serverless cold-exit may skip;
  // durable queue remains tracked as NOTIF-04b.
  const delay =
    typeof setTimeout === "function"
      ? setTimeout(() => {
          void processPushReceipts(ticketIds, tokenByTicketId);
        }, RECEIPT_DELAY_MS)
      : null;
  // Avoid keeping the event-loop handle forever in long-lived processes if
  // the runtime supports unref (Node).
  if (delay && typeof (delay as NodeJS.Timeout).unref === "function") {
    (delay as NodeJS.Timeout).unref();
  }
}

function waitForSendRetry(attempt: number): Promise<void> {
  const delay = SEND_RETRY_DELAY_MS[Math.min(attempt - 1, SEND_RETRY_DELAY_MS.length - 1)];
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function isRetryableSendStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Send a push to every registered device of an internal user id. Best-effort:
 * all errors are swallowed after logging. Caller passes the SAME userId used
 * for the in-app notification, so push honors the exact same recipient + the
 * per-category mute already applied upstream in createNotification.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  try {
    const rows = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    const tokens = rows.map((r) => r.token).filter(isExpoPushToken);
    if (tokens.length === 0) return;

    // NOTIF-06: absolute OS badge = current unread for this user (includes the
    // in-app row just inserted by createNotification before this send).
    const [unreadRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    const badge = Number(unreadRow?.c ?? 0);

    const messages = tokens.map((to) => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: "default" as const,
      badge,
      // Android notification channel — created client-side on registration.
      channelId: "default",
    }));

    for (let i = 0; i < messages.length; i += EXPO_CHUNK_SIZE) {
      const chunk = messages.slice(i, i + EXPO_CHUNK_SIZE);
      const chunkTokens = tokens.slice(i, i + EXPO_CHUNK_SIZE);
      await sendChunk(chunk, chunkTokens);
    }
  } catch (err) {
    console.error("[Push send]", err);
  }
}

async function sendChunk(
  messages: Array<Record<string, unknown>>,
  chunkTokens: string[],
): Promise<void> {
  let res: Response | null = null;

  for (let attempt = 1; attempt <= SEND_MAX_ATTEMPTS; attempt += 1) {
    try {
      res = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
    } catch (err) {
      if (attempt >= SEND_MAX_ATTEMPTS) {
        console.error("[Push chunk]", err);
        return;
      }
      await waitForSendRetry(attempt);
      continue;
    }

    if (res.ok) break;
    if (!isRetryableSendStatus(res.status) || attempt >= SEND_MAX_ATTEMPTS) {
      console.error("[Push send] Expo responded", res.status);
      return;
    }
    await waitForSendRetry(attempt);
  }

  if (!res?.ok) return;

  try {
    const json = (await res.json()) as {
      data?: ExpoTicket[];
    };

    const dead: string[] = [];
    const receiptIds: string[] = [];
    const tokenByTicketId = new Map<string, string>();

    json.data?.forEach((ticket, idx) => {
      const token = chunkTokens[idx];
      if (!token) return;
      if (ticket.status === "error") {
        if (isDeadDeviceError(ticket.details?.error)) {
          dead.push(token);
        } else {
          console.error(
            "[Push send] Expo ticket error",
            ticket.details?.error ?? "UnknownTicketError",
            ticket.message ?? "",
          );
        }
        return;
      }
      if (ticket.status === "ok" && ticket.id) {
        receiptIds.push(ticket.id);
        tokenByTicketId.set(ticket.id, token);
      }
    });
    await pruneTokens(dead);
    scheduleReceiptCheck(receiptIds, tokenByTicketId);
  } catch (err) {
    console.error("[Push chunk]", err);
  }
}
