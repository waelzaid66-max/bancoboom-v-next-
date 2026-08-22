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
  const inArrayValues: string[][] = [];

  return { selectQueue, deleteWhere, select, deleteFn, inArrayValues };
});

vi.mock("@workspace/db", () => ({
  db: {
    select: mocked.select,
    delete: mocked.deleteFn,
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    inArray: (column: unknown, values: unknown[]) => {
      mocked.inArrayValues.push(values.map(String));
      return actual.inArray(column as never, values as never);
    },
  };
});

import { computeSendRetryDelayMs, sendPushToUser } from "./PushService";

const TOKEN = "ExpoPushToken[push-send-p0-test]";
const HEALTHY_TOKEN = "ExpoPushToken[push-send-p0-healthy]";
const CREDENTIAL_TOKEN = "ExpoPushToken[push-send-p0-credential]";
const DEAD_TOKEN = "ExpoPushToken[push-send-p0-dead]";

function seedDevices(tokens: string[] = [TOKEN]): void {
  mocked.selectQueue.push(tokens.map((token) => ({ token })), [{ c: 1 }]);
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

async function flushRetryTimers(sendPromise: Promise<void>): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  await vi.runAllTimersAsync();
  await sendPromise;
}

describe("PushService pre-ticket P0 retry contract", () => {
  beforeEach(() => {
    mocked.selectQueue.length = 0;
    mocked.inArrayValues.length = 0;
    mocked.select.mockClear();
    mocked.deleteFn.mockClear();
    mocked.deleteWhere.mockClear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses increasing exponential retry windows with bounded controllable jitter", () => {
    const attemptOneBase = computeSendRetryDelayMs(1, () => 0);
    const attemptOneMaxJitter = computeSendRetryDelayMs(1, () => 1);
    const attemptTwoBase = computeSendRetryDelayMs(2, () => 0);
    const attemptTwoMaxJitter = computeSendRetryDelayMs(2, () => 1);

    expect(attemptOneBase).toBe(500);
    expect(attemptOneMaxJitter).toBe(625);
    expect(attemptTwoBase).toBe(1_000);
    expect(attemptTwoMaxJitter).toBe(1_250);
    expect(attemptTwoBase).toBeGreaterThan(attemptOneMaxJitter);

    expect(computeSendRetryDelayMs(1, () => -10)).toBe(attemptOneBase);
    expect(computeSendRetryDelayMs(1, () => 10)).toBe(attemptOneMaxJitter);
    expect(computeSendRetryDelayMs(1, () => Number.NaN)).toBe(attemptOneBase);
    expect(computeSendRetryDelayMs(1, () => 0.5)).toBeGreaterThan(attemptOneBase);
    expect(computeSendRetryDelayMs(1, () => 0.5)).toBeLessThan(attemptOneMaxJitter);
    expect(computeSendRetryDelayMs(1, () => 0)).toBeGreaterThan(0);
  });

  it("retries transient network failures with positive delay and a bounded attempt count", async () => {
    vi.useFakeTimers();
    seedDevices();
    const attemptTimes: number[] = [];
    let attempt = 0;
    const fetchMock = vi.fn(async () => {
      attemptTimes.push(Date.now());
      attempt += 1;
      if (attempt < 3) throw new Error("transient network");
      return response(200);
    });
    vi.stubGlobal("fetch", fetchMock);

    const sendPromise = sendOnce();
    await vi.advanceTimersByTimeAsync(0);

    // A tight immediate retry loop is not acceptable backoff.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    await sendPromise;

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
    expect(attemptTimes.slice(1).every((time, index) => time > attemptTimes[index])).toBe(true);
  });

  it("stops after a bounded number of attempts when a transient network failure never recovers", async () => {
    vi.useFakeTimers();
    seedDevices();
    const fetchMock = vi.fn().mockRejectedValue(new Error("network remains unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    const sendPromise = sendOnce();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    await sendPromise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries HTTP 429 after a positive delay and then succeeds", async () => {
    vi.useFakeTimers();
    seedDevices();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(429))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const sendPromise = sendOnce();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await flushRetryTimers(sendPromise);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries HTTP 5xx after a positive delay and succeeds when Expo recovers", async () => {
    vi.useFakeTimers();
    seedDevices();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const sendPromise = sendOnce();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await flushRetryTimers(sendPromise);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent HTTP 4xx response", async () => {
    seedDevices();
    const fetchMock = vi.fn().mockResolvedValue(response(400));
    vi.stubGlobal("fetch", fetchMock);

    await sendOnce();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces provider credential/project ticket errors without pruning the token", async () => {
    seedDevices([CREDENTIAL_TOKEN]);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
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
    expect(mocked.inArrayValues).toEqual([]);
    expect(errorSpy.mock.calls.flat().map(String).join(" ")).toContain("InvalidCredentials");
  });

  it("prunes only the token mapped to DeviceNotRegistered in a mixed ticket batch", async () => {
    seedDevices([HEALTHY_TOKEN, CREDENTIAL_TOKEN, DEAD_TOKEN]);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(
      response(200, [
        { status: "ok" },
        {
          status: "error",
          message: "credential mismatch",
          details: { error: "InvalidCredentials" },
        },
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
    expect(mocked.inArrayValues).toEqual([[DEAD_TOKEN]]);
  });
});
