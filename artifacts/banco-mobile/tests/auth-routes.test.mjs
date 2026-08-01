// Account creation must be reachable by address, not only by tab.
//
// Registration is a mode inside the Profile tab, not a screen. Before these
// routes existed there was no way to link to it at all: every "you need an
// account" path in the app hard-coded /(tabs)/profile and landed on whatever
// mode happened to be the default, which is sign-in. To the person who tapped
// "create account", that reads as the page failing to open.
//
// These guards protect the address, not the form. The flow itself lives in
// profile.tsx and is deliberately not duplicated here.
//
// Run: node --test tests/auth-routes.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "app");

// Comments are stripped before every match. A guard that can be satisfied by
// the prose explaining it is not a guard — this suite's own header mentions
// every symbol it asserts on.
function code(file) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("both auth entry points exist as real routes", () => {
  for (const route of ["sign-in.tsx", "sign-up.tsx"]) {
    assert.ok(
      fs.existsSync(path.join(APP, route)),
      `app/${route} must exist — without it there is no address to link to`,
    );
  }
});

test("each route lands on the screen that owns the flow, in its own mode", () => {
  const cases = [
    { file: "sign-up.tsx", mode: "signup" },
    { file: "sign-in.tsx", mode: "signin" },
  ];

  for (const { file, mode } of cases) {
    const src = code(path.join(APP, file));

    assert.match(src, /<Redirect\b/, `${file}: must resolve to the existing screen`);
    assert.match(
      src,
      /pathname:\s*"\/\(tabs\)\/profile"/,
      `${file}: must point at the Profile tab, which owns the auth flow`,
    );
    assert.match(
      src,
      new RegExp(`authMode:\\s*"${mode}"`),
      `${file}: must request the ${mode} mode explicitly, not rely on the default`,
    );

    // The whole point is NOT to grow a second copy of the auth form. If one of
    // these files ever starts collecting credentials, the flow has forked.
    assert.doesNotMatch(
      src,
      /useSignIn|useSignUp|TextInput/,
      `${file}: must not re-implement the auth form — one flow, one place`,
    );
  }
});

test("the Profile screen honours the mode it was opened with", () => {
  const src = code(path.join(APP, "(tabs)", "profile.tsx"));

  assert.match(
    src,
    /useLocalSearchParams/,
    "profile.tsx: must read the route param or the routes are inert",
  );
  assert.match(
    src,
    /const \{ authMode \} = useLocalSearchParams/,
    "profile.tsx: must destructure authMode specifically",
  );

  // switchMode, not setMode. setMode alone would flip the tab while leaving a
  // half-finished sign-in attempt's email, consent flag, phone and business
  // routing in place for the new signup to inherit.
  const effect = src.slice(src.indexOf("const { authMode }"));
  const body = effect.slice(0, effect.indexOf("}, [authMode]);"));
  assert.match(
    body,
    /switchMode\(authMode\)/,
    "profile.tsx: must route the param through switchMode so stale form state is cleared",
  );
  assert.doesNotMatch(
    body,
    /setMode\(/,
    "profile.tsx: setMode alone leaves the previous attempt's data behind",
  );

  // Only the param. Widening the dependency array re-runs switchMode on
  // unrelated renders and wipes what the user is typing.
  assert.match(
    body + "}, [authMode]);",
    /\}, \[authMode\]\);$/,
    "profile.tsx: the effect must depend on authMode alone",
  );
});
