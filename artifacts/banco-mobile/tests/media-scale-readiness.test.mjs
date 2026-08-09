import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE = path.resolve(__dirname, "..");

function source(relativePath) {
  return fs.readFileSync(path.join(MOBILE, relativePath), "utf8");
}

test("native uploads stream local files without first materializing a JS Blob", () => {
  const upload = source("lib/upload.ts");
  assert.match(upload, /expo-file-system\/legacy/);
  assert.match(upload, /createUploadTask\(/);
  assert.match(upload, /FileSystemUploadType\.BINARY_CONTENT/);
  assert.match(upload, /httpMethod:\s*["']PUT["']/);
  assert.match(upload, /cancelAsync\(/);
  assert.match(upload, /Platform\.OS\s*!==\s*["']web["']/);
});

test("listing galleries virtualize slides and mount a decoder only for the active video", () => {
  for (const relativePath of [
    "components/MediaGallery.tsx",
    "components/FullscreenImageViewer.tsx",
  ]) {
    const gallery = source(relativePath);
    assert.match(gallery, /\bFlatList\b/, `${relativePath}: must virtualize slides`);
    assert.match(gallery, /initialNumToRender=\{1\}/);
    assert.match(gallery, /windowSize=\{3\}/);
    assert.match(gallery, /maxToRenderPerBatch=\{2\}/);
    assert.match(
      gallery,
      /isActive\s*\?\s*\([\s\S]*?<[^>]*VideoSlide/,
      `${relativePath}: inactive videos must not own a player`,
    );
  }
});

test("recycled feed cards reset image content before loading the next listing", () => {
  for (const relativePath of [
    "components/SmartAssetCard.tsx",
    "components/StayCard.tsx",
    "components/IndustrialAssetCard.tsx",
  ]) {
    const card = source(relativePath);
    assert.match(card, /recyclingKey=\{item\.id\}/, relativePath);
  }
});

test("home prefetch is viewport-bounded and its URL tracker cannot grow forever", () => {
  const home = source("app/(tabs)/index.tsx");
  assert.match(home, /PREFETCH_INITIAL_COUNT/);
  assert.match(home, /PREFETCH_TRACK_LIMIT/);
  assert.match(home, /data\.slice\(0,\s*PREFETCH_INITIAL_COUNT\)/);
  assert.match(home, /prefetchedRef\.current\.size\s*>=\s*PREFETCH_TRACK_LIMIT/);
});

test("profile cover persists the immutable URL returned by promotion", () => {
  const profile = source("app/(tabs)/profile.tsx");
  assert.match(profile, /const promotion = await promoteUpload\(/);
  assert.match(profile, /const durableCoverUrl = promotion\.data\?\.url/);
  assert.match(profile, /coverUrl:\s*durableCoverUrl/);
  assert.doesNotMatch(profile, /coverUrl:\s*uploaded\.url/);
});
