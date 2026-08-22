import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => {
  const selectQueue: unknown[][] = [];
  const deleteWhere = vi.fn(async () => undefined);
  const select = vi.fn(() => {
    const rows = selectQueue.shift() ?? [];
    return {
      from: vi.fn(() => ({
        where: vi.fn(async () => rows),
      })),
    };
  });
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));

  return { selectQueue, deleteWhere, select, deleteFn };
});

vi.mock("@workspace/db", () => ({
  db: {
    select: mocked.select,
    delete: mocked.deleteFn,
  },
}));

import { sendPushToUser } from "./PushService";

const TOKEN = "ExpoPushToken[push-send-p0-test]";

function seedOneDevice(): void {
  mocked.selectQueue.push([{ token: TOKEN }], [{ c: 1 }]);
}

function response(status: number, data: unknown = []): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sendOnce(): Promise<void> {
  await sendPushToUser("user-push-p0", {
    title: "BANCO",
    body: "Push retry contract",
    data: { source: "p0-test" },
  });
}

describe("PushService pre-ticket P0 retry contract", () => {
  beforeEach(() => {
    mocked.selectQueue.length = 0;
    mocked.select.mockClear();
    mocked.deleteFn.mockClear();
    mocked.deleteWhere.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries a transient network exception, but remains bounded", async () => {
    seedOneDevice();
    const fetchMock = vi.fn().mockRejectedValue(new Error("transient network"));
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4);
  }, 10_000);

  it("retries HTTP 429 and succeeds without an unbounded loop", async () => {
    seedOneDevice();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(429))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("retries HTTP 5xx and succeeds when Expo recovers", async () => {
    seedOneDevice();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("does not retry a permanent HTTP 4xx response", async () => {
    seedOneDevice();
    const fetchMock = vi.fn().mockResolvedValue(response(400));
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not prune a healthy token for provider credential/project errors", async () => {
    seedOneDevice();
    const fetchMock = vi.fn().mockResolvedValue(
      response(200, [
        {
          status: "error",
          message: "credential mismatch",
          details: { error: "InvalidCredentials" },
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(mocked.deleteFn).not.toHaveBeenCalled();
  });

  it("prunes only the mapped token when Expo reports DeviceNotRegistered", async () => {
    seedOneDevice();
    const fetchMock = vi.fn().mockResolvedValue(
      response(200, [
        {
          status: "error",
          message: "device is gone",
          details: { error: "DeviceNotRegistered" },
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(mocked.deleteFn).toHaveBeenCalledTimes(1);
    expect(mocked.deleteWhere).toHaveBeenCalledTimes(1);
  });
});
