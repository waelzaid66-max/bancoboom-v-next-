import { db } from "@workspace/db";
import {
  messageNotificationOutbox,
  notifications,
  users,
} from "@workspace/db/schema";
import { and, asc, eq, gte, isNull, lte, ne, or, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { isEmailChannelEnabled, sendNewMessageEmail } from "./EmailService";
import { createNotificationOnce } from "./NotificationService";

const OUTBOX_BATCH_SIZE = 100;
const OUTBOX_MAX_RETRY_MS = 60 * 60 * 1000;
const OUTBOX_ERROR_MAX_CHARS = 1_000;
const MESSAGE_NOTIFICATION_COOLDOWN_MS = 3 * 60_000;

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface EnqueueMessageNotificationInput {
  messageId: string;
  conversationId: string;
  recipientId: string;
  listingId: string | null;
  recipientRole: "buyer" | "seller";
  senderName: string;
  preview: string;
}

/** Insert the durable marker inside the caller's message transaction. */
export async function enqueueMessageNotification(
  tx: DbTx,
  input: EnqueueMessageNotificationInput,
): Promise<void> {
  await tx
    .insert(messageNotificationOutbox)
    .values(input)
    .onConflictDoNothing({ target: messageNotificationOutbox.messageId });
}

export function messageNotificationRetryDelayMs(attemptCount: number): number {
  const exponent = Math.max(0, Math.min(attemptCount, 7));
  return Math.min(5_000 * 2 ** exponent, OUTBOX_MAX_RETRY_MS);
}

function outboxErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.slice(0, OUTBOX_ERROR_MAX_CHARS);
}

function messageNotificationDedupeKey(messageId: string): string {
  return `message:${messageId}:in-app`;
}

async function hasRecentThreadNotification(input: {
  recipientId: string;
  conversationId: string;
  messageId: string;
}): Promise<boolean> {
  const currentDedupeKey = messageNotificationDedupeKey(input.messageId);
  const [recent] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, input.recipientId),
        eq(notifications.type, "message"),
        gte(
          notifications.createdAt,
          new Date(Date.now() - MESSAGE_NOTIFICATION_COOLDOWN_MS),
        ),
        sql`${notifications.data}->>'conversation_id' = ${input.conversationId}`,
        or(
          isNull(notifications.dedupeKey),
          ne(notifications.dedupeKey, currentDedupeKey),
        ),
      ),
    )
    .limit(1);
  return Boolean(recent);
}

async function markSuppressed(id: string): Promise<void> {
  const now = new Date();
  await db
    .update(messageNotificationOutbox)
    .set({
      inAppProcessedAt: now,
      emailProcessedAt: now,
      completedAt: now,
      lastError: null,
      updatedAt: now,
    })
    .where(eq(messageNotificationOutbox.id, id));
}

/**
 * Deliver due message notification rows. The scheduled caller owns the
 * cross-replica advisory lock. In-app creation is source-key idempotent and the
 * two channel checkpoints make ordinary worker retries replay-safe.
 */
export async function processMessageNotificationOutbox(): Promise<number> {
  const due = await db
    .select({
      id: messageNotificationOutbox.id,
      messageId: messageNotificationOutbox.messageId,
      conversationId: messageNotificationOutbox.conversationId,
      recipientId: messageNotificationOutbox.recipientId,
      listingId: messageNotificationOutbox.listingId,
      recipientRole: messageNotificationOutbox.recipientRole,
      senderName: messageNotificationOutbox.senderName,
      preview: messageNotificationOutbox.preview,
      attemptCount: messageNotificationOutbox.attemptCount,
      inAppProcessedAt: messageNotificationOutbox.inAppProcessedAt,
      emailProcessedAt: messageNotificationOutbox.emailProcessedAt,
    })
    .from(messageNotificationOutbox)
    .where(
      and(
        isNull(messageNotificationOutbox.completedAt),
        lte(messageNotificationOutbox.availableAt, new Date()),
      ),
    )
    .orderBy(asc(messageNotificationOutbox.createdAt))
    .limit(OUTBOX_BATCH_SIZE);

  let completed = 0;
  for (const item of due) {
    let inAppDone = Boolean(item.inAppProcessedAt);
    let emailDone = Boolean(item.emailProcessedAt);
    try {
      if (
        !inAppDone &&
        !emailDone &&
        (await hasRecentThreadNotification({
          recipientId: item.recipientId,
          conversationId: item.conversationId,
          messageId: item.messageId,
        }))
      ) {
        await markSuppressed(item.id);
        completed += 1;
        continue;
      }

      const body =
        item.preview.length > 80 ? `${item.preview.slice(0, 79)}…` : item.preview;
      if (!inAppDone) {
        await createNotificationOnce({
          userId: item.recipientId,
          type: "message",
          title: item.senderName || "رسالة جديدة · New message",
          body,
          data: {
            conversation_id: item.conversationId,
            message_id: item.messageId,
            listing_id: item.listingId,
            role: item.recipientRole,
          },
          dedupeKey: messageNotificationDedupeKey(item.messageId),
        });
        await db
          .update(messageNotificationOutbox)
          .set({ inAppProcessedAt: new Date(), updatedAt: new Date() })
          .where(eq(messageNotificationOutbox.id, item.id));
        inAppDone = true;
      }

      if (!emailDone) {
        if (await isEmailChannelEnabled(item.recipientId, "message")) {
          const [recipient] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, item.recipientId))
            .limit(1);
          if (recipient?.email) {
            await sendNewMessageEmail({
              to: recipient.email,
              senderName: item.senderName,
              preview: item.preview,
              conversationId: item.conversationId,
              idempotencyKey: `message/${item.messageId}`,
            });
          }
        }
        await db
          .update(messageNotificationOutbox)
          .set({ emailProcessedAt: new Date(), updatedAt: new Date() })
          .where(eq(messageNotificationOutbox.id, item.id));
        emailDone = true;
      }

      if (inAppDone && emailDone) {
        await db
          .update(messageNotificationOutbox)
          .set({ completedAt: new Date(), lastError: null, updatedAt: new Date() })
          .where(eq(messageNotificationOutbox.id, item.id));
        completed += 1;
      }
    } catch (err) {
      const nextAttempt = item.attemptCount + 1;
      await db
        .update(messageNotificationOutbox)
        .set({
          attemptCount: nextAttempt,
          availableAt: new Date(
            Date.now() + messageNotificationRetryDelayMs(item.attemptCount),
          ),
          lastError: outboxErrorMessage(err),
          updatedAt: new Date(),
        })
        .where(eq(messageNotificationOutbox.id, item.id));
      logger.error(
        { err, messageId: item.messageId, attempt: nextAttempt },
        "Message notification outbox delivery failed",
      );
    }
  }

  return completed;
}
