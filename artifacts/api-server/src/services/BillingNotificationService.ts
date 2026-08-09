import { db } from "@workspace/db";
import {
  billingReceiptOutbox,
  invoices,
  notifications,
  paymentIntents,
  plans,
  subscriptions,
  transactions,
  users,
} from "@workspace/db/schema";
import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  isEmailChannelEnabled,
  sendBillingFailedEmail,
  sendBillingReceiptEmail,
  sendSubscriptionExpiringEmail,
  type BillingEmailCategory,
  type BillingReceiptKind,
} from "./EmailService";
import { createNotification, createNotificationOnce } from "./NotificationService";

const EXPIRING_HORIZON_DAYS = 3;
const OUTBOX_BATCH_SIZE = 50;
const OUTBOX_MAX_RETRY_MS = 60 * 60 * 1000;
const OUTBOX_ERROR_MAX_CHARS = 1_000;

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface BillingReceiptPayload {
  userId: string;
  kind: BillingReceiptKind;
  amount: string;
  balanceAfter: string;
  transactionId: string;
  description?: string | null;
  invoiceNumber?: string | null;
  planName?: string | null;
}

export interface BillingFailedPayload {
  userId: string;
  amount: string;
  method: string;
  purpose: "wallet_topup" | "subscription";
  intentId: string;
}

function receiptLabel(kind: BillingReceiptKind, ar: boolean): string {
  switch (kind) {
    case "wallet_topup":
      return ar ? "شحن المحفظة" : "Wallet top-up";
    case "subscription_charge":
      return ar ? "اشتراك" : "Subscription";
    case "lead_charge":
      return ar ? "رسوم مهتم" : "Lead charge";
  }
}

function receiptBody(
  kind: BillingReceiptKind,
  amount: string,
  ar: boolean,
  planName?: string | null,
): string {
  const label = receiptLabel(kind, ar);
  if (kind === "subscription_charge" && planName) {
    return ar
      ? `تم خصم ${amount} ج.م لاشتراك ${planName}.`
      : `${amount} EGP charged for ${planName}.`;
  }
  return ar
    ? `تم تسجيل ${label} بمبلغ ${amount} ج.م.`
    : `${label} of ${amount} EGP recorded.`;
}

async function resolveUserContact(userId: string) {
  const [row] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

async function resolveInvoiceNumber(transactionId: string): Promise<string | null> {
  const [row] = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.transactionId, transactionId))
    .limit(1);
  return row?.invoiceNumber ?? null;
}

async function hydrateReceipt(
  payload: BillingReceiptPayload,
): Promise<BillingReceiptPayload> {
  const invoiceNumber =
    payload.invoiceNumber ??
    (await resolveInvoiceNumber(payload.transactionId));
  return { ...payload, invoiceNumber };
}

function paymentSuccessNotification(payload: BillingReceiptPayload) {
  const arBody = receiptBody(payload.kind, payload.amount, true, payload.planName);
  const enBody = receiptBody(payload.kind, payload.amount, false, payload.planName);
  return {
    userId: payload.userId,
    type: "payment_success" as const,
    title: "تم الدفع بنجاح · Payment successful",
    body: `${arBody} · ${enBody}`,
    data: {
      transaction_id: payload.transactionId,
      kind: payload.kind,
      amount: payload.amount,
      balance_after: payload.balanceAfter,
      invoice_number: payload.invoiceNumber ?? null,
      plan_name: payload.planName ?? null,
    },
  };
}

async function deliverPaymentSuccessEmail(
  payload: BillingReceiptPayload,
): Promise<void> {
  if (!(await isEmailChannelEnabled(payload.userId, "payment_success"))) return;
  const contact = await resolveUserContact(payload.userId);
  if (!contact?.email) return;

  await sendBillingReceiptEmail({
    to: contact.email,
    name: contact.name,
    transactionId: payload.transactionId,
    kind: payload.kind,
    amount: payload.amount,
    balanceAfter: payload.balanceAfter,
    description: payload.description ?? undefined,
    invoiceNumber: payload.invoiceNumber ?? null,
    planName: payload.planName ?? undefined,
  });
}

/** Insert the recovery marker inside the caller's money transaction. */
export async function enqueueBillingReceipt(
  tx: DbTx,
  transactionId: string,
): Promise<void> {
  await tx
    .insert(billingReceiptOutbox)
    .values({ transactionId })
    .onConflictDoNothing({ target: billingReceiptOutbox.transactionId });
}

function isReceiptKind(value: string): value is BillingReceiptKind {
  return (
    value === "wallet_topup" ||
    value === "subscription_charge" ||
    value === "lead_charge"
  );
}

function positiveMoney(value: string): string {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount)) {
    throw new Error("Billing receipt ledger amount is invalid");
  }
  return amount.toFixed(2);
}

async function resolveOutboxReceipt(
  transactionId: string,
): Promise<BillingReceiptPayload> {
  const [row] = await db
    .select({
      userId: transactions.userId,
      kind: transactions.type,
      amount: transactions.amount,
      balanceAfter: transactions.balanceAfter,
      description: transactions.description,
      referenceType: transactions.referenceType,
      referenceId: transactions.referenceId,
    })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!row) throw new Error("Billing receipt source transaction is missing");
  if (!isReceiptKind(row.kind)) {
    throw new Error(`Unsupported billing receipt transaction type: ${row.kind}`);
  }

  let planName: string | null = null;
  if (row.kind === "subscription_charge" && row.referenceType === "subscription" && row.referenceId) {
    const [plan] = await db
      .select({ name: plans.name })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.id, row.referenceId))
      .limit(1);
    planName = plan?.name ?? null;
  }

  return hydrateReceipt({
    userId: row.userId,
    kind: row.kind,
    amount: positiveMoney(row.amount),
    balanceAfter: row.balanceAfter,
    transactionId,
    description: row.description,
    planName,
  });
}

export function billingReceiptRetryDelayMs(attemptCount: number): number {
  const exponent = Math.max(0, Math.min(attemptCount, 7));
  return Math.min(30_000 * 2 ** exponent, OUTBOX_MAX_RETRY_MS);
}

function outboxErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.slice(0, OUTBOX_ERROR_MAX_CHARS);
}

/**
 * Deliver due receipt rows. The scheduled caller owns the cross-replica
 * advisory lock. Channel checkpoints make a partial success replay-safe.
 */
export async function processBillingReceiptOutbox(): Promise<number> {
  const due = await db
    .select({
      id: billingReceiptOutbox.id,
      transactionId: billingReceiptOutbox.transactionId,
      attemptCount: billingReceiptOutbox.attemptCount,
      inAppProcessedAt: billingReceiptOutbox.inAppProcessedAt,
      emailProcessedAt: billingReceiptOutbox.emailProcessedAt,
    })
    .from(billingReceiptOutbox)
    .where(
      and(
        isNull(billingReceiptOutbox.completedAt),
        lte(billingReceiptOutbox.availableAt, new Date()),
      ),
    )
    .orderBy(asc(billingReceiptOutbox.createdAt))
    .limit(OUTBOX_BATCH_SIZE);

  let completed = 0;
  for (const item of due) {
    let inAppDone = Boolean(item.inAppProcessedAt);
    let emailDone = Boolean(item.emailProcessedAt);
    try {
      const payload = await resolveOutboxReceipt(item.transactionId);

      if (!inAppDone) {
        await createNotificationOnce({
          ...paymentSuccessNotification(payload),
          dedupeKey: `billing-receipt:${item.transactionId}:in-app`,
        });
        await db
          .update(billingReceiptOutbox)
          .set({ inAppProcessedAt: new Date(), updatedAt: new Date() })
          .where(eq(billingReceiptOutbox.id, item.id));
        inAppDone = true;
      }

      if (!emailDone) {
        await deliverPaymentSuccessEmail(payload);
        await db
          .update(billingReceiptOutbox)
          .set({ emailProcessedAt: new Date(), updatedAt: new Date() })
          .where(eq(billingReceiptOutbox.id, item.id));
        emailDone = true;
      }

      if (inAppDone && emailDone) {
        await db
          .update(billingReceiptOutbox)
          .set({ completedAt: new Date(), lastError: null, updatedAt: new Date() })
          .where(eq(billingReceiptOutbox.id, item.id));
        completed += 1;
      }
    } catch (err) {
      const nextAttempt = item.attemptCount + 1;
      await db
        .update(billingReceiptOutbox)
        .set({
          attemptCount: nextAttempt,
          availableAt: new Date(Date.now() + billingReceiptRetryDelayMs(item.attemptCount)),
          lastError: outboxErrorMessage(err),
          updatedAt: new Date(),
        })
        .where(eq(billingReceiptOutbox.id, item.id));
      logger.error(
        { err, transactionId: item.transactionId, attempt: nextAttempt },
        "Billing receipt outbox delivery failed",
      );
    }
  }

  return completed;
}

/**
 * In-app + email when a PSP checkout fails (declined/cancelled webhook).
 */
export async function notifyPaymentFailed(payload: BillingFailedPayload): Promise<void> {
  const purposeLabel =
    payload.purpose === "subscription"
      ? { ar: "اشتراك", en: "subscription" }
      : { ar: "شحن المحفظة", en: "wallet top-up" };

  await createNotification({
    userId: payload.userId,
    type: "payment_failed",
    title: "فشل الدفع · Payment failed",
    body: `لم يكتمل ${purposeLabel.ar} (${payload.amount} ج.م عبر ${payload.method}) · The ${purposeLabel.en} payment did not complete.`,
    data: {
      intent_id: payload.intentId,
      amount: payload.amount,
      method: payload.method,
      purpose: payload.purpose,
    },
  });

  try {
    if (!(await isEmailChannelEnabled(payload.userId, "payment_failed"))) return;
    const contact = await resolveUserContact(payload.userId);
    if (!contact?.email) return;

    await sendBillingFailedEmail({
      to: contact.email,
      name: contact.name,
      amount: payload.amount,
      method: payload.method,
      purpose: payload.purpose,
    });
  } catch (err) {
    logger.error({ err, userId: payload.userId }, "Billing failed email failed");
  }
}

async function alreadyNotifiedExpiring(
  userId: string,
  subscriptionId: string,
): Promise<boolean> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "subscription_expiring"),
        gte(notifications.createdAt, weekAgo),
        sql`${notifications.data}->>'subscription_id' = ${subscriptionId}`,
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Daily job: warn users whose paid subscription expires within
 * {@link EXPIRING_HORIZON_DAYS} days. Deduped per subscription per week.
 */
export async function notifySubscriptionsExpiringSoon(): Promise<number> {
  const now = new Date();
  const horizon = new Date(now.getTime() + EXPIRING_HORIZON_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      subscriptionId: subscriptions.id,
      userId: subscriptions.userId,
      expiresAt: subscriptions.expiresAt,
      planName: plans.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
        gte(subscriptions.expiresAt, now),
        lte(subscriptions.expiresAt, horizon),
      ),
    );

  let sent = 0;
  for (const row of rows) {
    if (!row.expiresAt) continue;
    if (await alreadyNotifiedExpiring(row.userId, row.subscriptionId)) continue;

    const expiresIso = row.expiresAt.toISOString();
    const daysLeft = Math.max(
      1,
      Math.ceil((row.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    );

    await createNotification({
      userId: row.userId,
      type: "subscription_expiring",
      title: "اشتراكك ينتهي قريباً · Subscription expiring soon",
      body: `اشتراك ${row.planName} ينتهي خلال ${daysLeft} يوم · Your ${row.planName} plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
      data: {
        subscription_id: row.subscriptionId,
        plan_name: row.planName,
        expires_at: expiresIso,
        days_left: daysLeft,
      },
    });

    try {
      const category: BillingEmailCategory = "subscription_expiring";
      if (await isEmailChannelEnabled(row.userId, category)) {
        const contact = await resolveUserContact(row.userId);
        if (contact?.email) {
          await sendSubscriptionExpiringEmail({
            to: contact.email,
            name: contact.name,
            planName: row.planName,
            expiresAt: expiresIso,
            daysLeft,
          });
        }
      }
    } catch (err) {
      logger.error(
        { err, userId: row.userId, subscriptionId: row.subscriptionId },
        "Subscription expiring email failed",
      );
    }

    sent += 1;
  }

  return sent;
}

/** Load intent owner + fields for failure notifications after mark failed. */
export async function notifyPaymentIntentFailed(intentId: string): Promise<void> {
  const [intent] = await db
    .select({
      userId: paymentIntents.userId,
      amount: paymentIntents.amount,
      method: paymentIntents.method,
      purpose: paymentIntents.purpose,
      status: paymentIntents.status,
    })
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (!intent || intent.status !== "failed") return;
  if (intent.purpose !== "wallet_topup" && intent.purpose !== "subscription") return;

  try {
    await notifyPaymentFailed({
      userId: intent.userId,
      amount: intent.amount,
      method: intent.method,
      purpose: intent.purpose,
      intentId,
    });
  } catch (err) {
    logger.error({ err, intentId }, "Payment intent failure notification failed");
  }
}
