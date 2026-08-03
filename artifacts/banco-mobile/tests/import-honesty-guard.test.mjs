// The car-import mini-app told the user things the repo could not back up:
// a hub that advertised "8+" auctions and "21" countries, and a chip on every
// auction card reading "Integration-ready" next to a button that only opens a
// request form. The owner's rule is absolute — "ممنوع اي شيء وهمي تماما" — so
// these are not cosmetic issues, they are the same class of defect as a filter
// chip that always returns nothing.
//
// This guard reads raw file text, like the other honesty guards in this
// directory. It fails the build if any of them come back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const hub = read("app/import/index.tsx");
const auctions = read("app/import/auctions.tsx");
const i18n = read("constants/i18n.ts");

/**
 * Every screen in the car-import world, not just the two that were caught.
 *
 * The first version of this guard watched the hub and the auction list, which
 * is where the invented numbers happened to be. But the defect was never about
 * those two files — the same class of claim, and the same off-family red, were
 * sitting in five more. A guard that only watches where the last bug was found
 * teaches the next one to appear next door.
 */
const IMPORT_SCREENS = [
  "app/import/index.tsx",
  "app/import/auctions.tsx",
  "app/import/calculator.tsx",
  "app/import/documents.tsx",
  "app/import/request.tsx",
  "app/import/order/[id].tsx",
  "components/import/OrderDocuments.tsx",
];

test("the hub advertises no count that was typed in by hand", () => {
  // The stats array is the only place the hub puts numbers in front of a user.
  const stats = hub.match(/const stats:[\s\S]*?\n {2}\];/);
  assert.ok(stats, "the stats array moved — update this guard to match");

  const literals = stats[0].match(/value:\s*"[^"]*\d[^"]*"/g) ?? [];
  assert.deepEqual(
    literals,
    [],
    `a count is only honest when something can be counted to produce it. ` +
      `Derive it from the list it describes, or drop the value and let the ` +
      `row stand as a capability. Found: ${literals.join(", ")}`
  );
});

test("the auction count is derived from the source list itself", () => {
  assert.match(
    hub,
    /value:\s*String\(AUCTION_SOURCES\.length\)/,
    "the auction stat must count SOURCES, so the screen can never drift from it"
  );
  assert.match(
    auctions,
    /export const SOURCES/,
    "SOURCES must stay exported — the hub counts it"
  );
});

test("no card claims an integration that does not exist", () => {
  // requestFrom() pushes the request form. That is a lead, not an integration,
  // and the UI must not imply otherwise.
  assert.doesNotMatch(
    auctions,
    /integrationReady|Integration-ready|جاهز للربط/,
    "the auction cards open a request form — nothing is wired to these houses"
  );
  assert.doesNotMatch(
    i18n,
    /integrationReady/,
    "the string itself must go, or it invites the claim straight back"
  );
});

test("the import screens promise nothing else the repo cannot back", () => {
  const banned = [
    "Integration-ready",
    "جاهز للربط",
    "24/7",
    "Guaranteed",
    "مضمون 100",
  ];
  for (const file of IMPORT_SCREENS) {
    const src = read(file);
    for (const phrase of banned) {
      assert.ok(
        !src.includes(phrase),
        `${file}: "${phrase}" is a promise with no enforcement behind it`
      );
    }
  }
});

test("no import screen writes its own red", () => {
  // The section accent is a TOKEN. Written as a literal it drifts: six of these
  // files had picked up #E53935 — Material Design's default red, ΔE ≈ 19 from
  // the brand logo — and a seventh had it buried in a StyleSheet where no audit
  // listed it. sectionTheme.ts holds the owner-locked rule that every section
  // colour derives from the logo red; a hex here quietly opts out of it.
  //
  // Comments are allowed to name the old value — that is how the reason for a
  // change survives — so this reads code lines only.
  for (const file of IMPORT_SCREENS) {
    const offenders = read(file)
      .split("\n")
      .map((line, i) => [i + 1, line])
      .filter(([, line]) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .filter(([, line]) => /#[0-9A-Fa-f]{6}\b/.test(line))
      // White, black and pure-transparent overlays are neutrals, not identity.
      .filter(([, line]) => !/#(FFFFFF|000000|22C55E)\b/i.test(line));

    assert.deepEqual(
      offenders,
      [],
      `${file} writes a colour by hand — bind it to sectionAccent()/SECTION_GRADIENT instead`
    );
  }
});

test("the shipment rail tells progress by fill, not by a rainbow", () => {
  const order = read("app/import/order/[id].tsx");

  // Six stages once carried six hues, five of them outside the red family.
  for (const hex of ["#F97316", "#F59E0B", "#0EA5E9", "#8B5CF6"]) {
    assert.ok(
      !order.includes(hex),
      `${hex} is back on the stage rail — progress is told by fill, not by hue`
    );
  }

  // And the stage list must not grow a colour field again.
  const stages = order.match(/const STAGES:[\s\S]*?\n\];/);
  assert.ok(stages, "the STAGES array moved — update this guard to match");
  assert.doesNotMatch(
    stages[0],
    /\bcolor\b/,
    "a stage carries no colour of its own; stageTone() derives it from position"
  );
});
