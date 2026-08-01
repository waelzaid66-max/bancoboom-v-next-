import { describe, it, expect, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import {
  settleSubscriptionIntentByWebhook,
  cancelSubscription,
  getMySubscription,
  reverseSubscriptionAfterPspReversal,
} from "./SubscriptionService";
import { db, createUser, deleteUsers, randomUUID } from "../__tests__/helpers";
import { plans, subscriptions, paymentIntents, transactions } from "@workspace/db/schema";
import { applyTransaction, getWalletBalance } from "./WalletService";

/**
 * SubscriptionService is an untested MONEY path. These cover the webhook
 * settlement (the only thing that activates a paid subscription), its
 * idempotency (replayed webhooks must not double-charge or double-activate),
 * cancel (stays active, auto-renew off), and the my-subscription view. Needs a
 * SEEDED db (a non-baseline plan must exist).
 */
const uids: string[] = [];

async function paidPlan() {
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.isBaseline, false), eq(plans.isActive, true)))
    .limit(1);
  if (!plan) throw new Error("seed a non-baseline plan first");
  return plan;
}

async function pendingIntent(userId: string, planId: string, amount: string): Promise<string> {
  const id = randomUUID();
  await db.insert(paymentIntents).values({
    id,
    userId,
    amount,
    method: "instapay",
    purpose: "subscription",
    status: "pending",
    planId,
  });
  return id;
}

afterAll(async () => {
  await deleteUsers(...uids); // cascades subscriptions / intents / transactions
});

describe("SubscriptionService — webhook settlement & lifecycle", () => {
  it("settles a pending intent into an active subscription + records the charge", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = await pendingIntent(userId, plan.id, plan.monthlyPrice);

    await settleSubscriptionIntentByWebhook(intentId, { providerTxnId: "txn_1" });

    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
    expect(subs).toHaveLength(1);
    expect(subs[0].planId).toBe(plan.id);
    expect(subs[0].transactionId).not.toBeNull();

    const [intent] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, intentId));
    expect(intent.status).toBe("completed");

    const charges = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "subscription_charge")));
    expect(charges).toHaveLength(1);
  });

  it("is idempotent: replaying the settlement webhook does not double-activate", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = await pendingIntent(userId, plan.id, plan.monthlyPrice);

    await settleSubscriptionIntentByWebhook(intentId);
    await settleSubscriptionIntentByWebhook(intentId); // replay — must be a no-op

    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    expect(subs).toHaveLength(1);
    const charges = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "subscription_charge")));
    expect(charges).toHaveLength(1);
  });

  it("cancel turns off auto-renew but keeps the subscription active until expiry", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = await pendingIntent(userId, plan.id, plan.monthlyPrice);
    await settleSubscriptionIntentByWebhook(intentId);

    await cancelSubscription(userId);

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    expect(sub.status).toBe("active");
    expect(sub.autoRenew).toBe(false);
    expect(sub.cancelledAt).not.toBeNull();
  });

  it("getMySubscription reports the active plan, subscription and usage", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = await pendingIntent(userId, plan.id, plan.monthlyPrice);
    await settleSubscriptionIntentByWebhook(intentId);

    const view = await getMySubscription(userId, "dealer");
    expect(view.plan).toBeTruthy();
    expect(view.subscription).not.toBeNull();
    expect(view.usage.active_listings).toBe(0);
    expect(view.usage.listings_this_month).toBe(0);
  });
});

describe("Subscription PSP reverse (Round 15)", () => {
  it("pending reverse blocks late settle and sets durable psp_reversed", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = await pendingIntent(userId, plan.id, plan.monthlyPrice);

    await reverseSubscriptionAfterPspReversal(intentId, { reason: "voided" });
    const [after] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, intentId));
    expect(after.status).toBe("failed");
    expect((after.metadata as Record<string, unknown>).psp_reversed).toBe(true);

    await settleSubscriptionIntentByWebhook(intentId, { providerTxnId: "late" });
    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    expect(subs).toHaveLength(0);
    expect(Number(await getWalletBalance(userId))).toBe(0);
  });

  it("claws back orphan_topup credit with adjustment debit", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = randomUUID();

    // Simulate orphan settlement path: wallet credit without a charge/sub row.
    await db.transaction((tx) =>
      applyTransaction(tx, {
        userId,
        type: "wallet_topup",
        direction: "credit",
        amount: plan.monthlyPrice,
        idempotencyKey: `${intentId}:orphan_topup`,
        referenceType: "payment_intent",
        referenceId: intentId,
      }),
    );
    await db.insert(paymentIntents).values({
      id: intentId,
      userId,
      amount: plan.monthlyPrice,
      method: "instapay",
      purpose: "subscription",
      status: "completed",
      planId: plan.id,
      completedAt: new Date(),
      metadata: { orphan_reason: "active_slot_taken" },
    });
    expect(Number(await getWalletBalance(userId))).toBe(Number(plan.monthlyPrice));

    await reverseSubscriptionAfterPspReversal(intentId, { reason: "refunded" });
    expect(Number(await getWalletBalance(userId))).toBe(0);

    const [claw] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.idempotencyKey, `${intentId}:psp_reversal_clawback:orphan`));
    expect(claw.type).toBe("adjustment");
    expect(Number(claw.amount)).toBe(-Number(plan.monthlyPrice));

    const [row] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, intentId));
    expect((row.metadata as Record<string, unknown>).psp_reversed).toBe(true);
  });

  it("expires active subscription created from charge key", async () => {
    const userId = await createUser({ role: "dealer" });
    uids.push(userId);
    const plan = await paidPlan();
    const intentId = await pendingIntent(userId, plan.id, plan.monthlyPrice);
    await settleSubscriptionIntentByWebhook(intentId);

    await reverseSubscriptionAfterPspReversal(intentId, { reason: "refunded" });
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    expect(sub.status).toBe("cancelled");
    const [row] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, intentId));
    expect((row.metadata as Record<string, unknown>).psp_reversed).toBe(true);
  });
});
