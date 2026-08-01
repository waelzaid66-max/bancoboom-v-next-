import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const orderDocs = fs.readFileSync(
  path.join(root, "components/import/OrderDocuments.tsx"),
  "utf8",
);
const orderDetail = fs.readFileSync(
  path.join(root, "app/import/order/[id].tsx"),
  "utf8",
);
const i18n = fs.readFileSync(path.join(root, "constants/i18n.ts"), "utf8");

test("order detail mounts OrderDocuments for per-order paperwork", () => {
  assert.match(orderDetail, /OrderDocuments/);
  assert.match(orderDetail, /from ["']@\/components\/import\/OrderDocuments["']/);
});

test("OrderDocuments reuses shared upload + fullscreen viewer", () => {
  assert.match(orderDocs, /uploadMediaAsset/);
  assert.match(orderDocs, /FullscreenImageViewer/);
  assert.match(orderDocs, /useAttachImportOrderDocument/);
  assert.match(orderDocs, /useDeleteImportOrderDocument/);
  assert.match(orderDocs, /useListImportOrderDocuments/);
});

test("delete dismiss uses common.cancel (not order-cancel Keep copy)", () => {
  assert.match(orderDocs, /t\("common\.cancel"\)/);
  assert.doesNotMatch(
    orderDocs,
    /docsDeleteTitle[\s\S]{0,200}?importOrder\.cancelKeep/,
  );
});

test("list error state has retry path + i18n keys EN+AR", () => {
  assert.match(orderDocs, /docsQuery\.isError/);
  assert.match(orderDocs, /importOrder\.docsLoadError/);
  assert.match(orderDocs, /common\.retry/);
  assert.match(i18n, /docsLoadError:\s*"Couldn't load documents/);
  assert.match(i18n, /docsLoadError:\s*"تعذّر تحميل المستندات/);
});

test("terminal orders are read-only for attach chips", () => {
  assert.match(orderDocs, /readOnly/);
  assert.match(orderDocs, /!readOnly &&/);
});
