import { FeedItem, getMapClusters } from "@workspace/api-client-react";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { AppText } from "@/components/AppText";
import { apiCategoryFor } from "@/components/CategoryTabs";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { miniAppNavClearance } from "@/components/MiniAppBottomNav";
import {
  areaBounds,
  areaCount,
  filterByArea,
  isUsableArea,
  type GeoArea,
} from "@/lib/geoArea";
import {
  buildMapClusterParams,
  type MapViewport,
  type SearchCriteria,
} from "@/lib/searchParams";
import { marketCountryMapCenter } from "@/lib/searchTaxonomy";
import {
  buildMapHtml,
  feedItemsToMarkers,
  type MapBridgeMessage,
  type MapClusterMarker,
} from "./mapHtml";
import { MapOverlayChrome, type MapPreviewCardProps } from "./MapOverlayChrome";

const CLUSTER_DEBOUNCE_MS = 300;
const CLUSTER_CACHE_MAX = 24;

export type MapBootstrapState = "loading" | "ready" | "failed";

function clusterCacheKey(criteriaSig: string, viewport: MapViewport): string {
  return `${criteriaSig}:${viewport.max_lat.toFixed(3)}:${viewport.min_lat.toFixed(3)}:${viewport.max_lng.toFixed(3)}:${viewport.min_lng.toFixed(3)}:${viewport.zoom}`;
}

export interface SearchResultsMapProps {
  /** The loaded result page (callers filter to items with coordinates). */
  items: FeedItem[];
  /** Committed search criteria — the map queries the SAME filter set as the list. */
  criteria: SearchCriteria;
  onOpenListing: (item: FeedItem) => void;
  /** Open a listing that isn't on the loaded page (an off-page single pin). */
  onOpenListingId?: (id: string) => void;
  onSave?: (item: FeedItem) => void;
  isSaved: (id: string) => boolean;
  /** Map pin preview card; Stay passes StayCard so overlay matches the list. */
  CardComponent?: React.ComponentType<MapPreviewCardProps>;
}

/**
 * Native map surface: a self-contained Leaflet/OpenStreetMap page rendered in a
 * WebView (Expo Go friendly, no native map module, no API key). The loaded page
 * renders instantly as price pins; then the map reports its viewport and we query
 * GET /search/map for authoritative, viewport-wide clusters (respecting the exact
 * search filters) and inject them back in — no reload, so panning stays smooth.
 * Tapping a single pin selects it; MapOverlayChrome shows the listing preview.
 */
export function SearchResultsMap({
  items,
  criteria,
  onOpenListing,
  onOpenListingId,
  onSave,
  isSaved,
  CardComponent,
}: SearchResultsMapProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // The bar overlaps the map rather than displacing it, so the map's own
  // bottom-anchored controls have to be told to step around it.
  const navClearance = miniAppNavClearance(insets.bottom);
  const { t, isRTL } = useI18n();
  const webRef = useRef<WebView>(null);
  const tileFailureShownRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bootstrapState, setBootstrapState] = useState<MapBootstrapState>("loading");
  // Total in the visible viewport per the last server response (honest count);
  // null until the first response, when we fall back to the loaded-page count.
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  /**
   * The drawn search area, or null.
   *
   * Held as a ref as well as state: `fetchClusters` is rebuilt from criteria
   * and would otherwise close over a stale area, quietly filtering the next
   * response against the shape the buyer just cleared.
   */
  const [area, setArea] = useState<GeoArea | null>(null);
  const areaRef = useRef<GeoArea | null>(null);
  const [areaTotal, setAreaTotal] = useState<{ total: number; exact: boolean } | null>(
    null,
  );

  const markers = useMemo(() => feedItemsToMarkers(items), [items]);
  const sig = useMemo(
    () => markers.map((m) => `${m.id}:${m.lat}:${m.lng}:${m.label}`).join("|"),
    [markers],
  );
  // Value signature of the committed filters, so a filter change is detectable
  // even when the object identity churns on every parent render.
  const criteriaSig = useMemo(() => JSON.stringify(criteria), [criteria]);
  const html = useMemo(
    () =>
      buildMapHtml(
        markers,
        {
          primary: colors.primary,
          primaryForeground: colors.primaryForeground,
          card: colors.card,
          foreground: colors.foreground,
          border: colors.border,
        },
        marketCountryMapCenter(criteria.marketCountry),
        criteria.nearMeEnabled &&
          criteria.nearLat != null &&
          criteria.nearLng != null
          ? {
              lat: criteria.nearLat,
              lng: criteria.nearLng,
              radiusKm: criteria.nearRadiusKm,
            }
          : undefined,
        navClearance,
        {
          draw: t("search.mapDrawArea"),
          done: t("search.mapDrawDone"),
          undo: t("search.mapDrawUndo"),
          clear: t("search.mapDrawClear"),
        },
      ),
    // Rebuild when plotted set, theme, market country, near-me area — or the
    // bottom clearance — changes. The clearance moves when the safe-area inset
    // does (rotation, a foldable unfolding), and a stale one puts the locate
    // button back under the bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sig,
      navClearance,
      // A language switch changes the button titles, so the page is rebuilt.
      isRTL,
      colors.primary,
      colors.primaryForeground,
      colors.card,
      colors.foreground,
      colors.border,
      criteria.marketCountry,
      criteria.nearMeEnabled,
      criteria.nearLat,
      criteria.nearLng,
      criteria.nearRadiusKm,
    ],
  );

  // Every generated document owns a unique bridge authority token. The token is
  // deliberately not derived from the HTML string alone: A -> B -> A must still
  // reject a delayed callback from the first A document.
  const sourceEpoch = useMemo(() => Symbol("map-source-epoch"), [html, sig]);
  const activeSourceEpochRef = useRef(sourceEpoch);

  // Latest items, read inside the message handler without re-subscribing.
  const itemsRef = useRef<FeedItem[]>(items);
  itemsRef.current = items;
  // Monotonic guard: a slow cluster response can never overwrite a newer viewport.
  const vpSeqRef = useRef(0);
  // The last viewport the map reported, so a pure criteria change (same mapped
  // set → no WebView reload) can re-query clusters for the current view.
  const lastViewportRef = useRef<MapViewport | null>(null);
  // Previous mapped-set signature, to tell a pure filter change (map not reloaded)
  // apart from a result change (WebView re-keyed, which re-posts its viewport).
  const prevSigRef = useRef(sig);
  const clusterCacheRef = useRef(
    new Map<string, { clusters: MapClusterMarker[]; total: number }>(),
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    },
    [],
  );

  // The generated page can change even when the marker `sig` does not (theme,
  // market, near-me, language, safe-area clearance). Rotate all page-specific
  // authority without keying/remounting the WebView on the raw HTML payload.
  useLayoutEffect(() => {
    activeSourceEpochRef.current = sourceEpoch;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    lastViewportRef.current = null;
    tileFailureShownRef.current = false;
    // The cluster cache is keyed on (criteriaSig, viewport) and carries no
    // source identity, so an entry computed for the PREVIOUS marker set is a
    // cache hit for the new one at the same viewport. The publish guard cannot
    // catch that: it compares the epoch of the CALLER, and after a rotation the
    // caller is the current epoch — it is the DATA that is stale.
    //
    // Every other page-specific authority is rotated here; this was the one that
    // was not.
    clusterCacheRef.current.clear();
    setBootstrapState("loading");
    setSelectedId(null);
    setServerTotal(null);
    vpSeqRef.current++;
  }, [sourceEpoch]);

  /**
   * The ONE place clusters reach the map.
   *
   * Both the cached and the freshly-fetched paths come through here, so the
   * area clip cannot be applied on one and forgotten on the other — which is
   * exactly the shape of bug that survives review and then shows up as "the
   * filter works until you pan back".
   *
   * The server narrowed to the shape's BOX because a box is all
   * `GET /v1/search/map` understands. The precise inside/outside test is this
   * line, against `lib/geoArea.ts`, where the maths has tests.
   */
  const publish = useCallback(
    (
      epoch: symbol,
      clusters: MapClusterMarker[],
      total: number,
    ) => {
      if (activeSourceEpochRef.current !== epoch) return;
      const shape = areaRef.current;
      const shown = filterByArea(clusters, shape);
      setServerTotal(total);
      setAreaTotal(shape ? areaCount(clusters, shape) : null);
      webRef.current?.injectJavaScript(
        `window.BANCO_MAP && window.BANCO_MAP.setClusters(${JSON.stringify(
          shown,
        )}); true;`,
      );
    },
    [],
  );

  const fetchClusters = useCallback(
    async (viewport: MapViewport) => {
      if (activeSourceEpochRef.current !== sourceEpoch) return;
      const seq = ++vpSeqRef.current;
      const cacheKey = clusterCacheKey(criteriaSig, viewport);
      const cached = clusterCacheRef.current.get(cacheKey);
      if (cached) {
        publish(sourceEpoch, cached.clusters, cached.total);
        return;
      }

      try {
        const res = await getMapClusters(buildMapClusterParams(criteria, viewport));
        if (
          activeSourceEpochRef.current !== sourceEpoch ||
          seq !== vpSeqRef.current
        ) return;
        const clusters = res.data ?? [];
        const priceById = new Map(
          itemsRef.current.map((i) => [i.id, i.price_display]),
        );
        const bookableById = new Set(
          itemsRef.current.filter((i) => i.is_bookable === true).map((i) => i.id),
        );
        // Section tint for single pins: exact category when the listing is on
        // the loaded page, else the browse section itself (a section mini-app
        // only ever maps its own world; "all" search falls back to primary).
        const catById = new Map(
          itemsRef.current.map((i) => [i.id, i.category ?? undefined]),
        );
        const defaultCat = apiCategoryFor(criteria.category) ?? undefined;
        const enriched: MapClusterMarker[] = clusters.map((c) => ({
          lat: c.lat,
          lng: c.lng,
          count: c.count,
          listing_id: c.listing_id,
          label:
            c.count === 1 && c.listing_id
              ? c.price_display ?? priceById.get(c.listing_id)
              : undefined,
          bookable:
            c.count === 1 && c.listing_id
              ? c.is_bookable === true || bookableById.has(c.listing_id)
              : false,
          cat:
            c.count === 1
              ? (c.category ??
                  (c.listing_id ? catById.get(c.listing_id) : undefined) ??
                  defaultCat)
              : undefined,
        }));
        const total = clusters.reduce((sum, c) => sum + c.count, 0);
        const cache = clusterCacheRef.current;
        // Cached UNFILTERED. The area is a view over the same server answer, so
        // clearing or redrawing a shape must not force a network round trip
        // for data already in hand.
        cache.set(cacheKey, { clusters: enriched, total });
        if (cache.size > CLUSTER_CACHE_MAX) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
        publish(sourceEpoch, enriched, total);
      } catch {
        // Leave the current markers in place; the map degrades to the loaded page.
      }
    },
    [criteria, criteriaSig, publish, sourceEpoch],
  );

  const scheduleFetchClusters = useCallback(
    (viewport: MapViewport) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void fetchClusters(viewport);
      }, CLUSTER_DEBOUNCE_MS);
    },
    [fetchClusters],
  );

  // A pure filter change (values differ but the mapped set is byte-identical, so
  // the sig-keyed WebView is NOT reloaded) must still refresh clusters/count. When
  // the mapped set also changed, the reload re-posts the viewport on ready, so we
  // skip here to avoid a duplicate /search/map request.
  useEffect(() => {
    const sigChanged = prevSigRef.current !== sig;
    prevSigRef.current = sig;
    if (sigChanged) return;
    // The new request is intentionally debounced, but the old criteria's
    // already-running request must stop being publishable immediately.
    vpSeqRef.current++;
    if (lastViewportRef.current) {
      setServerTotal(null);
      clusterCacheRef.current.clear();
      const shape = areaRef.current;
      if (shape) {
        const b = areaBounds(shape);
        scheduleFetchClusters({
          min_lat: b.south,
          max_lat: b.north,
          min_lng: b.west,
          max_lng: b.east,
          zoom: lastViewportRef.current.zoom,
        });
      } else {
        scheduleFetchClusters(lastViewportRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, criteriaSig]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      // React Native can deliver an already-queued callback after `source` has
      // changed. Reject the superseded document before parsing or any side effect.
      if (activeSourceEpochRef.current !== sourceEpoch) return;

      try {
        const msg = JSON.parse(event.nativeEvent.data) as MapBridgeMessage;
        if (msg.type === "ready") {
          setBootstrapState((current) => (current === "failed" ? current : "ready"));
        } else if (msg.type === "error") {
          // Leaflet/bootstrap failure is terminal for this WebView instance.
          // Fail closed: do not expose overlay controls over a dead/grey map.
          setBootstrapState("failed");
        } else if (msg.type === "tile_error") {
          // A tile failure only degrades a map that already completed bootstrap.
          // It cannot establish readiness by itself or revive a failed instance.
          if (!tileFailureShownRef.current) {
            tileFailureShownRef.current = true;
            Alert.alert(
              t("search.mapUnavailableTitle"),
              t("search.mapUnavailableBody"),
            );
          }
        } else if (msg.type === "locate_error") {
          // Same honesty as FilterSheet near-me — never leave Android/iOS users
          // with a dead locate button after permission deny/timeout.
          Alert.alert(
            t("search.locateFailedTitle"),
            msg.reason === "denied"
              ? t("search.locateDeniedBody")
              : t("search.locateFailedBody"),
            [
              { text: t("common.cancel"), style: "cancel" },
              ...(msg.reason === "denied"
                ? [
                    {
                      text: t("profile.photoPermissionSettings"),
                      onPress: () => {
                        void Linking.openSettings();
                      },
                    },
                  ]
                : []),
            ],
          );
        } else if (msg.type === "viewport") {
          const vp = { ...msg.bounds, zoom: msg.zoom };
          lastViewportRef.current = vp;
          scheduleFetchClusters(vp);
        } else if (msg.type === "area") {
          // An unusable shape — under three corners, or three taps in one spot
          // — clears rather than filters. A stray tap must never blank the map.
          const next = isUsableArea(msg.points) ? (msg.points as GeoArea) : null;
          areaRef.current = next;
          setArea(next);
          if (next) {
            // Ask the server for the shape's BOX, which is what it supports,
            // and let `publish` clip the answer down to the shape itself. The
            // zoom carries over: the buyer drew at the zoom they meant.
            const b = areaBounds(next);
            const vp = {
              min_lat: b.south,
              max_lat: b.north,
              min_lng: b.west,
              max_lng: b.east,
              zoom: lastViewportRef.current?.zoom ?? 10,
            };
            void fetchClusters(vp);
          } else {
            setAreaTotal(null);
            // Back to the visible viewport, unclipped.
            if (lastViewportRef.current) void fetchClusters(lastViewportRef.current);
          }
        } else if (msg.type === "draw_mode") {
          // Nothing to do yet — the page owns its own control states. Handled
          // explicitly so the message is not silently swallowed by the catch.
        } else if (msg.type === "select" && typeof msg.id === "string") {
          const hit = itemsRef.current.find((i) => i.id === msg.id);
          if (hit) setSelectedId(msg.id);
          else onOpenListingId?.(msg.id);
        }
      } catch {
        // Ignore malformed bridge messages.
      }
    },
    [sourceEpoch, scheduleFetchClusters, onOpenListingId, t],
  );

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}>
      <WebView
        ref={webRef}
        key={sig}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        androidLayerType="hardware"
        style={styles.web}
      />

      {bootstrapState === "loading" ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {bootstrapState === "failed" ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.failure,
            { backgroundColor: colors.card },
          ]}
          testID="search-map-bootstrap-failed"
          accessibilityRole="alert"
        >
          <AppText style={[styles.failureTitle, { color: colors.foreground }]}>
            {t("search.mapUnavailableTitle")}
          </AppText>
          <AppText
            style={[
              styles.failureBody,
              { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("search.mapUnavailableBody")}
          </AppText>
        </View>
      ) : null}

      {bootstrapState === "ready" ? (
        <MapOverlayChrome
          count={serverTotal ?? markers.length}
          areaCount={areaTotal}
          selected={selected}
          onClose={() => setSelectedId(null)}
          onOpenListing={onOpenListing}
          onSave={onSave}
          isSaved={isSaved}
          CardComponent={CardComponent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: "transparent" },
  center: { alignItems: "center", justifyContent: "center" },
  failure: {
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
});