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

test("only ready bridge message marks bootstrap successful", () => {
  const readyBranch = branchBetween('if (msg.type === "ready")', '} else if (msg.type === "error")');

  // This used to require the literal `setBootstrapState("ready")` and forbid the
  // word "failed" anywhere in the branch. Measured 2026-08-25: the source-epoch
  // work replaced it with
  //
  //   setBootstrapState((current) => (current === "failed" ? current : "ready"))
  //
  // which is STRICTLY STRONGER — under the old plain assignment a late `ready`
  // could revive a map that had already failed. Both old assertions rejected
  // that improvement: one because the literal moved, the other because the word
  // "failed" now appears in the very code that honours it. Address-pinned, not
  // a defect. The invariant is asserted instead of the spelling.
  assert.match(
    readyBranch,
    /setBootstrapState\(/,
    "the ready message must establish readiness",
  );
  assert.match(
    readyBranch,
    /"ready"/,
    "the ready branch must reach the ready state",
  );
  assert.doesNotMatch(
    readyBranch,
    /setBootstrapState\(\s*"failed"\s*\)/,
    "a ready message must never mark the map failed",
  );
  assert.doesNotMatch(
    readyBranch,
    /setBootstrapState\(\s*"ready"\s*\)/,
    "readiness must be set through the fail-closed updater, so a late ready cannot revive a failed instance",
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

test("tile failure is degradation and cannot revive failed bootstrap", () => {
  const tileBranch = branchBetween('else if (msg.type === "tile_error")', '} else if (msg.type === "locate_error")');

  // This used to require the tile branch to CARRY the fail-closed updater,
  // because that is where readiness was reconciled. Measured 2026-08-25: the
  // source-epoch work moved that reconciliation into the `ready` branch and left
  // the tile branch touching no bootstrap state at all.
  //
  // That is the stronger arrangement, and the honest one: a tile outage is pure
  // degradation of a map that already bootstrapped. It should never be able to
  // establish readiness, which the old form technically could — a `tile_error`
  // arriving while state was "loading" set it to "ready".
  //
  // So the invariant flips from "carry the updater" to "do not touch bootstrap
  // state", which is what the branch must actually honour.
  assert.doesNotMatch(
    tileBranch,
    /setBootstrapState\(/,
    "a tile failure must not establish, revive, or fail bootstrap — it is degradation of an already-ready map",
  );
  assert.match(tileBranch, /tileFailureShownRef/, "the alert must fire once per mounted map");
  assert.match(tileBranch, /Alert\.alert/, "the user must be told the tiles failed");

  // The reconciliation still has to exist somewhere, or this would pass by
  // deletion rather than by relocation.
  assert.match(
    source,
    /setBootstrapState\(\(current\) => \(current === "failed" \? current : "ready"\)\)/,
    "the fail-closed readiness updater must still exist — it moved to the ready branch, it was not removed",
  );
});

test("legacy ready-or-error conflation cannot return", () => {
  assert.doesNotMatch(source, /msg\.type === "ready" \|\| msg\.type === "error"/);
});
