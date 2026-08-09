import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getResolvedConfigMock } = vi.hoisted(() => ({
  getResolvedConfigMock: vi.fn(),
}));

vi.mock("../services/PaymentConfigService", () => ({
  getResolvedConfig: getResolvedConfigMock,
  getTestConfig: vi.fn(),
}));

import { createProviderCharge } from "./paymentProvider";

const chargeInput = {
  amount: "125.00",
  method: "fawry" as const,
  intentId: "00000000-0000-4000-8000-000000000001",
  purpose: "wallet_topup" as const,
  userId: "00000000-0000-4000-8000-000000000002",
};

describe("Paymob intention order binding", () => {
  beforeEach(() => {
    process.env.PUBLIC_API_BASE_URL = "https://api.banco.example";
    getResolvedConfigMock.mockReset();
    getResolvedConfigMock.mockResolvedValue({
      secretKey: "secret",
      publicKey: "public",
      hmacSecret: "hmac",
      integrationIds: [123],
      apiBase: "https://accept.paymob.com",
      mode: "test",
      source: "env",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PUBLIC_API_BASE_URL;
  });

  it("returns the Paymob order id used to bind future signed webhooks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "pi_123",
            client_secret: "client_secret_123",
            intention_order_id: 987654,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(createProviderCharge(chargeInput)).resolves.toMatchObject({
      providerRef: "pi_123",
      providerOrderId: "987654",
    });
  });

  it("fails closed when Paymob omits the order id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "pi_without_order",
            client_secret: "client_secret_without_order",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(createProviderCharge(chargeInput)).rejects.toMatchObject({
      code: "INVALID_DATA",
    });
  });
});
