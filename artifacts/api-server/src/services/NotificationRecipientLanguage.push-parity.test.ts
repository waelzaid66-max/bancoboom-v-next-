import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => {
  const persisted: Array<Record<string, unknown>> = [];

  const preferenceLimit = vi.fn(async () => []);
  const preferenceWhere = vi.fn(() => ({ limit: preferenceLimit }));
  const preferenceFrom = vi.fn(() => ({ where: preferenceWhere }));
  const select = vi.fn(() => ({ from: preferenceFrom }));

  const returning = vi.fn(async () => [{ id: "notification-parity" }]);
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn((value: Record<string, unknown>) => {
    persisted.push(value);
    return { onConflictDoNothing };
  });
  const insert = vi.fn(() => ({ values }));

  const sendPushToUser = vi.fn(async () => undefined);

  return {
    persisted,
    preferenceLimit,
    preferenceWhere,
    preferenceFrom,
    select,
    returning,
    onConflictDoNothing,
    values,
    insert,
    sendPushToUser,
  };
});

vi.mock("@workspace/db", () => ({
  db: {
    select: mocked.select,
    insert: mocked.insert,
  },
}));

vi.mock("./PushService", () => ({
  sendPushToUser: mocked.sendPushToUser,
}));

import { createNotification, createNotificationOnce } from "./NotificationService";

beforeEach(() => {
  mocked.persisted.length = 0;
  mocked.preferenceLimit.mockClear();
  mocked.preferenceWhere.mockClear();
  mocked.preferenceFrom.mockClear();
  mocked.select.mockClear();
  mocked.returning.mockClear();
  mocked.onConflictDoNothing.mockClear();
  mocked.values.mockClear();
  mocked.insert.mockClear();
  mocked.sendPushToUser.mockClear();
});

describe("NotificationService selected-copy parity", () => {
  it("persists and pushes the exact selected title/body and preserves deep-link data", async () => {
    const data = {
      conversation_id: "conversation-parity",
      message_id: "message-parity",
      listing_id: "listing-parity",
      role: "buyer",
    };
    const title = "رسالة جديدة من Noor";
    const body = "User-authored preview — keep EXACT 123";

    await expect(
      createNotification({
        userId: "recipient-ar",
        type: "message",
        title,
        body,
        data,
      }),
    ).resolves.toBeUndefined();

    expect(mocked.persisted).toHaveLength(1);
    expect(mocked.persisted[0]).toMatchObject({
      userId: "recipient-ar",
      type: "message",
      title,
      body,
      data,
    });
    expect(mocked.persisted[0].data).toBe(data);

    expect(mocked.sendPushToUser).toHaveBeenCalledTimes(1);
    expect(mocked.sendPushToUser).toHaveBeenCalledWith("recipient-ar", {
      title,
      body,
      data: {
        type: "message",
        ...data,
      },
    });
  });

  it("preserves the same selected copy/data through the durable dedupe path", async () => {
    const data = {
      intent_id: "intent-parity",
      amount: "50.00",
      method: "fawry",
      purpose: "wallet_topup",
    };
    const title = "Payment successful";
    const body = "EGP 50.00 was added to your wallet.";

    await expect(
      createNotificationOnce({
        userId: "recipient-en",
        type: "payment_success",
        title,
        body,
        data,
        dedupeKey: "payment:intent-parity:success",
      }),
    ).resolves.toBe("created");

    expect(mocked.persisted).toHaveLength(1);
    expect(mocked.persisted[0]).toMatchObject({
      userId: "recipient-en",
      type: "payment_success",
      title,
      body,
      data,
      dedupeKey: "payment:intent-parity:success",
    });
    expect(mocked.persisted[0].data).toBe(data);

    expect(mocked.onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mocked.returning).toHaveBeenCalledTimes(1);
    expect(mocked.sendPushToUser).toHaveBeenCalledTimes(1);
    expect(mocked.sendPushToUser).toHaveBeenCalledWith("recipient-en", {
      title,
      body,
      data: {
        type: "payment_success",
        ...data,
      },
    });
  });
});
