import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const mobileRoot = resolve(here, "..");
const launcher = join(mobileRoot, "scripts", "dev-env.sh");

function runLauncher(extraEnv = {}) {
  const temp = mkdtempSync(join(tmpdir(), "banco-dev-server-test-"));
  const capture = join(temp, "args.txt");
  const fakePnpm = join(temp, "pnpm");
  writeFileSync(
    fakePnpm,
    "#!/usr/bin/env bash\nprintf '%s\\n' \"$@\" > \"$BANCO_TEST_CAPTURE\"\n",
  );
  chmodSync(fakePnpm, 0o755);

  const env = {
    ...process.env,
    PATH: `${temp}:${process.env.PATH ?? ""}`,
    BANCO_TEST_CAPTURE: capture,
    CLERK_PUBLISHABLE_KEY: "",
    CLERK_PROXY_URL: "",
    REPLIT_EXPO_DEV_DOMAIN: "",
    REPLIT_DEV_DOMAIN: "",
    REPL_ID: "",
    PORT: "",
    BANCO_EXPO_HOST_MODE: "",
    ...extraEnv,
  };

  const result = spawnSync("bash", [launcher], {
    cwd: mobileRoot,
    env,
    encoding: "utf8",
  });

  let args = [];
  try {
    args = readFileSync(capture, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    args = [];
  }

  rmSync(temp, { recursive: true, force: true });
  return { ...result, args };
}

function assertHostMode(args, expected) {
  for (const mode of ["--lan", "--localhost", "--tunnel"]) {
    assert.equal(
      args.includes(mode),
      mode === expected,
      `expected only ${expected}; received ${args.join(" ")}`,
    );
  }
}

test("ordinary clean clone defaults Metro to LAN for physical-device reachability", () => {
  const result = runLauncher();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.args.slice(0, 3), ["exec", "expo", "start"]);
  assertHostMode(result.args, "--lan");
});

test("Replit keeps localhost host-mode so its Expo proxy remains the external transport", () => {
  const result = runLauncher({
    REPLIT_EXPO_DEV_DOMAIN: "example.expo.worf.replit.dev",
    REPLIT_DEV_DOMAIN: "example.worf.replit.dev",
  });
  assert.equal(result.status, 0, result.stderr);
  assertHostMode(result.args, "--localhost");
});

test("explicit tunnel override is honored without making tunnel the canonical default", () => {
  const result = runLauncher({ BANCO_EXPO_HOST_MODE: "tunnel" });
  assert.equal(result.status, 0, result.stderr);
  assertHostMode(result.args, "--tunnel");
});

test("invalid host-mode fails closed before Expo starts", () => {
  const result = runLauncher({ BANCO_EXPO_HOST_MODE: "not-a-mode" });
  assert.notEqual(result.status, 0);
  assert.equal(result.args.length, 0, "pnpm/expo must not start for invalid mode");
});

test("explicit Metro port remains preserved", () => {
  const result = runLauncher({ PORT: "19000" });
  assert.equal(result.status, 0, result.stderr);
  const portIndex = result.args.indexOf("--port");
  assert.notEqual(portIndex, -1, `missing --port in ${result.args.join(" ")}`);
  assert.equal(result.args[portIndex + 1], "19000");
});
