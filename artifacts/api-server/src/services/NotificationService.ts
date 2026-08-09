import { db } from "@workspace/db";
import { notifications, users, notificationPreferences } from "@workspace/db/schema";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { sendPushToUser } from "./PushService";

export type NotificationType =
  | "message"
  | "lead"
  | "system"
  | "rfq"
  | "new_match"
  | "price_drop"
  | "comment"
  | "review"
  // Additive (Task #40): B2B investment interest + global-supply response.
  | "investment"
  | "global_supply"
  // Additive: new short-stay booking request on a furnished/daily listing.
  | "booking"
  // Billing (Wave B3): PSP settlement, failed checkout, subscription renewal.
  | "payment_success"
  | "payment_failed"
  | "subscription_expiring"
  // Additive: car-import order lifecycle (created + each stage).
  | "car_import";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}

async function isInAppChannelEnabled(input: CreateNotificationInput): Promise<boolean> {
  const [pref] = await db
    .select({ inApp: notificationPreferences.inApp })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, input.userId),
        eq(notificationPreferences.type, input.type),
      ),
    )
    .limit(1);
  return !pref || pref.inApp !== false;
}

function fanOutPush(input: CreateNotificationInput): void {
  // Push remains best-effort. The durable contract is the in-app row; push has
  // its own provider handling and must never roll that row back.
  void sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    data: { type: input.type, ...(input.data ?? {}) },
  });
}

/**
 * Insert an in-app notification. Best-effort: a failure here must never break
 * the originating action (sending a message, tracking a lead), so errors are
 * swallowed after logging.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    // Respect per-category mute (Task #38): if the user explicitly disabled
    // in-app notifications for this category, skip creation entirely. Absence
    // of a preference row means the category is enabled (implicit default).
    if (!(await isInAppChannelEnabled(input))) return;

    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
    });

    // Remote push (Task #102): fan out to the user's registered devices in
    // addition to the in-app record. Same recipient + same per-category mute
    // gate above, so push never fires for a category the user disabled. Fully
    // fire-and-forget — a push failure must not affect notification creation.
    fanOutPush(input);
  } catch (err) {
    console.error("[Notification create]", err);
  }
}

/**
 * Durable/idempotent variant for retryable workers.
 *
 * Unlike createNotification, database failures are deliberately propagated so
 * the caller can retry. A unique source key prevents a crash between INSERT and
 * outbox acknowledgement from creating a second row or push fan-out.
 */
export async function createNotificationOnce(
  input: CreateNotificationInput & { dedupeKey: string },
): Promise<"created" | "duplicate" | "muted"> {
  if (!(await isInAppChannelEnabled(input))) return "muted";

  const inserted = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      dedupeKey: input.dedupeKey,
    })
    .onConflictDoNothing({ target: notifications.dedupeKey })
    .returning({ id: notifications.id });

  if (inserted.length === 0) return "duplicate";
  fanOutPush(input);
  return "created";
}

export async function listNotifications(
  clerkId: string
): Promise<{ items: NotificationDTO[]; unread: number }> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return { items: [], unread: 0 };

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const items: NotificationDTO[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: (n.data as Record<string, unknown> | null) ?? null,
    read_at: n.readAt ? n.readAt.toISOString() : null,
    created_at: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
  }));

  // NOTIF-05: unread is a full-table count — not capped to the newest 100 feed page.
  const [unreadRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  const unread = Number(unreadRow?.c ?? 0);
  return { items, unread };
}

export async function markNotificationsRead(
  clerkId: string,
  id?: string
): Promise<{ read: boolean }> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) throw Object.assign(new Error("User not found"), { code: "UNAUTHORIZED" });

  if (id) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), eq(notifications.id, id)));
  } else {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  }
  return { read: true };
}
