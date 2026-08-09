import { db } from "@workspace/db";
import { paymentIntents, transactions, users } from "@workspace/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  applyTransaction,
  getWalletBalance,
  type LedgerPaymentMethod,
} from "./WalletService";
import { createProviderCharge, type EgyptianRail } from "../lib/paymentProvider";
import {
  conflict,
  invalidData,
  isUniqueViolation,
  notFound,
  toMoney,
} from "../lib/billing";
import { schedulePaymentSuccess, notifyPaymentIntentFailed } from "./BillingNotificationService";

export type TopupMethod = EgyptianRail;

export interface CreateTopupInput {
  userId: string;
  amount: number;
  method: TopupMethod;
  /** Client-stable UUID — reused as payment_intents.id so retries never open a second PSP checkout. */
  idempotencyKey: string;
}

export interface TopupIntentResult {
  intent_id: string;
  amount: string;
  method: string;
  status: string;
  provider_ref: string | null;
  /** Hosted checkout URL the buyer is sent to in order to pay. */
  checkout_url: string | null;
  created_at: string;
}

export interface ConfirmTopupResult {
  intent_id: string;
  status: string;
  transaction_id: string | null;
  balance: string;
  already_processed: boolean;
}

function checkoutUrlFromMeta(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const url = (metadata as Record<string, unknown>).checkout_url;
  return typeof url === "string" && url.length > 0 ? url : null;
}

/**
 * Resume a failed intent for another PSP open WITHOUT wiping `paymob_order_id`.
 * A full metadata replace stranded paid orders when a second checkout was opened.
 */
export function resumeFailedPaymentMetadataSql() {
  return sql`
    (COALESCE(${paymentIntents.metadata}, '{}'::jsonb)
      - 'checkout_url'
      - 'provider_opening'
      - 'provider_opening_at'
      - 'charge_error')
    || '{"provider":"paymob","resumed":true}'::jsonb
  `;
}

/** Mark charge failure while preserving any already-bound Paymob order.id. */
export function chargeErrorPaymentMetadataSql() {
  return sql`
    (COALESCE(${paymentIntents.metadata}, '{}'::jsonb)
      - 'checkout_url'
      - 'provider_opening'
      - 'provider_opening_at'
      - 'resumed')
    || '{"provider":"paymob","charge_error":true}'::jsonb
  `;
}

/** Bind hosted checkout URL without erasing `paymob_order_id`. */
export function checkoutBoundPaymentMetadataSql(
  checkoutUrl: string,
  providerOrderId: string,
) {
  return sql`
    (COALESCE(${paymentIntents.metadata}, '{}'::jsonb)
      - 'provider_opening'
      - 'provider_opening_at'
      - 'charge_error'
      - 'resumed')
    || jsonb_build_object(
      'provider', 'paymob',
      'checkout_url', ${checkoutUrl}::text,
      'paymob_order_id', ${providerOrderId}::text
    )
  `;
}

export function paymobOrderIdFromMeta(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const id = (metadata as Record<string, unknown>).paymob_order_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** True when a refund/void already won — settlement must never credit afterward. */
export function pspReversedFromMeta(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }
  const meta = metadata as Record<string, unknown>;
  return (
    meta.psp_reversed === true ||
    meta.psp_refund_reconciliation_required === true
  );
}

function asIntentMeta(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return { ...(metadata as Record<string, unknown>) };
  }
  return {};
}

function assertTopupIdempotencyMatch(
  existing: typeof paymentIntents.$inferSelect,
  input: CreateTopupInput,
  amount: string,
): void {
  if (existing.userId !== input.userId) {
    throw conflict("Idempotency key already used");
  }
  if (existing.purpose !== "wallet_topup") {
    throw conflict("Idempotency key already used");
  }
  if (existing.method !== input.method) {
    throw invalidData("Idempotency key reused with a different payment method");
  }
  if (toMoney(existing.amount) !== amount) {
    throw invalidData("Idempotency key reused with a different amount");
  }
}

function topupResultFromRow(
  row: typeof paymentIntents.$inferSelect,
  checkoutUrl: string | null,
): TopupIntentResult {
  return {
    intent_id: row.id,
    amount: row.amount,
    method: row.method,
    status: row.status,
    provider_ref: row.providerRef,
    checkout_url: checkoutUrl,
    created_at: (row.createdAt ?? new Date()).toISOString(),
  };
}

/**
 * Create a pending wallet top-up intent against the real PSP (Paymob).
 *
 * Durable intent row is inserted FIRST so a process crash / DB blip after the
 * PSP charge cannot leave a paid checkout with no settleable intent (webhook
 * would otherwise ACK an unknown merchant reference and strand money).
 * Provider charge is opened second; checkout URL is patched onto the row.
 *
 * Idempotency: `idempotencyKey` IS the payment_intents.id. Retries with the
 * same key replay the existing checkout URL and never open a second Paymob
 * order once one is bound.
 */
export async function createTopupIntent(
  input: CreateTopupInput
): Promise<TopupIntentResult> {
  const amount = toMoney(input.amount);
  if (Number(amount) <= 0) throw invalidData("Top-up amount must be positive");

  const intentId = input.idempotencyKey.trim();
  if (!intentId) throw invalidData("idempotency_key is required");

  let intent: typeof paymentIntents.$inferSelect | undefined;

  const [existing] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (existing) {
    assertTopupIdempotencyMatch(existing, input, amount);
    if (existing.status === "completed" || existing.status === "expired") {
      throw conflict("This top-up was already completed");
    }
    const replayUrl = checkoutUrlFromMeta(existing.metadata);
    if (
      existing.status === "pending" &&
      replayUrl &&
      existing.providerRef
    ) {
      return topupResultFromRow(existing, replayUrl);
    }
    // pending/failed without a bound checkout → resume (re-open PSP once).
    if (existing.status === "failed") {
      const boundOrder = paymobOrderIdFromMeta(existing.metadata);
      if (boundOrder) {
        // Order already claimed — reopening a second checkout would strand
        // settlement of the first paid order. Restore pending and refuse.
        await db
          .update(paymentIntents)
          .set({
            status: "pending",
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
          metadata: resumeFailedPaymentMetadataSql(),
        })
        .where(
          and(eq(paymentIntents.id, intentId), eq(paymentIntents.status, "failed")),
        )
        .returning();
      intent = resumed ?? existing;
    } else {
      intent = existing;
    }
  } else {
    try {
      const [inserted] = await db
        .insert(paymentIntents)
        .values({
          id: intentId,
          userId: input.userId,
          amount,
          method: input.method,
          purpose: "wallet_topup",
          status: "pending",
          providerRef: null,
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
      assertTopupIdempotencyMatch(raced, input, amount);
      const replayUrl = checkoutUrlFromMeta(raced.metadata);
      if (raced.status === "pending" && replayUrl && raced.providerRef) {
        return topupResultFromRow(raced, replayUrl);
      }
      if (raced.status === "completed" || raced.status === "expired") {
        throw conflict("This top-up was already completed");
      }
      intent = raced;
    }
  }

  if (!intent) throw invalidData("Failed to create top-up intent");

  // Another concurrent request may have bound checkout between our read and now.
  const earlyUrl = checkoutUrlFromMeta(intent.metadata);
  if (intent.status === "pending" && earlyUrl && intent.providerRef) {
    return topupResultFromRow(intent, earlyUrl);
  }

  if (paymobOrderIdFromMeta(intent.metadata)) {
    throw conflict(
      "This payment already has a provider order; wait for confirmation",
    );
  }

  // Serialize Paymob checkout creation: only one concurrent retry may enter the
  // PSP window. Losers poll until checkout is bound (or the opener fails).
  const claimed = await claimProviderOpening(intentId);
  if (!claimed) {
    const replay = await waitForTopupCheckout(intentId, input, amount);
    if (replay) return replay;
    throw conflict("Top-up checkout is being prepared; retry shortly");
  }

  let charge;
  try {
    charge = await createProviderCharge({
      amount,
      method: input.method,
      intentId,
      purpose: "wallet_topup",
      userId: input.userId,
      description: `Wallet top-up (${input.method})`,
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

  const row = updated ?? intent;
  return topupResultFromRow(row, charge.checkoutUrl);
}

/**
 * CAS: mark intent as opening a PSP checkout. Returns true only for the winner.
 * Requires pending + no providerRef + no checkout_url + not already opening
 * (or the opening lease expired — crash recovery without a schema migration).
 */
const PROVIDER_OPENING_LEASE_SEC = 120;

async function claimProviderOpening(intentId: string): Promise<boolean> {
  const [row] = await db
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
            < extract(epoch from now()) - ${PROVIDER_OPENING_LEASE_SEC}
        )`,
      ),
    )
    .returning({ id: paymentIntents.id });
  return !!row;
}

async function waitForTopupCheckout(
  intentId: string,
  input: CreateTopupInput,
  amount: string,
): Promise<TopupIntentResult | null> {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 50));
    const [fresh] = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, intentId))
      .limit(1);
    if (!fresh) return null;
    assertTopupIdempotencyMatch(fresh, input, amount);
    const url = checkoutUrlFromMeta(fresh.metadata);
    if (fresh.status === "pending" && url && fresh.providerRef) {
      return topupResultFromRow(fresh, url);
    }
    if (fresh.status === "failed") {
      return null;
    }
    if (fresh.status === "completed" || fresh.status === "expired") {
      throw conflict("This top-up was already completed");
    }
  }
  return null;
}

async function findTransactionByKey(key: string): Promise<string | null> {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.idempotencyKey, key))
    .limit(1);
  return row?.id ?? null;
}

/** Lightweight metadata used by the webhook to route + tamper-check a settlement. */
export async function getIntentMeta(
  intentId: string
): Promise<{ purpose: string; amount: string; status: string } | null> {
  const [intent] = await db
    .select({
      purpose: paymentIntents.purpose,
      amount: paymentIntents.amount,
      status: paymentIntents.status,
    })
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);
  return intent ?? null;
}

/**
 * Record a signed Paymob refund without guessing its economic delta.
 *
 * Paymob signs the original transaction amount (`amount_cents`) but exposes
 * the cumulative partial-refund total in a separate field that is not part of
 * the transaction HMAC. The webhook therefore proves that a refund happened,
 * not how much should be clawed back. Persist the reconciliation marker and
 * block any late success settlement until an authenticated provider inquiry
 * supplies the authoritative refunded total.
 */
export async function markPaymobRefundForReconciliation(
  intentId: string,
  opts: { providerTxnId?: string | null } = {},
): Promise<void> {
  const marker = {
    psp_refund_reconciliation_required: true,
    psp_refund_transaction_id: opts.providerTxnId ?? null,
    psp_refund_reported_at: new Date().toISOString(),
  };

  const [updated] = await db
    .update(paymentIntents)
    .set({
      metadata: sql`
        COALESCE(${paymentIntents.metadata}, '{}'::jsonb)
        || ${JSON.stringify(marker)}::jsonb
      `,
    })
    .where(eq(paymentIntents.id, intentId))
    .returning({ id: paymentIntents.id });

  if (!updated) throw notFound("Payment intent not found");
}

/**
 * Bind a signed Paymob `order.id` to exactly one local payment_intent.
 * merchant_order_id / extras.intent_id are UNSIGNED — without this claim an
 * intercepted webhook body could remap settlement onto another same-amount intent.
 */
export async function claimPaymobOrderForIntent(
  intentId: string,
  providerOrderId: string,
): Promise<"ok" | "not_found" | "order_bound_elsewhere" | "intent_order_mismatch"> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`paymob_order:${providerOrderId}`}))`,
    );

    // Lock the intent row so two different orders cannot both observe
    // paymob_order_id=null and last-write-wins a full metadata replace.
    const [intent] = await tx
      .select({
        id: paymentIntents.id,
        metadata: paymentIntents.metadata,
      })
      .from(paymentIntents)
      .where(eq(paymentIntents.id, intentId))
      .for("update")
      .limit(1);
    if (!intent) return "not_found";

    const meta =
      intent.metadata && typeof intent.metadata === "object" && !Array.isArray(intent.metadata)
        ? ({ ...(intent.metadata as Record<string, unknown>) } as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    const existingOrder =
      typeof meta.paymob_order_id === "string" ? meta.paymob_order_id : null;
    if (existingOrder && existingOrder !== providerOrderId) {
      return "intent_order_mismatch";
    }

    const [conflictRow] = await tx
      .select({ id: paymentIntents.id })
      .from(paymentIntents)
      .where(
        and(
          sql`${paymentIntents.id} <> ${intentId}::uuid`,
          sql`${paymentIntents.metadata}->>'paymob_order_id' = ${providerOrderId}`,
        ),
      )
      .limit(1);
    if (conflictRow) return "order_bound_elsewhere";

    if (existingOrder === providerOrderId) return "ok";

    // Merge only the order id — never replace the whole JSONB blob (would wipe
    // checkout_url / provider_opening written by concurrent resume paths).
    await tx
      .update(paymentIntents)
      .set({
        metadata: sql`
          COALESCE(${paymentIntents.metadata}, '{}'::jsonb)
          || jsonb_build_object('paymob_order_id', ${providerOrderId}::text)
        `,
      })
      .where(eq(paymentIntents.id, intentId));
    return "ok";
  });
}

/**
 * Prefer the already-bound local intent for a signed Paymob order.id.
 * When present, unsigned merchant_order_id must be ignored (remap attack).
 */
export async function findIntentIdByPaymobOrderId(
  providerOrderId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: paymentIntents.id })
    .from(paymentIntents)
    .where(sql`${paymentIntents.metadata}->>'paymob_order_id' = ${providerOrderId}`)
    .limit(1);
  return row?.id ?? null;
}

/**
 * Read-only status of a wallet top-up intent. This is what the client polls
 * after the buyer returns from the hosted checkout — it NEVER settles. Money
 * only moves through the verified provider webhook (`settleTopupIntent`).
 *
 * IDOR: a mismatched owner reads as "not found" (no existence leak).
 */
export async function getTopupIntentStatus(
  intentId: string,
  userId: string
): Promise<ConfirmTopupResult> {
  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (!intent || intent.userId !== userId) {
    throw notFound("Payment intent not found");
  }
  if (intent.purpose !== "wallet_topup") {
    throw invalidData("Not a wallet top-up intent");
  }

  const transactionId =
    intent.status === "completed" ? await findTransactionByKey(intent.id) : null;
  const balance = await getWalletBalance(userId);

  return {
    intent_id: intent.id,
    status: intent.status,
    transaction_id: transactionId,
    balance,
    already_processed: intent.status === "completed",
  };
}

/**
 * Settle a wallet top-up intent — invoked ONLY by the verified provider webhook.
 * Credits the wallet and marks the intent completed atomically.
 *
 * Idempotency: the ledger credit uses idempotencyKey = intent.id, so repeated
 * webhook deliveries credit exactly once. The fast-path (`completed` short
 * circuit), the existing-key replay in applyTransaction, and the UNIQUE
 * constraint (concurrent race → 23505) all resolve to a no-op.
 */
export async function settleTopupIntent(
  intentId: string,
  opts: { providerTxnId?: string | null } = {}
): Promise<void> {
  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, intentId))
    .limit(1);

  if (!intent) throw notFound("Payment intent not found");
  if (intent.purpose !== "wallet_topup") {
    throw invalidData("Not a wallet top-up intent");
  }
  if (intent.status === "completed") return; // idempotent replay
  // Refund/void already recorded — never credit after PSP clawback won the race.
  if (pspReversedFromMeta(intent.metadata)) {
    return;
  }
  // Verified success webhooks must still credit after a premature/out-of-order
  // failure mark — otherwise the buyer paid at the PSP with no wallet credit.
  // Exception: psp_reversed (checked above) blocks credit even when status=failed.
  if (intent.status !== "pending" && intent.status !== "failed") {
    throw invalidData(`Cannot settle a ${intent.status} intent`);
  }

  // Soft-deleted owners must not receive wallet credit from late PSP webhooks.
  // Pre-check avoids opening a useless txn; the credit UPDATE also requires
  // deleted_at IS NULL (WalletService) so a delete that races this window fails closed.
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

  try {
    const applied = await db.transaction(async (tx) => {
      // Lock intent first so a concurrent PSP reverse cannot lose the race to credit.
      const [lockedIntent] = await tx
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, intent.id))
        .for("update")
        .limit(1);
      if (!lockedIntent) return { replayed: true, aborted: true as const };
      if (lockedIntent.status === "completed") {
        return { replayed: true, aborted: true as const };
      }
      if (pspReversedFromMeta(lockedIntent.metadata)) {
        return { replayed: true, aborted: true as const };
      }
      if (lockedIntent.status !== "pending" && lockedIntent.status !== "failed") {
        throw invalidData(`Cannot settle a ${lockedIntent.status} intent`);
      }

      // Re-check under row lock: delete between pre-check and credit must not credit.
      const [locked] = await tx
        .select({ id: users.id, deletedAt: users.deletedAt })
        .from(users)
        .where(eq(users.id, intent.userId))
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
        return { replayed: true, abortedDeleted: true as const };
      }

      const result = await applyTransaction(tx, {
        userId: intent.userId,
        type: "wallet_topup",
        direction: "credit",
        amount: intent.amount,
        paymentMethod: intent.method as LedgerPaymentMethod,
        referenceType: "payment_intent",
        referenceId: intent.id,
        description: `Wallet top-up via ${intent.method}`,
        idempotencyKey: intent.id,
        metadata: opts.providerTxnId
          ? { provider_txn_id: opts.providerTxnId }
          : null,
        invoice: {
          lineItems: [
            { label: `Wallet top-up (${intent.method})`, amount: intent.amount },
          ],
        },
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

      return result;
    });

    if ("aborted" in applied && applied.aborted) {
      return;
    }
    if ("abortedDeleted" in applied && applied.abortedDeleted) {
      return;
    }

    if (!applied.replayed) {
      schedulePaymentSuccess({
        userId: intent.userId,
        kind: "wallet_topup",
        amount: intent.amount,
        balanceAfter: applied.balanceAfter,
        transactionId: applied.transactionId,
        description: `Wallet top-up via ${intent.method}`,
      });
    }
  } catch (err) {
    // Concurrent delivery already credited under the same idempotency key.
    if (isUniqueViolation(err)) return;
    throw err;
  }
}

/** Mark a pending top-up intent failed (cancelled/declined webhook). No money moves. */
export async function markTopupIntentFailed(intentId: string): Promise<void> {
  const updated = await db
    .update(paymentIntents)
    .set({ status: "failed" })
    .where(
      and(eq(paymentIntents.id, intentId), eq(paymentIntents.status, "pending"))
    )
    .returning({ id: paymentIntents.id });

  if (updated.length > 0) {
    await notifyPaymentIntentFailed(intentId);
  }
}

/**
 * Paymob refund/void after a successful settlement. Pending intents are marked
 * failed WITH durable `psp_reversed` so a late success webhook cannot credit.
 * Completed top-ups are clawed back via an `adjustment` debit (not `refund` —
 * schema/UI treat refund as a credit). `clawAmountEgp` supports PARTIAL refunds
 * (cumulative via metadata.psp_clawed_cents). Partial balance → debit what's
 * left and flag shortfall for ops.
 */
export async function reverseTopupAfterPspReversal(
  intentId: string,
  opts: {
    reason: "refunded" | "voided";
    providerTxnId?: string | null;
    /** EGP magnitude to claw this delivery; defaults to full remaining intent. */
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
    if (!intent || intent.purpose !== "wallet_topup") return;

    const meta = asIntentMeta(intent.metadata);
    const intentTotal = Number(intent.amount);
    const alreadyClawed = Math.max(0, Number(meta.psp_clawed_cents ?? 0) / 100);
    const remaining = Math.max(0, Math.round((intentTotal - alreadyClawed) * 100) / 100);

    if (intent.status === "pending" || intent.status === "failed") {
      if (meta.psp_reversed === true) return;
      // Durable reverse marker under row lock — late success cannot credit.
      meta.psp_reversed = true;
      meta.psp_reversal_reason = opts.reason;
      if (opts.providerTxnId) meta.psp_reversal_txn_id = opts.providerTxnId;
      await tx
        .update(paymentIntents)
        .set({ status: "failed", metadata: meta })
        .where(eq(paymentIntents.id, intentId));
      notifyFailed = intent.status === "pending";
      return;
    }
    if (intent.status !== "completed") return;
    if (remaining <= 0) {
      meta.psp_reversed = true;
      await tx
        .update(paymentIntents)
        .set({ metadata: meta })
        .where(eq(paymentIntents.id, intent.id));
      return;
    }

    const requestedRaw =
      opts.clawAmountEgp != null && opts.clawAmountEgp !== ""
        ? Number(opts.clawAmountEgp)
        : remaining;
    if (!Number.isFinite(requestedRaw) || requestedRaw <= 0) return;
    const requested = Math.min(remaining, Math.round(requestedRaw * 100) / 100);

    const [lockedUser] = await tx
      .select({ bal: users.walletBalance })
      .from(users)
      .where(eq(users.id, intent.userId))
      .for("update")
      .limit(1);
    const avail = Math.max(0, Number(lockedUser?.bal ?? 0));
    const claw = Math.min(avail, requested);

    // Per-delivery idempotency: Paymob refund txn id when present; otherwise
    // watermark by (requested, already-clawed) so retries do not double-debit.
    const reversalKey = opts.providerTxnId
      ? `${intent.id}:psp_reversal:txn:${opts.providerTxnId}`
      : `${intent.id}:psp_reversal:c${Math.round(requested * 100)}:from${Math.round(alreadyClawed * 100)}`;

    if (claw > 0) {
      const applied = await applyTransaction(tx, {
        userId: intent.userId,
        type: "adjustment",
        direction: "debit",
        amount: claw.toFixed(2),
        paymentMethod: intent.method as LedgerPaymentMethod,
        referenceType: "payment_intent",
        referenceId: intent.id,
        description: `PSP ${opts.reason} clawback for top-up`,
        idempotencyKey: reversalKey,
        metadata: {
          psp_reversal: opts.reason,
          provider_txn_id: opts.providerTxnId ?? null,
          clawback_amount: claw.toFixed(2),
          requested_amount: requested.toFixed(2),
        },
      });
      // Replay must not inflate psp_clawed_cents.
      const creditedClaw = applied.replayed ? 0 : claw;
      const clawedAfter = Math.round((alreadyClawed + creditedClaw) * 100);
      meta.psp_clawed_cents = Math.max(
        Number(meta.psp_clawed_cents ?? 0),
        clawedAfter,
      );
      if (!applied.replayed && claw < requested) {
        meta.psp_reversal_shortfall = true;
        meta.psp_reversal_shortfall_amount = (requested - claw).toFixed(2);
        console.error(
          "[Paymob reversal] wallet shortfall — ops must recover",
          intentId,
          opts.reason,
          meta.psp_reversal_shortfall_amount,
        );
      }
    } else if (requested > 0) {
      meta.psp_reversal_shortfall = true;
      meta.psp_reversal_shortfall_amount = requested.toFixed(2);
      console.error(
        "[Paymob reversal] wallet shortfall — ops must recover",
        intentId,
        opts.reason,
        meta.psp_reversal_shortfall_amount,
      );
    }

    meta.psp_reversal_reason = opts.reason;
    if (opts.providerTxnId) meta.psp_reversal_txn_id = opts.providerTxnId;
    // Block late settle-from-failed even when only a partial reverse landed.
    meta.psp_reversed = true;
    await tx
      .update(paymentIntents)
      .set({ metadata: meta })
      .where(eq(paymentIntents.id, intent.id));
  });

  if (notifyFailed) {
    await notifyPaymentIntentFailed(intentId);
  }
}
