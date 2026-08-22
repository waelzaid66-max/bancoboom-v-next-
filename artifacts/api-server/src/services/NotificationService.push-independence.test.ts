import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => {
  const events: string[] = [];
  const preferenceLimit = vi.fn(async () => []);
  const preferenceWhere = vi.fn(() => ({ limit: preferenceLimit }));
  const preferenceFrom = vi.fn(() => ({ where: preferenceWhere }));
  const select = vi.fn(() => ({ from: preferenceFrom }));

  const insertValues = vi.fn(async () => {
    events.push("insert");
  });
  const insert = vi.fn(() => ({ values: insertValues }));

  const sendPushToUser = vi.fn(() => {
    events.push("push");
    return new Promise<void>(() => undefined);
  });

  return {
    events,
    preferenceLimit,
    preferenceWhere,
    preferenceFrom,
    select,
    insertValues,
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

import { createNotification } from "./NotificationService";

describe("NotificationService remote-push independence", () => {
  it("commits the in-app notification before push fan-out and never awaits remote push", async () => {
    mocked.events.length = 0;
    mocked.preferenceLimit.mockClear();
    mocked.preferenceWhere.mockClear();
    mocked.preferenceFrom.mockClear();
    mocked.select.mockClear();
    mocked.insertValues.mockClear();
    mocked.insert.mockClear();
    mocked.sendPushToUser.mockClear();

    const result = createNotification({
      userId: "user-push-independence",
      type: "system",
      title: "BANCO",
      body: "Durable in-app notification",
      data: { source: "push-independence-test" },
    });

    await expect(result).resolves.toBeUndefined();

    expect(mocked.insert).toHaveBeenCalledTimes(1);
    expect(mocked.insertValues).toHaveBeenCalledTimes(1);
    expect(mocked.sendPushToUser).toHaveBeenCalledTimes(1);
    expect(mocked.events).toEqual(["insert", "push"]);
  }, 1_000);
});
