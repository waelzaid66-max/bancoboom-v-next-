import { db } from "@workspace/db";
import {
  plans,
  subscriptions,
  paymentIntents,
  transactions,
  listings,
  users,
  type Plan,
} from "@workspace/db/schema";
import { and, asc, count, eq, gte, gt, inArray, isNull, sql } from "drizzle-orm";
import {
  applyTransaction,
  getWalletBalance,
  type LedgerPaymentMethod,
} from "./WalletService";
import {
  resumeFailedPaymentMetadataSql,
  chargeErrorPaymentMetadataSql,
  checkoutBoundPaymentMetadataSql,
  paymobOrderIdFromMeta,
  pspReversedFromMeta,
} from "./PaymentIntentService";
import { resolveEffectivePlan, type UserRole } from "./PlanService";
import { createProviderCharge, type EgyptianRail } from "../lib/paymentProvider";
import { invalidData, isUniqueViolation, notFound, toMoney, conflict } from "../lib/billing";
import {
  enqueueBillingReceipt,
  notifyPaymentIntentFailed,
} from "./BillingNotificationService";

/** A subscription period is a fixed 30-day window. */
const PERIOD_DAYS = 30;

/** Roles that may hold paid (business) subscriptions. */
// `financial_institution` is the fourth account type (individual / dealer /
// company / financial_institution) and is a BUSINESS account for billing.
// Leaving it out meant an FI signed up successfully and was then locked out of
// the subscription layer entirely: listPlans() classified banks as non-business
// and showed them the individual catalog, and startSubscription() rejected every
// business plan with "This plan isn't available for your account type" — including
// `bank_featured`, the plan that exists specifically for them.
const BUSINESS_ROLES: readonly UserRole[] = [
  "dealer",
  "company",
  "enterprise",
  "financial_institution",
];

type SubscriptionRow = typeof subscriptions.$inferSelect;
type SubscribePaymentMethod = "wallet" | EgyptianRail;

function periodEnd(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + PERIOD_DAYS);
  return end;
}

function monthStartUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/* ── view mappers ──────────────────────────────────────── */

export function mapPlan(p: Plan) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    name_ar: p.nameAr,
    audience: p.audience,
    is_baseline: p.isBaseline,
    monthly_price: p.monthlyPrice,
    listing_quota: p.listingQuota,
    active_listing_cap: p.activeListingCap,
    boost_price: p.boostPrice,
    cpl_whatsapp: p.cplWhatsapp,
    cpl_call: p.cplCall,
    cpl_chat: p.cplChat,
    cpl_finance_request: p.cplFinanceRequest,
    ranking_weight: p.rankingWeight,
    features: (p.features as Record<string, boolean> | null) ?? null,
    sort_order: p.sortOrder ?? 0,
  };
}

function mapSubscription(s: SubscriptionRow, plan: Plan) {
  return {
    id: s.id,
    status: s.status,
    plan: mapPlan(plan),
    price_paid: s.pricePaid,
    starts_at: (s.startsAt ?? new Date()).toISOString(),
    expires_at: s.expiresAt.toISOString(),
    auto_renew: s.autoRenew,
    cancelled_at: s.cancelledAt ? s.cancelledAt.toISOString() : null,
  };
}

/* ── lookups ───────────────────────────────────────────── */

async function getPlanBySlug(slug: string): Promise<Plan> {
  const [plan] = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  if (!plan) throw notFound("Plan not found");
  return plan;
}

async function getActiveSubscription(userId: string): Promise<SubscriptionRow | null> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gt(subscriptions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return sub ?? null;
}

/**
 * Locate the subscription created by a confirmed subscription intent, keyed by
 * its idempotent charge transaction. Used to make confirmation replay-safe.
 */
async function findSubscriptionByChargeKey(
  chargeKey: string
): Promise<{ sub: SubscriptionRow; plan: Plan } | null> {
  const [txRow] = await db
    .select({ referenceId: transactions.referenceId })
    .from(transactions)
    .where(eq(transactions.idempotencyKey, chargeKey))
    .limit(1);
  if (!txRow?.referenceId) return null;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, txRow.referenceId))
    .limit(1);
  if (!sub) return null;

  const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
  if (!plan) return null;
  return { sub, plan };
}

/* ── plans listing ─────────────────────────────────────── */

/**
 * The catalog of plans relevant to a user's account type: business users see
 * business plans, individuals see individual plans. Free baselines are included
 * so the UI can show the current tier.
 */
/**
 * Which plans an account type may see and buy.
 *
 * BUSINESS_ROLES is dealer/company/enterprise — it does NOT include
 * financial_institution, which is a distinct fourth account type with its own
 * pricing. The previous rule was a two-way split: business roles saw business
 * plans, and *everyone else* was shown `audience === "individual"`. A bank fell
 * into "everyone else", so the seeded `bank_featured` plan — 14,999/month,
 * audience financial_institution — was filtered out of the only account type
 * that can buy it, and banks were offered the individual plan instead.
 *
 * Audit S5 had already corrected that plan's audience from `company` to
 * `financial_institution` (see the comment in seed.ts). That half of the fix
 * moved the plan further out of reach, because this filter never had a branch
 * for it.
 *
 * Behaviour for the existing roles is unchanged: individual still matches
 * individual, and the three business roles still match each other.
 */
function planMatchesRole(role: UserRole, audience: UserRole): boolean {
  if (BUSINESS_ROLES.includes(role)) return BUSINESS_ROLES.includes(audience);
  // Individual and financial_institution each see exactly their own tier.
  return audience === role;
}

export async function listPlans(role: UserRole) {
  const all = await db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.sortOrder));

  return all
    .filter((p) => planMatchesRole(role, p.audience as UserRole))
    .map(mapPlan);
}

/* ── subscribe ─────────────────────────────────────────── */

export interface StartSubscriptionInput {
  userId: string;
  role: UserRole;
  planSlug: string;
  paymentMethod: SubscribePaymentMethod;
  /** Client-stable UUID. External rails reuse it as payment_intents.id. */
  idempotencyKey: string;
}

/**
 * Begin a subscription. Wallet payments settle immediately (subscription
 * active, balance debited) inside one transaction; external rails create a
 * pending payment intent that the caller confirms separately.
 *
 * Pricing is read from the plans table — never from client input.
 */
export async function startSubscription(input: StartSubscriptionInput) {
  const plan = await getPlanBySlug(input.planSlug);

  if (!plan.isActive) throw invalidData("This plan is not available");
  if (plan.isBaseline) {
    throw invalidData("The free baseline plan requires no subscription");
  }
  // Same rule the listing uses, so a plan a caller can SEE is a plan they can
  // BUY. The old gate demanded a business role on both sides, which rejected a
  // bank buying the bank plan even if it somehow obtained the id — the second
  // half of the same defect. Individuals are unaffected: their only plan is the
  // free baseline, already rejected above.
  if (!planMatchesRole(input.role, plan.audience as UserRole)) {
    throw invalidData("This plan isn't available for your account type");
  }

  if (await getActiveSubscription(input.userId)) {
    throw invalidData(
      "You already have an active subscription. It must expire before you can switch plans."
    );
  }

  const price = toMoney(plan.monthlyPrice);
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) throw invalidData("idempotency_key is required");
  // Namespace away from payment_intents.id / top-up ledger keys (same UUID
  // space) so a reused client key cannot replay a wallet_topup credit as a
  // free subscription_charge.
  const walletLedgerKey = `subscription_wallet:${idempotencyKey}`;

  if (input.paymentMethod === "wallet") {
    let sub: SubscriptionRow;
    try {
      const txResult = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(subscriptions)
          .values({
            userId: input.userId,
            planId: plan.id,
            status: "active",
            pricePaid: price,
            startsAt: new Date(),
            expiresAt: periodEnd(),
            autoRenew: false,
          })
          .returning();

        if (Number(price) > 0) {
          const applied = await applyTransaction(tx, {
            userId: input.userId,
            type: "subscription_charge",
            direction: "debit",
            amount: price,
            referenceType: "subscription",
            referenceId: created.id,
            description: `Subscription: ${plan.name} (${PERIOD_DAYS}d)`,
            idempotencyKey: walletLedgerKey,
            invoice: {
              lineItems: [
                { label: `${plan.name} subscription (${PERIOD_DAYS}d)`, amount: price },
              ],
            },
          });
          await enqueueBillingReceipt(tx, applied.transactionId);
          const [updated] = await tx
            .update(subscriptions)
            .set({ transactionId: applied.transactionId })
            .where(eq(subscriptions.id, created.id))
            .returning();
          return {
            sub: updated,
            charge: {
              transactionId: applied.transactionId,
              balanceAfter: applied.balanceAfter,
            },
          };
        }
        return { sub: created, charge: null as { transactionId: string; balanceAfter: string } | null };
      });
      sub = txResult.sub;
    } catch (err) {
      // Lost race for the one-active-subscription slot — or a client retry after
      // the first request already activated. Replay via the ledger idempotency key.
      if (isUniqueViolation(err)) {
        const settled = await findSubscriptionByChargeKey(walletLedgerKey);
        if (settled && settled.sub.userId === input.userId) {
          return {
            mode: "active" as const,
            subscription: mapSubscription(settled.sub, settled.plan),
            intent: null,
          };
        }
        throw invalidData("You already have an active subscription.");
      }
      // Fingerprint mismatch / conflict from applyTransaction on concurrent
      // same-key retries — resolve to the winner's subscription if present.
      if ((err as { code?: string })?.code === "CONFLICT") {
        const settled = await findSubscriptionByChargeKey(walletLedgerKey);
        if (settled && settled.sub.userId === input.userId) {
          return {
            mode: "active" as const,
            subscription: mapSubscription(settled.sub, settled.plan),
            intent: null,
          };
        }
      }
      throw err;
    }

    return {
      mode: "active" as const,
      subscription: mapSubscription(sub, plan),
      intent: null,
    };
  }

  // External rail → durable pending intent FIRST (id = client idempotency key),
  // then open the PSP charge. Retries with the same key replay the checkout URL.
  const intentId = idempotencyKey;

  function checkoutUrlFromMeta(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return null;
    }
    const url = (metadata as Record<string, unknown>).checkout_url;
    return typeof url === "string" && url.length > 0 ? url : null;
  }

  function assertSubIntentMatch(existing: typeof paymentIntents.$inferSelect): void {
    if (existing.userId !== input.userId) {
      throw conflict("Idempotency key already used");
    }
    if (existing.purpose !== "subscription") {
      throw conflict("Idempotency key already used");
    }
    if (existing.method !== input.paymentMethod) {
      throw invalidData("Idempotency key reused with a different payment method");
    }
    if (existing.planId && existing.planId !== plan.id) {
      throw invalidData("Idempotency key reused with a different plan");
    }
    if (toMoney(existing.amount) !== price) {
      throw invalidData("Idempotency key reused with a different amount");
    }
  }

  function intentResult(row: typeof paymentIntents.$inferSelect, checkoutUrl: string | null) {
    return {
      mode: "intent" as const,
      subscription: null,
      intent: {
        intent_id: row.id,
        plan_slug: plan.slug,
        amount: row.amount,
        method: row.method as EgyptianRail,
        status: row.status,
        provider_ref: row.providerRef,
        checkout_url: checkoutUrl,
        created_at: (row.createdAt ?? new Date()).toISOString(),
      },
    };
  }

  let intent: typeof paymentIntents.$inferSelect | undefined;
  const [existingIntent] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (existingIntent) {
    assertSubIntentMatch(existingIntent);
    if (existingIntent.status === "completed" || existingIntent.status === "expired") {
      throw conflict("This subscription payment was already completed");
    }
    const replayUrl = checkoutUrlFromMeta(existingIntent.metadata);
    if (
      existingIntent.status === "pending" &&
      replayUrl &&
      existingIntent.providerRef
    ) {
      return intentResult(existingIntent, replayUrl);
    }
    if (existingIntent.status === "failed") {
      const boundOrder = paymobOrderIdFromMeta(existingIntent.metadata);
      if (boundOrder) {
        await db
          .update(paymentIntents)
          .set({
            status: "pending",
            planId: plan.id,
            metadata: resumeFailedPaymentMetadataSql(),
          })
          .where(
            and(
              eq(paymentIntents.id, intentId),
              eq(paymentIntents.status, "failed"),
            ),
          );
        throw conflict(
          "This payment already has a provider order; wait for confirmation",
        );
      }
      const [resumed] = await db
        .update(paymentIntents)
        .set({
          status: "pending",
          providerRef: null,
          planId: plan.id,
          metadata: resumeFailedPaymentMetadataSql(),
        })
        .where(
          and(
            eq(paymentIntents.id, intentId),
            eq(paymentIntents.status, "failed"),
          ),
        )
        .returning();
      intent = resumed ?? existingIntent;
    } else {
      intent = existingIntent;
    }
  } else {
    try {
      const [inserted] = await db
        .insert(paymentIntents)
        .values({
          id: intentId,
          userId: input.userId,
          amount: price,
          method: input.paymentMethod,
          purpose: "subscription",
          status: "pending",
          providerRef: null,
          planId: plan.id,
          metadata: { provider: "paymob" },
        })
        .returning();
      intent = inserted;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const [raced] = await db
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, intentId))
        .limit(1);
      if (!raced) throw err;
      assertSubIntentMatch(raced);
      const replayUrl = checkoutUrlFromMeta(raced.metadata);
      if (raced.status === "pending" && replayUrl && raced.providerRef) {
        return intentResult(raced, replayUrl);
      }
      if (raced.status === "completed" || raced.status === "expired") {
        throw conflict("This subscription payment was already completed");
      }
      intent = raced;
    }
  }

  if (!intent) throw invalidData("Failed to create subscription intent");

  const earlyUrl = checkoutUrlFromMeta(intent.metadata);
  if (intent.status === "pending" && earlyUrl && intent.providerRef) {
    return intentResult(intent, earlyUrl);
  }

  if (paymobOrderIdFromMeta(intent.metadata)) {
    throw conflict(
      "This payment already has a provider order; wait for confirmation",
    );
  }

  const [openingClaim] = await db
    .update(paymentIntents)
    .set({
      metadata: sql`
        (COALESCE(${paymentIntents.metadata}, '{}'::jsonb)
          - 'provider_opening_at')
        || jsonb_build_object(
          'provider', 'paymob',
          'provider_opening', true,
          'provider_opening_at', (extract(epoch from now()))::text
        )
      `,
    })
    .where(
      and(
        eq(paymentIntents.id, intentId),
        eq(paymentIntents.status, "pending"),
        isNull(paymentIntents.providerRef),
        sql`COALESCE(${paymentIntents.metadata}->>'checkout_url', '') = ''`,
        sql`(
          COALESCE(${paymentIntents.metadata}->>'provider_opening', '') <> 'true'
          OR COALESCE((${paymentIntents.metadata}->>'provider_opening_at')::double precision, 0)
            < extract(epoch from now()) - 120
        )`,
      ),
    )
    .returning({ id: paymentIntents.id });

  if (!openingClaim) {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 50));
      const [fresh] = await db
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, intentId))
        .limit(1);
      if (!fresh) break;
      assertSubIntentMatch(fresh);
      const url = checkoutUrlFromMeta(fresh.metadata);
      if (fresh.status === "pending" && url && fresh.providerRef) {
        return intentResult(fresh, url);
      }
      if (fresh.status === "failed") break;
      if (fresh.status === "completed" || fresh.status === "expired") {
        throw conflict("This subscription payment was already completed");
      }
    }
    throw conflict("Subscription checkout is being prepared; retry shortly");
  }

  let charge;
  try {
    charge = await createProviderCharge({
      amount: price,
      method: input.paymentMethod,
      intentId,
      purpose: "subscription",
      userId: input.userId,
      description: `Subscription: ${plan.name}`,
    });
  } catch (err) {
    await db
      .update(paymentIntents)
      .set({ status: "failed", metadata: chargeErrorPaymentMetadataSql() })
      .where(and(eq(paymentIntents.id, intentId), eq(paymentIntents.status, "pending")));
    throw err;
  }

  const [updated] = await db
    .update(paymentIntents)
    .set({
      providerRef: charge.providerRef,
      metadata: checkoutBoundPaymentMetadataSql(
        charge.checkoutUrl,
        charge.providerOrderId,
      ),
    })
    .where(eq(paymentIntents.id, intentId))
    .returning();

  return intentResult(updated ?? intent, charge.checkoutUrl);
}

/* ── confirm subscription intent ───────────────────────── */

/**
 * Read-only status of a subscription payment intent. This is what the client
 * polls after the buyer returns from the hosted checkout — it NEVER settles.
 * Activation only happens through the verified provider webhook
 * (`settleSubscriptionIntentByWebhook`).
 *
 * IDOR: a mismatched owner reads as "not found" (no existence leak).
 */
export async function getSubscriptionIntentStatus(
  intentId: string,
  userId: string
) {
  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (!intent || intent.userId !== userId) throw notFound("Payment intent not found");
  if (intent.purpose !== "subscription") throw invalidData("Not a subscription intent");

  const existing = await findSubscriptionByChargeKey(`${intent.id}:charge`);

  return {
    intent_id: intent.id,
    status: intent.status,
    subscription: existing ? mapSubscription(existing.sub, existing.plan) : null,
    balance: await getWalletBalance(userId),
    already_processed: intent.status === "completed",
  };
}

/**
 * Settle a subscription payment intent — invoked ONLY by the verified provider
 * webhook. The external payment funds the wallet and is immediately spent on
 * the subscription in ONE transaction, so the net wallet delta is zero while
 * the ledger records both the inflow and the purchase (balance == SUM(ledger)
 * always holds).
 *
 * Idempotency: the credit uses key `${id}:topup` and the charge uses
 * `${id}:charge`. A repeated webhook delivery replays exactly once; the
 * fast-path, the active-subscription unique index, and the 23505 catch all
 * resolve to a no-op.
 */
export async function settleSubscriptionIntentByWebhook(
  intentId: string,
  opts: { providerTxnId?: string | null } = {}
): Promise<void> {
  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (!intent) throw notFound("Payment intent not found");
  if (intent.purpose !== "subscription") throw invalidData("Not a subscription intent");
  if (intent.status === "completed") return; // idempotent replay
  // Refund/void already recorded — never activate/credit after PSP reverse won.
  if (pspReversedFromMeta(intent.metadata)) {
    return;
  }
  if (intent.status !== "pending" && intent.status !== "failed") {
    throw invalidData(`Cannot settle a ${intent.status} intent`);
  }
  if (!intent.planId) throw invalidData("Subscription intent is missing its plan");

  // Soft-deleted owners must not receive an active subscription from late webhooks.
  const [owner] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, intent.userId), isNull(users.deletedAt)))
    .limit(1);
  if (!owner) {
    await db
      .update(paymentIntents)
      .set({ status: "failed" })
      .where(
        and(
          eq(paymentIntents.id, intent.id),
          inArray(paymentIntents.status, ["pending", "failed"]),
        ),
      );
    return;
  }

  const [plan] = await db.select().from(plans).where(eq(plans.id, intent.planId)).limit(1);
  if (!plan) throw notFound("Plan not found");

  const chargeKey = `${intent.id}:charge`;
  const userId = intent.userId;

  // Fast-path replay: this intent was already settled.
  if (await findSubscriptionByChargeKey(chargeKey)) {
    await db
      .update(paymentIntents)
      .set({ status: "completed", completedAt: new Date() })
      .where(
        and(
          eq(paymentIntents.id, intent.id),
          inArray(paymentIntents.status, ["pending", "failed"]),
        ),
      );
    return;
  }

  try {
    const settled = await db.transaction(async (tx) => {
      const [lockedIntent] = await tx
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, intent.id))
        .for("update")
        .limit(1);
      if (!lockedIntent) return null;
      if (lockedIntent.status === "completed") return null;
      if (pspReversedFromMeta(lockedIntent.metadata)) return null;
      if (lockedIntent.status !== "pending" && lockedIntent.status !== "failed") {
        throw invalidData(`Cannot settle a ${lockedIntent.status} intent`);
      }

      const [locked] = await tx
        .select({ id: users.id, deletedAt: users.deletedAt })
        .from(users)
        .where(eq(users.id, userId))
        .for("update")
        .limit(1);
      if (!locked || locked.deletedAt) {
        await tx
          .update(paymentIntents)
          .set({ status: "failed" })
          .where(
            and(
              eq(paymentIntents.id, intent.id),
              inArray(paymentIntents.status, ["pending", "failed"]),
            ),
          );
        return null;
      }

      await applyTransaction(tx, {
        userId,
        type: "wallet_topup",
        direction: "credit",
        amount: intent.amount,
        paymentMethod: intent.method as LedgerPaymentMethod,
        referenceType: "payment_intent",
        referenceId: intent.id,
        description: `Subscription payment via ${intent.method}`,
        idempotencyKey: `${intent.id}:topup`,
        metadata: opts.providerTxnId ? { provider_txn_id: opts.providerTxnId } : null,
      });

      const [created] = await tx
        .insert(subscriptions)
        .values({
          userId,
          planId: plan.id,
          status: "active",
          pricePaid: intent.amount,
          startsAt: new Date(),
          expiresAt: periodEnd(),
          autoRenew: false,
        })
        .returning();

      const charge = await applyTransaction(tx, {
        userId,
        type: "subscription_charge",
        direction: "debit",
        amount: intent.amount,
        referenceType: "subscription",
        referenceId: created.id,
        description: `Subscription: ${plan.name} (${PERIOD_DAYS}d)`,
        idempotencyKey: chargeKey,
        invoice: {
          lineItems: [
            { label: `${plan.name} subscription (${PERIOD_DAYS}d)`, amount: intent.amount },
          ],
        },
      });
      await enqueueBillingReceipt(tx, charge.transactionId);

      await tx
        .update(subscriptions)
        .set({ transactionId: charge.transactionId })
        .where(eq(subscriptions.id, created.id));

      await tx
        .update(paymentIntents)
        .set({ status: "completed", completedAt: new Date() })
        .where(
          and(
            eq(paymentIntents.id, intent.id),
            inArray(paymentIntents.status, ["pending", "failed"]),
          ),
        );

      return {
        transactionId: charge.transactionId,
        balanceAfter: charge.balanceAfter,
      };
    });

    if (!settled) return;

  } catch (err) {
    if (isUniqueViolation(err)) {
      // Concurrent delivery already activated this charge key — complete intent.
      if (await findSubscriptionByChargeKey(chargeKey)) {
        await db
          .update(paymentIntents)
          .set({ status: "completed", completedAt: new Date() })
          .where(
            and(
              eq(paymentIntents.id, intent.id),
              inArray(paymentIntents.status, ["pending", "failed"]),
            ),
          );
        return;
      }
      // Active-subscription unique slot taken by another sub: still credit the
      // verified PSP payment as a wallet top-up so money is not stranded, then
      // complete the intent (never ACK success while leaving intent pending).
      try {
        await db.transaction(async (tx) => {
          const [lockedIntent] = await tx
            .select()
            .from(paymentIntents)
            .where(eq(paymentIntents.id, intent.id))
            .for("update")
            .limit(1);
          if (!lockedIntent || lockedIntent.status === "completed") return;
          if (pspReversedFromMeta(lockedIntent.metadata)) return;
          if (lockedIntent.status !== "pending" && lockedIntent.status !== "failed") return;

          await applyTransaction(tx, {
            userId,
            type: "wallet_topup",
            direction: "credit",
            amount: intent.amount,
            paymentMethod: intent.method as LedgerPaymentMethod,
            referenceType: "payment_intent",
            referenceId: intent.id,
            description: `Subscription payment credited (active plan already held)`,
            idempotencyKey: `${intent.id}:orphan_topup`,
            metadata: opts.providerTxnId
              ? { provider_txn_id: opts.providerTxnId, orphan_reason: "active_slot_taken" }
              : { orphan_reason: "active_slot_taken" },
          });
          await tx
            .update(paymentIntents)
            .set({ status: "completed", completedAt: new Date() })
            .where(
              and(
                eq(paymentIntents.id, intent.id),
                inArray(paymentIntents.status, ["pending", "failed"]),
              ),
            );
        });
      } catch (err2) {
        if (isUniqueViolation(err2)) return;
        throw err2;
      }
      return;
    }
    throw err;
  }
}

/** Mark a pending subscription intent failed (cancelled/declined webhook). No money moves. */
export async function markSubscriptionIntentFailed(intentId: string): Promise<void> {
  const updated = await db
    .update(paymentIntents)
    .set({ status: "failed" })
    .where(and(eq(paymentIntents.id, intentId), eq(paymentIntents.status, "pending")))
    .returning({ id: paymentIntents.id });

  if (updated.length > 0) {
    await notifyPaymentIntentFailed(intentId);
  }
}

/**
 * Paymob refund/void after subscription settlement (or pre-settle race).
 * - pending/failed: durable `psp_reversed` so late success cannot settle.
 * - completed: expire the charge-linked active sub; claw back orphan wallet
 *   credit (`:orphan_topup`) via adjustment debit (not `refund` — UI treats
 *   refund as credit). Net-zero topup+charge paths need no clawback.
 */
export async function reverseSubscriptionAfterPspReversal(
  intentId: string,
  opts: {
    reason: "refunded" | "voided";
    providerTxnId?: string | null;
    /** EGP magnitude for orphan clawback; defaults to full orphan credit. */
    clawAmountEgp?: string | number | null;
  },
): Promise<void> {
  let notifyFailed = false;

  await db.transaction(async (tx) => {
    const [intent] = await tx
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, intentId))
      .for("update")
      .limit(1);
    if (!intent || intent.purpose !== "subscription") return;

    const meta =
      intent.metadata && typeof intent.metadata === "object" && !Array.isArray(intent.metadata)
        ? ({ ...(intent.metadata as Record<string, unknown>) } as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    if (meta.psp_reversed === true) return;

    meta.psp_reversed = true;
    meta.psp_reversal_reason = opts.reason;
    if (opts.providerTxnId) meta.psp_reversal_txn_id = opts.providerTxnId;

    if (intent.status === "pending" || intent.status === "failed") {
      await tx
        .update(paymentIntents)
        .set({ status: "failed", metadata: meta })
        .where(eq(paymentIntents.id, intent.id));
      notifyFailed = intent.status === "pending";
      return;
    }
    if (intent.status !== "completed") return;

    // Expire any active subscription created from this settlement charge key.
    const chargeKey = `${intent.id}:charge`;
    const [chargeTx] = await tx
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.idempotencyKey, chargeKey))
      .limit(1);
    if (chargeTx) {
      await tx
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          autoRenew: false,
          expiresAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.userId, intent.userId),
            eq(subscriptions.transactionId, chargeTx.id),
            eq(subscriptions.status, "active"),
          ),
        );
    }

    // Orphan path credited `${id}:orphan_topup` without a matching charge.
    const orphanKey = `${intent.id}:orphan_topup`;
    const [orphanCredit] = await tx
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
      })
      .from(transactions)
      .where(eq(transactions.idempotencyKey, orphanKey))
      .limit(1);
    if (orphanCredit && Number(orphanCredit.amount) > 0) {
      const orphanTotal = Number(orphanCredit.amount);
      const requestedRaw =
        opts.clawAmountEgp != null && opts.clawAmountEgp !== ""
          ? Number(opts.clawAmountEgp)
          : orphanTotal;
      const clawTarget =
        Number.isFinite(requestedRaw) && requestedRaw > 0
          ? Math.min(orphanTotal, Math.round(requestedRaw * 100) / 100)
          : orphanTotal;
      const [lockedUser] = await tx
        .select({ bal: users.walletBalance })
        .from(users)
        .where(eq(users.id, intent.userId))
        .for("update")
        .limit(1);
      const avail = Math.max(0, Number(lockedUser?.bal ?? 0));
      const claw = Math.min(avail, clawTarget);
      if (claw > 0) {
        await applyTransaction(tx, {
          userId: intent.userId,
          type: "adjustment",
          direction: "debit",
          amount: claw.toFixed(2),
          paymentMethod: intent.method as LedgerPaymentMethod,
          referenceType: "payment_intent",
          referenceId: intent.id,
          description: `PSP ${opts.reason} clawback for orphan subscription top-up`,
          idempotencyKey: `${intent.id}:psp_reversal_clawback:orphan`,
          metadata: {
            psp_reversal: opts.reason,
            provider_txn_id: opts.providerTxnId ?? null,
            original_idempotency_key: orphanKey,
            clawback_amount: claw.toFixed(2),
          },
        });
      }
      if (claw < clawTarget) {
        meta.psp_reversal_shortfall = true;
        meta.psp_reversal_shortfall_amount = (clawTarget - claw).toFixed(2);
        meta.psp_reversal_needs_manual_review = true;
        console.error(
          "[Paymob subscription reversal] orphan shortfall — ops must recover",
          intentId,
          meta.psp_reversal_shortfall_amount,
        );
      }
    }

    await tx
      .update(paymentIntents)
      .set({ metadata: meta })
      .where(eq(paymentIntents.id, intent.id));
  });

  if (notifyFailed) {
    await notifyPaymentIntentFailed(intentId);
  }
}

/* ── cancel ────────────────────────────────────────────── */

/**
 * Cancel auto-renewal. The subscription stays ACTIVE (and keeps its plan's
 * quotas) until it expires — no refund, no immediate downgrade.
 */
export async function cancelSubscription(userId: string) {
  const active = await getActiveSubscription(userId);
  if (!active) throw notFound("No active subscription to cancel");

  const [updated] = await db
    .update(subscriptions)
    .set({ cancelledAt: new Date(), autoRenew: false })
    .where(eq(subscriptions.id, active.id))
    .returning();

  const [plan] = await db.select().from(plans).where(eq(plans.id, updated.planId)).limit(1);
  if (!plan) throw notFound("Plan not found");
  return mapSubscription(updated, plan);
}

/* ── my subscription + usage ───────────────────────────── */

/**
 * The user's effective plan (active subscription or free baseline), the active
 * subscription record if any, and current usage against the plan's quotas.
 */
export async function getMySubscription(userId: string, role: UserRole) {
  const effective = await resolveEffectivePlan(userId, role);

  const active = await getActiveSubscription(userId);
  let subscriptionView: ReturnType<typeof mapSubscription> | null = null;
  if (active) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, active.planId)).limit(1);
    if (plan) subscriptionView = mapSubscription(active, plan);
  }

  const [{ createdThisMonth }] = await db
    .select({ createdThisMonth: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), gte(listings.createdAt, monthStartUtc())));

  const [{ activeNow }] = await db
    .select({ activeNow: count() })
    .from(listings)
    .where(and(eq(listings.userId, userId), eq(listings.status, "active")));

  return {
    plan: mapPlan(effective),
    subscription: subscriptionView,
    usage: {
      listings_this_month: Number(createdThisMonth),
      active_listings: Number(activeNow),
      listing_quota: effective.listingQuota,
      active_listing_cap: effective.activeListingCap,
    },
  };
}
