import type { Request, Response } from "express";
import { verifyPaymobWebhook } from "../lib/paymentProvider";
import {
  getIntentMeta,
  claimPaymobOrderForIntent,
  findIntentIdByPaymobOrderId,
  markPaymobRefundForReconciliation,
  settleTopupIntent,
  markTopupIntentFailed,
  reverseTopupAfterPspReversal,
} from "../services/PaymentIntentService";
import {
  settleSubscriptionIntentByWebhook,
  markSubscriptionIntentFailed,
  reverseSubscriptionAfterPspReversal,
} from "../services/SubscriptionService";

/**
 * Paymob "transaction processed" webhook — the ONLY path that settles a
 * payment. The HMAC signature is verified before any field is trusted; an
 * invalid signature is rejected with 401 and never touches the ledger.
 *
 * Valid-but-unactionable deliveries (amount mismatch, already settled) are
 * acknowledged with 200 so the provider stops retrying. Unknown intents return
 * 503 so the provider retries (never ACK a signed payment with no durable row).
 * Genuine processing failures also return 500/503 for retry.
 */
export async function paymobWebhookHandler(req: Request, res: Response) {
  const body = (req.body ?? {}) as { obj?: Record<string, unknown> };
  const obj = body.obj ?? {};
  const providedHmac =
    typeof req.query.hmac === "string" ? req.query.hmac : undefined;

  const verification = await verifyPaymobWebhook({ obj, providedHmac });
  if (!verification.valid) {
    return res.status(401).json({ ok: false });
  }
  if (!verification.providerOrderId) {
    console.error("[Paymob webhook] signed payload missing order.id");
    return res.status(200).json({ ok: true });
  }

  try {
    // Route exclusively through the order id bound from the trusted Intention
    // API response. merchant_order_id / extras.intent_id are not covered by
    // Paymob's transaction HMAC and must never establish first-use ownership.
    const intentId = await findIntentIdByPaymobOrderId(
      verification.providerOrderId,
    );
    if (!intentId) {
      console.error(
        "[Paymob webhook] signed order is not pre-bound to an intent",
        verification.providerOrderId,
      );
      return res.status(503).json({ ok: false, error: "order_not_bound" });
    }

    const meta = await getIntentMeta(intentId);
    if (!meta) {
      console.error(
        "[Paymob webhook] signed settlement for unknown intent",
        intentId,
      );
      return res.status(503).json({ ok: false, error: "intent_not_found" });
    }

    const isPspReverse = verification.isRefunded || verification.isVoided;
    const intentCents = Math.round(Number(meta.amount) * 100);

    // Economic guards MUST run before claimPaymobOrderForIntent. Paymob signs
    // amount_cents as the ORIGINAL transaction amount, including on refund
    // callbacks. Partial-refund totals live in refunded_amount_cents, which is
    // not part of the transaction HMAC and cannot drive the ledger directly.
    if (
      verification.amountCents == null ||
      !Number.isFinite(verification.amountCents) ||
      verification.amountCents <= 0
    ) {
      console.error(
        "[Paymob webhook] missing/invalid signed amount_cents for intent",
        intentId,
      );
      return res.status(200).json({ ok: true });
    }
    if (verification.currency !== "EGP") {
      console.error(
        "[Paymob webhook] non-EGP currency for intent",
        intentId,
        verification.currency,
      );
      return res.status(200).json({ ok: true });
    }

    if (intentCents !== verification.amountCents) {
      console.error(
        "[Paymob webhook] amount mismatch for intent",
        intentId,
      );
      return res.status(200).json({ ok: true });
    }

    const claim = await claimPaymobOrderForIntent(
      intentId,
      verification.providerOrderId,
    );
    if (claim === "not_found") {
      console.error(
        "[Paymob webhook] signed settlement for unknown intent",
        intentId,
      );
      return res.status(503).json({ ok: false, error: "intent_not_found" });
    }
    if (claim !== "ok") {
      console.error(
        "[Paymob webhook] order/intent binding rejected",
        claim,
        intentId,
        verification.providerOrderId,
      );
      return res.status(200).json({ ok: true });
    }

    if (verification.isRefunded) {
      await markPaymobRefundForReconciliation(intentId, {
        providerTxnId: verification.providerTxnId,
      });
      console.error(
        "[Paymob webhook] refund requires authenticated amount reconciliation",
        intentId,
        verification.providerTxnId,
      );
    } else if (verification.success) {
      if (meta.purpose === "subscription") {
        await settleSubscriptionIntentByWebhook(intentId, {
          providerTxnId: verification.providerTxnId,
        });
      } else {
        await settleTopupIntent(intentId, {
          providerTxnId: verification.providerTxnId,
        });
      }
    } else if (isPspReverse) {
      // Post-settlement refund/void: mark-failed is a no-op on completed intents
      // and would leave wallet credit / active subscription in place.
      const reason = "voided";
      const clawAmountEgp = (intentCents / 100).toFixed(2);
      if (meta.purpose === "subscription") {
        await reverseSubscriptionAfterPspReversal(intentId, {
          reason,
          providerTxnId: verification.providerTxnId,
          clawAmountEgp,
        });
      } else {
        await reverseTopupAfterPspReversal(intentId, {
          reason,
          providerTxnId: verification.providerTxnId,
          clawAmountEgp,
        });
      }
    } else {
      if (meta.purpose === "subscription") {
        await markSubscriptionIntentFailed(intentId);
      } else {
        await markTopupIntentFailed(intentId);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[Paymob webhook] settlement error", err);
    return res.status(500).json({ ok: false });
  }
}

/**
 * Post-checkout redirect landing. Paymob sends the buyer here after the hosted
 * checkout. Settlement is already handled by the webhook, so this is a tiny
 * "you can return to the app" page; the client polls intent status separately.
 */
export function paymentReturnHandler(_req: Request, res: Response) {
  res
    .status(200)
    .type("html")
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8" />` +
        `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
        `<title>BANCO Payment</title>` +
        `<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;` +
        `display:flex;min-height:100vh;align-items:center;justify-content:center;` +
        `margin:0;background:#0b0b0c;color:#fafafa;text-align:center;padding:24px}` +
        `.c{max-width:340px}h1{font-size:20px;margin:0 0 8px}p{opacity:.7;line-height:1.5}` +
        `</style></head><body><div class="c"><h1>Payment received</h1>` +
        `<p>You can close this window and return to the BANCO app. ` +
        `Your balance will update automatically.</p></div></body></html>`
    );
}
