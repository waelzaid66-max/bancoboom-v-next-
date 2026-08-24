import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "components/search/SearchResultsMap.tsx"), "utf8");

function branchBetween(start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `missing ${start}`);
  const to = source.indexOf(end, from);
  assert.ok(to > from, `missing ${end} after ${start}`);
  return source.slice(from, to);
}

test("native map bootstrap has explicit loading ready failed states", () => {
  assert.match(source, /type MapBootstrapState = "loading" \| "ready" \| "failed"/);
  assert.match(source, /useState<MapBootstrapState>\("loading"\)/);
  assert.match(source, /setBootstrapState\("loading"\)/);
});

test("ready bridge message cannot revive a failed WebView instance", () => {
  const readyBranch = branchBetween('if (msg.type === "ready")', '} else if (msg.type === "error")');
  assert.match(
    readyBranch,
    /setBootstrapState\(\(current\) => \(current === "failed" \? current : "ready"\)\)/,
  );
});

test("bootstrap error fails closed and surfaces bounded unavailable UI", () => {
  const errorBranch = branchBetween('else if (msg.type === "error")', '} else if (msg.type === "tile_error")');
  assert.match(errorBranch, /setBootstrapState\("failed"\)/);
  assert.doesNotMatch(errorBranch, /setBootstrapState\("ready"\)/);

  assert.match(source, /bootstrapState === "failed"/);
  assert.match(source, /testID="search-map-bootstrap-failed"/);
  assert.match(source, /search\.mapUnavailableTitle/);
  assert.match(source, /search\.mapUnavailableBody/);
  assert.match(source, /bootstrapState === "ready"[\s\S]*?<MapOverlayChrome/);
});

test("tile failure is degradation only and cannot establish bootstrap readiness", () => {
  const tileBranch = branchBetween('else if (msg.type === "tile_error")', '} else if (msg.type === "locate_error")');
  assert.doesNotMatch(
    tileBranch,
    /setBootstrapState\([^\n]*"ready"/,
    "tile_error must not transition loading or failed bootstrap state to ready",
  );
  assert.match(tileBranch, /tileFailureShownRef/);
  assert.match(tileBranch, /Alert\.alert/);
});

test("legacy ready-or-error conflation cannot return", () => {
  assert.doesNotMatch(source, /msg\.type === "ready" \|\| msg\.type === "error"/);
});
