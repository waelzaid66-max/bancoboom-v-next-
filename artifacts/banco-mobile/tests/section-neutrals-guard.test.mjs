// Five section headers, one set of neutrals.
//
// They were written out five times and drifted: Cars moved to the owner's
// 2026-08-02 brief palette (#090909 / #A5A5A5 / hairline 0.06) and the rest
// stayed on an older black and grey (#000000 / #8E8E93 / 0.16), so the app ran
// two blacks and two greys at once. A value with five homes always drifts, so
// this guard removes the homes rather than trusting anyone to keep them equal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const tokens = read("lib/sectionTheme.ts");

/** Agent B's headers under the V2 split. Facilities and Stays belong to agent
 *  A and are deliberately not asserted here — the tokens are exported and
 *  waiting, and claiming their files would be taking work that is not ours. */
const HEADERS = [
  "components/search/car/CarsHomeHeader.tsx",
  "components/search/property/PropertyHomeHeader.tsx",
  "components/search/materials/MaterialsHomeHeader.tsx",
];

test("the neutrals have exactly one home", () => {
  assert.match(tokens, /export const SECTION_NEUTRAL = \{/);
  for (const key of ["void", "secondary", "surface", "snow", "ash", "steel", "hairline"]) {
    assert.match(
      tokens,
      new RegExp(`\\n  ${key}: "`),
      `SECTION_NEUTRAL is missing ${key}`,
    );
  }
});

test("the neutrals are the owner's brief values, not someone's preference", () => {
  // The owner specified these on 2026-08-02 and Cars already shipped them by
  // that decision. If they change, it should be a decision, not a drift.
  const want = {
    void: "#090909",
    secondary: "#121212",
    surface: "#181818",
    snow: "#FFFFFF",
    ash: "#A5A5A5",
    hairline: "rgba(255,255,255,0.06)",
  };
  for (const [key, value] of Object.entries(want)) {
    assert.match(
      tokens,
      new RegExp(`${key}: "${value.replace(/[()]/g, "\\$&")}"`),
      `SECTION_NEUTRAL.${key} must be ${value} — the brief's value`,
    );
  }
});

test("no header writes a neutral by hand", () => {
  for (const file of HEADERS) {
    const src = read(file);
    const named = [...src.matchAll(/^const (VOID|SECONDARY|SURFACE|SNOW|ASH|STEEL|HAIRLINE) = (.+);$/gm)];
    assert.ok(named.length > 0, `${file}: no neutral constants found — did they move?`);
    for (const [, name, value] of named) {
      assert.match(
        value,
        /^SECTION_NEUTRAL\./,
        `${file}: ${name} is written by hand as ${value} — take it from SECTION_NEUTRAL`,
      );
    }
  }
});

test("a header may still keep its own ACCENT — that is the point", () => {
  // The guard above must not have swept the accent into the shared file. Each
  // world keeps its own red; the neutrals are the part that must not differ.
  for (const file of HEADERS) {
    assert.match(
      read(file),
      /const ACCENT = sectionAccent\(/,
      `${file} must still bind its own section accent`,
    );
  }
});
