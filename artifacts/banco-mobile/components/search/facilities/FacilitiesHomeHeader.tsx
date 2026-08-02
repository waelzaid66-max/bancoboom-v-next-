/**
 * B-INDUSTRY — Factories & Land. Upper header only.
 *
 * Identity granted by the owner (2026-08-02), lifting the standing hold that
 * `SectionSearchApp` and `section-miniapp-guard` both carried. The section had
 * no visual identity of its own: it rode the generic title-and-icon chrome
 * while its four siblings each had a wordmark.
 *
 * WHY THIS ONE IS SHAPED DIFFERENTLY FROM ITS SIBLINGS
 *
 * Cars could split its chrome cleanly because its brand block sits INSIDE the
 * top bar, so pinning the top bar kept BANCO above the results. Property,
 * Materials and Stays close the top bar first and open the brand as a sibling,
 * so the same split would push branding under the filter chips — which the
 * owner's brief forbids outright.
 *
 * The fix is not to move anyone's brand. It is that the pinned slice was never
 * required to be the top bar alone: `SearchResultsSurface` only cares what goes
 * into `listHeader`. So the pinned slice here is top bar + brand + search, and
 * the brand is one horizontal lockup rather than three stacked rows — which is
 * also the "POWERED BY eats its own line" defect the owner reported. This file
 * is the reference implementation of that shape; the other three follow it.
 *
 *   slot="pinned"  A top bar · B brand lockup · C search      → stays put
 *   slot="scroll"  D hero · E type strip · F counts           → scrolls away
 *   slot="all"     everything, i.e. the pre-split behaviour    (default)
 *
 * HONESTY
 *
 * Unlike Cars — whose vehicle-type strip stays dark because the API exposes no
 * such facet — this section is backed by a real one. `industrial_type` counts
 * come back from search, so both the type strip and the counts under the hero
 * are live numbers. A type with no listings does not render, and when nothing
 * is proven the whole band disappears rather than showing a zero or a guess.
 *
 * Does NOT touch MiniAppBottomNav. No vanity counts. No invented capability.
 */
import { Feather, Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { PHONE_COUNTRIES } from "@/constants/countryCodes";
import { CURRENCY_BY_MARKET } from "@/constants/listingCreateTaxonomy";
import { useI18n } from "@/context/LanguageContext";
import { marketCountryLabel } from "@/lib/searchTaxonomy";
import { sectionAccent } from "@/lib/sectionTheme";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const B_MARK = require("../../../assets/images/b-mark.png");
const HERO_PHOTO = require("../../../assets/images/categories/facilities.jpg");

const ACCENT = sectionAccent("facilities");
const VOID = "#000000";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";
const HAIRLINE = "rgba(255,255,255,0.16)";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/** One browse type with a proven count. Built by the caller from live facets. */
export type FacilityType = {
  key: string;
  label: string;
  count: number;
  icon: FeatherName;
};

function sortIcon(sort: string): FeatherName {
  if (sort === "price_asc") return "trending-up";
  if (sort === "price_desc") return "trending-down";
  if (sort === "newest") return "clock";
  return "list";
}

type Props = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  marketCountry: string;
  sort: string;
  inputRef: React.RefObject<RNTextInput | null>;
  /** Types with a live count behind them. Empty = the strip does not render. */
  types?: FacilityType[];
  activeType?: string | null;
  onSelectType?: (key: string) => void;
  /** Which slice to draw. Default "all" keeps the pre-split behaviour exactly. */
  slot?: "all" | "pinned" | "scroll";
  onBack: () => void;
  onSaveSearch: () => void;
  onOpenFilters: () => void;
  onOpenMap: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onQueryChange: (text: string) => void;
  onSubmitQuery: () => void;
  onClearQuery: () => void;
  onOpenMarket: () => void;
  onCycleSort: () => void;
};

export function FacilitiesHomeHeader({
  searchOpen,
  draftQuery,
  searchSaved,
  activeFilterCount,
  marketCountry,
  sort,
  inputRef,
  types = [],
  activeType = null,
  onSelectType,
  slot = "all",
  onBack,
  onSaveSearch,
  onOpenFilters,
  onOpenMap,
  onOpenSearch,
  onCloseSearch,
  onQueryChange,
  onSubmitQuery,
  onClearQuery,
  onOpenMarket,
  onCycleSort,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 4 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const sortActive = sort !== "recommended";

  const showPinned = slot === "all" || slot === "pinned";
  const showScroll = slot === "all" || slot === "scroll";

  const marketMeta = useMemo(() => {
    const phone = PHONE_COUNTRIES.find((c) => c.iso === marketCountry);
    const currency = CURRENCY_BY_MARKET[marketCountry] ?? "";
    const label = marketCountryLabel(marketCountry, isRTL);
    return {
      flag: phone?.flag ?? "",
      caption: currency || label,
      a11y: `${label}${currency ? ` ${currency}` : ""}`,
    };
  }, [marketCountry, isRTL]);

  // The total is a sum of proven per-type counts, never a separate number that
  // could drift from the strip beside it.
  const provenTotal = useMemo(
    () => types.reduce((sum, ty) => sum + ty.count, 0),
    [types],
  );

  const trust: { key: string; icon: FeatherName; label: string }[] = [
    {
      key: "licensed",
      icon: "file-text",
      label: t("search.discover.section.facilitiesTrustLicensed"),
    },
    {
      key: "survey",
      icon: "map-pin",
      label: t("search.discover.section.facilitiesTrustSurvey"),
    },
    {
      key: "escrow",
      icon: "shield",
      label: t("search.discover.section.facilitiesTrustEscrow"),
    },
  ];

  return (
    <View
      style={[
        styles.root,
        { paddingTop: slot === "scroll" ? 0 : Math.max(0, topPad - 6) },
      ]}
      testID={slot === "scroll" ? "facilities-hero-band" : "facilities-home-header"}
    >
      {/* ── A · top bar ─────────────────────────────────────────────── */}
      {showPinned ? (
        <View style={[styles.topBar, { flexDirection: rowDir }]}>
          <Pressable
            onPress={onBack}
            style={styles.iconHit}
            hitSlop={12}
            testID="section-back"
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Feather
              name={isRTL ? "arrow-right" : "arrow-left"}
              size={18}
              color={SNOW}
            />
          </Pressable>
          <View style={styles.topSpacer} />
          <Pressable
            onPress={onOpenMap}
            style={styles.iconHit}
            hitSlop={12}
            testID="facilities-header-map"
            accessibilityRole="button"
            accessibilityLabel={t("search.discover.section.deskMap")}
          >
            <Ionicons name="map" size={16} color={SNOW} />
          </Pressable>
          <Pressable
            onPress={onCycleSort}
            style={[styles.sortHit, sortActive ? styles.sortHitActive : null]}
            accessibilityLabel={t(`search.sortOptions.${sort}`)}
            testID="section-sort-cycle"
            hitSlop={8}
          >
            <Feather
              name={sortIcon(sort)}
              size={13}
              color={sortActive ? SNOW : ASH}
            />
          </Pressable>
          <Pressable
            onPress={onSaveSearch}
            disabled={searchSaved}
            style={styles.iconHit}
            testID="section-save-search"
          >
            <Feather
              name="bookmark"
              size={16}
              color={searchSaved ? ACCENT : SNOW}
            />
          </Pressable>
        </View>
      ) : null}

      {/* ── B · brand lockup — ONE row, pinned ──────────────────────── */}
      {showPinned ? (
        <View
          style={[styles.brandLockup, { flexDirection: rowDir }]}
          testID="facilities-industry-brand"
        >
          <Image source={B_MARK} style={styles.wordmarkB} contentFit="contain" />
          <View style={styles.brandTextCol}>
            <AppText style={styles.wordmarkIndustry} numberOfLines={1}>
              {t("search.discover.section.facilitiesBrand")}
            </AppText>
            <AppText style={styles.wordmarkHub} numberOfLines={1}>
              {t("search.discover.section.facilitiesHubLabel")}
            </AppText>
          </View>

          <View style={styles.brandSpacer} />

          <AppText style={styles.poweredLabelInline} numberOfLines={1}>
            {t("booking.poweredBy")}
          </AppText>
          <Image
            source={BANCO_LOGO}
            style={styles.poweredLogo}
            contentFit="contain"
            tintColor={ACCENT}
          />
          <Pressable
            onPress={onOpenMarket}
            style={[styles.marketWeld, { flexDirection: rowDir }]}
            accessibilityLabel={marketMeta.a11y}
            testID="facilities-market-beside-banco"
            hitSlop={8}
          >
            {marketMeta.flag ? (
              <AppText style={styles.marketFlag}>{marketMeta.flag}</AppText>
            ) : (
              <Feather name="globe" size={11} color={ASH} />
            )}
            <AppText style={styles.marketCaption} numberOfLines={1}>
              {marketMeta.caption}
            </AppText>
            <Feather name="chevron-down" size={10} color={ASH} />
          </Pressable>
        </View>
      ) : null}

      {/* ── C · search + filters, pinned ────────────────────────────── */}
      {showPinned ? (
        searchOpen ? (
          <View style={[styles.searchPill, { flexDirection: rowDir }]}>
            <Ionicons name="search" size={16} color={ACCENT} />
            <TextInput
              ref={inputRef}
              value={draftQuery}
              onChangeText={onQueryChange}
              onSubmitEditing={onSubmitQuery}
              placeholder={t("search.discover.section.facilitiesWhere")}
              placeholderTextColor={ASH}
              style={[styles.searchInput, { textAlign }]}
              returnKeyType="search"
              testID="section-search-input"
              autoCorrect={false}
            />
            {draftQuery.length > 0 ? (
              <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
                <Feather name="x" size={14} color={ASH} />
              </Pressable>
            ) : (
              <Pressable onPress={onCloseSearch} hitSlop={8} testID="section-search-close">
                <Feather name="x" size={14} color={ASH} />
              </Pressable>
            )}
            <Pressable
              onPress={onOpenFilters}
              hitSlop={8}
              style={styles.filterInSearch}
              testID="section-filter-toggle"
            >
              <Feather name="sliders" size={15} color={ACCENT} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
                </View>
              ) : null}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.searchPill, { flexDirection: rowDir }]}>
            <Pressable
              onPress={onOpenSearch}
              style={[styles.searchMainHit, { flexDirection: rowDir }]}
              testID="section-search-open"
            >
              <Ionicons name="search" size={16} color={ACCENT} />
              <AppText
                style={[
                  styles.searchPlaceholder,
                  { textAlign, color: draftQuery ? SNOW : ASH },
                ]}
                numberOfLines={1}
              >
                {draftQuery || t("search.discover.section.facilitiesWhere")}
              </AppText>
            </Pressable>
            {draftQuery.length > 0 ? (
              <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
                <Feather name="x" size={14} color={ASH} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onOpenFilters}
              hitSlop={8}
              style={styles.filterInSearch}
              testID="section-filter-toggle"
            >
              <Feather name="sliders" size={15} color={ACCENT} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
                </View>
              ) : null}
            </Pressable>
          </View>
        )
      ) : null}

      {/* ── D · hero, scrolls away ──────────────────────────────────── */}
      {showScroll ? (
        <View style={styles.hero} testID="facilities-hero">
          <Image source={HERO_PHOTO} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.88)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroInner}>
            <AppText style={[styles.heroTitle, { textAlign }]} numberOfLines={2}>
              {t("search.discover.section.facilitiesTagline")}
            </AppText>
            <View style={[styles.trustRow, { flexDirection: rowDir }]}>
              {trust.map((item) => (
                <View
                  key={item.key}
                  style={[styles.trustItem, { flexDirection: rowDir }]}
                >
                  <Feather name={item.icon} size={11} color={ACCENT} />
                  <AppText style={styles.trustText} numberOfLines={1}>
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* ── E · type strip — only types a facet actually returned ───── */}
      {showScroll && types.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeStrip}
          testID="facilities-type-strip"
        >
          {types.map((ty) => {
            const active = activeType === ty.key;
            return (
              <Pressable
                key={ty.key}
                onPress={() => onSelectType?.(ty.key)}
                style={[
                  styles.typeChip,
                  { flexDirection: rowDir },
                  active ? styles.typeChipActive : null,
                ]}
                testID={`facilities-type-${ty.key}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Feather
                  name={ty.icon}
                  size={13}
                  color={active ? SNOW : ACCENT}
                />
                <AppText
                  style={[styles.typeLabel, active ? styles.typeLabelActive : null]}
                  numberOfLines={1}
                >
                  {ty.label}
                </AppText>
                <AppText
                  style={[styles.typeCount, active ? styles.typeCountActive : null]}
                >
                  {ty.count}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* ── F · one proven total, or nothing at all ─────────────────── */}
      {showScroll && provenTotal > 0 ? (
        <View style={[styles.countRow, { flexDirection: rowDir }]} testID="facilities-count">
          <View style={styles.countDot} />
          <AppText style={styles.countText} numberOfLines={1}>
            {provenTotal}
          </AppText>
          <AppText style={styles.countLabel} numberOfLines={1}>
            {t("search.discover.section.facilitiesHubLabel")}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: VOID },

  topBar: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 2,
    gap: 2,
  },
  topSpacer: { flex: 1 },
  iconHit: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  sortHit: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  sortHitActive: { backgroundColor: ACCENT, borderColor: ACCENT },

  // ONE row. Three stacked rows is the shape the owner reported as a defect.
  brandLockup: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  wordmarkB: { width: 22, height: 22 },
  brandTextCol: { justifyContent: "center" },
  wordmarkIndustry: {
    color: SNOW,
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
    letterSpacing: 1.6,
    lineHeight: 18,
  },
  wordmarkHub: {
    color: ASH,
    fontSize: 8.5,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.6,
    lineHeight: 11,
  },
  brandSpacer: { flex: 1 },
  poweredLabelInline: {
    color: ASH,
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  poweredLogo: { width: 42, height: 12 },
  marketWeld: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  marketFlag: { fontSize: 11 },
  marketCaption: {
    color: ASH,
    fontSize: 9.5,
    fontFamily: "Inter_500Medium",
  },

  searchPill: {
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    height: 54,
    borderRadius: 28,
    paddingHorizontal: 16,
    backgroundColor: "#121212",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  searchMainHit: { flex: 1, alignItems: "center", gap: 8 },
  searchInput: {
    flex: 1,
    color: SNOW,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterInSearch: { paddingStart: 4 },
  filterBadge: {
    position: "absolute",
    top: -5,
    end: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: SNOW,
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },

  hero: {
    height: 132,
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroInner: { padding: 14, gap: 8 },
  heroTitle: {
    color: SNOW,
    fontSize: 17,
    fontFamily: "Cairo_700Bold",
    lineHeight: 23,
  },
  trustRow: { alignItems: "center", gap: 10, flexWrap: "wrap" },
  trustItem: { alignItems: "center", gap: 4 },
  trustText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 9.5,
    fontFamily: "Inter_500Medium",
  },

  typeStrip: { gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  typeChip: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#121212",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  typeChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  typeLabel: { color: SNOW, fontSize: 12.5, fontFamily: "Cairo_700Bold" },
  typeLabelActive: { color: SNOW },
  typeCount: { color: ASH, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  typeCountActive: { color: "rgba(255,255,255,0.9)" },

  countRow: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  countDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  countText: { color: SNOW, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  countLabel: { color: ASH, fontSize: 11, fontFamily: "Inter_400Regular" },
});
