/**
 * B-PROPERTIES — premium black header (visual shell).
 *
 * Stay-parity bands (A–D): back / stays / request / save · wordmark ·
 * search+filter pill · offer+Wanted · type tabs (Commercial + More pickers).
 * Country/currency (micro) + sort sit next to BANCO above the search pill.
 * Presentational only — parent owns criteria and sheets. RE-only.
 */
import { Feather, Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { MarketCountryButton } from "@/components/MarketCountryPicker";
import { PROPERTY_TYPES } from "@/constants/listingCreateTaxonomy";
import { useI18n } from "@/context/LanguageContext";
import { sectionAccent } from "@/lib/sectionTheme";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const B_MARK = require("../../../assets/images/b-mark.png");
const PROPERTY_MARK = require("../../../assets/images/property-mark.png");

const ACCENT = sectionAccent("real_estate"); // #B81E3C
const VOID = "#000000";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";
const HAIRLINE = "rgba(255,255,255,0.16)";

/** Band D sentinel — opens commercial subtype picker (never sent to API). */
export const RE_COMMERCIAL_TAB = "__commercial__";
/** Band D sentinel — opens deep residential/hotel picker (never sent to API). */
export const RE_MORE_TAB = "__more__";

/** Real API property_type values under the Commercial Band D tab. */
export const RE_COMMERCIAL_TYPES = [
  "office",
  "shop",
  "warehouse",
  "commercial_land",
] as const;

/** Deep types under More — primary apartment/villa/land stay as direct tabs. */
export const RE_MORE_TYPES = [
  "studio",
  "chalet",
  "townhouse",
  "duplex",
  "penthouse",
  "hotel",
] as const;

export type PropertyTypeTab = {
  value: string;
  label: string;
};

type TypePickerKind = "commercial" | "more" | null;

type PropertyHomeHeaderProps = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  activePropertyType: string;
  /** Offer axis: "all" | "sale" | "rent" */
  activeOfferKey: string;
  /** Wanted browse (`listingMode=buy`) — composes with offer. */
  wantedActive: boolean;
  /** Live propertyType for picker row highlight. */
  selectedPropertyType: string | null;
  typeTabs: PropertyTypeTab[];
  marketCountry: string;
  sort: string;
  inputRef: React.RefObject<RNTextInput | null>;
  onBack: () => void;
  onSaveSearch: () => void;
  onOpenStays: () => void;
  onOpenRequest: () => void;
  /** Open / latch map (FAB parity after desks map retirement). */
  onOpenMap: () => void;
  onOpenFilters: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onQueryChange: (text: string) => void;
  onSubmitQuery: () => void;
  onClearQuery: () => void;
  onSelectType: (value: string) => void;
  onSelectOffer: (engineKey: string) => void;
  onToggleWanted: () => void;
  onOpenMarket: () => void;
  onCycleSort: () => void;
};

/** Names must exist in `@/components/icons` ICONS registry (Android/Expo safe). */
function tabIcon(value: string): React.ComponentProps<typeof Ionicons>["name"] {
  switch (value) {
    case "__all__":
      return "grid-outline";
    case "apartment":
      return "business-outline";
    case "villa":
      return "home";
    case RE_COMMERCIAL_TAB:
    case "office":
      return "storefront-outline";
    case "land":
      return "map-outline";
    case RE_MORE_TAB:
      return "ellipsis-horizontal";
    default:
      return "radio-button-off";
  }
}

function sortIcon(sort: string): React.ComponentProps<typeof Feather>["name"] {
  if (sort === "price_asc") return "trending-up";
  if (sort === "price_desc") return "trending-down";
  if (sort === "newest") return "clock";
  return "list";
}

export function PropertyHomeHeader({
  searchOpen,
  draftQuery,
  searchSaved,
  activeFilterCount,
  activePropertyType,
  activeOfferKey,
  wantedActive,
  selectedPropertyType,
  typeTabs,
  marketCountry,
  sort,
  inputRef,
  onBack,
  onSaveSearch,
  onOpenStays,
  onOpenRequest,
  onOpenMap,
  onOpenFilters,
  onOpenSearch,
  onCloseSearch,
  onQueryChange,
  onSubmitQuery,
  onClearQuery,
  onSelectType,
  onSelectOffer,
  onToggleWanted,
  onOpenMarket,
  onCycleSort,
}: PropertyHomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const [typePicker, setTypePicker] = useState<TypePickerKind>(null);
  // Owner rule: never invent a fake 67px web pad (it destroyed headers before).
  // ~2mm tighter than Stay default — reclaim listing space (owner 2026-07-31).
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 10 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const sortActive = sort !== "recommended";
  const offerTabs = [
    { value: "all", label: t("search.listingModeAll") },
    { value: "sale", label: t("home.engines.sale") },
    { value: "rent", label: t("home.engines.rent") },
  ] as const;

  const handleTypePress = (value: string) => {
    if (value === RE_COMMERCIAL_TAB) {
      setTypePicker("commercial");
      return;
    }
    if (value === RE_MORE_TAB) {
      setTypePicker("more");
      return;
    }
    onSelectType(value);
  };

  const pickerOptions =
    typePicker === "commercial"
      ? RE_COMMERCIAL_TYPES
      : typePicker === "more"
        ? RE_MORE_TYPES
        : null;
  const pickerTitle =
    typePicker === "commercial"
      ? t("search.discover.section.propertyTabCommercial")
      : typePicker === "more"
        ? t("search.discover.section.deskMore")
        : "";
  const pickerTestPrefix =
    typePicker === "commercial" ? "re-commercial" : "re-more";

  return (
    <View style={[styles.root, { paddingTop: Math.max(0, topPad - 1) }]} testID="re-property-header">
      {/* Band A — top actions */}
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <Pressable
          onPress={onBack}
          style={styles.iconHit}
          hitSlop={12}
          testID="section-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={20}
            color={SNOW}
          />
        </Pressable>
        <View style={styles.topSpacer} />
        <Pressable
          onPress={onOpenMap}
          style={styles.iconHit}
          hitSlop={12}
          testID="re-header-map"
          accessibilityRole="button"
          accessibilityLabel={t("search.discover.section.deskMap")}
        >
          <Ionicons name="map" size={18} color={SNOW} />
        </Pressable>
        <Pressable
          onPress={onOpenStays}
          style={styles.iconHit}
          hitSlop={12}
          testID="re-header-stays"
          accessibilityRole="button"
          accessibilityLabel={t("search.discover.section.deskStays")}
        >
          <Ionicons name="calendar" size={18} color={SNOW} />
        </Pressable>
        <Pressable
          onPress={onOpenRequest}
          style={styles.iconHit}
          hitSlop={12}
          testID="re-header-request"
          accessibilityRole="button"
          accessibilityLabel={t("search.discover.section.deskRequest")}
        >
          <Ionicons name="document-text-outline" size={18} color={SNOW} />
        </Pressable>
        <Pressable
          onPress={onSaveSearch}
          disabled={searchSaved}
          style={styles.iconHit}
          testID="section-save-search"
          accessibilityRole="button"
        >
          <Feather
            name="bookmark"
            size={18}
            color={searchSaved ? ACCENT : SNOW}
          />
        </Pressable>
      </View>

      {/* Band B — B-PROPERTIES identity (balanced, not half-screen) */}
      <View style={styles.brandBlock} testID="re-property-brand">
        <View
          style={[
            styles.wordmarkRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Image
            source={B_MARK}
            style={styles.wordmarkB}
            contentFit="contain"
          />
          <AppText style={styles.wordmarkProperties} numberOfLines={1}>
            {t("search.discover.section.propertyBrand")}
          </AppText>
          <Image
            source={PROPERTY_MARK}
            style={styles.wordmarkSeal}
            contentFit="contain"
          />
        </View>

        <View style={styles.taglineRow}>
          <View style={styles.taglineRule} />
          <AppText style={styles.tagline} numberOfLines={1}>
            {t("search.discover.section.propertyTagline")}
          </AppText>
          <View style={styles.taglineRule} />
        </View>

        <AppText style={styles.poweredLabel} numberOfLines={1}>
          {t("booking.poweredBy")}
        </AppText>
        <View
          style={[
            styles.poweredRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Image
            source={BANCO_LOGO}
            style={styles.poweredLogo}
            contentFit="contain"
            tintColor={ACCENT}
          />
          {/* Market + sort sit above the search pill, next to BANCO — no orphan strip. */}
          <MarketCountryButton
            selected={marketCountry}
            onPress={onOpenMarket}
            density="micro"
          />
          <Pressable
            onPress={onCycleSort}
            style={[
              styles.sortNearBanco,
              sortActive ? styles.sortNearBancoActive : null,
            ]}
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
        </View>
      </View>

      {/* Band C — search pill; filter lives inside (Stay-aligned) */}
      {searchOpen ? (
        <View style={[styles.searchPill, { flexDirection: rowDir }]}>
          <Ionicons name="search" size={17} color={ACCENT} />
          <TextInput
            ref={inputRef}
            value={draftQuery}
            onChangeText={onQueryChange}
            onSubmitEditing={onSubmitQuery}
            placeholder={t("search.discover.section.propertyWhere")}
            placeholderTextColor={ASH}
            style={[styles.searchInput, { textAlign }]}
            returnKeyType="search"
            testID="section-search-input"
            autoCorrect={false}
          />
          {draftQuery.length > 0 ? (
            <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
              <Feather name="x" size={15} color={ASH} />
            </Pressable>
          ) : (
            <Pressable onPress={onCloseSearch} hitSlop={8} testID="section-search-close">
              <Feather name="x" size={15} color={ASH} />
            </Pressable>
          )}
          <Pressable
            onPress={onOpenFilters}
            hitSlop={8}
            style={styles.filterInSearch}
            testID="section-filter-toggle"
          >
            <Feather name="sliders" size={16} color={ACCENT} />
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
            <Ionicons name="search" size={17} color={ACCENT} />
            <AppText
              style={[
                styles.searchPlaceholder,
                {
                  textAlign,
                  color: draftQuery ? SNOW : ASH,
                },
              ]}
              numberOfLines={1}
            >
              {draftQuery || t("search.discover.section.propertyWhere")}
            </AppText>
          </Pressable>
          {draftQuery.length > 0 ? (
            <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
              <Feather name="x" size={15} color={ASH} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onOpenFilters}
            hitSlop={8}
            style={styles.filterInSearch}
            testID="section-filter-toggle"
          >
            <Feather name="sliders" size={16} color={ACCENT} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      )}

      {/* Offer axis + Wanted (listingMode) — Wanted composes with sale/rent. */}
      <View
        style={[styles.offerRow, { flexDirection: rowDir }]}
        testID="re-offer-strip"
      >
        {offerTabs.map((tab) => {
          const active = activeOfferKey === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => onSelectOffer(tab.value)}
              style={[styles.offerChip, active ? styles.offerChipActive : null]}
              testID={`re-offer-${tab.value}`}
            >
              <AppText
                style={[styles.offerChipText, { color: active ? SNOW : ASH }]}
                numberOfLines={1}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onToggleWanted}
          style={[styles.offerChip, wantedActive ? styles.offerChipActive : null]}
          testID="re-offer-wanted"
        >
          <AppText
            style={[styles.offerChipText, { color: wantedActive ? SNOW : ASH }]}
            numberOfLines={1}
          >
            {t("search.listingModeBuy")}
          </AppText>
        </Pressable>
      </View>

      {/* Band D — primary types only (market lives next to BANCO above search). */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsRow, { flexDirection: rowDir }]}
        style={styles.tabsScroll}
        testID="re-type-strip"
      >
        {typeTabs.map((tab, index) => {
          const active = activePropertyType === tab.value;
          const tint = active ? ACCENT : ASH;
          return (
            <React.Fragment key={tab.value}>
              {index > 0 ? <View style={styles.tabDivider} /> : null}
              <Pressable
                onPress={() => handleTypePress(tab.value)}
                style={[styles.tabItem, active ? styles.tabItemActive : null]}
                testID={`re-type-${tab.value}`}
              >
                <Ionicons name={tabIcon(tab.value)} size={16} color={active ? SNOW : tint} />
                <AppText
                  style={[styles.tabLabel, { color: active ? SNOW : tint }]}
                  numberOfLines={1}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>

      <Modal
        visible={typePicker != null}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePicker(null)}
      >
        <Pressable
          style={styles.typePickerBackdrop}
          onPress={() => setTypePicker(null)}
          testID={`re-${typePicker ?? "type"}-backdrop`}
        >
          <View style={styles.typePickerSheet} testID="re-type-picker-sheet">
            <AppText style={styles.typePickerTitle}>{pickerTitle}</AppText>
            {(pickerOptions ?? []).map((value) => {
              const def = PROPERTY_TYPES.find((p) => p.value === value);
              const label = def ? (isRTL ? def.ar : def.en) : value;
              const rowActive = selectedPropertyType === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    setTypePicker(null);
                    onSelectType(value);
                  }}
                  style={[
                    styles.typePickerRow,
                    { flexDirection: rowDir },
                    rowActive ? styles.typePickerRowActive : null,
                  ]}
                  testID={`${pickerTestPrefix}-${value}`}
                >
                  <AppText
                    style={[
                      styles.typePickerRowText,
                      rowActive ? styles.typePickerRowTextActive : null,
                    ]}
                  >
                    {label}
                  </AppText>
                  <Feather
                    name={isRTL ? "chevron-left" : "chevron-right"}
                    size={16}
                    color={rowActive ? ACCENT : ASH}
                  />
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  topBar: {
    alignItems: "center",
    minHeight: 34,
    marginBottom: 0,
  },
  topSpacer: { flex: 1 },
  iconHit: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 4,
  },
  wordmarkRow: {
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  wordmarkB: {
    width: 32,
    height: 40,
  },
  wordmarkProperties: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: ACCENT,
    letterSpacing: 1.1,
  },
  wordmarkSeal: {
    width: 30,
    height: 30,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  taglineRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: ACCENT,
    maxWidth: 48,
    opacity: 0.85,
  },
  tagline: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: ASH,
    textAlign: "center",
  },
  poweredLabel: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    color: ASH,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  poweredRow: {
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  poweredLogo: {
    width: 68,
    height: 16,
  },
  sortNearBanco: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sortNearBancoActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  searchPill: {
    height: 46,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    backgroundColor: VOID,
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  searchMainHit: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: SNOW,
    padding: 0,
  },
  filterInSearch: {
    position: "relative",
    padding: 4,
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 9.5,
    fontFamily: "Inter_700Bold",
    color: SNOW,
  },
  offerRow: {
    marginTop: 8,
    gap: 6,
    alignItems: "center",
  },
  offerChip: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
  },
  offerChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  offerChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  typePickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  typePickerSheet: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: "#141414",
    overflow: "hidden",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  typePickerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: SNOW,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  typePickerRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  typePickerRowActive: {
    backgroundColor: "rgba(184,30,60,0.14)",
  },
  typePickerRowText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: SNOW,
  },
  typePickerRowTextActive: {
    color: ACCENT,
    fontFamily: "Inter_600SemiBold",
  },
  tabsScroll: {
    marginTop: 6,
    marginHorizontal: -16,
  },
  tabsRow: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 0,
    minHeight: 44,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    minWidth: 62,
    gap: 3,
    borderRadius: 14,
    paddingVertical: 5,
  },
  tabItemActive: {
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  tabDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "center",
    height: 24,
    backgroundColor: HAIRLINE,
  },
});
