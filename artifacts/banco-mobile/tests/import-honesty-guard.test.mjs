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
  for (const phrase of banned) {
    assert.ok(
      !hub.includes(phrase) && !auctions.includes(phrase),
      `"${phrase}" is a promise with no enforcement behind it`
    );
  }
});
