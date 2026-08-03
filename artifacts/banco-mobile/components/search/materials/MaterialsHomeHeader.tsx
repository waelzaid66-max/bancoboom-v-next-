/**
 * B-CORE Industrial Hub — upper header only (materials).
 *
 * Identity + search + Filters (opens FilterSheet) + market welded beside BANCO.
 * Browse axes (type / origin / commodity) live as smart horizontal strips under
 * the header in SectionSearchApp — not duplicated as strip-wrecking chrome here.
 * Does NOT touch MiniAppBottomNav. No vanity counts. No fake hub.
 */
import { Feather, Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { AppText } from "@/components/AppText";
import { PHONE_COUNTRIES } from "@/constants/countryCodes";
import { CURRENCY_BY_MARKET } from "@/constants/listingCreateTaxonomy";
import { useI18n } from "@/context/LanguageContext";
import { marketCountryLabel } from "@/lib/searchTaxonomy";
import { sectionAccent } from "@/lib/sectionTheme";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const B_MARK = require("../../../assets/images/b-mark.png");
const HERO_PHOTO = require("../../../assets/images/categories/materials.jpg");

const ACCENT = sectionAccent("materials");
const VOID = "#000000";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";

/** Scroll travel the collapse maps over — matched to Cars and Property so all
 *  three sections answer a finger at the same rate. */
const COLLAPSE_SCROLL = 96;
/** The lockup's resting height as one row. The seal is the tallest thing in it
 *  at 46; 46 is therefore the number, not a guess at one. */
const LOCKUP_HEIGHT = 46;
const LOCKUP_SCALE_MIN = 0.82;
const HAIRLINE = "rgba(255,255,255,0.16)";

type Props = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  marketCountry: string;
  sort: string;
  inputRef: React.RefObject<RNTextInput | null>;
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
  /**
   * Which slice to paint — the Facilities model.
   *
   *   "pinned"  A top bar · B brand lockup · C search  → held above the list
   *   "scroll"  D tagline                              → handed to the list
   *   "all"     everything, original order             → the unsplit default
   */
  slot?: "all" | "pinned" | "scroll";
  /** List offset, published by SearchResultsSurface. Pinned slice only. */
  scrollY?: SharedValue<number>;
};

type FeatherName = React.ComponentProps<typeof Feather>["name"];

function sortIcon(sort: string): FeatherName {
  if (sort === "price_asc") return "trending-up";
  if (sort === "price_desc") return "trending-down";
  if (sort === "newest") return "clock";
  return "list";
}

export function MaterialsHomeHeader({
  searchOpen,
  draftQuery,
  searchSaved,
  activeFilterCount,
  marketCountry,
  sort,
  inputRef,
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
  slot = "all",
  scrollY,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  // Lift header block ~3mm (~19dp) for more results space (owner 2026-07-31).
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 4 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const sortActive = sort !== "recommended";

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

  const showPinned = slot === "all" || slot === "pinned";
  const showScroll = slot === "all" || slot === "scroll";

  // Collapse, same contract as Cars and Property: read the shared offset on the
  // UI thread, interpolate, never re-render. Straight mapping — no spring, so
  // nothing can overshoot into the top bar.
  const lockupCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return {
      opacity: 1 - p,
      height: LOCKUP_HEIGHT * (1 - p),
      transform: [{ scale: 1 + (LOCKUP_SCALE_MIN - 1) * p }],
    };
  });

  const liftCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return {
      shadowOpacity: 0.18 + 0.34 * p,
      shadowRadius: 8 + 12 * p,
      elevation: 2 + 10 * p,
    };
  });

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: slot === "scroll" ? 0 : Math.max(0, topPad - 6) },
        showPinned && !showScroll ? styles.pinnedShell : null,
        showPinned && !showScroll ? liftCollapse : null,
      ]}
      testID={slot === "scroll" ? "materials-scroll-band" : "materials-core-header"}
    >
      {showPinned ? (
      <View style={[styles.topBar, { flexDirection: rowDir }]}>
        <Pressable
          onPress={onBack}
          style={styles.iconHit}
          hitSlop={12}
          testID="section-back"
          accessibilityRole="button"
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
          testID="materials-header-map"
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

      {/* Brand lockup — ONE row, pinned.
              It was three: the wordmark row, a ruled tagline, then a powered-by
              row carrying BANCO and the market weld. Nothing is dropped —
              powered-by and market weld to the trailing end of this same row,
              and the tagline moves down into the scrolling slice, where prose
              belongs and where it no longer holds a slice of the viewport for
              the whole session. Every testID and handler stays. */}
      {showPinned ? (
        <Animated.View
          style={[
            styles.brandLockup,
            { flexDirection: rowDir },
            slot === "all" ? null : lockupCollapse,
          ]}
          testID="materials-core-brand"
        >
          <Image source={B_MARK} style={styles.wordmarkB} contentFit="contain" />
          <View style={styles.wordmarkTextCol}>
            <AppText style={styles.wordmarkCore} numberOfLines={1}>
              {t("search.discover.section.materialsBrand")}
            </AppText>
            <AppText style={styles.wordmarkHub} numberOfLines={1}>
              {t("search.discover.section.materialsHubLabel")}
            </AppText>
          </View>
          <View style={styles.heroSeal} testID="materials-core-seal">
            <Image source={HERO_PHOTO} style={styles.heroSealPhoto} contentFit="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.55)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroSealMark}>
              <Image source={B_MARK} style={styles.heroSealB} contentFit="contain" />
            </View>
          </View>

          <View style={styles.brandSpacer} />

          <View
            style={[
              styles.bancoMarketWeld,
              { flexDirection: rowDir },
            ]}
            testID="materials-powered-market-row"
          >
          {/* Caption ABOVE the mark, not beside it. Side by side the pair cost
              enough of the row that "POWERED BY" truncated to "POWE…" once the
              three rows became one — and a clipped caption reads as breakage,
              not as compression. Stacked, it is what it always was: a caption
              on the logo. */}
          <View style={styles.poweredCol}>
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
          <Pressable
            onPress={onOpenMarket}
            style={[styles.marketWeld, { flexDirection: rowDir }]}
            accessibilityLabel={marketMeta.a11y}
            testID="materials-market-beside-banco"
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
        </Animated.View>
      ) : null}

      {/* Search + Filters → FilterSheet (the open/close refinements sheet).
              Pinned, and it has to be: the empty and error states render as an
              absolute overlay on the results, so anything living inside the
              list is unreachable in exactly the states a user most needs to
              change their query from. */}
      {showPinned ? (
      searchOpen ? (
        <View style={[styles.searchPill, { flexDirection: rowDir }]}>
          <Ionicons name="search" size={16} color={ACCENT} />
          <TextInput
            ref={inputRef}
            value={draftQuery}
            onChangeText={onQueryChange}
            onSubmitEditing={onSubmitQuery}
            placeholder={t("search.discover.section.materialsWhere")}
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
              {draftQuery || t("search.discover.section.materialsWhere")}
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

      {/* Tagline — moved down out of the pinned lockup. It is prose, not a
              control, so it reads once at the top of the results and then
              leaves with them instead of holding the viewport all session. */}
      {showScroll ? (
        <View style={[styles.taglineRow, { flexDirection: rowDir }]}>
          <View style={styles.taglineRule} />
          <AppText style={styles.tagline} numberOfLines={1}>
            {t("search.discover.section.materialsTagline")}
          </AppText>
          <View style={styles.taglineRule} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingHorizontal: 16,
    paddingBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  /** Only the pinned slice — it is the piece that sits OVER the results, so it
   *  is the piece that casts a shadow. The scrolling slice is inside the list,
   *  where a shadow would trail the tagline down the screen. */
  pinnedShell: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  topBar: { alignItems: "center", minHeight: 24, gap: 2 },
  topSpacer: { flex: 1 },
  iconHit: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  sortHit: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sortHitActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  /** One row, replacing the three-row brandBlock. `overflow: hidden` is what
   *  lets the animated height close it cleanly rather than squashing what is
   *  inside it on the way down. */
  brandLockup: {
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    overflow: "hidden",
  },
  /** Identity leads, controls trail — the reading order the block had when it
   *  was three stacked rows. */
  brandSpacer: { flex: 1 },
  poweredCol: { alignItems: "center", flexShrink: 0 },
  wordmarkB: { width: 34, height: 42 },
  wordmarkTextCol: { gap: 0, flexShrink: 1 },
  heroSeal: {
    width: 56,
    height: 46,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(168,42,28,0.55)",
    marginInlineStart: 2,
  },
  heroSealPhoto: { ...StyleSheet.absoluteFillObject },
  heroSealMark: {
    position: "absolute",
    left: 3,
    bottom: 3,
    width: 16,
    height: 20,
  },
  heroSealB: { width: 16, height: 20 },
  wordmarkCore: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: ACCENT,
    letterSpacing: 2,
  },
  wordmarkHub: {
    fontSize: 9.5,
    fontFamily: "Inter_600SemiBold",
    color: SNOW,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 8,
    marginBottom: 1,
  },
  taglineRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: ACCENT,
    maxWidth: 36,
    opacity: 0.85,
  },
  tagline: {
    fontSize: 8.5,
    fontFamily: "Inter_500Medium",
    color: ASH,
    textAlign: "center",
    flexShrink: 1,
  },
  bancoMarketWeld: {
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    flexShrink: 1,
    marginBottom: 1,
  },
  poweredLabelInline: {
    fontSize: 7,
    fontFamily: "Inter_500Medium",
    color: ASH,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  poweredLogo: { width: 52, height: 12 },
  marketWeld: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  marketFlag: { fontSize: 11, lineHeight: 13 },
  marketCaption: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: ASH,
    letterSpacing: 0.4,
  },
  searchPill: {
    height: 40,
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
    minHeight: 38,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: SNOW,
    padding: 0,
  },
  filterInSearch: { position: "relative", padding: 4 },
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
});
