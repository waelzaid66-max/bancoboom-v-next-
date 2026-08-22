import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiError,
  customFetch,
  setAuthFailureHandler,
  setAuthTokenGetter,
  setBaseUrl,
} from "../src/custom-fetch.ts";

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
const SESSION_A = "sess_auth_a";
const SESSION_B = "sess_auth_b";

test.beforeEach(() => {
  setBaseUrl(null);
  setAuthTokenGetter(null);
  setAuthFailureHandler(null, null);
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  setAuthFailureHandler(null, null);
});

async function tombstoneCall(): Promise<unknown> {
  globalThis.fetch = async () => tombstoneResponse();
  return customFetch("https://api.example.test/v1/me", { responseType: "json" });
}

test("first ACCOUNT_DELETED invokes once for the Clerk session and preserves ApiError", async () => {
  let calls = 0;
  setAuthFailureHandler(SESSION_A, () => {
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

test("concurrent same-session tombstones coalesce to one teardown", async () => {
  const flight = deferred();
  let calls = 0;
  setAuthFailureHandler(SESSION_A, () => {
    calls += 1;
    return flight.promise;
  });

  await Promise.allSettled(Array.from({ length: 8 }, () => tombstoneCall()));
  assert.equal(calls, 1);

  flight.resolve();
  await flight.promise;
  await Promise.resolve();
});

test("synchronous handler throw re-arms the same session", async () => {
  let calls = 0;
  setAuthFailureHandler(SESSION_A, () => {
    calls += 1;
    throw new Error("sync teardown failure");
  });

  await assert.rejects(tombstoneCall(), ApiError);
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 2);
});

test("asynchronous handler rejection re-arms the same session", async () => {
  let calls = 0;
  let rejectFirst!: (reason?: unknown) => void;
  setAuthFailureHandler(SESSION_A, () => {
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

test("successful teardown suppresses later stale tombstones for the same session", async () => {
  let calls = 0;
  setAuthFailureHandler(SESSION_A, async () => {
    calls += 1;
  });

  await assert.rejects(tombstoneCall(), ApiError);
  await Promise.resolve();
  await Promise.resolve();
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 1);
});

test("same-session handler replacement preserves COMPLETED state", async () => {
  let firstCalls = 0;
  let replacementCalls = 0;
  setAuthFailureHandler(SESSION_A, async () => {
    firstCalls += 1;
  });

  await assert.rejects(tombstoneCall(), ApiError);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(firstCalls, 1);

  setAuthFailureHandler(SESSION_A, () => {
    replacementCalls += 1;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(replacementCalls, 0);
});

test("same-session cleanup and re-registration do not re-arm COMPLETED", async () => {
  let calls = 0;
  setAuthFailureHandler(SESSION_A, async () => {
    calls += 1;
  });

  await assert.rejects(tombstoneCall(), ApiError);
  await Promise.resolve();
  await Promise.resolve();
  setAuthFailureHandler(SESSION_A, null);
  setAuthFailureHandler(SESSION_A, () => {
    calls += 1;
  });

  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(calls, 1);
});

test("a genuinely new Clerk session starts a fresh generation", async () => {
  let sessionACalls = 0;
  let sessionBCalls = 0;
  setAuthFailureHandler(SESSION_A, async () => {
    sessionACalls += 1;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  await Promise.resolve();
  await Promise.resolve();

  setAuthFailureHandler(SESSION_B, async () => {
    sessionBCalls += 1;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(sessionACalls, 1);
  assert.equal(sessionBCalls, 1);
});

test("old-session Promise settlement cannot mutate a newer session generation", async () => {
  const oldFlight = deferred();
  const newFlight = deferred();
  let oldCalls = 0;
  let newCalls = 0;

  setAuthFailureHandler(SESSION_A, () => {
    oldCalls += 1;
    return oldFlight.promise;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(oldCalls, 1);

  setAuthFailureHandler(SESSION_B, () => {
    newCalls += 1;
    return newFlight.promise;
  });
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(newCalls, 1);

  oldFlight.resolve();
  await oldFlight.promise;
  await Promise.resolve();
  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(newCalls, 1, "old-session settlement must not clear the new in-flight teardown");

  newFlight.reject(new Error("session B teardown failure"));
  await assert.rejects(newFlight.promise);
  await Promise.resolve();
  await Promise.resolve();

  await assert.rejects(tombstoneCall(), ApiError);
  assert.equal(newCalls, 2, "session B rejection must re-arm session B only");
});

test("non-tombstone responses never invoke the auth failure handler", async () => {
  let calls = 0;
  setAuthFailureHandler(SESSION_A, () => {
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
