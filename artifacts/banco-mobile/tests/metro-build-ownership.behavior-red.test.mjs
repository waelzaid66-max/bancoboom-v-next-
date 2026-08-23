import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildPath = path.join(mobileRoot, "scripts", "build.js");
const source = fs.readFileSync(buildPath, "utf8");

function loadHarness({ fetchImpl, spawnImpl }) {
  const withoutEntrypoint = source.replace(/\nmain\(\)\.catch\([\s\S]*$/m, "\n");
  const instrumented = `${withoutEntrypoint}\nglobalThis.__metroHarness = { checkMetroHealth, startMetro };\n`;

  const fakeProcess = {
    ...process,
    env: { ...process.env },
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
        return { spawn: spawnImpl, spawnSync() { throw new Error("unexpected spawnSync"); } };
      }
      return require(id);
    },
    setTimeout,
    __dirname: path.dirname(buildPath),
  };
  context.globalThis = context;

  vm.runInNewContext(instrumented, context, { filename: buildPath });
  return context.__metroHarness;
}

test("RED behavioral: an arbitrary HTTP-OK Metro must not be adopted as build authority", async () => {
  const fetched = [];
  let spawnCount = 0;
  const harness = loadHarness({
    fetchImpl: async (url) => {
      fetched.push(String(url));
      return { ok: true };
    },
    spawnImpl() {
      spawnCount += 1;
      return { stdout: null, stderr: null, kill() {} };
    },
  });

  await assert.rejects(
    () => harness.startMetro("example.invalid", "test-repl"),
    /occupied|owned|authority|already running/i,
    "an HTTP-OK listener is not sufficient proof that this build owns the Metro process",
  );

  assert.equal(spawnCount, 0, "the build must not spawn over an occupied/unowned endpoint");
  assert.ok(fetched.length > 0, "the occupied-endpoint probe must execute");
});

test("RED behavioral: Metro health probing must not be fixed to shared localhost:8081", async () => {
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
