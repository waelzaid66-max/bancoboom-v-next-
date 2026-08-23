import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const replitConfig = readFileSync(resolve(root, ".replit"), "utf8");
const startScript = readFileSync(resolve(root, "scripts/replit-prod-start.sh"), "utf8");

test("Replit declares nginx as an explicit Nix runtime dependency", () => {
  assert.match(replitConfig, /\[nix\][\s\S]*channel\s*=\s*"stable-25_05"/);
  assert.match(replitConfig, /\[nix\][\s\S]*packages\s*=\s*\[[^\]]*"nginx"[^\]]*\]/);
});

test("router resolves nginx and MIME data from the runtime instead of /etc", () => {
  assert.doesNotMatch(startScript, /\/etc\/nginx\/mime\.types/);
  assert.match(startScript, /command -v nginx/);
  assert.match(startScript, /readlink -f/);
  assert.match(startScript, /NGINX_MIME_TYPES=/);
  assert.match(startScript, /\/conf\/mime\.types/);
});

test("router fails closed when nginx or MIME data is unavailable", () => {
  assert.match(startScript, /NGINX_BIN/);
  assert.match(startScript, /if \[ -z "\$NGINX_BIN" \]/);
  assert.match(startScript, /if \[ ! -f "\$NGINX_MIME_TYPES" \]/);
  assert.match(startScript, /exit 1/);
});

test("nginx lifecycle uses the resolved binary and a writable runtime prefix", () => {
  assert.match(startScript, /NGINX_RUNTIME_PREFIX=/);
  assert.match(startScript, /mkdir -p "\$NGINX_RUNTIME_PREFIX"/);
  assert.match(startScript, /"\$NGINX_BIN" -p "\$NGINX_RUNTIME_PREFIX" -c "\$NGINX_CONF" -s stop/);
  assert.match(startScript, /"\$NGINX_BIN" -p "\$NGINX_RUNTIME_PREFIX" -c "\$NGINX_CONF" -g "daemon off;"/);
  assert.doesNotMatch(startScript, /(^|\n)\s*nginx\s+-c/m);
});
