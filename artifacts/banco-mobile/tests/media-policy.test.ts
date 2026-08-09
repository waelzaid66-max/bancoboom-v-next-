// @ts-nocheck -- Node-only contract test; the Expo runtime tsconfig omits Node types.
import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticatedMediaSource,
  inferSupportedPickedContentType,
  isFirstPartyServingUrl,
  isSupportedPickedVideo,
} from "../lib/mediaPolicy.ts";

test("supported native video containers resolve to server-served MIME types", () => {
  assert.equal(
    inferSupportedPickedContentType({ uri: "file:///clip.mp4" }, true),
    "video/mp4",
  );
  assert.equal(
    inferSupportedPickedContentType(
      { uri: "file:///clip", mimeType: "VIDEO/QUICKTIME; charset=binary" },
      true,
    ),
    "video/quicktime",
  );
});

test("unsupported native video containers fail closed instead of being mislabeled mp4", () => {
  for (const asset of [
    { uri: "file:///clip.mkv", mimeType: "video/x-matroska" },
    { uri: "content://picker/42", fileName: "clip.avi" },
    { uri: "file:///clip.3gp" },
  ]) {
    assert.equal(inferSupportedPickedContentType(asset, true), null);
    assert.equal(isSupportedPickedVideo(asset), false);
  }
});

test("supported still-image types resolve without trusting arbitrary MIME", () => {
  assert.equal(
    inferSupportedPickedContentType(
      { uri: "content://picker/42", fileName: "photo.HEIC" },
      false,
    ),
    "image/heic",
  );
  assert.equal(
    inferSupportedPickedContentType(
      { uri: "file:///payload.svg", mimeType: "image/svg+xml" },
      false,
    ),
    null,
  );
});

test("private-media bearer headers are scoped to the configured API origin", () => {
  const base = "https://api.banco.today";
  const firstParty = "https://api.banco.today/api/v1/uploads/objects/uploads/abc";
  const lookalike = "https://evil.example/api/v1/uploads/objects/uploads/abc";
  const headers = { Authorization: "Bearer secret" };

  assert.equal(isFirstPartyServingUrl(firstParty, base), true);
  assert.equal(isFirstPartyServingUrl(lookalike, base), false);
  assert.deepEqual(authenticatedMediaSource(firstParty, headers, base), {
    uri: firstParty,
    headers,
  });
  assert.deepEqual(authenticatedMediaSource(lookalike, headers, base), {
    uri: lookalike,
  });
});
