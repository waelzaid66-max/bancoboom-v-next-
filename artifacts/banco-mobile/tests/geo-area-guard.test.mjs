// Point-in-polygon decides what a buyer sees after drawing a shape, and the
// map cannot be rendered in this environment to check it by eye. So it is
// tested here instead — including the two cases that break naive ray casting
// and only ever show up on real data.
import { createRequire } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib/geoArea.ts"), "utf8");

// The module is TypeScript, so it is compiled with the project's OWN compiler
// rather than pattern-stripped. That matters: a regex stripper silently drifts
// from the source it claims to test, and a guard that tests a near-copy of the
// code is worse than no guard. This runs the real implementation.
const ts = require("typescript");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const sandbox = { exports: {} };
new Function("exports", js)(sandbox.exports);
const mod = sandbox.exports;

/** A unit square from (0,0) to (1,1). */
const SQUARE = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: 0 },
];

test("a shape needs three distinct corners to be a filter at all", () => {
  assert.equal(mod.isUsableArea(null), false);
  assert.equal(mod.isUsableArea([]), false);
  assert.equal(mod.isUsableArea([{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }]), false);
  // Three taps in one spot enclose nothing. Accepting it would return zero
  // results and read as a broken filter rather than an empty area.
  assert.equal(
    mod.isUsableArea([
      { lat: 5, lng: 5 },
      { lat: 5, lng: 5 },
      { lat: 5, lng: 5 },
    ]),
    false,
  );
  assert.equal(mod.isUsableArea(SQUARE), true);
});

test("a draw with repeated or collinear corners has no searchable area", () => {
  assert.equal(
    mod.isUsableArea([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 0 },
    ]),
    false,
    "two unique points do not enclose an area",
  );
  assert.equal(
    mod.isUsableArea([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
    ]),
    false,
    "three distinct but collinear points do not enclose an area",
  );
});

test("nonsense coordinates are refused, not silently plotted", () => {
  const bad = [
    { lat: NaN, lng: 0 },
    { lat: 0, lng: 1 },
    { lat: 1, lng: 1 },
  ];
  assert.equal(mod.isUsableArea(bad), false);
  assert.equal(
    mod.isUsableArea([
      { lat: 91, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
    ]),
    false,
  );
  assert.equal(
    mod.isUsableArea([
      { lat: 0, lng: 181 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
    ]),
    false,
  );
});

test("the box handed to the server is the tightest one around the shape", () => {
  assert.deepEqual(mod.areaBounds(SQUARE), {
    north: 1,
    south: 0,
    east: 1,
    west: 0,
  });
  const tri = [
    { lat: 30.1, lng: 31.2 },
    { lat: 29.8, lng: 31.9 },
    { lat: 30.4, lng: 31.5 },
  ];
  assert.deepEqual(mod.areaBounds(tri), {
    north: 30.4,
    south: 29.8,
    east: 31.9,
    west: 31.2,
  });
});

test("plainly inside and plainly outside", () => {
  assert.equal(mod.isPointInArea({ lat: 0.5, lng: 0.5 }, SQUARE), true);
  assert.equal(mod.isPointInArea({ lat: 1.5, lng: 0.5 }, SQUARE), false);
  assert.equal(mod.isPointInArea({ lat: 0.5, lng: 1.5 }, SQUARE), false);
  assert.equal(mod.isPointInArea({ lat: -0.5, lng: 0.5 }, SQUARE), false);
});

test("a ray through a shared vertex must not flip the answer", () => {
  // THE classic failure. This diamond has vertices at lat 0 and lat 2, and a
  // point at lat 1 fires a ray that passes exactly through the side vertices.
  // Count that crossing twice and every point on that line reads as outside.
  const diamond = [
    { lat: 0, lng: 1 },
    { lat: 1, lng: 2 },
    { lat: 2, lng: 1 },
    { lat: 1, lng: 0 },
  ];
  assert.equal(mod.isPointInArea({ lat: 1, lng: 1 }, diamond), true);
  assert.equal(mod.isPointInArea({ lat: 1, lng: 2.5 }, diamond), false);
  assert.equal(mod.isPointInArea({ lat: 1, lng: -0.5 }, diamond), false);
});

test("a concave shape excludes its own bite", () => {
  // An L. A bounding box would call the notch inside — which is exactly why
  // the box alone is not the filter, and the shape test has to run.
  const ell = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 3 },
    { lat: 1, lng: 3 },
    { lat: 1, lng: 1 },
    { lat: 3, lng: 1 },
    { lat: 3, lng: 0 },
  ];
  assert.equal(mod.isPointInArea({ lat: 0.5, lng: 2.5 }, ell), true);
  assert.equal(mod.isPointInArea({ lat: 2.5, lng: 0.5 }, ell), true);
  // Inside the box, outside the L.
  assert.equal(mod.isPointInArea({ lat: 2.5, lng: 2.5 }, ell), false);
});

test("no area means no filtering — never an empty map", () => {
  const pts = [{ lat: 9, lng: 9 }, { lat: 0.5, lng: 0.5 }];
  assert.equal(mod.filterByArea(pts, null).length, 2);
  assert.equal(mod.filterByArea(pts, undefined).length, 2);
  // An unusable shape is the same as no shape. Treating it as a filter would
  // blank the map on a stray tap.
  assert.equal(mod.filterByArea(pts, [{ lat: 0, lng: 0 }]).length, 2);
});

test("filtering keeps only what is inside", () => {
  const pts = [
    { lat: 0.5, lng: 0.5, id: "in" },
    { lat: 5, lng: 5, id: "out" },
  ];
  const kept = mod.filterByArea(pts, SQUARE);
  assert.deepEqual(kept.map((p) => p.id), ["in"]);
});

test("a count is only called exact when every marker is a single listing", () => {
  const singles = [
    { lat: 0.2, lng: 0.2, count: 1 },
    { lat: 0.8, lng: 0.8, count: 1 },
    { lat: 9, lng: 9, count: 1 },
  ];
  assert.deepEqual(mod.areaCount(singles, SQUARE), { total: 2, exact: true });

  // A cluster sits at the centroid of what it holds, so one inside the shape
  // can still contain listings outside it. The total stays useful; the claim
  // to exactness does not survive.
  const withCluster = [
    { lat: 0.2, lng: 0.2, count: 1 },
    { lat: 0.8, lng: 0.8, count: 25 },
  ];
  assert.deepEqual(mod.areaCount(withCluster, SQUARE), {
    total: 26,
    exact: false,
  });
});

test("a marker with no count is one listing, not zero", () => {
  const pts = [{ lat: 0.5, lng: 0.5 }];
  assert.deepEqual(mod.areaCount(pts, SQUARE), { total: 1, exact: true });
});

test("Cairo — a real shape over real coordinates", () => {
  // Roughly a box over greater Cairo. Sanity that the maths survives the
  // magnitudes it will actually see, not just the unit square.
  const cairo = [
    { lat: 30.15, lng: 31.15 },
    { lat: 30.15, lng: 31.45 },
    { lat: 29.95, lng: 31.45 },
    { lat: 29.95, lng: 31.15 },
  ];
  assert.equal(mod.isPointInArea({ lat: 30.04, lng: 31.24 }, cairo), true);
  // Alexandria is far outside.
  assert.equal(mod.isPointInArea({ lat: 31.2, lng: 29.92 }, cairo), false);
  const b = mod.areaBounds(cairo);
  assert.ok(b.north > b.south && b.east > b.west);
});
