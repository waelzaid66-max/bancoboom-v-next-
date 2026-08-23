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

function loadHarness({ fetchImpl, spawnImpl, env = {} }) {
  const withoutEntrypoint = source.replace(/\nmain\(\)\.catch\([\s\S]*$/m, "\n");
  const instrumented = `${withoutEntrypoint}\nglobalThis.__metroHarness = { checkMetroHealth, startMetro };\n`;

  const fakeProcess = {
    ...process,
    env: { ...process.env, ...env },
    on() {},
    exit() {
      throw new Error("unexpected process.exit");
    },
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
    setTimeout,
    __dirname: path.dirname(buildPath),
  };
  context.globalThis = context;

  vm.runInNewContext(instrumented, context, { filename: buildPath });
  return context.__metroHarness;
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
