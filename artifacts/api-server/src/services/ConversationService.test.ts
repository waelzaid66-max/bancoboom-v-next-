import { describe, it, expect, afterAll } from "vitest";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import {
  createConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  deleteConversation,
} from "./ConversationService";
import { db, pool, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import {
  conversations,
  users,
  listings,
  notifications,
  messages,
  messageNotificationOutbox,
} from "@workspace/db/schema";
import {
  enqueueMessageNotification,
  processMessageNotificationOutbox,
} from "./MessageNotificationService";

/**
 * G3 — buyer↔seller messaging end-to-end against a real database:
 * start thread → send → inbox + unread → read → mark-read → soft-delete, plus the
 * authorization gates (own-listing, non-participant) and create idempotency.
 */
const uids: string[] = [];
const listingIds: string[] = [];

async function mkUser(opts: { shadowBanned?: boolean } = {}): Promise<{ id: string; clerkId: string }> {
  const id = randomUUID();
  const clerkId = uniq("clerk");
  await db.insert(users).values({
    id,
    clerkId,
    name: uniq("User"),
    role: "individual",
    walletBalance: "0",
    isShadowBanned: opts.shadowBanned ?? false,
  });
  uids.push(id);
  return { id, clerkId };
}

async function mkActiveListing(sellerId: string): Promise<string> {
  const id = randomUUID();
  await db.insert(listings).values({
    id,
    userId: sellerId,
    title: uniq("msg-listing"),
    category: "car",
    status: "active",
    basePriceCash: "100000",
    location: "Cairo",
  });
  listingIds.push(id);
  return id;
}

async function connectPoolClient() {
  return pool.connect();
}

afterAll(async () => {
  for (const id of listingIds) await db.delete(listings).where(eq(listings.id, id));
  await deleteUsers(...uids);
});

describe("ConversationService — buyer↔seller messaging journey", () => {
  it("runs the full thread lifecycle: start → send → unread inbox → read", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);

    // Buyer opens a thread on the seller's listing.
    const conv = await createConversation(buyer.clerkId, listingId);
    expect(conv.listing_id).toBe(listingId);
    expect(conv.viewer_role).toBe("buyer");
    expect(conv.counterparty_id).toBe(seller.id);
    expect(conv.unread).toBe(0);

    // Buyer sends the first message.
    const sent = await sendMessage(buyer.clerkId, conv.id, "Is this still available?");
    expect(sent.is_mine).toBe(true);
    expect(sent.body).toBe("Is this still available?");
    expect(sent.read_at).toBeNull();

    // Seller's inbox shows the thread as the seller, with one unread.
    const sellerInbox = await listConversations(seller.clerkId);
    const threadForSeller = sellerInbox.find((c) => c.id === conv.id);
    expect(threadForSeller).toBeTruthy();
    expect(threadForSeller!.viewer_role).toBe("seller");
    expect(threadForSeller!.unread).toBe(1);
    expect(threadForSeller!.last_message_text).toBe("Is this still available?");

    // Seller reads the messages — the buyer's message is not "mine" for the seller.
    const msgs = await getMessages(seller.clerkId, conv.id);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].is_mine).toBe(false);
    expect(msgs[0].body).toBe("Is this still available?");

    // Marking read clears the seller's unread and stamps read_at.
    const read = await markConversationRead(seller.clerkId, conv.id);
    expect(read.read).toBe(true);

    const sellerInbox2 = await listConversations(seller.clerkId);
    expect(sellerInbox2.find((c) => c.id === conv.id)!.unread).toBe(0);

    const msgsAfter = await getMessages(seller.clerkId, conv.id);
    expect(msgsAfter[0].read_at).not.toBeNull();
  });

  it("is idempotent: re-opening the same listing returns the same conversation", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);

    const a = await createConversation(buyer.clerkId, listingId);
    const b = await createConversation(buyer.clerkId, listingId);
    expect(b.id).toBe(a.id);
  });

  it("deduplicates one client send without duplicating unread or notifications", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    const conv = await createConversation(buyer.clerkId, listingId);
    const clientMessageId = randomUUID();

    const first = await sendMessage(buyer.clerkId, conv.id, "one logical send", {
      clientMessageId,
    });
    const replay = await sendMessage(buyer.clerkId, conv.id, "one logical send", {
      clientMessageId,
    });

    expect(replay.id).toBe(first.id);
    expect(replay.client_message_id).toBe(clientMessageId);

    const durable = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id));
    expect(durable).toHaveLength(1);

    const sellerThread = (await listConversations(seller.clerkId)).find(
      (conversation) => conversation.id === conv.id,
    );
    expect(sellerThread?.unread).toBe(1);

    const queued = await db
      .select()
      .from(messageNotificationOutbox)
      .where(eq(messageNotificationOutbox.messageId, first.id));
    expect(queued).toHaveLength(1);
    expect(queued[0].completedAt).toBeNull();

    expect(await processMessageNotificationOutbox()).toBeGreaterThanOrEqual(1);
    expect(await processMessageNotificationOutbox()).toBe(0);

    const sellerNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, seller.id));
    expect(
      sellerNotifications.filter(
        (notification) =>
          notification.type === "message" &&
          (notification.data as { conversation_id?: string } | null)?.conversation_id === conv.id,
      ),
    ).toHaveLength(1);
    expect(
      (sellerNotifications.find((notification) => notification.type === "message")?.data as {
        message_id?: string;
      } | null)?.message_id,
    ).toBe(first.id);
  });

  it("keeps unread counters aligned when send commits during mark-read", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    const conv = await createConversation(buyer.clerkId, listingId);
    await sendMessage(buyer.clerkId, conv.id, "first unread message", {
      clientMessageId: randomUUID(),
    });
    const racingClientMessageId = randomUUID();
    const suffix = conv.id.replaceAll("-", "");
    const triggerName = `test_pause_mark_read_${suffix}`;
    const functionName = `${triggerName}_fn`;
    let controlClient: Awaited<ReturnType<typeof connectPoolClient>> | undefined;
    let observerClient: Awaited<ReturnType<typeof connectPoolClient>> | undefined;
    let controlTransactionOpen = false;
    let markRead: Promise<{ read: boolean }> | undefined;
    let racingSend: Promise<unknown> | undefined;

    try {
      const control = await connectPoolClient();
      controlClient = control;
      const observer = await connectPoolClient();
      observerClient = observer;

      // Pause mark-read after its UPDATE statement has taken a snapshot and
      // found the first message, but before that statement can commit. This
      // gives a concurrent send one precise chance to commit in the gap between
      // the message projection and unread-counter projection.
      await observer.query(`
        CREATE FUNCTION ${functionName}() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.conversation_id = '${conv.id}'::uuid THEN
            PERFORM set_config('application_name', '${triggerName}', true);
            PERFORM pg_advisory_xact_lock(hashtextextended('${conv.id}', 0));
          END IF;
          RETURN NEW;
        END
        $$
      `);
      await observer.query(`
        CREATE TRIGGER ${triggerName}
        AFTER UPDATE OF read_at ON messages
        FOR EACH ROW EXECUTE FUNCTION ${functionName}()
      `);

      await control.query("BEGIN");
      controlTransactionOpen = true;
      await control.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [conv.id],
      );

      markRead = markConversationRead(seller.clerkId, conv.id);

      const waitDeadline = Date.now() + 5_000;
      let markReadBackendPid: number | null = null;
      while (Date.now() < waitDeadline) {
        const paused = await observer.query<{ pid: number }>(
          `SELECT pid
           FROM pg_stat_activity
           WHERE application_name = $1
             AND wait_event_type = 'Lock'
             AND wait_event = 'advisory'`,
          [triggerName],
        );
        if (paused.rows[0]?.pid) {
          markReadBackendPid = paused.rows[0].pid;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(markReadBackendPid).not.toBeNull();

      racingSend = sendMessage(buyer.clerkId, conv.id, "message racing with read", {
        clientMessageId: racingClientMessageId,
      });

      // On the vulnerable implementation the send commits while mark-read is
      // paused. On the corrected implementation it blocks on the conversation
      // row lock. Observe either state before releasing the test barrier.
      let concurrencyState: "send_committed" | "send_serialized" | null = null;
      const sendDeadline = Date.now() + 5_000;
      while (Date.now() < sendDeadline) {
        const visible = await observer.query<{ visible: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM messages WHERE client_message_id = $1
           ) AS visible`,
          [racingClientMessageId],
        );
        if (visible.rows[0]?.visible) {
          concurrencyState = "send_committed";
          break;
        }

        const serialized = await observer.query<{ serialized: boolean }>(
          `SELECT EXISTS (
             SELECT 1
             FROM pg_stat_activity
             WHERE pid <> $1
               AND wait_event_type = 'Lock'
               AND $1 = ANY(pg_blocking_pids(pid))
               AND query ILIKE '%conversations%'
               AND query ILIKE '%for update%'
           ) AS serialized`,
          [markReadBackendPid],
        );
        if (serialized.rows[0]?.serialized) {
          concurrencyState = "send_serialized";
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(concurrencyState).toBe("send_serialized");

      await control.query("COMMIT");
      controlTransactionOpen = false;
      await Promise.all([markRead, racingSend]);

      const [thread] = await db
        .select({ sellerUnread: conversations.sellerUnread })
        .from(conversations)
        .where(eq(conversations.id, conv.id));
      const [unread] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            ne(messages.senderId, seller.id),
            isNull(messages.readAt),
          ),
        );

      expect(thread.sellerUnread).toBe(Number(unread.count));
      expect(thread.sellerUnread).toBe(1);
    } finally {
      if (controlTransactionOpen && controlClient) {
        await controlClient.query("ROLLBACK").catch(() => undefined);
      }
      await Promise.allSettled([markRead, racingSend].filter(Boolean));
      try {
        if (observerClient) {
          await observerClient.query(`DROP TRIGGER IF EXISTS ${triggerName} ON messages`);
          await observerClient.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
        }
      } finally {
        controlClient?.release();
        observerClient?.release();
      }
    }
  });

  it("rolls the notification work item back with an aborted message transaction", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    const conv = await createConversation(buyer.clerkId, listingId);
    const messageId = randomUUID();

    await expect(
      db.transaction(async (tx) => {
        await tx.insert(messages).values({
          id: messageId,
          conversationId: conv.id,
          senderId: buyer.id,
          body: "must roll back",
        });
        await enqueueMessageNotification(tx, {
          messageId,
          conversationId: conv.id,
          recipientId: seller.id,
          listingId,
          recipientRole: "seller",
          senderName: "Test Buyer",
          preview: "must roll back",
        });
        throw new Error("abort-after-message-outbox");
      }),
    ).rejects.toThrow("abort-after-message-outbox");

    expect(await db.select().from(messages).where(eq(messages.id, messageId))).toHaveLength(0);
    expect(
      await db
        .select()
        .from(messageNotificationOutbox)
        .where(eq(messageNotificationOutbox.messageId, messageId)),
    ).toHaveLength(0);
  });

  it("completes rapid thread work without notification storms", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    const conv = await createConversation(buyer.clerkId, listingId);

    await sendMessage(buyer.clerkId, conv.id, "first rapid message", {
      clientMessageId: randomUUID(),
    });
    await sendMessage(buyer.clerkId, conv.id, "second rapid message", {
      clientMessageId: randomUUID(),
    });
    expect(await processMessageNotificationOutbox()).toBeGreaterThanOrEqual(2);

    const queued = await db
      .select()
      .from(messageNotificationOutbox)
      .where(eq(messageNotificationOutbox.conversationId, conv.id));
    expect(queued).toHaveLength(2);
    expect(queued.every((item) => item.completedAt !== null)).toBe(true);

    const sellerNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, seller.id));
    expect(
      sellerNotifications.filter(
        (notification) =>
          notification.type === "message" &&
          (notification.data as { conversation_id?: string } | null)?.conversation_id === conv.id,
      ),
    ).toHaveLength(1);
    expect(
      (await listConversations(seller.clerkId)).find(
        (conversation) => conversation.id === conv.id,
      )?.unread,
    ).toBe(2);
  });

  it("forbids messaging your own listing", async () => {
    const seller = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    await expect(createConversation(seller.clerkId, listingId)).rejects.toThrow(/own listing/i);
  });

  it("blocks a non-participant from reading a conversation", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const stranger = await mkUser();
    const listingId = await mkActiveListing(seller.id);

    const conv = await createConversation(buyer.clerkId, listingId);
    await sendMessage(buyer.clerkId, conv.id, "hi");
    await expect(getMessages(stranger.clerkId, conv.id)).rejects.toThrow(/participant/i);
  });

  it("rejects an empty message (no text, no media)", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    const conv = await createConversation(buyer.clerkId, listingId);
    await expect(sendMessage(buyer.clerkId, conv.id, "   ")).rejects.toThrow(
      /text, media, or a shared listing/i
    );
  });

  it("soft-hides a thread for the deleter only, and a new message un-hides it", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);

    const conv = await createConversation(buyer.clerkId, listingId);
    await sendMessage(buyer.clerkId, conv.id, "first");

    // Buyer hides the thread → gone from the buyer's inbox, still in the seller's.
    await deleteConversation(buyer.clerkId, conv.id);
    expect((await listConversations(buyer.clerkId)).find((c) => c.id === conv.id)).toBeUndefined();
    expect((await listConversations(seller.clerkId)).find((c) => c.id === conv.id)).toBeTruthy();

    // A new message from the seller un-hides it for the buyer.
    await sendMessage(seller.clerkId, conv.id, "still here");
    expect((await listConversations(buyer.clerkId)).find((c) => c.id === conv.id)).toBeTruthy();
  });

  it("notifies the RECIPIENT (not the sender) when a message is sent", async () => {
    const seller = await mkUser();
    const buyer = await mkUser();
    const listingId = await mkActiveListing(seller.id);
    const conv = await createConversation(buyer.clerkId, listingId);

    await sendMessage(buyer.clerkId, conv.id, "Is this still available?");
    await processMessageNotificationOutbox();

    // The seller (recipient) gets a "message" notification carrying the thread id.
    const sellerNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, seller.id));
    const msgNotif = sellerNotifs.find((n) => n.type === "message");
    expect(msgNotif).toBeTruthy();
    expect((msgNotif!.data as { conversation_id?: string }).conversation_id).toBe(conv.id);

    // The buyer (sender) is NOT notified of their own message.
    const buyerNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, buyer.id));
    expect(buyerNotifs.some((n) => n.type === "message")).toBe(false);
  });
});
