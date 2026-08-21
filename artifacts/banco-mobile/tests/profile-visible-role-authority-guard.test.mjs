import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("../app/(tabs)/profile.tsx", import.meta.url),
  "utf8",
);

function sliceBetween(startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start marker: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end marker: ${endNeedle}`);
  return source.slice(start, end);
}

test("profile visible role pill consumes DB-first computed role", () => {
  const roleAuthority = sliceBetween(
    "const meRole = meQuery.data?.data?.role ?? \"\";",
    "const isFi = role === \"financial_institution\";",
  );
  assert.match(
    roleAuthority,
    /const\s+role\s*=\s*meRole\s*\|\|\s*clerkRole\s*;/,
    "profile must compute the visible/business role from /me first with Clerk only as fallback",
  );

  const rolePill = sliceBetween(
    "styles.rolePill,",
    "{memberSince && (",
  );

  assert.doesNotMatch(
    rolePill,
    /user\.publicMetadata\?\.role/,
    "visible role pill must not bypass the computed DB-first role authority",
  );
  assert.match(
    rolePill,
    /categoryLabel\s*\|\|[\s\S]*\brole\b/,
    "visible role pill must fall back to the computed role when categoryLabel is absent",
  );
});
