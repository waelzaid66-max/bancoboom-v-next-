// The map's own controls were being drawn underneath MiniAppBottomNav.
//
// Leaflet anchors its bottom controls to the map CONTAINER, and on every
// mini-app that container runs beneath the bar — which is `position: absolute`
// and therefore covers what is under it rather than displacing it. The owner
// sent two screenshots of the result: a locate button sliced in half by the
// bar, and the OpenStreetMap attribution buried under it.
//
// buildMapHtml is a pure function, so this reads its output directly rather
// than a rendered screen. That matters here: this environment renders the app
// signed-out with zero API calls, so the map never mounts and a screenshot
// could not have proved the fix either way. The generated HTML can.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const mapHtml = read("components/search/mapHtml.ts");
const nav = read("components/MiniAppBottomNav.tsx");
const nativeHost = read("components/search/SearchResultsMap.tsx");
const webHost = read("components/search/SearchResultsMap.web.tsx");
const chrome = read("components/search/MapOverlayChrome.tsx");

test("the map is told how much bottom chrome covers it", () => {
  assert.match(
    mapHtml,
    /bottomInset\?: number/,
    "buildMapHtml must accept the clearance — only the native side knows it",
  );
  assert.match(
    mapHtml,
    /\.leaflet-bottom \{ margin-bottom: \$\{safeBottom\}px; \}/,
    "the lift belongs on Leaflet's bottom corner wrapper, so every bottom " +
      "control inherits it instead of each one rediscovering the bug",
  );
});

test("a bad inset cannot push the controls off the map", () => {
  // A NaN or a negative from a caller would move controls the wrong way, and
  // an absurd value would strand them mid-map. Both are clamped.
  assert.match(
    mapHtml,
    /Math\.max\(0, Math\.min\(Number\(bottomInset\) \|\| 0, \d+\)\)/,
    "bottomInset must be clamped at both ends",
  );
});

test("both map hosts pass the clearance, and recompute it when it moves", () => {
  for (const [name, src] of [
    ["SearchResultsMap.tsx", nativeHost],
    ["SearchResultsMap.web.tsx", webHost],
  ]) {
    assert.match(
      src,
      /miniAppNavClearance\(insets\.bottom\)/,
      `${name} must derive the clearance from the bar, never hard-code it`,
    );
    assert.match(
      src,
      /navClearance,/,
      `${name} must pass the clearance into buildMapHtml`,
    );
    // The inset changes on rotation and on a foldable opening. A memo that
    // does not list it keeps serving HTML built for the old geometry, which
    // puts the button straight back under the bar.
    assert.match(
      src.match(/\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\s*\n\s*\[[\s\S]*?\]/)?.[0] ?? "",
      /navClearance/,
      `${name} must rebuild the HTML when the clearance changes`,
    );
  }
});

test("the clearance has ONE source, and it is the bar itself", () => {
  assert.match(
    nav,
    /export const MINI_APP_NAV_HEIGHT/,
    "the bar owns its own height — nothing else may guess it",
  );
  assert.match(
    nav,
    /export function miniAppNavClearance/,
    "callers take the clearance whole, so the float gap cannot drift from it",
  );
  // The helper must add the same gap the bar actually renders at, or the two
  // disagree the moment someone edits one of them.
  const barBottom = nav.match(/bottom: insets\.bottom \+ \(isWeb \? (\d+) : (\d+)\)/);
  const helperGap = nav.match(/insetsBottom \+ \(isWeb \? (\d+) : (\d+)\) \+ MINI_APP_NAV_HEIGHT/);
  assert.ok(barBottom, "the bar's bottom offset moved — update this guard");
  assert.ok(helperGap, "the helper's gap moved — update this guard");
  assert.deepEqual(
    [helperGap[1], helperGap[2]],
    [barBottom[1], barBottom[2]],
    "the helper's float gap must match where the bar actually renders",
  );
});

test("the map preview card clears the bar by derivation, not by a magic number", () => {
  assert.match(
    chrome,
    /miniAppNavClearance\(insets\.bottom\)/,
    "the card used a bare 132 that happened to clear the bar; it must derive",
  );
  assert.doesNotMatch(
    chrome,
    /insets\.bottom \+ 132/,
    "the magic number is back — it will slide under the bar the day the bar changes",
  );
});

test("the attribution stays legible — it is a licence term, not decoration", () => {
  // OSM's licence requires visible attribution. It was under the bar.
  assert.match(mapHtml, /\.leaflet-control-attribution \{/);
  assert.doesNotMatch(
    mapHtml,
    /\.leaflet-control-attribution[\s\S]{0,120}display:\s*none/,
    "attribution may be small and dim, never hidden",
  );
  assert.match(
    mapHtml,
    /attributionControl: true/,
    "the control itself must stay on",
  );
});

test("the locate button meets the platform touch-target floor", () => {
  const rule = mapHtml.match(/\.locate-btn \{[\s\S]*?\}/)?.[0] ?? "";
  const size = rule.match(/width: (\d+)px; height: (\d+)px/);
  assert.ok(size, "the locate button's size moved — update this guard");
  assert.ok(
    Number(size[1]) >= 44 && Number(size[2]) >= 44,
    `locate button is ${size[1]}×${size[2]}; iOS and Android both ask for 44 minimum`,
  );
});
