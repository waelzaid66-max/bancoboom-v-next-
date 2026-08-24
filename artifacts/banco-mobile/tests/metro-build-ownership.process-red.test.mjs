import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { once } from "node:events";
import { createServer } from "node:http";
import { spawn as realSpawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const nodeRequire = createRequire(import.meta.url);
const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildPath = path.join(mobileRoot, "scripts", "build.js");
const source = fs.readFileSync(buildPath, "utf8");

function loadStartMetro(
  spawnImpl,
  fetchImpl = async () => ({ ok: false }),
) {
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
  return context.__startMetro;
}

async function exitsWithin(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return Promise.race([
    once(child, "exit").then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs)),
  ]);
}

async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
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

test("RED process: a real foreign listener on legacy 8081 survives and is never adopted as build authority", async () => {
  const foreign = createServer((req, res) => {
    if (req.url === "/status") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("packager-status:running");
      return;
    }
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("foreign-listener");
  });

  let ownedCandidate = null;
  const spawnCalls = [];

  try {
    foreign.listen(8081);
    await once(foreign, "listening");

    const startMetro = loadStartMetro(
      (command, args, options) => {
        spawnCalls.push({ command, args, options });
        ownedCandidate = realSpawn(
          process.execPath,
          ["-e", "setInterval(() => {}, 1000)"],
          { stdio: "ignore" },
        );
        return ownedCandidate;
      },
      globalThis.fetch.bind(globalThis),
    );

    let failure = null;
    try {
      await startMetro("example.invalid", "test-repl");
    } catch (error) {
      failure = error;
    }

    const survival = await fetch("http://localhost:8081/status");
    assert.equal(survival.ok, true, "the pre-existing foreign listener must remain alive");
    assert.equal(
      await survival.text(),
      "packager-status:running",
      "the listener still answering 8081 must be the original foreign fixture",
    );

    assert.ok(
      failure || spawnCalls.length > 0,
      "the build must fail closed or start its own Metro instead of silently adopting the foreign HTTP-OK listener",
    );

    if (spawnCalls.length > 0) {
      const argv = spawnCalls[0].args ?? [];
      const portIndex = argv.indexOf("--port");
      assert.notEqual(portIndex, -1, "an owned Metro spawn must receive an explicit --port");
      assert.notEqual(
        String(argv[portIndex + 1] ?? ""),
        "8081",
        "an owned Metro must never be spawned over the foreign legacy listener",
      );
    }
  } finally {
    if (
      ownedCandidate &&
      ownedCandidate.exitCode === null &&
      ownedCandidate.signalCode === null
    ) {
      ownedCandidate.kill("SIGKILL");
      await once(ownedCandidate, "exit");
    }
    await closeServer(foreign);
  }
});
