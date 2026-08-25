// Create-listing pin picker — Leaflet in a WebView (same stack as browse maps).
// Seller pans the map; the pin stays at the center. Confirm writes lat/lng into
// the same `pin` state GPS already uses. Never required to publish.
import { Feather } from "@/components/icons";
import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { sectionAccent, sectionAccentAlpha } from "@/lib/sectionTheme";
import { marketCountryMapCenter } from "@/lib/searchTaxonomy";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { LEAFLET_CSS, LEAFLET_JS } from "@/components/search/mapVendorInline";

type Pin = { lat: number; lng: number };
type MapPinBootstrapState = "loading" | "ready" | "failed";

type BridgeMsg =
  | { type: "ready" }
  | { type: "center"; lat: number; lng: number }
  | { type: "error" };

/**
 * The crosshair is the one mark the user aims with, so it is identity, not
 * chrome. `components/search/mapHtml.ts` moved every map pin onto the section
 * tokens ("keep in lockstep", it says) — this picker was missed and kept
 * Material's `#E53935`, which is ΔE ≈ 19 from the logo red. Being inside a
 * WebView HTML string is exactly why: no audit that greps `.tsx` colour props
 * reads the inside of a template literal.
 */
const ACCENT = sectionAccent("car");
const CROSSHAIR = ACCENT;
const CROSSHAIR_FILL = sectionAccentAlpha("car", 0.2);

function buildPinPickerHtml(center: Pin & { zoom: number }): string {
  const { lat, lng, zoom } = center;
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<!-- MAP-07: Leaflet inlined (no unpkg). -->
<style>${LEAFLET_CSS}</style>
<style>
  html,body,#map{margin:0;height:100%;background:#0b0b0b}
  .crosshair{
    position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-44px 0 0 -22px;
    z-index:1000;pointer-events:none;
  }
  .crosshair svg{width:44px;height:44px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))}
  .hint{
    position:absolute;left:12px;right:12px;bottom:16px;z-index:1000;pointer-events:none;
    text-align:center;color:#fff;font:600 12px/1.3 -apple-system,sans-serif;
    background:rgba(0,0,0,.55);padding:8px 10px;border-radius:10px
  }
</style>
</head><body>
<div id="map"></div>
<div class="crosshair" aria-hidden="true">
  <svg viewBox="0 0 44 44" fill="none">
    <path d="M22 4v10M22 30v10M4 22h10M30 22h10" stroke="${CROSSHAIR}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="22" cy="22" r="7" stroke="${CROSSHAIR}" stroke-width="2.5" fill="${CROSSHAIR_FILL}"/>
  </svg>
</div>
<div class="hint" id="hint"></div>
<script>${LEAFLET_JS}</script>
<script>
  function post(msg){
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  try {
    if(!window.L){ post({type:"error"}); }
    else {
      var map = L.map("map",{zoomControl:true,attributionControl:true})
        .setView([${lat},${lng}],${zoom});
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        maxZoom:19,attribution:"&copy; OpenStreetMap"
      }).addTo(map);
      function emit(){
        var c = map.getCenter();
        post({type:"center",lat:c.lat,lng:c.lng});
      }
      map.on("moveend", emit);
      map.whenReady(function(){ post({type:"ready"}); emit(); });
    }
  } catch(e){ post({type:"error"}); }
</script>
</body></html>`;
}

export function MapPinPicker({
  visible,
  marketCountry,
  initial,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  marketCountry: string;
  initial?: Pin | null;
  onClose: () => void;
  onConfirm: (pin: Pin) => void;
}) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const rowDir = isRTL ? "row-reverse" : "row";
  const [center, setCenter] = useState<Pin | null>(initial ?? null);
  const [bootstrapState, setBootstrapState] =
    useState<MapPinBootstrapState>("loading");

  const framing = useMemo(() => {
    if (initial) return { ...initial, zoom: 15 };
    const m = marketCountryMapCenter(marketCountry);
    return { lat: m.lat, lng: m.lng, zoom: Math.max(m.zoom, 11) };
  }, [initial, marketCountry]);

  const html = useMemo(() => buildPinPickerHtml(framing), [framing]);

  useEffect(() => {
    if (!visible) return;
    setBootstrapState("loading");
    setCenter(initial ?? null);
  }, [visible, initial, marketCountry]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as BridgeMsg;
      if (msg.type === "ready") {
        setBootstrapState((current) =>
          current === "failed" ? current : "ready",
        );
      }
      if (msg.type === "error") setBootstrapState("failed");
      if (msg.type === "center") setCenter({ lat: msg.lat, lng: msg.lng });
    } catch {
      /* ignore malformed */
    }
  };

  const canConfirm = bootstrapState === "ready" && center !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={[styles.header, { flexDirection: rowDir }]}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.headerBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <AppText style={[styles.headerTitle, { color: colors.foreground }]}>
              {t("create.pickOnMapTitle")}
            </AppText>
            <View style={styles.headerBtn} />
          </View>

          <AppText
            style={[
              styles.hint,
              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("create.pickOnMapHint")}
          </AppText>

          <View style={styles.mapWrap}>
            {bootstrapState === "loading" ? (
              <View style={styles.loading}>
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : null}
            {bootstrapState === "failed" ? (
              <View style={[styles.failure, { backgroundColor: colors.background }]}> 
                <AppText style={[styles.failureTitle, { color: colors.foreground }]}>
                  {t("search.mapUnavailableTitle")}
                </AppText>
                <AppText
                  style={[
                    styles.failureBody,
                    {
                      color: colors.mutedForeground,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t("search.mapUnavailableBody")}
                </AppText>
              </View>
            ) : null}
            {visible ? (
              <WebView
                key={`${framing.lat}:${framing.lng}:${framing.zoom}:${visible}`}
                originWhitelist={["*"]}
                source={{ html }}
                onMessage={onMessage}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                mixedContentMode="compatibility"
              />
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              if (!canConfirm || !center) return;
              onConfirm(center);
            }}
            disabled={!canConfirm}
            style={[
              styles.confirm,
              {
                backgroundColor: canConfirm ? ACCENT : colors.secondary,
                opacity: canConfirm ? 1 : 0.5,
              },
            ]}
            testID="create-map-pin-confirm"
          >
            <AppText style={styles.confirmText}>
              {t("create.pickOnMapConfirm")}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "88%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerBtn: { width: 40, alignItems: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  webview: { flex: 1, backgroundColor: "transparent" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  failure: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
  },
  failureTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  failureBody: {
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 19,
  },
  confirm: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
  },
});
