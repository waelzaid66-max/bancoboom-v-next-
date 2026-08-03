import { FeedItem, getMapClusters } from "@workspace/api-client-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiCategoryFor } from "@/components/CategoryTabs";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { miniAppNavClearance } from "@/components/MiniAppBottomNav";
import {
  buildMapClusterParams,
  type MapViewport,
} from "@/lib/searchParams";
import { marketCountryMapCenter } from "@/lib/searchTaxonomy";
import {
  buildMapHtml,
  feedItemsToMarkers,
  type MapBridgeMessage,
  type MapClusterMarker,
} from "./mapHtml";
import { MapOverlayChrome } from "./MapOverlayChrome";
import type { SearchResultsMapProps } from "./SearchResultsMap";

const CLUSTER_DEBOUNCE_MS = 300;
const CLUSTER_CACHE_MAX = 24;

function clusterCacheKey(criteriaSig: string, viewport: MapViewport): string {
  return `${criteriaSig}:${viewport.max_lat.toFixed(3)}:${viewport.min_lat.toFixed(3)}:${viewport.max_lng.toFixed(3)}:${viewport.min_lng.toFixed(3)}:${viewport.zoom}`;
}

type BancoMapBridge = {
  setClusters: (clusters: MapClusterMarker[]) => void;
};

function injectClusters(
  iframe: HTMLIFrameElement | null,
  clusters: MapClusterMarker[],
) {
  try {
    const win = iframe?.contentWindow as
      | (Window & { BANCO_MAP?: BancoMapBridge })
      | null
      | undefined;
    win?.BANCO_MAP?.setClusters(clusters);
  } catch {
    // Cross-origin / not-ready iframe — degrade to page markers.
  }
}

/**
 * Web map surface: the same Leaflet/OpenStreetMap page in an <iframe srcDoc>,
 * plus the native host's GET /search/map cluster loop (debounce + cache +
 * contentWindow.BANCO_MAP.setClusters). Without clusters, web only showed the
 * loaded page pins while Android/iOS got viewport-wide counts.
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
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const markers = useMemo(() => feedItemsToMarkers(items), [items]);
  const sig = useMemo(
    () => markers.map((m) => `${m.id}:${m.lat}:${m.lng}:${m.label}`).join("|"),
    [markers],
  );
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
      ),
    // The clearance belongs here: it moves when the safe-area inset does — a
    // rotation, a foldable opening — and a stale one puts the locate button
    // straight back under the bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sig,
      navClearance,
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

  const itemsRef = useRef<FeedItem[]>(items);
  itemsRef.current = items;
  const vpSeqRef = useRef(0);
  const lastViewportRef = useRef<MapViewport | null>(null);
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

  // Reloaded iframe (keyed by `sig`) loses in-page selection + clusters.
  useEffect(() => {
    setSelectedId(null);
    setServerTotal(null);
    vpSeqRef.current++;
  }, [sig]);

  const fetchClusters = useCallback(
    async (viewport: MapViewport) => {
      const cacheKey = clusterCacheKey(criteriaSig, viewport);
      const cached = clusterCacheRef.current.get(cacheKey);
      if (cached) {
        setServerTotal(cached.total);
        injectClusters(iframeRef.current, cached.clusters);
        return;
      }

      const seq = ++vpSeqRef.current;
      try {
        const res = await getMapClusters(buildMapClusterParams(criteria, viewport));
        if (seq !== vpSeqRef.current) return;
        const clusters = res.data ?? [];
        const priceById = new Map(
          itemsRef.current.map((i) => [i.id, i.price_display]),
        );
        const bookableById = new Set(
          itemsRef.current.filter((i) => i.is_bookable === true).map((i) => i.id),
        );
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
        cache.set(cacheKey, { clusters: enriched, total });
        if (cache.size > CLUSTER_CACHE_MAX) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
        setServerTotal(total);
        injectClusters(iframeRef.current, enriched);
      } catch {
        // Leave current markers; map degrades to the loaded page.
      }
    },
    [criteria, criteriaSig],
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

  // Pure filter change without mapped-set change must still refresh clusters.
  useEffect(() => {
    const sigChanged = prevSigRef.current !== sig;
    prevSigRef.current = sig;
    if (sigChanged) return;
    if (lastViewportRef.current) {
      setServerTotal(null);
      clusterCacheRef.current.clear();
      scheduleFetchClusters(lastViewportRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, criteriaSig]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const msg = JSON.parse(String(event.data)) as MapBridgeMessage;
        if (msg.type === "viewport") {
          const vp = { ...msg.bounds, zoom: msg.zoom };
          lastViewportRef.current = vp;
          scheduleFetchClusters(vp);
        } else if (msg.type === "select" && typeof msg.id === "string") {
          const hit = itemsRef.current.find((i) => i.id === msg.id);
          if (hit) setSelectedId(msg.id);
          else onOpenListingId?.(msg.id);
        } else if (msg.type === "locate_error") {
          // MAP-06: parity with native — surface deny/timeout; offer Settings on deny.
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
        }
      } catch {
        // Ignore non-map messages on the shared web message channel.
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [scheduleFetchClusters, onOpenListingId, t]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}>
      <iframe
        key={sig}
        ref={iframeRef}
        title="search-map"
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
        allow="geolocation"
        style={{ border: "none", width: "100%", height: "100%" }}
      />
      <MapOverlayChrome
        count={serverTotal ?? markers.length}
        selected={selected}
        onClose={() => setSelectedId(null)}
        onOpenListing={onOpenListing}
        onSave={onSave}
        isSaved={isSaved}
        CardComponent={CardComponent}
      />
    </View>
  );
}
