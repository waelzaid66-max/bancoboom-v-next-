import { buildMapHtml as buildBaseMapHtml } from "./mapHtml";
import type { MapBridgeMessage as BaseMapBridgeMessage } from "./mapHtml";

export type {
  MapClusterMarker,
  MapMarker,
  MapTheme,
  MapViewportBounds,
} from "./mapHtml";

export type MapBridgeMessage = BaseMapBridgeMessage | { type: "tile_error" };

const TILE_FAILURE_GUARD = `<script>
(function () {
  var sent = false;
  function postTileFailure() {
    if (sent) return;
    sent = true;
    try {
      var payload = JSON.stringify({ type: "tile_error" });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(payload);
      } else if (window.parent) {
        window.parent.postMessage(payload, "*");
      }
    } catch (e) {}
  }
  window.addEventListener("error", function (event) {
    var target = event && event.target;
    if (!target || target.tagName !== "IMG") return;
    var src = typeof target.src === "string" ? target.src : "";
    if (src.indexOf("tile.openstreetmap.org") === -1) return;
    postTileFailure();
  }, true);
})();
</script>`;

/**
 * Preserve the canonical map generator byte-for-byte and add only a bounded,
 * host-visible failure signal for OpenStreetMap image-tile resource failures.
 *
 * The listener is injected into <head>, before Leaflet creates tile images, so
 * initial-load failures cannot race past the guard. It emits once per document
 * and does not change provider, clustering, viewport, drawing or selection logic.
 */
export function buildMapHtml(
  ...args: Parameters<typeof buildBaseMapHtml>
): string {
  const html = buildBaseMapHtml(...args);
  if (!html.includes("</head>")) return html;
  return html.replace("</head>", `${TILE_FAILURE_GUARD}\n</head>`);
}
