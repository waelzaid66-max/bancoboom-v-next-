import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiError,
  customFetch,
  setAuthFailureHandler,
  setAuthTokenGetter,
  setBaseUrl,
} from "./custom-fetch.ts";

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function tombstoneResponse(): Response {
  return new Response(
    JSON.stringify({ error: { code: "ACCOUNT_DELETED", message: "Deleted" } }),
    {
      status: 401,
      statusText: "Unauthorized",
      headers: { "content-type": "application/json" },
    },
  );
}

function other401Response(): Response {
  return new Response(
    JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Nope" } }),
    {
      status: 401,
      statusText: "Unauthorized",
      headers: { "content-type": "application/json" },
    },
  );
}

function okResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;

test.beforeEach(() => {
  setBaseUrl(null);
  setAuthTokenGetter(null);
  setAuthFailureHandler(null);
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  setAuthFailureHandler(null);
});

async function tombstoneCall(): Promise<unknown> {
  globalThis.fetch = async () => tombstoneResponse();
  return customFetch("https://api.example.test/v1/me", { responseType: "json" });
}

test("first ACCOUNT_DELETED invokes the handler once and preserves ApiError", async () => {
  let calls = 0;
  setAuthFailureHandler(() => {
    calls += 1;
  });

  await assert.rejects(tombstoneCall(), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal((error.data as { error?: { code?: string } })?.error?.code, "ACCOUNT_DELETED");
    return true;
  });
  assert.equal(calls, 1);
});

test("concurrent tombstones share one in-flight teardown", async () => {
  const first = deferred();
  let calls = 0;
  setAuthFailureHandler(() => {
    calls += 1;
    return first.promise;
  });

  await Promise.allSettled(Array.from({ length: 8 }, () => tombstoneCall()));
  assert.equal(calls, 1);

  first.resolve();
  await first.promise;
  await Promise.resolve();

  const second = deferred();
  setAuthFailureHandler(() => {
    calls += 1;
    return second.promise;
  });
  await Promise.allSettled([tombstoneCall(), tombstoneCall()]);
  assert.equal(calls, 2);
  second.resolve();
});

test("synchronous handler throw re-arms for the next tombstone", async () => {
  let calls = 0;
  setAuthFailureHandler(() => {
    calls += 1;
    throw new Error("sync teardown failure");
  });

  await assert.rejects(tombstoneCall(), ApiError);
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 2);
});

test("asynchronous handler rejection re-arms for the next tombstone", async () => {
  let calls = 0;
  let rejectFirst!: (reason?: unknown) => void;
  setAuthFailureHandler(() => {
    calls += 1;
    if (calls === 1) {
      return new Promise<void>((_resolve, reject) => {
        rejectFirst = reject;
      });
    }
  });

  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 1);
  rejectFirst(new Error("async teardown failure"));
  await Promise.resolve();
  await Promise.resolve();

  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 2);
});

test("successful async teardown re-arms for a later tombstone", async () => {
  let calls = 0;
  setAuthFailureHandler(async () => {
    calls += 1;
  });

  await assert.rejects(tombstoneCall(), ApiError);
  await Promise.resolve();
  await Promise.resolve();
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 2);
});

test("old Promise settlement cannot clear a replacement handler generation", async () => {
  const oldFlight = deferred();
  const newFlight = deferred();
  let oldCalls = 0;
  let newCalls = 0;

  setAuthFailureHandler(() => {
    oldCalls += 1;
    return oldFlight.promise;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(oldCalls, 1);

  setAuthFailureHandler(() => {
    newCalls += 1;
    return newFlight.promise;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(newCalls, 1);

  oldFlight.resolve();
  await oldFlight.promise;
  await Promise.resolve();

  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(newCalls, 1, "old generation settlement must not clear the new flight");

  newFlight.resolve();
  await newFlight.promise;
  await Promise.resolve();
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(newCalls, 2);
});

test("non-tombstone responses never invoke the auth failure handler", async () => {
  let calls = 0;
  setAuthFailureHandler(() => {
    calls += 1;
  });

  globalThis.fetch = async () => other401Response();
  await assert.rejects(
    customFetch("https://api.example.test/v1/me", { responseType: "json" }),
    ApiError,
  );

  globalThis.fetch = async () => okResponse();
  await customFetch("https://api.example.test/v1/me", { responseType: "json" });

  assert.equal(calls, 0);
});
