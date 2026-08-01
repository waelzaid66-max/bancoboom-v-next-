/**
 * BANCO Maps — mini-app §7 of 10 (Wave 6 Opt B land; Wave 8 count lock).
 *
 * Dedicated Maps world from Discover Search. Reuses Leaflet / SearchResultsMap /
 * clusters — never deletes vendor stack. World tabs filter this map surface;
 * per-section `?map=1` feeds remain intentional duplication serving all catalogues.
 */
import { Feather } from "@/components/icons";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { MiniAppBottomNav } from "@/components/MiniAppBottomNav";
import { SmartAssetCard } from "@/components/SmartAssetCard";
import { SearchResultsMap } from "@/components/search/SearchResultsMap";
import { useI18n } from "@/context/LanguageContext";
import { useSession } from "@/context/SessionContext";
import { useSearchMiniApp } from "@/hooks/useSearchMiniApp";
import { DEFAULT_MARKET_COUNTRY } from "@/constants/listingCreateTaxonomy";
import { loadPreferredMarketCountry } from "@/lib/marketPreference";
import {
  DEFAULT_CRITERIA,
  type SearchCriteria,
} from "@/lib/searchParams";
import { sectionAccent } from "@/lib/sectionTheme";
import type { FeedItem } from "@workspace/api-client-react";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");

const VOID = "#000000";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";
const HAIRLINE = "rgba(255,255,255,0.16)";
// W9 D-W9-01: Maps hub stays in BANCO red-family (logo red). Gold was identity break.
const ACCENT = sectionAccent("all");
const BODY_BG = "#0C0D10";

type MapsWorld =
  | "all"
  | "car"
  | "real_estate"
  | "materials"
  | "facilities"
  | "stays";

type WorldTab = {
  id: MapsWorld;
  labelKey:
    | "search.discover.exploreMapWorldAll"
    | "search.discover.exploreMapCar"
    | "search.discover.exploreMapProperties"
    | "search.discover.exploreMapMaterials"
    | "search.discover.exploreMapFactories"
    | "search.discover.exploreMapStays";
  sectionHref?: Href;
};

const WORLD_TABS: WorldTab[] = [
  { id: "all", labelKey: "search.discover.exploreMapWorldAll" },
  {
    id: "car",
    labelKey: "search.discover.exploreMapCar",
    sectionHref: "/section/car?map=1" as Href,
  },
  {
    id: "real_estate",
    labelKey: "search.discover.exploreMapProperties",
    sectionHref: "/section/real-estate?map=1" as Href,
  },
  {
    id: "materials",
    labelKey: "search.discover.exploreMapMaterials",
    sectionHref: "/section/materials?map=1" as Href,
  },
  {
    id: "facilities",
    labelKey: "search.discover.exploreMapFactories",
    sectionHref: "/section/factories?map=1" as Href,
  },
  {
    id: "stays",
    labelKey: "search.discover.exploreMapStays",
    sectionHref: "/section/booking?map=1" as Href,
  },
];

function criteriaForWorld(
  world: MapsWorld,
  marketCountry: string,
): SearchCriteria {
  const base: SearchCriteria = {
    ...DEFAULT_CRITERIA,
    marketCountry,
    // sort≠recommended activates hasActiveCriteria for mixed "all" catalogue
    sort: "newest",
  };
  switch (world) {
    case "car":
      return { ...base, category: "car" };
    case "real_estate":
      return { ...base, category: "real_estate" };
    case "materials":
      return { ...base, category: "materials" };
    case "facilities":
      return { ...base, category: "facilities" };
    case "stays":
      return { ...base, category: "real_estate", engineKey: "rent" };
    case "all":
    default:
      return { ...base, category: "all" };
  }
}

export function MapsHubApp() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { isSaved, toggleSave } = useSession();
  const search = useSearchMiniApp();
  const { criteria, items, commit, loadMore, retry, phase } = search;

  const [world, setWorld] = useState<MapsWorld>("all");
  const [listMode, setListMode] = useState(false);
  const seeded = useRef(false);
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    void loadPreferredMarketCountry().then((iso) => {
      commit(criteriaForWorld("all", iso || DEFAULT_MARKET_COUNTRY));
    });
  }, [commit]);

  const selectWorld = useCallback(
    (next: MapsWorld) => {
      setWorld(next);
      setListMode(false);
      commit(
        criteriaForWorld(
          next,
          criteria.marketCountry || DEFAULT_MARKET_COUNTRY,
        ),
      );
    },
    [commit, criteria.marketCountry],
  );

  const mappableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.coordinates &&
          Number.isFinite(i.coordinates.lat) &&
          Number.isFinite(i.coordinates.lng),
      ),
    [items],
  );

  const openListing = (item: FeedItem) => {
    router.push(`/listing/${item.id}` as Href);
  };

  const activeTab = WORLD_TABS.find((w) => w.id === world);

  return (
    <View style={styles.root} testID="maps-hub">
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconHit}
            hitSlop={12}
            testID="section-back"
            accessibilityRole="button"
          >
            <Feather
              name={isRTL ? "arrow-right" : "arrow-left"}
              size={22}
              color={SNOW}
            />
          </Pressable>
          <View style={styles.topSpacer} />
          <Pressable
            onPress={() => setListMode((m) => !m)}
            style={styles.iconHit}
            hitSlop={12}
            testID="maps-hub-list-toggle"
            accessibilityRole="button"
            accessibilityLabel={
              listMode ? t("search.viewMap") : t("search.viewList")
            }
          >
            <Feather name={listMode ? "map" : "list"} size={20} color={SNOW} />
          </Pressable>
          {activeTab?.sectionHref ? (
            <Pressable
              onPress={() => router.push(activeTab.sectionHref!)}
              style={styles.iconHit}
              hitSlop={12}
              testID="maps-hub-open-section"
              accessibilityRole="button"
              accessibilityLabel={t("search.discover.exploreMapOpenSection")}
            >
              <Feather name="grid" size={20} color={SNOW} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.brandBlock} testID="maps-hub-brand">
          <View
            style={[
              styles.wordmarkRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Image
              source={BANCO_LOGO}
              style={styles.wordmarkLogo}
              contentFit="contain"
              tintColor={ACCENT}
            />
            <AppText style={styles.wordmarkMaps} numberOfLines={1}>
              {t("search.discover.exploreMapBrand")}
            </AppText>
          </View>
          <AppText style={styles.tagline} numberOfLines={2}>
            {t("search.discover.exploreMapHubSub")}
          </AppText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={[styles.tabsRow, { flexDirection: rowDir }]}
          testID="maps-hub-world-tabs"
        >
          {WORLD_TABS.map((tab) => {
            const active = world === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => selectWorld(tab.id)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? ACCENT : "rgba(255,255,255,0.08)",
                    borderColor: active ? ACCENT : HAIRLINE,
                  },
                ]}
                testID={`maps-world-${tab.id}`}
              >
                <AppText
                  style={[styles.tabLabel, { color: active ? VOID : SNOW }]}
                  numberOfLines={1}
                >
                  {t(tab.labelKey)}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {phase === "loading" && items.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={ACCENT} />
            <AppText style={{ color: ASH, marginTop: 12 }}>
              {t("common.loading")}
            </AppText>
          </View>
        ) : listMode ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: insets.bottom + 120,
              gap: 10,
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <AppText style={{ color: ASH, textAlign: "center", marginTop: 40 }}>
                {t("search.noResults")}
              </AppText>
            }
            ListFooterComponent={
              phase === "loadingMore" ? (
                <ActivityIndicator color={ACCENT} style={{ marginVertical: 16 }} />
              ) : null
            }
            renderItem={({ item }) => (
              <SmartAssetCard
                item={item}
                onPress={openListing}
                onSave={toggleSave}
                isSaved={isSaved(item.id)}
              />
            )}
            testID="maps-hub-list"
          />
        ) : (
          <SearchResultsMap
            items={mappableItems}
            criteria={criteria}
            onOpenListing={openListing}
            onOpenListingId={(id) => router.push(`/listing/${id}` as Href)}
            onSave={toggleSave}
            isSaved={isSaved}
          />
        )}

        {phase === "error" && items.length === 0 ? (
          <View style={styles.errorOverlay}>
            <AppText style={{ color: SNOW, marginBottom: 12 }}>
              {t("common.error")}
            </AppText>
            <Pressable onPress={retry} style={styles.retryBtn} testID="maps-hub-retry">
              <AppText style={{ color: VOID, fontWeight: "700" }}>
                {t("common.retry")}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <MiniAppBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: VOID },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  topBar: { alignItems: "center", minHeight: 40 },
  topSpacer: { flex: 1 },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBlock: { alignItems: "center", gap: 6 },
  wordmarkRow: { alignItems: "center", gap: 10 },
  wordmarkLogo: { width: 72, height: 22 },
  wordmarkMaps: {
    color: SNOW,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    color: ASH,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 320,
    textAlign: "center",
  },
  tabsRow: { gap: 8, paddingVertical: 4 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabLabel: { fontSize: 13, fontWeight: "700" },
  body: { flex: 1, backgroundColor: BODY_BG },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    padding: 24,
  },
  retryBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
