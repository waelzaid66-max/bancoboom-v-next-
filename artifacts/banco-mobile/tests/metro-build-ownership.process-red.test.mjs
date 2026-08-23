import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { once } from "node:events";
import { spawn as realSpawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const nodeRequire = createRequire(import.meta.url);
const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildPath = path.join(mobileRoot, "scripts", "build.js");
const source = fs.readFileSync(buildPath, "utf8");

function loadStartMetro(spawnImpl) {
  const withoutEntrypoint = source.replace(/\nmain\(\)\.catch\([\s\S]*$/m, "\n");
  const instrumented = `${withoutEntrypoint}\nglobalThis.__startMetro = startMetro;\n`;

  const fakeProcess = {
    ...process,
    env: { ...process.env, METRO_READY_TIMEOUT_SEC: "1" },
    on() {},
    exit() {
      throw new Error("build requested process exit");
    },
  };

  const context = {
    AbortSignal,
    Buffer,
    URL,
    clearTimeout,
    console: { log() {}, warn() {}, error() {} },
    fetch: async () => ({ ok: false }),
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
  return context.__startMetro;
}

async function exitsWithin(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return Promise.race([
    once(child, "exit").then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs)),
  ]);
}

test("RED process: readiness timeout leaves no invocation-owned child orphan", async () => {
  const ownedChild = realSpawn(
    process.execPath,
    ["-e", "setInterval(() => {}, 1000)"],
    { stdio: "ignore" },
  );

  try {
    const startMetro = loadStartMetro(() => ownedChild);
    let failure = null;
    try {
      await startMetro("example.invalid", "test-repl");
    } catch (error) {
      failure = error;
    }

    assert.ok(failure, "readiness timeout must fail the build invocation");
    assert.equal(
      await exitsWithin(ownedChild, 750),
      true,
      "the real invocation-owned child must be reaped after readiness timeout",
    );
  } finally {
    if (ownedChild.exitCode === null && ownedChild.signalCode === null) {
      ownedChild.kill("SIGKILL");
      await once(ownedChild, "exit");
    }
  }
});
