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

import { processPushReceipts, sendPushToUser } from "./PushService";

const TOKEN = "ExpoPushToken[receipt-p0-main]";
const DEAD_TOKEN = "ExpoPushToken[receipt-p0-dead]";
const HEALTHY_TOKEN = "ExpoPushToken[receipt-p0-healthy]";
const CREDENTIAL_TOKEN = "ExpoPushToken[receipt-p0-credential]";
const TICKET = "ticket-receipt-p0";
const RECEIPT_MAX_ATTEMPTS = 3;

function response(status: number, data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function seedPushDevices(tokens: string[] = [TOKEN]): void {
  mocked.selectQueue.push(tokens.map((token) => ({ token })), [{ c: 1 }]);
}

async function flushTimers<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(0);
  await vi.runAllTimersAsync();
  return promise;
}

function ticketMap(entries: Array<[string, string]> = [[TICKET, TOKEN]]): Map<string, string> {
  return new Map(entries);
}

describe("PushService post-ticket receipt P0 contract", () => {
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

  it("does not fetch receipts at 15 seconds and waits for the policy-scale first check", async () => {
    vi.useFakeTimers();
    seedPushDevices();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(200, [{ status: "ok", id: TICKET }]),
      )
      .mockResolvedValueOnce(
        response(200, { [TICKET]: { status: "ok" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await sendPushToUser("receipt-p0-user", {
      title: "BANCO",
      body: "Receipt timing",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(15 * 60_000 - 15_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a transient receipt network failure only after a positive delay", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary network"))
      .mockResolvedValueOnce(response(200, { [TICKET]: { status: "ok" } }));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    await processing;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops after the bounded receipt attempt budget when a network failure persists", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockRejectedValue(new Error("receipt network unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    await processing;

    expect(fetchMock).toHaveBeenCalledTimes(RECEIPT_MAX_ATTEMPTS);
    expect(mocked.deleteFn).not.toHaveBeenCalled();
  });

  it("retries HTTP 429 receipt fetch and can recover", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(429, {}))
      .mockResolvedValueOnce(response(200, { [TICKET]: { status: "ok" } }));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await flushTimers(processing);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries HTTP 5xx receipt fetch and can recover", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(503, {}))
      .mockResolvedValueOnce(response(200, { [TICKET]: { status: "ok" } }));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await flushTimers(processing);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent non-429 HTTP 4xx receipt response", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(response(400, {}));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await vi.runAllTimersAsync();
    await processing;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocked.deleteFn).not.toHaveBeenCalled();
  });

  it("does not treat a missing requested receipt as terminal success", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(200, {}))
      .mockResolvedValueOnce(response(200, { [TICKET]: { status: "ok" } }));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await flushTimers(processing);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mocked.deleteFn).not.toHaveBeenCalled();
  });

  it("bounds persistent missing-receipt polling to the in-process P0 attempt budget", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(async () => response(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    const processing = processPushReceipts([TICKET], ticketMap());
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance each bounded retry window separately so each async fetch/microtask
    // can schedule the next timer relative to the updated fake clock.
    await vi.advanceTimersByTimeAsync(2_500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5_000);
    await processing;

    expect(fetchMock).toHaveBeenCalledTimes(RECEIPT_MAX_ATTEMPTS);
    expect(mocked.deleteFn).not.toHaveBeenCalled();
  });

  it("keeps a healthy token on successful receipt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response(200, { [TICKET]: { status: "ok" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await processPushReceipts([TICKET], ticketMap([[TICKET, HEALTHY_TOKEN]]));

    expect(mocked.deleteFn).not.toHaveBeenCalled();
    expect(mocked.inArrayValues).toEqual([]);
  });

  it("prunes only the token mapped to DeviceNotRegistered", async () => {
    const liveTicket = "ticket-live";
    const deadTicket = "ticket-dead";
    const fetchMock = vi.fn().mockResolvedValue(
      response(200, {
        [liveTicket]: { status: "ok" },
        [deadTicket]: {
          status: "error",
          message: "device is no longer registered",
          details: { error: "DeviceNotRegistered" },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await processPushReceipts(
      [liveTicket, deadTicket],
      ticketMap([
        [liveTicket, HEALTHY_TOKEN],
        [deadTicket, DEAD_TOKEN],
      ]),
    );

    expect(mocked.deleteFn).toHaveBeenCalledTimes(1);
    expect(mocked.deleteWhere).toHaveBeenCalledTimes(1);
    expect(mocked.inArrayValues).toEqual([[DEAD_TOKEN]]);
  });

  it("surfaces credential/project receipt errors without pruning healthy tokens", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(
      response(200, {
        [TICKET]: {
          status: "error",
          message: "credential mismatch",
          details: { error: "InvalidCredentials" },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await processPushReceipts([TICKET], ticketMap([[TICKET, CREDENTIAL_TOKEN]]));

    expect(mocked.deleteFn).not.toHaveBeenCalled();
    expect(errorSpy.mock.calls.flat().map(String).join(" ")).toContain("InvalidCredentials");
  });

  it("fails malformed receipt payloads observably without pruning tokens", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(response(200, "malformed"));
    vi.stubGlobal("fetch", fetchMock);

    await processPushReceipts([TICKET], ticketMap());

    expect(mocked.deleteFn).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
