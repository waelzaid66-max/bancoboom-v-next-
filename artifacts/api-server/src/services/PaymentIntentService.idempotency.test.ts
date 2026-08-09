import { describe, it, expect, vi, afterAll, beforeEach } from "vitest";

const { createProviderChargeMock } = vi.hoisted(() => ({
  createProviderChargeMock: vi.fn(),
}));

vi.mock("../lib/paymentProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/paymentProvider")>();
  return {
    ...actual,
    createProviderCharge: createProviderChargeMock,
  };
});

import { createTopupIntent } from "./PaymentIntentService";
import { db, createUser, deleteUsers, randomUUID } from "../__tests__/helpers";
import { paymentIntents } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const uids: string[] = [];

afterAll(async () => {
  await deleteUsers(...uids);
});

beforeEach(() => {
  createProviderChargeMock.mockReset();
  createProviderChargeMock.mockImplementation(
    async (input: { intentId: string }) => ({
      providerRef: `paymob_${input.intentId.slice(0, 8)}`,
      checkoutUrl: `https://accept.paymob.com/checkout/${input.intentId}`,
      providerOrderId: `order_${input.intentId.slice(0, 8)}`,
    }),
  );
});

describe("createTopupIntent idempotency", () => {
  it("reuses the same checkout on retry with the same idempotency key", async () => {
    const userId = await createUser();
    uids.push(userId);
    const key = randomUUID();

    const first = await createTopupIntent({
      userId,
      amount: 250,
      method: "instapay",
      idempotencyKey: key,
    });
    expect(first.intent_id).toBe(key);
    expect(first.checkout_url).toContain(key);
    expect(createProviderChargeMock).toHaveBeenCalledTimes(1);

    const second = await createTopupIntent({
      userId,
      amount: 250,
      method: "instapay",
      idempotencyKey: key,
    });
    expect(second.intent_id).toBe(key);
    expect(second.checkout_url).toBe(first.checkout_url);
    expect(second.provider_ref).toBe(first.provider_ref);
    // Must NOT open a second Paymob order.
    expect(createProviderChargeMock).toHaveBeenCalledTimes(1);

    const rows = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, key));
    expect(rows).toHaveLength(1);
  });

  it("rejects the same key with a different amount", async () => {
    const userId = await createUser();
    uids.push(userId);
    const key = randomUUID();

    await createTopupIntent({
      userId,
      amount: 100,
      method: "fawry",
      idempotencyKey: key,
    });

    await expect(
      createTopupIntent({
        userId,
        amount: 200,
        method: "fawry",
        idempotencyKey: key,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
  });
});
