/**
 * BOOM STAY — premium black header (visual shell).
 *
 * Presentational only: same Stay actions as the former rose hero
 * (back · save · search · filter · property-type tabs). No hotels.
 * Parent (`BookingStaysApp`) owns all search state and handlers.
 */
import { Feather, Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { STAYS_ACCENT } from "@/components/StayCard";
import { useI18n } from "@/context/LanguageContext";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const BOOM_LOGO = require("../../../assets/images/boom-logo.png");

const VOID = "#000000";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";
const HAIRLINE = "rgba(255,255,255,0.16)";

export type StayTypeTab = {
  value: string;
  label: string;
};

type StaysHomeHeaderProps = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  activeStayType: string;
  typeTabs: StayTypeTab[];
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
  onSelectType: (value: string) => void;
  /**
   * Which slice to draw. Default "all" is the pre-split behaviour exactly, so
   * any caller that passes nothing renders what it always did.
   *
   *   pinned — top bar · brand lockup · search   (stays above the results)
   *   scroll — the type tabs                     (travel with the list)
   *
   * The brand sits in the PINNED slice on purpose. Its block is a sibling of
   * the top bar here, not a child as in Cars, so pinning the top bar alone
   * would push BANCO down into the list and under the filter chips — which the
   * owner's brief forbids. Widening the pinned slice keeps the branding exactly
   * where it is without moving a single node in the tree.
   */
  slot?: "all" | "pinned" | "scroll";
};

/** Names must exist in `@/components/icons` ICONS registry (runtime + types). */
function tabIcon(value: string): React.ComponentProps<typeof Ionicons>["name"] {
  switch (value) {
    case "__all__":
      return "business-outline";
    case "studio":
      return "bed-outline";
    case "apartment":
      return "business-outline";
    case "villa":
      return "home";
    case "chalet":
      return "grid-outline";
    default:
      return "radio-button-off";
  }
}

export function StaysHomeHeader({
  searchOpen,
  draftQuery,
  searchSaved,
  activeFilterCount,
  activeStayType,
  typeTabs,
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
  onSelectType,
  slot = "all",
}: StaysHomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  // Owner rule: never invent a fake 67px web pad (it destroyed headers before).
  // Same sanctioned pattern as Search/Section/billing/analytics headers.
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const showPinned = slot === "all" || slot === "pinned";
  const showScroll = slot === "all" || slot === "scroll";

  return (
    <View
      style={[
        styles.root,
        { paddingTop: slot === "scroll" ? 0 : Math.max(0, topPad - 1) },
      ]}
      testID={slot === "scroll" ? "stays-hero-band" : "stays-header"}
    >
      {/* Band A — top actions · PINNED */}
      {showPinned ? (
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <Pressable
          onPress={onBack}
          style={styles.iconHit}
          hitSlop={12}
          testID="stays-back"
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
          testID="stays-header-map"
          accessibilityRole="button"
          accessibilityLabel={t("search.discover.section.deskMap")}
        >
          <Ionicons name="map" size={20} color={SNOW} />
        </Pressable>
        <Pressable
          onPress={onSaveSearch}
          disabled={searchSaved}
          style={styles.iconHit}
          testID="stays-save-search"
          accessibilityRole="button"
        >
          <Feather
            name="bookmark"
            size={20}
            color={searchSaved ? STAYS_ACCENT : SNOW}
          />
        </Pressable>
      </View>

      ) : null}

      {/* Band B — brand · PINNED, and now one row instead of four.
          It used to stack wordmark, tagline, a POWERED BY label and the BANCO
          logo vertically — the "POWERED BY eats its own line" defect the owner
          reported, and the tallest brand block of the five sections. Every
          element survives; they sit side by side. The two decorative rules that
          used to flank the tagline are the one exception: they existed only to
          centre it across a full-width row and have no meaning in a left-led
          lockup. */}
      {showPinned ? (
        <View
          style={[styles.brandLockup, { flexDirection: rowDir }]}
          testID="stays-brand"
        >
          <Image
            source={BOOM_LOGO}
            style={styles.wordmarkBoom}
            contentFit="contain"
          />
          <AppText
            style={[styles.wordmarkStay, styles.wordmarkStayCompact]}
            numberOfLines={1}
          >
            STAY
          </AppText>

          <View style={styles.brandSpacer} />

          <AppText style={styles.poweredLabel} numberOfLines={1}>
            {t("booking.poweredBy")}
          </AppText>
          <Image
            source={BANCO_LOGO}
            style={styles.poweredLogo}
            contentFit="contain"
            tintColor={STAYS_ACCENT}
          />
        </View>
      ) : null}

      {/* Band C — search · PINNED. Filters must stay reachable at all times:
          the empty and error states overlay the list, so anything inside it can
          be covered. */}
      {showPinned ? (
      searchOpen ? (
        <View style={[styles.searchPill, { flexDirection: rowDir }]}>
          <Ionicons name="search" size={18} color={STAYS_ACCENT} />
          <TextInput
            ref={inputRef}
            value={draftQuery}
            onChangeText={onQueryChange}
            onSubmitEditing={onSubmitQuery}
            placeholder={t("search.discover.section.staysWhere")}
            placeholderTextColor={ASH}
            style={[styles.searchInput, { textAlign }]}
            returnKeyType="search"
            testID="stays-search-input"
            autoCorrect={false}
          />
          {draftQuery.length > 0 ? (
            <Pressable onPress={onClearQuery} hitSlop={8} testID="stays-search-clear">
              <Feather name="x" size={16} color={ASH} />
            </Pressable>
          ) : (
            <Pressable onPress={onCloseSearch} hitSlop={8} testID="stays-search-close">
              <Feather name="x" size={16} color={ASH} />
            </Pressable>
          )}
          <Pressable
            onPress={onOpenFilters}
            hitSlop={8}
            style={styles.filterInSearch}
            testID="stays-filter-toggle"
          >
            <Feather name="sliders" size={17} color={STAYS_ACCENT} />
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
            testID="stays-search-toggle"
          >
            <Ionicons name="search" size={18} color={STAYS_ACCENT} />
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
              {draftQuery || t("search.discover.section.staysWhere")}
            </AppText>
          </Pressable>
          {draftQuery.length > 0 ? (
            <Pressable onPress={onClearQuery} hitSlop={8} testID="stays-search-clear">
              <Feather name="x" size={16} color={ASH} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onOpenFilters}
            hitSlop={8}
            style={styles.filterInSearch}
            testID="stays-filter-toggle"
          >
            <Feather name="sliders" size={17} color={STAYS_ACCENT} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      )
      ) : null}

      {/* Band D0 — tagline · SCROLLS AWAY. Measured at 320 and 390dp, the pinned
          row could not hold logo + STAY + tagline + powered-by: the tagline
          rendered "Banco Owne…" and POWERED BY rendered "POW…". A truncated
          brand line says less than no brand line. It is descriptive rather than
          identity, so it moves to the band that has the full width — and gets
          back the two rules that centred it. */}
      {showScroll ? (
        <View style={styles.taglineRow}>
          <View style={styles.taglineRule} />
          <AppText style={styles.tagline} numberOfLines={1}>
            {t("search.discover.section.staysTagline")}
          </AppText>
          <View style={styles.taglineRule} />
        </View>
      ) : null}

      {/* Band D — property type tabs · SCROLLS AWAY with the results */}
      {showScroll ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsRow, { flexDirection: rowDir }]}
        style={styles.tabsScroll}
      >
        {typeTabs.map((tab, index) => {
          const active = activeStayType === tab.value;
          const tint = active ? STAYS_ACCENT : ASH;
          return (
            <React.Fragment key={tab.value}>
              {index > 0 ? <View style={styles.tabDivider} /> : null}
              <Pressable
                onPress={() => onSelectType(tab.value)}
                style={styles.tabItem}
                testID={`stays-type-${tab.value}`}
              >
                <Ionicons name={tabIcon(tab.value)} size={20} color={tint} />
                <AppText style={[styles.tabLabel, { color: tint }]} numberOfLines={1}>
                  {tab.label}
                </AppText>
              </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  topBar: {
    alignItems: "center",
    minHeight: 40,
    marginBottom: 0,
  },
  topSpacer: { flex: 1 },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  // One horizontal row. `brandBlock` and `wordmarkRow` are kept below because
  // they still describe the pre-split shape a caller passing slot="all" without
  // the split would land on; nothing references them at runtime today.
  brandLockup: {
    alignItems: "center",
    // Wrap rather than truncate. At 320dp the row cannot hold every element;
    // two short rows read correctly where "S.." and "P..." do not.
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 4,
  },
  brandTextCol: { justifyContent: "center", flexShrink: 1 },
  // Type only. The BOOM logo keeps its 108×40 — "Do NOT shrink the logo", and
  // the 320dp measurement showed shrinking is what clips a mark, not what
  // saves it. The row absorbs narrow screens by letting this column shrink and
  // the tagline truncate, never by scaling the mark.
  wordmarkStayCompact: {
    fontSize: 17,
    letterSpacing: 2,
    lineHeight: 21,
  },
  taglineCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  brandSpacer: { flex: 1, minWidth: 8 },
  brandBlock: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 6,
  },
  wordmarkRow: {
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  wordmarkBoom: {
    width: 108,
    height: 40,
  },
  wordmarkStay: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: STAYS_ACCENT,
    letterSpacing: 3.5,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: "100%",
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  taglineRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: STAYS_ACCENT,
    maxWidth: 56,
    opacity: 0.85,
  },
  tagline: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: ASH,
    textAlign: "center",
  },
  poweredLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: ASH,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  poweredRow: {
    alignItems: "center",
    gap: 6,
  },
  poweredLogo: {
    width: 72,
    height: 18,
  },
  searchPill: {
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
    backgroundColor: VOID,
    borderWidth: 1.5,
    borderColor: STAYS_ACCENT,
  },
  searchMainHit: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    minHeight: 48,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
    backgroundColor: STAYS_ACCENT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 9.5,
    fontFamily: "Inter_700Bold",
    color: SNOW,
  },
  tabsScroll: {
    marginTop: 8,
    marginHorizontal: -16,
  },
  tabsRow: {
    alignItems: "stretch",
    paddingHorizontal: 12,
    gap: 0,
    minHeight: 48,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    minWidth: 68,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  tabDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "center",
    height: 28,
    backgroundColor: HAIRLINE,
  },
});
