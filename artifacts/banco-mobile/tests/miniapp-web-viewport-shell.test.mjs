import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootHtml = readFileSync(new URL("../app/+html.tsx", import.meta.url), "utf8");

function cssBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = rootHtml.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `missing CSS block for ${selector}`);
  return match[1];
}

test("web document installs the Expo Router full-screen scroll reset", () => {
  assert.match(rootHtml, /import \{ ScrollViewStyleReset \} from "expo-router\/html";/);
  assert.match(rootHtml, /<ScrollViewStyleReset \/>/);
  assert.match(rootHtml, /viewport-fit=cover/);
});

test("web root cannot collapse to header content height", () => {
  assert.match(
    rootHtml,
    /html,\s*body,\s*#root\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*100%;/,
  );
  assert.match(
    rootHtml,
    /#root\s*\{\s*display:\s*flex;\s*flex:\s*1 1 auto;\s*min-height:\s*100vh;\s*min-height:\s*100dvh;\s*\}/,
  );
});

test("document scrolling stays disabled so section ScrollViews own scrolling", () => {
  const bodyBlock = cssBlock("body");
  assert.match(bodyBlock, /overflow:\s*hidden;/);
  assert.match(bodyBlock, /overscroll-behavior:\s*none;/);
});
