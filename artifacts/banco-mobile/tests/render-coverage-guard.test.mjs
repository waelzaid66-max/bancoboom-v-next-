// Guard the boundary between source-text checks and real component mounting.
// The registry is explicit because filename/export inference failed on the
// icon facade: SendIcon.render.test.tsx mounts the exported Feather facade, not
// a symbol named SendIcon. Every row therefore records the source symbol, the
// exact render suite, the complementary static guard, and the visual claim.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const RENDER_CRITICAL = [
  {
    source: "components/PresenceDot.tsx",
    symbol: "PresenceDot",
    suite: "tests/render/PresenceDot.render.test.tsx",
    staticGuard: "tests/presence-privacy-guard.test.mjs",
    claim: "away, unknown, and opted-out users draw no distinguishable mark",
  },
  {
    source: "components/PresenceDot.tsx",
    symbol: "PresenceLabel",
    suite: "tests/render/PresenceLabel.render.test.tsx",
    staticGuard: "tests/presence-privacy-guard.test.mjs",
    claim: "presence words resolve in English and Arabic without leaking opt-out",
  },
  {
    source: "components/icons.tsx",
    symbol: "Feather",
    suite: "tests/render/SendIcon.render.test.tsx",
    staticGuard: "tests/icons.test.mjs",
    claim: "the send glyph is painted as a plane rather than a hollow V",
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderSuites() {
  return readdirSync(join(root, "tests/render"))
    .filter((file) => file.endsWith(".test.tsx"))
    .map((file) => `tests/render/${file}`)
    .sort();
}

test("every declared render claim points to real source, suite, and static guard", () => {
  for (const entry of RENDER_CRITICAL) {
    for (const path of [entry.source, entry.suite, entry.staticGuard]) {
      assert.ok(existsSync(join(root, path)), `${path} moved — update the registry`);
    }

    const source = read(entry.source);
    assert.match(
      source,
      new RegExp(`export\\s+(?:function|const|class)\\s+${entry.symbol}\\b`),
      `${entry.symbol} is no longer exported from ${entry.source}`,
    );
  }
});

test("every declared suite imports and mounts its exact source symbol", () => {
  for (const entry of RENDER_CRITICAL) {
    const suite = read(entry.suite);
    const sourceAlias = `@/${entry.source.replace(/\.tsx$/, "")}`;

    assert.match(
      suite,
      new RegExp(`from\\s+["']${escapeRegExp(sourceAlias)}["']`),
      `${entry.suite} no longer imports from ${sourceAlias}`,
    );
    assert.match(
      suite,
      new RegExp(`<${entry.symbol}[\\s/>]`),
      `${entry.suite} does not mount ${entry.symbol}; claim: ${entry.claim}`,
    );
  }
});

test("render suites mount through React Native Testing Library, never source text", () => {
  for (const suitePath of renderSuites()) {
    const suite = read(suitePath);
    assert.match(suite, /@testing-library\/react-native/);
    assert.match(suite, /\brender\s*\(/, `${suitePath} never calls render()`);
    assert.doesNotMatch(
      suite,
      /readFileSync|readFile\s*\(/,
      `${suitePath} is a source guard disguised as a render suite`,
    );
  }
});

test("the explicit registry covers every render suite exactly once", () => {
  const declared = RENDER_CRITICAL.map((entry) => entry.suite).sort();
  assert.equal(new Set(declared).size, declared.length, "a render suite is declared twice");
  assert.deepEqual(renderSuites(), declared);
});

test("the render meta-guard and Jest suite are both chained", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts?.["test:render-coverage"],
    "node --test tests/render-coverage-guard.test.mjs",
  );
  assert.equal(pkg.scripts?.["test:render"], "jest --runInBand");
  assert.match(pkg.scripts?.test ?? "", /pnpm run test:render-coverage(?:\s|$)/);
  assert.match(pkg.scripts?.test ?? "", /pnpm run test:render(?:\s|$)/);
});

test("Jest reaches only the TypeScript render suites", () => {
  const config = read("jest.config.js");
  assert.ok(config.includes('tests/render/**/*.test.tsx'));
  assert.match(config, /testPathIgnorePatterns/);
  assert.match(config, /\\\\\.test\\\\\.mjs\$/);
});
