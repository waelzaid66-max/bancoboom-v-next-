import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyPaymobWebhook: vi.fn(),
  getIntentMeta: vi.fn(),
  claimPaymobOrderForIntent: vi.fn(),
  findIntentIdByPaymobOrderId: vi.fn(),
  markPaymobRefundForReconciliation: vi.fn(),
  settleTopupIntent: vi.fn(),
  markTopupIntentFailed: vi.fn(),
  reverseTopupAfterPspReversal: vi.fn(),
  settleSubscriptionIntentByWebhook: vi.fn(),
  markSubscriptionIntentFailed: vi.fn(),
  reverseSubscriptionAfterPspReversal: vi.fn(),
}));

vi.mock("../lib/paymentProvider", () => ({
  verifyPaymobWebhook: mocks.verifyPaymobWebhook,
}));

vi.mock("../services/PaymentIntentService", () => ({
  getIntentMeta: mocks.getIntentMeta,
  claimPaymobOrderForIntent: mocks.claimPaymobOrderForIntent,
  findIntentIdByPaymobOrderId: mocks.findIntentIdByPaymobOrderId,
  markPaymobRefundForReconciliation:
    mocks.markPaymobRefundForReconciliation,
  settleTopupIntent: mocks.settleTopupIntent,
  markTopupIntentFailed: mocks.markTopupIntentFailed,
  reverseTopupAfterPspReversal: mocks.reverseTopupAfterPspReversal,
}));

vi.mock("../services/SubscriptionService", () => ({
  settleSubscriptionIntentByWebhook:
    mocks.settleSubscriptionIntentByWebhook,
  markSubscriptionIntentFailed: mocks.markSubscriptionIntentFailed,
  reverseSubscriptionAfterPspReversal:
    mocks.reverseSubscriptionAfterPspReversal,
}));

import { paymobWebhookHandler } from "./paymentsController";

function request(): Request {
  return {
    body: { obj: { order: { id: 777 } } },
    query: { hmac: "valid" },
  } as unknown as Request;
}

function response(): Response {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response;
}

function successfulVerification(intentId: string) {
  return {
    valid: true,
    intentId,
    providerOrderId: "777",
    success: true,
    isRefunded: false,
    isVoided: false,
    providerTxnId: "txn_777",
    amountCents: 12500,
    currency: "EGP",
  };
}

describe("Paymob webhook order binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPaymobWebhook.mockResolvedValue(
      successfulVerification("00000000-0000-4000-8000-000000000099"),
    );
    mocks.getIntentMeta.mockResolvedValue({
      purpose: "wallet_topup",
      amount: "125.00",
      status: "pending",
    });
    mocks.claimPaymobOrderForIntent.mockResolvedValue("ok");
  });

  it("does not trust an unsigned merchant intent when the signed order is unbound", async () => {
    mocks.findIntentIdByPaymobOrderId.mockResolvedValue(null);
    const res = response();

    await paymobWebhookHandler(request(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "order_not_bound",
    });
    expect(mocks.getIntentMeta).not.toHaveBeenCalled();
    expect(mocks.claimPaymobOrderForIntent).not.toHaveBeenCalled();
    expect(mocks.settleTopupIntent).not.toHaveBeenCalled();
  });

  it("routes by the pre-bound signed order and ignores a remapped merchant intent", async () => {
    const boundIntentId = "00000000-0000-4000-8000-000000000001";
    mocks.findIntentIdByPaymobOrderId.mockResolvedValue(boundIntentId);
    const res = response();

    await paymobWebhookHandler(request(), res);

    expect(mocks.getIntentMeta).toHaveBeenCalledWith(boundIntentId);
    expect(mocks.claimPaymobOrderForIntent).toHaveBeenCalledWith(
      boundIntentId,
      "777",
    );
    expect(mocks.settleTopupIntent).toHaveBeenCalledWith(boundIntentId, {
      providerTxnId: "txn_777",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("records refunds for authoritative reconciliation instead of treating amount_cents as the refund delta", async () => {
    const boundIntentId = "00000000-0000-4000-8000-000000000001";
    mocks.findIntentIdByPaymobOrderId.mockResolvedValue(boundIntentId);
    mocks.verifyPaymobWebhook.mockResolvedValue({
      ...successfulVerification(
        "00000000-0000-4000-8000-000000000099",
      ),
      success: false,
      isRefunded: true,
    });
    const res = response();

    await paymobWebhookHandler(request(), res);

    expect(mocks.markPaymobRefundForReconciliation).toHaveBeenCalledWith(
      boundIntentId,
      { providerTxnId: "txn_777" },
    );
    expect(mocks.reverseTopupAfterPspReversal).not.toHaveBeenCalled();
    expect(mocks.reverseSubscriptionAfterPspReversal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("keeps signed voids on the full automatic reversal path", async () => {
    const boundIntentId = "00000000-0000-4000-8000-000000000001";
    mocks.findIntentIdByPaymobOrderId.mockResolvedValue(boundIntentId);
    mocks.verifyPaymobWebhook.mockResolvedValue({
      ...successfulVerification(
        "00000000-0000-4000-8000-000000000099",
      ),
      success: false,
      isVoided: true,
    });
    const res = response();

    await paymobWebhookHandler(request(), res);

    expect(mocks.reverseTopupAfterPspReversal).toHaveBeenCalledWith(
      boundIntentId,
      {
        reason: "voided",
        providerTxnId: "txn_777",
        clawAmountEgp: "125.00",
      },
    );
    expect(mocks.markPaymobRefundForReconciliation).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
