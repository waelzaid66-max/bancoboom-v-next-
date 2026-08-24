import assert from "node:assert/strict";
import test from "node:test";

import {
  ApiError,
  customFetch,
  setAuthFailureHandler,
  setAuthTokenGetter,
  setBaseUrl,
} from "../src/custom-fetch.ts";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
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

const originalFetch = globalThis.fetch;
const SESSION_A = "sess_stale_request_a";
const SESSION_B = "sess_current_b";

test.beforeEach(() => {
  setBaseUrl(null);
  setAuthTokenGetter(null);
  setAuthFailureHandler(null, null);
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  setAuthFailureHandler(null, null);
});

test("RED: a delayed ACCOUNT_DELETED response from Session A must never tear down current Session B", async () => {
  const responseGate = deferred<Response>();
  let sessionATeardowns = 0;
  let sessionBTeardowns = 0;

  setAuthFailureHandler(SESSION_A, () => {
    sessionATeardowns += 1;
  });

  globalThis.fetch = async () => responseGate.promise;
  const requestFromSessionA = customFetch("https://api.example.test/v1/me", {
    responseType: "json",
  });

  await Promise.resolve();

  setAuthFailureHandler(SESSION_B, () => {
    sessionBTeardowns += 1;
  });

  responseGate.resolve(tombstoneResponse());

  await assert.rejects(requestFromSessionA, (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(
      (error.data as { error?: { code?: string } })?.error?.code,
      "ACCOUNT_DELETED",
    );
    return true;
  });

  assert.equal(
    sessionATeardowns,
    0,
    "a response arriving after Session A was superseded must not run Session A teardown",
  );
  assert.equal(
    sessionBTeardowns,
    0,
    "a stale Session-A tombstone must never run the currently registered Session-B teardown",
  );
});

test("RED: Session A token acquisition cannot inherit Session B teardown provenance", async () => {
  const tokenGate = deferred<string | null>();
  let tokenGetterCalls = 0;
  let sessionATeardowns = 0;
  let sessionBTeardowns = 0;

  setAuthFailureHandler(SESSION_A, () => {
    sessionATeardowns += 1;
  });
  setAuthTokenGetter(() => {
    tokenGetterCalls += 1;
    return tokenGate.promise;
  });

  globalThis.fetch = async (_input, init) => {
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      "Bearer session-a-token",
      "the delayed request must still carry Session A's token",
    );
    return tombstoneResponse();
  };

  const requestFromSessionA = customFetch("https://api.example.test/v1/me", {
    responseType: "json",
  });

  await Promise.resolve();
  assert.equal(tokenGetterCalls, 1, "Session A token acquisition must be in flight");

  setAuthFailureHandler(SESSION_B, () => {
    sessionBTeardowns += 1;
  });
  tokenGate.resolve("session-a-token");

  await assert.rejects(requestFromSessionA, (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(
      (error.data as { error?: { code?: string } })?.error?.code,
      "ACCOUNT_DELETED",
    );
    return true;
  });

  assert.equal(
    sessionATeardowns,
    0,
    "Session A teardown must not run after Session A has been superseded",
  );
  assert.equal(
    sessionBTeardowns,
    0,
    "a request carrying Session A's token must never inherit Session B teardown provenance",
  );
});
