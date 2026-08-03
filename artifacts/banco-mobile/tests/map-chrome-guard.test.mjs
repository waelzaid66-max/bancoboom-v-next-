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
import { createRequire } from "node:module";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
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

test("the page draws the area; the host decides what is inside it", () => {
  // One implementation of point-in-polygon, in the file that has tests. If the
  // page ever grew its own, the two would drift and the map would disagree
  // with its own caption.
  assert.doesNotMatch(
    mapHtml,
    /isPointInArea|pointInPolygon|rayCast/,
    "inside/outside belongs to lib/geoArea.ts, never to the WebView",
  );
  assert.match(
    mapHtml,
    /type: "area", points:/,
    "the page reports corners and nothing more",
  );
});

test("an area cannot be committed from fewer than three corners", () => {
  const commit = mapHtml.match(/function commitArea\(\)[\s\S]*?\n    \}/)?.[0] ?? "";
  assert.match(
    commit,
    /drawPts\.length < 3/,
    "two corners enclose nothing; committing one would blank the map",
  );
});

test("every cluster injection goes through the one clipping point", () => {
  // The bug this prevents: applying the area on the fetch path and forgetting
  // the cache path, so the filter works until the buyer pans back.
  const injections = nativeHost.match(/BANCO_MAP\.setClusters/g) ?? [];
  assert.equal(
    injections.length,
    1,
    "clusters reach the map from exactly one place, so the clip cannot be skipped",
  );
  assert.match(nativeHost, /filterByArea\(clusters, shape\)/);
});

test("the drawn area survives a criteria change without going stale", () => {
  // fetchClusters is rebuilt from criteria; a closed-over area would filter the
  // next response against a shape the buyer already cleared.
  assert.match(
    nativeHost,
    /areaRef\.current/,
    "the area is read from a ref at publish time, not captured in a callback",
  );
});

test("draw controls are inline SVG, never an icon font", () => {
  const ctrl = mapHtml.match(/var DrawControl[\s\S]*?map\.addControl\(new DrawControl\(\)\);/)?.[0] ?? "";
  assert.ok(ctrl, "the draw control moved — update this guard");
  assert.match(ctrl, /<svg viewBox="0 0 24 24"/);
  assert.doesNotMatch(
    ctrl,
    /font-family|&#x|ionicon|material-icons|FontAwesome/i,
    "an icon font in a WebView is a missing glyph waiting to happen on Android",
  );
});

test("draw controls meet the same touch floor as the rest of the map", () => {
  const rule = mapHtml.match(/\.map-btn \{[\s\S]*?\}/)?.[0] ?? "";
  const size = rule.match(/width: (\d+)px; height: (\d+)px/);
  assert.ok(size, "the draw button size moved — update this guard");
  assert.ok(Number(size[1]) >= 44 && Number(size[2]) >= 44, `draw button is ${size[1]}×${size[2]}`);
});

test("the area caption never claims a bare number it cannot prove", () => {
  assert.match(chrome, /areaCount\.exact/);
  assert.match(chrome, /search\.mapAreaCountAtLeast/);
  const i18n = read("constants/i18n.ts");
  // Both languages, or the Arabic-first app ships an English-only control.
  assert.ok(
    (i18n.match(/mapAreaCountAtLeast:/g) ?? []).length >= 2,
    "the at-least string must exist in EN and AR",
  );
  assert.ok(
    (i18n.match(/mapDrawArea:/g) ?? []).length >= 2,
    "the draw labels must exist in EN and AR",
  );
});

test("the generated page actually parses — the compiler never sees it", () => {
  // mapHtml builds a <script> as a STRING. TypeScript checks the builder and
  // not one character of what it emits, so a stray bracket or an unescaped
  // backtick ships a map that renders blank with nothing in the build log.
  // It happened once already during this work: a backtick inside a CSS comment
  // closed the template literal.
  //
  // So the page is built for real and handed to the JS parser.
  const ts = require("typescript");
  const js = ts.transpileModule(mapHtml, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const box = { exports: {} };
  const stubVendor = () => ({
    LEAFLET_CSS: "",
    LEAFLET_JS: "",
    MARKER_CLUSTER_CSS: "",
    MARKER_CLUSTER_DEFAULT_CSS: "",
    MARKER_CLUSTER_JS: "",
  });
  new Function("exports", "require", js)(box.exports, stubVendor);

  const html = box.exports.buildMapHtml(
    [],
    {
      primary: "#CC1E24",
      primaryForeground: "#FFFFFF",
      card: "#111111",
      foreground: "#FFFFFF",
      border: "#222222",
    },
    undefined,
    undefined,
    73,
    { draw: "ارسم منطقة", done: "ابحث", undo: "تراجع", clear: "امسح" },
  );

  const open = html.lastIndexOf("<script>");
  const close = html.lastIndexOf("</script>");
  assert.ok(open > 0 && close > open, "the page has no script block");
  const script = html.slice(open + "<script>".length, close);
  // Throws on any syntax error inside the page.
  assert.doesNotThrow(() => new Function(script), "the generated page does not parse");

  // And the values that cross the boundary really arrive.
  assert.match(html, /margin-bottom: 73px/, "the clearance did not reach the CSS");
  assert.ok(html.includes("ارسم منطقة"), "translated labels did not reach the page");
  assert.match(html, /var DrawControl/, "the draw control did not reach the page");
});
