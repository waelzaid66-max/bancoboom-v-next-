/**
 * B-oom Car — premium black header (Stay-parity visual shell).
 *
 * Presentational only: back · map · save · BOOM+CAR wordmark · search+filter.
 * Parent (`SectionSearchApp`) owns criteria, engines chips, brand strip, map latch,
 * and market/sort on the primary strip (unguarded MarketCountryButton SoT).
 * Vehicle-type tabs (REL-21) wait for taxonomy Approve — do not invent.
 * Car Import hub is a different world — never linked from this chrome.
 *
 * W8 D-W8-01: market/sort live ONLY on the primary strip — not duplicated here.
 */
import { Feather, Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { sectionAccent } from "@/lib/sectionTheme";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const BOOM_LOGO = require("../../../assets/images/boom-logo.png");

const ACCENT = sectionAccent("car");
const VOID = "#000000";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";
const HAIRLINE = "rgba(255,255,255,0.16)";

type Props = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  inputRef: React.RefObject<RNTextInput | null>;
  onBack: () => void;
  onSaveSearch: () => void;
  onOpenMap: () => void;
  onOpenFilters: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onQueryChange: (text: string) => void;
  onSubmitQuery: () => void;
  onClearQuery: () => void;
};

export function CarsHomeHeader({
  searchOpen,
  draftQuery,
  searchSaved,
  activeFilterCount,
  inputRef,
  onBack,
  onSaveSearch,
  onOpenMap,
  onOpenFilters,
  onOpenSearch,
  onCloseSearch,
  onQueryChange,
  onSubmitQuery,
  onClearQuery,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={[styles.root, { paddingTop: topPad - 1 }]} testID="cars-home-header">
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
            size={22}
            color={SNOW}
          />
        </Pressable>
        <View style={styles.topSpacer} />
        <Pressable
          onPress={onOpenMap}
          style={styles.iconHit}
          hitSlop={12}
          testID="cars-header-map"
          accessibilityRole="button"
          accessibilityLabel={t("search.discover.section.deskMap")}
        >
          <Ionicons name="map" size={20} color={SNOW} />
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
            size={20}
            color={searchSaved ? ACCENT : SNOW}
          />
        </Pressable>
      </View>

      <View style={styles.brandBlock} testID="cars-boom-brand">
        <View
          style={[
            styles.wordmarkRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Image
            source={BOOM_LOGO}
            style={styles.wordmarkBoom}
            contentFit="contain"
          />
          <AppText style={styles.wordmarkCar} numberOfLines={1}>
            {t("search.discover.section.carBrand")}
          </AppText>
        </View>

        <View style={styles.taglineRow}>
          <View style={styles.taglineRule} />
          <AppText style={styles.tagline} numberOfLines={1}>
            {t("search.discover.section.carTagline")}
          </AppText>
          <View style={styles.taglineRule} />
        </View>

        <View
          style={[
            styles.poweredRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
          testID="cars-powered-row"
        >
          <AppText style={styles.poweredLabelInline} numberOfLines={1}>
            {t("booking.poweredBy")}
          </AppText>
          <Image
            source={BANCO_LOGO}
            style={styles.poweredLogo}
            contentFit="contain"
            tintColor={ACCENT}
          />
        </View>
      </View>

      {searchOpen ? (
        <View style={[styles.searchPill, { flexDirection: rowDir }]}>
          <Ionicons name="search" size={18} color={ACCENT} />
          <TextInput
            ref={inputRef}
            value={draftQuery}
            onChangeText={onQueryChange}
            onSubmitEditing={onSubmitQuery}
            placeholder={t("search.discover.section.carWhere")}
            placeholderTextColor={ASH}
            style={[styles.searchInput, { textAlign }]}
            returnKeyType="search"
            testID="section-search-input"
            autoCorrect={false}
          />
          {draftQuery.length > 0 ? (
            <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
              <Feather name="x" size={16} color={ASH} />
            </Pressable>
          ) : (
            <Pressable onPress={onCloseSearch} hitSlop={8} testID="section-search-close">
              <Feather name="x" size={16} color={ASH} />
            </Pressable>
          )}
          <Pressable
            onPress={onOpenFilters}
            hitSlop={8}
            style={styles.filterInSearch}
            testID="section-filter-toggle"
          >
            <Feather name="sliders" size={17} color={ACCENT} />
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
            <Ionicons name="search" size={18} color={ACCENT} />
            <AppText
              style={[
                styles.searchPlaceholder,
                { textAlign, color: draftQuery ? SNOW : ASH },
              ]}
              numberOfLines={1}
            >
              {draftQuery || t("search.discover.section.carWhere")}
            </AppText>
          </Pressable>
          {draftQuery.length > 0 ? (
            <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
              <Feather name="x" size={16} color={ASH} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onOpenFilters}
            hitSlop={8}
            style={styles.filterInSearch}
            testID="section-filter-toggle"
          >
            <Feather name="sliders" size={17} color={ACCENT} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  topBar: {
    alignItems: "center",
    minHeight: 40,
  },
  topSpacer: { flex: 1 },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  wordmarkRow: {
    alignItems: "center",
    gap: 8,
  },
  wordmarkBoom: {
    width: 72,
    height: 28,
  },
  wordmarkCar: {
    color: SNOW,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: "100%",
  },
  taglineRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
  },
  tagline: {
    color: ASH,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  poweredRow: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  poweredLabelInline: {
    color: ASH,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  poweredLogo: {
    width: 64,
    height: 16,
  },
  searchPill: {
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#141414",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  searchMainHit: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: SNOW,
    fontSize: 15,
    paddingVertical: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  filterInSearch: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: SNOW,
    fontSize: 9,
    fontWeight: "700",
  },
});
