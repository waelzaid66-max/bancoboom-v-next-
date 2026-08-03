import type { FeedItem } from "@workspace/api-client-react";
import {
  LEAFLET_CSS,
  LEAFLET_JS,
  MARKER_CLUSTER_CSS,
  MARKER_CLUSTER_DEFAULT_CSS,
  MARKER_CLUSTER_JS,
} from "./mapVendorInline";

/** A single price pin on the map. */
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Pre-formatted, already-localized price (FeedItem.price_display). */
  label: string;
  /** Furnished/daily rental → the pin gets a 📅 "bookable" prefix. */
  bookable?: boolean;
  /** API section (car / real_estate / industrial) — tints the pin with the
   *  section's identity color so every section's map wears its own world. */
  cat?: string;
}

/**
 * A server-clustered point for a viewport. `count > 1` renders a count bubble
 * (tap drills in); `count === 1` renders a single pin (tap selects the listing).
 * `label` is an optional, best-effort price the host attaches when the single
 * listing happens to be on the loaded page.
 */
export interface MapClusterMarker {
  lat: number;
  lng: number;
  count: number;
  listing_id: string | null;
  label?: string;
  /** Single-listing furnished/daily rental → 📅 "bookable" prefix on the pin. */
  bookable?: boolean;
  /** Section tint for single-listing pins (falls back to the app primary). */
  cat?: string;
}

/** Brand colors threaded into the Leaflet page so pins match the app theme. */
export interface MapTheme {
  primary: string;
  primaryForeground: string;
  card: string;
  foreground: string;
  border: string;
}

/** The visible bounding box + zoom the page reports back so the host can query. */
export interface MapViewportBounds {
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

/** Bridge message posted from the Leaflet page back to React Native / the web host. */
export type MapBridgeMessage =
  | { type: "ready" }
  | { type: "error" }
  | { type: "select"; id: string }
  | { type: "viewport"; bounds: MapViewportBounds; zoom: number }
  /** Locate-me failed (permission deny / timeout / unavailable) — host shows Alert. */
  | { type: "locate_error"; reason: "denied" | "unavailable" | "timeout" }
  /**
   * The buyer finished drawing a search area, or cleared it (`points: []`).
   *
   * Only the corners cross the bridge — the host re-derives the box and runs
   * the inside/outside test itself, in `lib/geoArea.ts`, where it is testable.
   * The page draws; it does not decide what counts.
   */
  | { type: "area"; points: { lat: number; lng: number }[] }
  /** Draw mode opened or closed, so the host can swap its own chrome. */
  | { type: "draw_mode"; active: boolean };

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * Project the feed onto map pins. Only items that carry valid coordinates are
 * mappable, so the map (and its honest "N on the map" caption) never overstates
 * how many results have a real location.
 */
export function feedItemsToMarkers(items: FeedItem[]): MapMarker[] {
  const out: MapMarker[] = [];
  for (const item of items) {
    const c = item.coordinates;
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      out.push({
        id: item.id,
        lat: c.lat,
        lng: c.lng,
        label: item.price_display,
        bookable: item.is_bookable === true,
        cat: item.category ?? undefined,
      });
    }
  }
  return out;
}

/**
 * Build a fully self-contained Leaflet + OpenStreetMap page. No API key and no
 * Google dependency — it works inside Expo Go's WebView (native) and in an
 * <iframe> (web).
 *
 * Two-layer design:
 *  - The embedded `markers` render instantly as price pills (the loaded page),
 *    so the map is never blank while the first viewport query is in flight.
 *  - `window.BANCO_MAP.setClusters(...)` replaces them with authoritative,
 *    viewport-wide clusters from GET /search/map. The page reports its bounds
 *    on load and after every pan/zoom via {type:"viewport"}, and the host injects
 *    fresh clusters back in — no page reload, so panning stays smooth.
 *
 * Tapping a count bubble drills in; tapping a single pin posts
 * {type:"select", id} so the host can reveal the listing card.
 */
export function buildMapHtml(
  markers: MapMarker[],
  theme: MapTheme,
  center?: { lat: number; lng: number; zoom: number },
  // "Near me" area: soft radius circle + centre dot (MAP-03 restore). Optional —
  // omitted callers render as before.
  near?: { lat: number; lng: number; radiusKm: number },
  /**
   * How much of the map's bottom edge is hidden behind native chrome, in px.
   *
   * The map fills its container, and on every mini-app that container runs
   * UNDERNEATH `MiniAppBottomNav` — an absolute bar at `insets.bottom + 8`.
   * Leaflet anchors bottom controls to the container, not to what a person can
   * actually see, so the locate button and the attribution were drawn beneath
   * that bar: half a button, and a copyright line nobody could read. Only the
   * native side knows the number, so the native side has to hand it down.
   *
   * Defaults to 0 — exactly the old behaviour for a caller with no chrome.
   */
  bottomInset?: number,
  /**
   * Titles for the draw controls, already translated by the host.
   *
   * The page has no access to the i18n tree, and hard-coding English inside it
   * would put four untranslatable strings into an app that ships Arabic first.
   * They arrive as accessible names on the buttons, so a screen reader in
   * either language reads them correctly.
   */
  labels?: { draw: string; done: string; undo: string; clear: string },
): string {
  const drawLabels = {
    draw: labels?.draw ?? "Draw area",
    done: labels?.done ?? "Done",
    undo: labels?.undo ?? "Undo",
    clear: labels?.clear ?? "Clear area",
  };
  // Clamped: a NaN or a negative from a caller would push controls off-screen
  // instead of clear of the bar, and the ceiling keeps a bad inset from
  // shoving them up into the middle of the map.
  const safeBottom = Math.max(0, Math.min(Number(bottomInset) || 0, 240));
  // JSON is safe inside a <script> except for a literal "</script>"; escaping
  // "<" to its unicode form neutralizes that without changing the parsed data.
  const json = JSON.stringify(markers).replace(/</g, "\\u003c");
  const lat = center?.lat ?? 26.8;
  const lng = center?.lng ?? 30.8;
  const zoom = center?.zoom ?? 6;
  const nearLat = Number(near?.lat);
  const nearLng = Number(near?.lng);
  const nearMeters = Math.round(Number(near?.radiusKm) * 1000);
  const nearScript =
    near && Number.isFinite(nearLat) && Number.isFinite(nearLng) && nearMeters > 0
      ? `
    L.circle([${nearLat}, ${nearLng}], {
      radius: ${nearMeters},
      color: "${theme.primary}",
      weight: 2,
      opacity: 0.9,
      fillColor: "${theme.primary}",
      fillOpacity: 0.08,
      interactive: false
    }).addTo(map);
    L.circleMarker([${nearLat}, ${nearLng}], {
      radius: 5,
      color: "#ffffff",
      weight: 2,
      fillColor: "${theme.primary}",
      fillOpacity: 1,
      interactive: false
    }).addTo(map);`
      : "";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<!-- MAP-07: Leaflet + MarkerCluster inlined (no unpkg/cdnjs). OSM tiles still network. -->
<style>${LEAFLET_CSS}</style>
<style>${MARKER_CLUSTER_CSS}</style>
<style>${MARKER_CLUSTER_DEFAULT_CSS}</style>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  body { background: ${theme.card}; }
  .leaflet-container {
    background: ${theme.card};
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  }
  .pin .pill {
    position: absolute;
    transform: translate(-50%, -50%);
    background: ${theme.primary};
    color: ${theme.primaryForeground};
    font-weight: 700;
    font-size: 12px;
    line-height: 1;
    padding: 6px 9px;
    border-radius: 16px;
    white-space: nowrap;
    border: 1.5px solid ${theme.primaryForeground};
    box-shadow: 0 1px 5px rgba(0,0,0,0.35);
    cursor: pointer;
  }
  /* Section hint ON the map — all pins stay in BANCO's red family (identity
     rule: logo red + derivatives; depth varies, the family never changes).
     Values mirror lib/sectionTheme SECTION_GRADIENT heads; keep in lockstep. */
  .pin .pill.car { background: #CC1E24; }
  .pin .pill.real_estate { background: #B81E3C; }
  .pin .pill.industrial { background: #B22E1F; }
  /* Bookable (furnished/daily) — emerald, a functional status (not identity),
     always wins over the section tint so a reservable stay reads instantly. */
  .pin .pill.book { background: #0E9F6E; }
  .cpin .cbubble {
    position: absolute;
    transform: translate(-50%, -50%);
    min-width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 7px;
    background: ${theme.primary};
    color: ${theme.primaryForeground};
    font-weight: 700;
    font-size: 13px;
    line-height: 1;
    border-radius: 999px;
    border: 2px solid ${theme.primaryForeground};
    box-shadow: 0 1px 6px rgba(0,0,0,0.4);
    cursor: pointer;
  }
  .cpin .sdot {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: ${theme.primary};
    border: 2.5px solid ${theme.primaryForeground};
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    cursor: pointer;
  }
  .marker-cluster-small div,
  .marker-cluster-medium div,
  .marker-cluster-large div {
    background: ${theme.primary};
    color: ${theme.primaryForeground};
    font-weight: 700;
  }
  .marker-cluster-small,
  .marker-cluster-medium,
  .marker-cluster-large { background: rgba(0,0,0,0.18); }
  /* Everything Leaflet anchors to the BOTTOM of the container gets lifted
     clear of the native bar that overlaps it. One rule, both controls, so a
     future bottom control inherits the clearance instead of rediscovering the
     bug. leaflet-bottom is Leaflet's own corner wrapper, which is why the rule
     sits on it rather than on each control. */
  .leaflet-bottom { margin-bottom: ${safeBottom}px; }
  /* The attribution is a legal notice, not decoration — OSM's licence requires
     it to be legible, so it moves with everything else rather than staying
     buried. Kept small and dimmed, never hidden. */
  .leaflet-control-attribution {
    font-size: 10px;
    opacity: 0.75;
    padding: 2px 6px;
    border-radius: 6px 0 0 0;
  }
  .locate-btn {
    /* 44px, not 40: this is a real touch target, and 44 is the floor both
       Apple and Android ask for. It was under it. */
    width: 44px; height: 44px; background: ${theme.card};
    border: 1px solid ${theme.border}; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 5px rgba(0,0,0,0.35); cursor: pointer; margin-bottom: 8px;
  }
  /* Draw-area controls. Same 44px floor, same card surface as locate, so the
     map's controls read as one set rather than two designs sharing a screen. */
  .map-btns { display: flex; flex-direction: column; gap: 8px; }
  .map-btn {
    width: 44px; height: 44px; background: ${theme.card};
    border: 1px solid ${theme.border}; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 5px rgba(0,0,0,0.35); cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .map-btn svg { width: 20px; height: 20px; stroke: ${theme.foreground}; fill: none; }
  .map-btn-go { background: ${theme.primary}; border-color: ${theme.primary}; }
  .map-btn-go svg { stroke: ${theme.primaryForeground}; }
  /* Not enough corners yet. Dimmed rather than removed, so the control the
     buyer is working towards stays where they last saw it. */
  .map-btn-go.is-off { opacity: 0.45; }
  .map-btn-clear svg { stroke: ${theme.primary}; }
  /* A dropped corner. Small, high contrast, and pointer-events off so tapping
     one lands on the map underneath and adds the NEXT corner rather than
     doing nothing — the failure that makes hand-rolled drawing feel broken. */
  .draw-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: ${theme.primary}; border: 2px solid ${theme.primaryForeground};
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  /* Crosshair while drawing, so it is obvious the next tap places a corner
     rather than dismissing something. */
  .leaflet-container.drawing { cursor: crosshair; }
  .locate-btn svg { width: 20px; height: 20px; stroke: ${theme.primary}; }
  .me-dot {
    width: 16px; height: 16px; background: #2F80ED; border: 3px solid #fff;
    border-radius: 50%; box-shadow: 0 0 0 6px rgba(47,128,237,0.25);
    transform: translate(-50%, -50%);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>${MARKER_CLUSTER_JS}</script>
<script>
  (function () {
    var DATA = ${json};
    function post(msg) {
      try {
        var s = JSON.stringify(msg);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(s);
        } else if (window.parent) {
          window.parent.postMessage(s, "*");
        }
      } catch (e) {}
    }
    function esc(t) {
      return String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
    if (!window.L) { post({ type: "error" }); return; }
    var map = L.map("map", { zoomControl: false, attributionControl: true })
      .setView([${lat}, ${lng}], ${zoom});
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("${OSM_TILES}", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
${nearScript}
    // "Locate me" control — centres the map on the device GPS and drops a
    // you-are-here dot (fcd7d1c; wiped by 93b650b; restored surgically).
    var meMarker = null;
    var LocateControl = L.Control.extend({
      options: { position: "bottomright" },
      onAdd: function () {
        var b = L.DomUtil.create("div", "locate-btn");
        b.setAttribute("title", "My location");
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-width="2"><circle cx="12" cy="12" r="7"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg>';
        L.DomEvent.disableClickPropagation(b);
        b.onclick = function () {
          if (!navigator.geolocation) {
            post({ type: "locate_error", reason: "unavailable" });
            return;
          }
          navigator.geolocation.getCurrentPosition(function (p) {
            var ll = [p.coords.latitude, p.coords.longitude];
            map.setView(ll, 14);
            if (meMarker) { map.removeLayer(meMarker); }
            meMarker = L.marker(ll, {
              icon: L.divIcon({ className: "", html: '<div class="me-dot"></div>', iconSize: [16, 16] })
            }).addTo(map);
          }, function (err) {
            // N2: never fail silently on Android/iOS WebView permission deny/timeout.
            var reason = "unavailable";
            if (err && err.code === 1) reason = "denied";
            else if (err && err.code === 3) reason = "timeout";
            post({ type: "locate_error", reason: reason });
          }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 });
        };
        return b;
      }
    });
    map.addControl(new LocateControl());

    // ── Draw a search area ────────────────────────────────────────────────
    //
    // Hand-rolled on Leaflet primitives rather than pulling in Leaflet.draw.
    // The libraries here are VENDORED into assets/map-vendor because CDNs are
    // blocked, so every dependency is a file somebody has to keep in sync —
    // and this needs a polygon, a click handler and an undo. That is smaller
    // than the wiring it would take to vendor a plugin for it.
    //
    // Tap to drop a corner, tap "done" to close the shape. Deliberately taps
    // and not a freehand drag: a drag is how the map is PANNED, and stealing
    // that gesture is how a map stops feeling like a map.
    //
    // The page draws and reports. It does not decide what is inside — the host
    // does that in lib/geoArea.ts, where the maths is testable.
    var drawing = false;
    var drawPts = [];
    var drawLine = null;
    var drawShape = null;
    var drawDots = [];
    var committedArea = null;

    function clearDrawScratch() {
      if (drawLine) { map.removeLayer(drawLine); drawLine = null; }
      for (var i = 0; i < drawDots.length; i++) { map.removeLayer(drawDots[i]); }
      drawDots = [];
      drawPts = [];
    }

    function clearArea() {
      clearDrawScratch();
      if (drawShape) { map.removeLayer(drawShape); drawShape = null; }
      committedArea = null;
      post({ type: "area", points: [] });
    }

    function redrawScratch() {
      if (drawLine) { map.removeLayer(drawLine); drawLine = null; }
      if (drawPts.length > 1) {
        drawLine = L.polyline(drawPts, {
          color: ${JSON.stringify(theme.primary)},
          weight: 3,
          dashArray: "6 5",
        }).addTo(map);
      }
    }

    function addDrawPoint(latlng) {
      drawPts.push([latlng.lat, latlng.lng]);
      var dot = L.marker(latlng, {
        icon: L.divIcon({ className: "", html: '<div class="draw-dot"></div>', iconSize: [12, 12] }),
        keyboard: false,
      }).addTo(map);
      drawDots.push(dot);
      redrawScratch();
      syncDrawUi();
    }

    function commitArea() {
      // Under three corners encloses nothing. The host refuses it too — this
      // just avoids sending a shape we already know is not one.
      if (drawPts.length < 3) return;
      var pts = drawPts.slice();
      clearDrawScratch();
      if (drawShape) { map.removeLayer(drawShape); }
      drawShape = L.polygon(pts, {
        color: ${JSON.stringify(theme.primary)},
        weight: 2,
        fillColor: ${JSON.stringify(theme.primary)},
        fillOpacity: 0.12,
      }).addTo(map);
      committedArea = pts.map(function (p) { return { lat: p[0], lng: p[1] }; });
      setDrawing(false);
      // The host filters and re-injects. The page never decides what is
      // inside — one implementation of that maths, in a file with tests.
      post({ type: "area", points: committedArea });
    }

    function setDrawing(on) {
      drawing = !!on;
      if (!drawing) { clearDrawScratch(); }
      // Dragging stays ON while drawing so the buyer can still reach the rest
      // of the city mid-shape; corners are taps, so the two never collide.
      L.DomUtil[drawing ? "addClass" : "removeClass"](map.getContainer(), "drawing");
      post({ type: "draw_mode", active: drawing });
      syncDrawUi();
    }

    map.on("click", function (e) {
      if (drawing) { addDrawPoint(e.latlng); }
    });

    // The draw controls live TOP-left, opposite the zoom pair and clear of the
    // bottom bar entirely — the one corner nothing else competes for.
    var drawBtn = null, doneBtn = null, undoBtn = null, clearBtn = null;
    function syncDrawUi() {
      if (!drawBtn) return;
      drawBtn.style.display = drawing ? "none" : "flex";
      doneBtn.style.display = drawing ? "flex" : "none";
      undoBtn.style.display = drawing && drawPts.length > 0 ? "flex" : "none";
      clearBtn.style.display = !drawing && drawShape ? "flex" : "none";
      // "Done" only becomes real at three corners. Disabled rather than hidden
      // so the buyer can see the target they are working towards.
      doneBtn.className = "map-btn map-btn-go" + (drawPts.length < 3 ? " is-off" : "");
      doneBtn.setAttribute("aria-disabled", drawPts.length < 3 ? "true" : "false");
    }
    var DrawControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        var wrap = L.DomUtil.create("div", "map-btns");
        function mk(cls, title, svg, onTap) {
          var b = L.DomUtil.create("div", cls, wrap);
          b.setAttribute("title", title);
          b.setAttribute("role", "button");
          b.innerHTML = svg;
          L.DomEvent.disableClickPropagation(b);
          b.onclick = onTap;
          return b;
        }
        // Every icon is inline SVG — no icon font anywhere near this page, so
        // nothing can fall back to a missing glyph on an Android WebView.
        var PEN = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M7 16l9.5-9.5a2.1 2.1 0 1 1 3 3L10 19H7z"/></svg>';
        var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
        var UNDO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12H8"/></svg>';
        var CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        drawBtn = mk("map-btn", ${JSON.stringify(drawLabels.draw)}, PEN, function () { setDrawing(true); });
        doneBtn = mk("map-btn map-btn-go", ${JSON.stringify(drawLabels.done)}, CHECK, function () { commitArea(); });
        undoBtn = mk("map-btn", ${JSON.stringify(drawLabels.undo)}, UNDO, function () {
          if (!drawPts.length) return;
          drawPts.pop();
          var d = drawDots.pop();
          if (d) map.removeLayer(d);
          redrawScratch();
          syncDrawUi();
        });
        clearBtn = mk("map-btn map-btn-clear", ${JSON.stringify(drawLabels.clear)}, CROSS, function () { clearArea(); });
        syncDrawUi();
        return wrap;
      }
    });
    map.addControl(new DrawControl());

    // Layer 1 — the loaded page, shown instantly so the map is never blank.
    var group = L.markerClusterGroup
      ? L.markerClusterGroup({ maxClusterRadius: 48, showCoverageOnHover: false, spiderfyOnMaxZoom: true })
      : L.layerGroup();
    var pts = [];
    // Section class is allow-listed (server enum values only) so a stray value
    // can never inject markup or an unexpected CSS class.
    function pillClass(cat, bookable) {
      var cls = "pill";
      if (typeof cat === "string" && /^[a-z_]+$/.test(cat)) cls += " " + cat;
      if (bookable) cls += " book";
      return cls;
    }
    DATA.forEach(function (d) {
      if (typeof d.lat !== "number" || typeof d.lng !== "number") return;
      var icon = L.divIcon({
        className: "pin",
        html: '<div class="' + pillClass(d.cat, d.bookable) + '">' + (d.bookable ? "📅 " : "") + esc(d.label) + "</div>",
        iconSize: [0, 0]
      });
      var m = L.marker([d.lat, d.lng], { icon: icon });
      m.on("click", (function (id) {
        return function () { post({ type: "select", id: id }); };
      })(d.id));
      group.addLayer(m);
      pts.push([d.lat, d.lng]);
    });
    map.addLayer(group);

    // Layer 2 — authoritative, viewport-wide server clusters. Once the host
    // injects the first response the loaded-page layer is removed so counts and
    // pins reflect the WHOLE visible area, not just the current result page.
    var serverLayer = L.layerGroup();
    var initialShown = true;
    window.BANCO_MAP = {
      setClusters: function (clusters) {
        if (initialShown) { map.removeLayer(group); initialShown = false; }
        serverLayer.clearLayers();
        if (!map.hasLayer(serverLayer)) map.addLayer(serverLayer);
        (clusters || []).forEach(function (c) {
          if (typeof c.lat !== "number" || typeof c.lng !== "number") return;
          var marker;
          if (c.count > 1) {
            marker = L.marker([c.lat, c.lng], {
              icon: L.divIcon({
                className: "cpin",
                html: '<div class="cbubble">' + (c.count > 99 ? "99+" : c.count) + "</div>",
                iconSize: [0, 0]
              })
            });
            (function (lat, lng) {
              marker.on("click", function () {
                map.setView([lat, lng], Math.min(map.getZoom() + 2, 16));
              });
            })(c.lat, c.lng);
          } else {
            var inner = c.label
              ? '<div class="' + pillClass(c.cat, c.bookable) + '">' + (c.bookable ? "📅 " : "") + esc(c.label) + "</div>"
              : '<div class="sdot"></div>';
            marker = L.marker([c.lat, c.lng], {
              icon: L.divIcon({
                className: c.label ? "pin" : "cpin",
                html: inner,
                iconSize: [0, 0]
              })
            });
            (function (id) {
              marker.on("click", function () { if (id) post({ type: "select", id: id }); });
            })(c.listing_id);
          }
          serverLayer.addLayer(marker);
        });
      }
    };

    // Report the visible bounds so the host can query /search/map for it.
    var vpTimer = null;
    function postViewport() {
      var b = map.getBounds();
      post({
        type: "viewport",
        bounds: {
          min_lat: b.getSouth(),
          max_lat: b.getNorth(),
          min_lng: b.getWest(),
          max_lng: b.getEast()
        },
        zoom: map.getZoom()
      });
    }
    map.on("moveend", function () {
      if (vpTimer) clearTimeout(vpTimer);
      vpTimer = setTimeout(postViewport, 300);
    });

    // Frame the loaded page, then hand off to server clustering for the viewport.
    if (pts.length === 1) {
      map.setView(pts[0], 13);
    } else if (pts.length > 1) {
      map.fitBounds(pts, { padding: [48, 48], maxZoom: 15 });
    }
    post({ type: "ready" });
    postViewport();
  })();
</script>
</body>
</html>`;
}
