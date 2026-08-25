import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const mobileRoot = fileURLToPath(new URL("../", import.meta.url));
const appJsonPath = path.join(mobileRoot, "app.json");

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodeWhiteAlphaPng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), "notification icon must be a PNG");

  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const idat = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    assert.ok(dataEnd + 4 <= buffer.length, `truncated PNG chunk ${type}`);
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4;
  }

  assert.equal(width, 96, "Android notification small icon must be exactly 96px wide");
  assert.equal(height, 96, "Android notification small icon must be exactly 96px high");
  assert.equal(bitDepth, 8, "notification icon guard expects an 8-bit PNG");
  assert.equal(interlace, 0, "notification icon must be non-interlaced for deterministic validation");
  assert.ok(
    colorType === 6 || colorType === 4,
    "notification icon must contain an alpha channel (RGBA or grayscale+alpha PNG)",
  );
  assert.ok(idat.length > 0, "notification icon PNG has no image data");

  const bytesPerPixel = colorType === 6 ? 4 : 2;
  const rowBytes = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idat));
  const expectedBytes = height * (rowBytes + 1);
  assert.equal(inflated.length, expectedBytes, "unexpected PNG scanline payload size");

  const rows = [];
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const raw = inflated.subarray(inputOffset, inputOffset + rowBytes);
    inputOffset += rowBytes;
    const row = Buffer.alloc(rowBytes);
    const prior = y > 0 ? rows[y - 1] : null;

    for (let x = 0; x < rowBytes; x += 1) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = prior ? prior[x] : 0;
      const upLeft = prior && x >= bytesPerPixel ? prior[x - bytesPerPixel] : 0;
      const value = raw[x];

      if (filter === 0) row[x] = value;
      else if (filter === 1) row[x] = (value + left) & 0xff;
      else if (filter === 2) row[x] = (value + up) & 0xff;
      else if (filter === 3) row[x] = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) row[x] = (value + paethPredictor(left, up, upLeft)) & 0xff;
      else assert.fail(`unsupported PNG filter ${filter}`);
    }

    rows.push(row);
  }

  let transparentPixels = 0;
  let foregroundPixels = 0;

  for (const row of rows) {
    for (let x = 0; x < rowBytes; x += bytesPerPixel) {
      if (colorType === 6) {
        const red = row[x];
        const green = row[x + 1];
        const blue = row[x + 2];
        const alpha = row[x + 3];
        if (alpha === 0) transparentPixels += 1;
        if (alpha > 0) {
          foregroundPixels += 1;
          assert.equal(red, 255, "every visible notification-icon pixel must be white");
          assert.equal(green, 255, "every visible notification-icon pixel must be white");
          assert.equal(blue, 255, "every visible notification-icon pixel must be white");
        }
      } else {
        const gray = row[x];
        const alpha = row[x + 1];
        if (alpha === 0) transparentPixels += 1;
        if (alpha > 0) {
          foregroundPixels += 1;
          assert.equal(gray, 255, "every visible notification-icon pixel must be white");
        }
      }
    }
  }

  assert.ok(foregroundPixels > 0, "notification icon must contain a visible foreground glyph");
  assert.ok(transparentPixels > 0, "notification icon must contain a transparent background");
}

function getNotificationPluginConfig(appJson) {
  const plugins = appJson?.expo?.plugins;
  assert.ok(Array.isArray(plugins), "expo.plugins must be configured");
  const entry = plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-notifications",
  );
  assert.ok(entry, "expo-notifications plugin must be configured");
  assert.ok(entry[1] && typeof entry[1] === "object", "expo-notifications config is missing");
  return entry[1];
}

test("Android notification small icon is a dedicated compliant white/transparent 96x96 PNG", () => {
  const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
  const notificationConfig = getNotificationPluginConfig(appJson);
  const notificationIcon = notificationConfig.icon;

  assert.equal(typeof notificationIcon, "string", "expo-notifications.icon must be a local PNG path");
  assert.ok(notificationIcon.endsWith(".png"), "expo-notifications.icon must point to a PNG");
  assert.notEqual(
    notificationIcon,
    appJson.expo.icon,
    "notification small icon must not reuse the launcher icon",
  );
  assert.notEqual(
    notificationIcon,
    appJson.expo.android?.adaptiveIcon?.foregroundImage,
    "notification small icon must not reuse the adaptive launcher foreground",
  );

  const iconPath = path.resolve(mobileRoot, notificationIcon);
  const mobilePrefix = `${path.resolve(mobileRoot)}${path.sep}`;
  assert.ok(iconPath.startsWith(mobilePrefix), "notification icon must stay inside banco-mobile");
  assert.ok(existsSync(iconPath), `configured notification icon does not exist: ${notificationIcon}`);

  decodeWhiteAlphaPng(readFileSync(iconPath));
});
