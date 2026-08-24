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
  assert.match(source, /type\s+MapPinBootstrapState\s*=\s*["']loading["']\s*\|\s*["']ready["']\s*\|\s*["']failed["']/);
  assert.match(
    source,
    /useState<MapPinBootstrapState>\s*\(\s*["']loading["']\s*\)/,
    "picker bootstrap authority must begin loading",
  );
});

test("picker consumes ready and error as terminally fenced bootstrap outcomes", () => {
  const readyBranch = bodyBetween('msg.type === "ready"', 'msg.type === "error"');
  assert.match(
    readyBranch,
    /current\s*===\s*["']failed["']\s*\?\s*current\s*:\s*["']ready["']/,
    "late ready must not revive a failed picker instance",
  );

  const errorBranchEnd = source.indexOf('msg.type === "center"');
  const errorStart = source.indexOf('msg.type === "error"');
  assert.notEqual(errorStart, -1, "picker must explicitly consume error bridge messages");
  assert.notEqual(errorBranchEnd, -1, "picker center handling must remain present");
  const errorBranch = source.slice(errorStart, errorBranchEnd);
  assert.match(errorBranch, /setBootstrapState\(\s*["']failed["']\s*\)/);
});

test("opening or reframing the picker resets bootstrap state to loading", () => {
  assert.match(
    source,
    /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]{0,500}if\s*\(\s*!visible\s*\)\s*return;[\s\S]{0,300}setBootstrapState\(\s*["']loading["']\s*\)[\s\S]{0,500}\}\s*,\s*\[\s*visible\s*,\s*initial\s*,\s*marketCountry\s*\]\s*\)/,
    "opening, initial-pin changes and market reframing must reset bootstrap authority",
  );
});

test("failed picker renders localized unavailable UI instead of an infinite loading overlay", () => {
  assert.match(source, /search\.mapUnavailableTitle/);
  assert.match(source, /search\.mapUnavailableBody/);
  assert.match(
    source,
    /bootstrapState\s*===\s*["']failed["'][\s\S]{0,1800}search\.mapUnavailableTitle[\s\S]{0,1000}search\.mapUnavailableBody/,
  );
});

test("loading indicator and confirmation are fenced by bootstrap state", () => {
  assert.match(source, /<WebView\b/);
  assert.match(source, /testID="create-map-pin-confirm"/);
  assert.match(source, /msg\.type\s*===\s*["']center["']/);
  assert.match(
    source,
    /bootstrapState\s*===\s*["']loading["'][\s\S]{0,900}<ActivityIndicator\b/,
    "loading indicator must be loading-state specific",
  );
  assert.match(
    source,
    /const\s+canConfirm\s*=\s*bootstrapState\s*===\s*["']ready["']\s*&&\s*center\s*!==\s*null/,
    "failed/loading picker must not confirm stale coordinates",
  );
});
