import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../components/MapPinPicker.tsx", import.meta.url),
  "utf8",
);

function bodyBetween(startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle} after ${startNeedle}`);
  return source.slice(start, end);
}

test("picker bridge still declares and emits bootstrap error", () => {
  assert.match(source, /\|\s*\{\s*type:\s*["']error["']\s*\}/);
  assert.match(source, /post\(\{\s*type:\s*["']error["']\s*\}\)/);
});

test("picker owns loading-ready-failed bootstrap state instead of a boolean spinner latch", () => {
  assert.match(source, /["']loading["']/);
  assert.match(source, /["']ready["']/);
  assert.match(source, /["']failed["']/);
  assert.match(
    source,
    /useState(?:<[^>]+>)?\s*\(\s*["']loading["']\s*\)/,
    "picker bootstrap authority must begin loading",
  );
});

test("picker consumes ready and error as mutually exclusive bootstrap outcomes", () => {
  const readyBranch = bodyBetween('msg.type === "ready"', 'msg.type === "error"');
  assert.match(readyBranch, /\(\s*["']ready["']\s*\)/);

  const errorBranchEnd = source.indexOf('msg.type === "center"');
  const errorStart = source.indexOf('msg.type === "error"');
  assert.notEqual(errorStart, -1, "picker must explicitly consume error bridge messages");
  assert.notEqual(errorBranchEnd, -1, "picker center handling must remain present");
  const errorBranch = source.slice(errorStart, errorBranchEnd);
  assert.match(
    errorBranch,
    /\(\s*["']failed["']\s*\)/,
    "bootstrap error must terminate the spinner in failed state",
  );
});

test("opening or rebuilding the picker resets bootstrap state to loading", () => {
  assert.match(
    source,
    /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]{0,500}if\s*\(\s*!visible\s*\)\s*return;[\s\S]{0,300}\(\s*["']loading["']\s*\)[\s\S]{0,500}\}\s*,\s*\[\s*visible\s*,\s*initial\s*\]\s*\)/,
    "each newly opened/reframed picker instance must start from loading",
  );
});

test("failed picker renders localized unavailable UI instead of an infinite loading overlay", () => {
  assert.match(source, /search\.mapUnavailableTitle/);
  assert.match(source, /search\.mapUnavailableBody/);
  assert.match(
    source,
    /===\s*["']failed["'][\s\S]{0,1600}search\.mapUnavailableTitle[\s\S]{0,900}search\.mapUnavailableBody/,
    "failed state must render an actionable localized unavailable surface",
  );
});

test("normal picker map and confirmation remain usable only outside terminal bootstrap failure", () => {
  assert.match(source, /<WebView\b/);
  assert.match(source, /testID="create-map-pin-confirm"/);
  assert.match(source, /msg\.type\s*===\s*["']center["']/);
  assert.match(
    source,
    /===\s*["']loading["'][\s\S]{0,900}<ActivityIndicator\b/,
    "loading indicator must be loading-state specific",
  );
});
