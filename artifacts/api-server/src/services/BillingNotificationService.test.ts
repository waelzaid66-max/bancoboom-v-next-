import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, createUser, deleteUsers } from "../__tests__/helpers";
import {
  billingReceiptOutbox,
  notifications,
  paymentIntents,
  transactions,
} from "@workspace/db/schema";
import {
  enqueueBillingReceipt,
  notifyPaymentFailed,
  notifyPaymentIntentFailed,
  processBillingReceiptOutbox,
} from "./BillingNotificationService";
import { markTopupIntentFailed } from "./PaymentIntentService";
import { applyTransaction } from "./WalletService";

const uids: string[] = [];

afterAll(async () => {
  await deleteUsers(...uids);
});

describe("BillingNotificationService", () => {
  it("commits the receipt outbox atomically and delivers it exactly once", async () => {
    const uid = await createUser({ walletBalance: "0" });
    uids.push(uid);

    const applied = await db.transaction(async (tx) => {
      const result = await applyTransaction(tx, {
        userId: uid,
        type: "wallet_topup",
        direction: "credit",
        amount: "250.00",
        idempotencyKey: randomUUID(),
        description: "Durable receipt test",
        invoice: {
          lineItems: [{ label: "Wallet top-up", amount: "250.00" }],
        },
      });
      await enqueueBillingReceipt(tx, result.transactionId);
      await enqueueBillingReceipt(tx, result.transactionId);
      return result;
    });

    const queued = await db
      .select()
      .from(billingReceiptOutbox)
      .where(eq(billingReceiptOutbox.transactionId, applied.transactionId));
    expect(queued).toHaveLength(1);
    expect(queued[0].completedAt).toBeNull();

    expect(await processBillingReceiptOutbox()).toBeGreaterThanOrEqual(1);
    expect(await processBillingReceiptOutbox()).toBe(0);

    const delivered = await db
      .select()
      .from(notifications)
      .where(eq(notifications.dedupeKey, `billing-receipt:${applied.transactionId}:in-app`));
    expect(delivered).toHaveLength(1);
    expect(delivered[0].data).toMatchObject({
      transaction_id: applied.transactionId,
      amount: "250.00",
      balance_after: "250.00",
    });

    const [completed] = await db
      .select()
      .from(billingReceiptOutbox)
      .where(eq(billingReceiptOutbox.transactionId, applied.transactionId));
    expect(completed.inAppProcessedAt).not.toBeNull();
    expect(completed.emailProcessedAt).not.toBeNull();
    expect(completed.completedAt).not.toBeNull();
  });

  it("rolls the outbox marker back when the ledger transaction aborts", async () => {
    const uid = await createUser({ walletBalance: "0" });
    uids.push(uid);
    let transactionId = "";

    await expect(
      db.transaction(async (tx) => {
        const result = await applyTransaction(tx, {
          userId: uid,
          type: "wallet_topup",
          direction: "credit",
          amount: "75.00",
          idempotencyKey: randomUUID(),
        });
        transactionId = result.transactionId;
        await enqueueBillingReceipt(tx, result.transactionId);
        throw new Error("abort-after-outbox");
      }),
    ).rejects.toThrow("abort-after-outbox");

    const ledger = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    const queued = await db
      .select()
      .from(billingReceiptOutbox)
      .where(eq(billingReceiptOutbox.transactionId, transactionId));
    expect(ledger).toHaveLength(0);
    expect(queued).toHaveLength(0);
  });

  it("renders a debit receipt as a positive charge amount", async () => {
    const uid = await createUser({ walletBalance: "500" });
    uids.push(uid);

    const applied = await db.transaction(async (tx) => {
      const result = await applyTransaction(tx, {
        userId: uid,
        type: "lead_charge",
        direction: "debit",
        amount: "25.00",
        idempotencyKey: randomUUID(),
        description: "Lead charge (chat)",
      });
      await enqueueBillingReceipt(tx, result.transactionId);
      return result;
    });

    expect(await processBillingReceiptOutbox()).toBeGreaterThanOrEqual(1);
    const [delivered] = await db
      .select()
      .from(notifications)
      .where(
        eq(
          notifications.dedupeKey,
          `billing-receipt:${applied.transactionId}:in-app`,
        ),
      );
    expect(delivered.data).toMatchObject({
      kind: "lead_charge",
      amount: "25.00",
      balance_after: "475.00",
    });
  });

  it("creates payment_failed notification when intent is marked failed", async () => {
    const uid = await createUser();
    uids.push(uid);
    const intentId = randomUUID();
    await db.insert(paymentIntents).values({
      id: intentId,
      userId: uid,
      amount: "99.00",
      method: "fawry",
      purpose: "wallet_topup",
      status: "pending",
    });

    await markTopupIntentFailed(intentId);

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, uid));
    expect(rows.some((r) => r.type === "payment_failed")).toBe(true);
  });

  it("notifyPaymentFailed attaches intent metadata", async () => {
    const uid = await createUser();
    uids.push(uid);
    const intentId = randomUUID();

    await notifyPaymentFailed({
      userId: uid,
      amount: "50.00",
      method: "vodafone_cash",
      purpose: "wallet_topup",
      intentId,
    });

    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, uid))
      .limit(1);
    expect(row?.type).toBe("payment_failed");
    expect(row?.data).toMatchObject({ intent_id: intentId, amount: "50.00" });
  });

  it("notifyPaymentIntentFailed is a no-op when intent is not failed", async () => {
    const uid = await createUser();
    uids.push(uid);
    const intentId = randomUUID();
    await db.insert(paymentIntents).values({
      id: intentId,
      userId: uid,
      amount: "10.00",
      method: "fawry",
      purpose: "wallet_topup",
      status: "pending",
    });

    await notifyPaymentIntentFailed(intentId);
    const rows = await db.select().from(notifications).where(eq(notifications.userId, uid));
    expect(rows.length).toBe(0);
  });
});
