import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const nodeRequire = createRequire(import.meta.url);
const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildPath = path.join(mobileRoot, "scripts", "build.js");
const source = fs.readFileSync(buildPath, "utf8");

function makeChild() {
  const child = new EventEmitter();
  child.stdout = null;
  child.stderr = null;
  child.killCalls = 0;
  child.kill = () => {
    child.killCalls += 1;
    return true;
  };
  // Keep a synthetic spawn error observable without letting Node turn an
  // intentionally unhandled EventEmitter "error" into a test-process crash.
  child.on("error", () => {});
  return child;
}

function loadHarness({
  fetchImpl,
  spawnImpl,
  env = {},
  processOnImpl = () => {},
  processExitImpl = () => {
    throw new Error("unexpected process.exit");
  },
  setTimeoutImpl = setTimeout,
}) {
  const withoutEntrypoint = source.replace(/\nmain\(\)\.catch\([\s\S]*$/m, "\n");
  const instrumented = `${withoutEntrypoint}\nglobalThis.__metroHarness = { checkMetroHealth, startMetro, downloadManifest, setupSignalHandlers };\n`;

  const fakeProcess = {
    ...process,
    env: { ...process.env, ...env },
    on: processOnImpl,
    exit: processExitImpl,
  };

  const context = {
    AbortSignal,
    Buffer,
    URL,
    clearTimeout,
    console: { log() {}, warn() {}, error() {} },
    fetch: fetchImpl,
    globalThis: null,
    process: fakeProcess,
    require(id) {
      if (id === "child_process") {
        return {
          spawn: spawnImpl,
          spawnSync() {
            throw new Error("unexpected spawnSync");
          },
        };
      }
      return nodeRequire(id);
    },
    setTimeout: setTimeoutImpl,
    __dirname: path.dirname(buildPath),
  };
  context.globalThis = context;

  vm.runInNewContext(instrumented, context, { filename: buildPath });
  return context.__metroHarness;
}

function fastReadinessTimer(callback, delay, ...args) {
  if (delay === 1000) {
    callback(...args);
    return 0;
  }
  return setTimeout(callback, delay, ...args);
}

test("RED behavioral: arbitrary HTTP-OK must never be silently adopted as this build's Metro", async () => {
  const fetched = [];
  const spawnCalls = [];
  const harness = loadHarness({
    fetchImpl: async (url) => {
      fetched.push(String(url));
      return { ok: true };
    },
    spawnImpl(command, args, options) {
      spawnCalls.push({ command, args, options });
      return makeChild();
    },
  });

  let rejected = false;
  try {
    await harness.startMetro("example.invalid", "test-repl");
  } catch {
    rejected = true;
  }

  assert.ok(fetched.length > 0, "the endpoint probe must execute");
  assert.ok(
    rejected || spawnCalls.length > 0,
    "HTTP-OK alone must not resolve successfully without starting an invocation-owned Metro or failing closed",
  );

  if (spawnCalls.length > 0) {
    const argv = spawnCalls[0].args ?? [];
    const portIndex = argv.indexOf("--port");
    assert.notEqual(portIndex, -1, "an alternate owned Metro must receive an explicit --port");
    const port = String(argv[portIndex + 1] ?? "");
    assert.notEqual(port, "", "the explicit --port must have a value");
    assert.notEqual(port, "8081", "the build must not spawn over the occupied legacy shared port");
  }
});

test("RED behavioral: a spawned Metro child that exits early must fail promptly", async () => {
  let spawnedChild = null;
  const harness = loadHarness({
    env: { METRO_READY_TIMEOUT_SEC: "2" },
    fetchImpl: async () => ({ ok: false }),
    spawnImpl() {
      spawnedChild = makeChild();
      setTimeout(() => spawnedChild.emit("exit", 42, null), 20);
      return spawnedChild;
    },
  });

  const startedAt = Date.now();
  let failure = null;
  try {
    await harness.startMetro("example.invalid", "test-repl");
  } catch (error) {
    failure = error;
  }
  const elapsedMs = Date.now() - startedAt;

  assert.ok(spawnedChild, "the test must reach the spawned-child path");
  assert.ok(failure, "early child exit must reject/fail the build harness");
  assert.match(
    String(failure?.message ?? failure),
    /exit|spawn|metro|42/i,
    "failure should identify the Metro child/process path rather than an unrelated timeout",
  );
  assert.ok(
    elapsedMs < 750,
    `early child exit must fail promptly instead of waiting for readiness timeout (elapsed ${elapsedMs}ms)`,
  );
});

test("RED behavioral: a spawned Metro child error must fail promptly", async () => {
  let spawnedChild = null;
  const harness = loadHarness({
    env: { METRO_READY_TIMEOUT_SEC: "1" },
    fetchImpl: async () => ({ ok: false }),
    spawnImpl() {
      spawnedChild = makeChild();
      setTimeout(() => spawnedChild.emit("error", new Error("synthetic spawn failure")), 20);
      return spawnedChild;
    },
  });

  const startedAt = Date.now();
  let failure = null;
  try {
    await harness.startMetro("example.invalid", "test-repl");
  } catch (error) {
    failure = error;
  }
  const elapsedMs = Date.now() - startedAt;

  assert.ok(spawnedChild, "the test must reach the spawned-child path");
  assert.ok(failure, "spawn error must reject/fail the build harness");
  assert.match(
    String(failure?.message ?? failure),
    /spawn|synthetic|metro/i,
    "failure should identify the owned Metro spawn path",
  );
  assert.ok(
    elapsedMs < 750,
    `spawn error must fail promptly instead of waiting for readiness timeout (elapsed ${elapsedMs}ms)`,
  );
});

test("RED behavioral: readiness timeout cleans exactly the owned Metro child", async () => {
  let spawnedChild = null;
  const harness = loadHarness({
    env: { METRO_READY_TIMEOUT_SEC: "1" },
    fetchImpl: async () => ({ ok: false }),
    spawnImpl() {
      spawnedChild = makeChild();
      return spawnedChild;
    },
  });

  let failure = null;
  try {
    await harness.startMetro("example.invalid", "test-repl");
  } catch (error) {
    failure = error;
  }

  assert.ok(spawnedChild, "the test must reach the spawned-child path");
  assert.ok(failure, "readiness timeout must fail the build harness");
  assert.equal(
    spawnedChild.killCalls,
    1,
    "timeout cleanup must terminate the invocation-owned child exactly once",
  );
});

test("RED behavioral: post-spawn Metro reads use the same explicit owned endpoint", async () => {
  const fetches = [];
  const spawnCalls = [];
  let spawned = false;
  let statusReads = 0;

  const harness = loadHarness({
    env: { METRO_READY_TIMEOUT_SEC: "2" },
    setTimeoutImpl: fastReadinessTimer,
    fetchImpl: async (url) => {
      const value = String(url);
      fetches.push({ url: value, afterSpawn: spawned });
      if (value.includes("/status")) {
        statusReads += 1;
        return { ok: statusReads > 1 };
      }
      if (value.includes("/manifest")) {
        return { ok: true, json: async () => ({ id: "owned-manifest" }) };
      }
      return { ok: true };
    },
    spawnImpl(command, args, options) {
      spawnCalls.push({ command, args, options });
      spawned = true;
      return makeChild();
    },
  });

  await harness.startMetro("example.invalid", "test-repl");
  await harness.downloadManifest("ios");

  assert.equal(spawnCalls.length, 1, "the invocation must own one spawned Metro child");
  const argv = spawnCalls[0].args ?? [];
  const portIndex = argv.indexOf("--port");
  assert.notEqual(portIndex, -1, "owned Metro spawn must receive --port");
  const ownedPort = String(argv[portIndex + 1] ?? "");
  assert.match(ownedPort, /^\d+$/, "owned Metro port must be explicit and numeric");
  assert.notEqual(ownedPort, "8081", "owned Metro port must not reuse legacy shared 8081");

  const postSpawnUrls = fetches.filter((entry) => entry.afterSpawn).map((entry) => entry.url);
  assert.ok(postSpawnUrls.some((url) => url.includes("/status")), "owned readiness must be probed after spawn");
  assert.ok(postSpawnUrls.some((url) => url.includes("/manifest")), "manifest must use the owned endpoint");
  for (const value of postSpawnUrls) {
    const parsed = new URL(value);
    assert.equal(
      parsed.port,
      ownedPort,
      `post-spawn Metro read must use the spawn-owned port ${ownedPort}: ${value}`,
    );
  }
});

test("RED behavioral: signal cleanup is idempotent for the invocation-owned child", async () => {
  const handlers = new Map();
  const exitCodes = [];
  let spawnedChild = null;
  let statusReads = 0;

  const harness = loadHarness({
    env: { METRO_READY_TIMEOUT_SEC: "2" },
    setTimeoutImpl: fastReadinessTimer,
    processOnImpl(signal, handler) {
      handlers.set(signal, handler);
    },
    processExitImpl(code) {
      exitCodes.push(code);
    },
    fetchImpl: async (url) => {
      if (String(url).includes("/status")) {
        statusReads += 1;
        return { ok: statusReads > 1 };
      }
      return { ok: true };
    },
    spawnImpl() {
      spawnedChild = makeChild();
      return spawnedChild;
    },
  });

  await harness.startMetro("example.invalid", "test-repl");
  harness.setupSignalHandlers();

  assert.ok(spawnedChild, "the test must own a spawned Metro child");
  assert.equal(typeof handlers.get("SIGTERM"), "function");
  assert.equal(typeof handlers.get("SIGHUP"), "function");

  handlers.get("SIGTERM")();
  handlers.get("SIGHUP")();

  assert.equal(
    spawnedChild.killCalls,
    1,
    "repeated termination signals must not kill the invocation-owned child more than once",
  );
  assert.ok(exitCodes.length >= 1, "signal path must terminate the build process after cleanup");
});

test("RED behavioral: Metro health probing must not stay fixed to shared localhost:8081", async () => {
  const fetched = [];
  const harness = loadHarness({
    fetchImpl: async (url) => {
      fetched.push(String(url));
      return { ok: false };
    },
    spawnImpl() {
      throw new Error("spawn not expected");
    },
  });

  await harness.checkMetroHealth();

  assert.equal(fetched.length, 1);
  assert.doesNotMatch(
    fetched[0],
    /^http:\/\/localhost:8081\/status$/,
    "the build-integrity probe must derive from an invocation-owned endpoint rather than the shared legacy port",
  );
});
