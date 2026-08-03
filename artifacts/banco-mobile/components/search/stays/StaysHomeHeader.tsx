/**
 * BOOM STAY — premium black header (visual shell).
 *
 * Presentational only: same Stay actions as the former rose hero
 * (back · save · search · filter · property-type tabs). No hotels.
 * Parent (`BookingStaysApp`) owns all search state and handlers.
 *
 * ─── 2026-08-03 · rebuilt on the Cars header's approved shape ───────────────
 *
 * ⚠️ NO DESIGN RENDER EXISTS FOR THIS SECTION. Cars, Properties and B-CORE all
 * have one from the owner; Stays does not. Everything below that is a judgement
 * rather than a measurement is DERIVED from CarsHomeHeader — the sibling the
 * owner approved — and is marked as such so it can be corrected against a real
 * render later without archaeology.
 *
 * What was wrong, measured from the team's own 390dp capture
 * (audit/handoff/evidence/10-sec-booking-390dp.png, 612px ÷ 2 = 306dp, 36% of
 * an 844dp screen before the first card):
 *
 *   1. Branding stacked FOUR rows — wordmark, tagline, "POWERED BY" orphaned on
 *      a line of its own, then the BANCO mark on a fourth. ~100dp for identity.
 *   2. Two reds inside one wordmark: boom-logo.png measures ~#A00000 while the
 *      word STAY was painted in STAYS_ACCENT (#B81E3C). Cars solved this by
 *      painting its word SNOW — the owner's render shows "CAR" white. Same fix
 *      applied here, which also ends the clash rather than papering over it.
 *   3. Old neutrals (#000000 / #8E8E93). Cars moved to #090909 / #A5A5A5.
 *   4. No collapse at all — the header held 306dp forever.
 *   5. The type strip ran off the right edge with nothing to say so.
 *   6. Touch targets at 40×40, under the 44 the brief asks for.
 *
 * Band layout follows Cars exactly:
 *   A  top bar   back · wordmark + powered-by · map · save        [pinned]
 *   B  tagline   identity text, fades on collapse                 [pinned]
 *   C  search    one pill, filter inline                          [pinned]
 *   D  type tabs All / Studio / Apartment / Villa / Chalet        [pinned]
 *
 * 🔒 ALL FOUR BANDS ARE PINNED, and the collapse is what gives the screen back
 * rather than handing anything to the list. The results overlay is an opaque
 * StyleSheet.absoluteFill covering ListHeaderComponent, so whatever goes in the
 * scrolling slot disappears exactly when results are empty or loading. That is
 * what broke this section in 80b1a17 and was reverted in fdbb4ff.
 *
 * The tagline was tried in the scrolling slot and measured: it vanished from
 * every loading and empty render, so the section lost "Banco Owners Open
 * Market" precisely when it had nothing else to say. It is pinned and animates
 * its own height to zero on scroll instead — same vertical back, identity
 * never dropped.
 *
 * STILL OPEN, deliberately not decided here:
 *   • Stays has no accent of its own — STAYS_ACCENT is sectionAccent("real_estate").
 *     Adding a `booking` token is an identity call and the owner has an open
 *     decision on the brand red (#FF1E1E), so the borrow stays visible instead
 *     of being quietly replaced.
 *   • No hero plate and no trust row: neither asset exists for this section.
 */
import { Feather, Ionicons } from "@/components/icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { STAYS_ACCENT } from "@/components/StayCard";
import { SECTION_NEUTRAL } from "@/lib/sectionTheme";
import { useI18n } from "@/context/LanguageContext";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const BOOM_LOGO = require("../../../assets/images/boom-logo.png");

/** Neutrals lifted from CarsHomeHeader so the two sections read as one system.
 *  The real fix is one shared token file — logged as debt, not done here. */
const VOID = SECTION_NEUTRAL.void;
const SNOW = SECTION_NEUTRAL.snow;
const ASH = SECTION_NEUTRAL.ash;
const HAIRLINE = SECTION_NEUTRAL.hairline;

/** The owner's spec sheet: expanded 88–100, collapsed 56–64. Cars settled on
 *  94 → 60 and this matches it rather than picking a second pair of numbers. */
const HEADER_EXPANDED = 94;
const HEADER_COLLAPSED = 60;
/** Travel the collapse maps over — deliberately longer than the 34dp of height
 *  it removes, so the header answers the scroll instead of snapping shut. */
const COLLAPSE_SCROLL = 96;
const LOGO_SCALE_MIN = 0.82;
/** 48dp touch target. The brief asks for ≥44 and the old 40×40 hit boxes were
 *  under it — an accessibility defect, not a matter of taste. */
const TAP = 48;
const SEARCH_H = 54;
/** Tagline row height, animated to zero on collapse. */
const TAGLINE_H = 18;
const PAD_H = 16;

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
  /**
   * Which half to paint. Default "all" — every band in order, which is exactly
   * what the header did before, so `BookingStaysApp` needs no change to keep
   * working.
   *   "pinned" → top bar + search + type tabs. Always reachable.
   *   "scroll" → the tagline. Text only, safe to hand to a list header.
   */
  slot?: "all" | "pinned" | "scroll";
  /**
   * Scroll offset published by the results surface. Read by the "pinned" slot
   * only, and only to collapse. Derived on the UI thread, so scrolling causes
   * no React render. Absent ⇒ the header paints expanded and never moves.
   */
  scrollY?: SharedValue<number>;
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
  slot = "all",
  scrollY,
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
}: StaysHomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  // Owner rule: never invent a fake 67px web pad (it destroyed headers before).
  // Same sanctioned pattern as Search/Section/billing/analytics headers.
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  // Every band here is either a control or identity that must never vanish, so
  // all of them are pinned and "scroll" paints nothing. The prop stays on the
  // family contract: the day this section gets a hero plate, that is what goes
  // in the scrolling slot — and nothing else.
  const showPinned = slot === "all" || slot === "pinned";

  // The top row gives back 34dp as it collapses. Height only — the search pill
  // below keeps its own 54 whether the header is open or shut.
  const barCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return { height: HEADER_EXPANDED + (HEADER_COLLAPSED - HEADER_EXPANDED) * p };
  });

  // Scale, not resize: the glyphs stay on the GPU and never re-layout per frame.
  const logoCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return { transform: [{ scale: 1 + (LOGO_SCALE_MIN - 1) * p }] };
  });

  // The powered-by line is the row 60dp cannot hold, so it leaves first — over
  // the first 60% of the travel, before the wordmark is ever crowded.
  const poweredCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL * 0.6], [1, 0], Extrapolation.CLAMP)
      : 1;
    return { opacity: p };
  });

  // The tagline gives back its own height on the way down. Height as well as
  // opacity, so the rows below actually move up instead of leaving a gap.
  const taglineCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL * 0.5], [1, 0], Extrapolation.CLAMP)
      : 1;
    return {
      opacity: p,
      height: TAGLINE_H * p,
      marginTop: 6 * p,
      marginBottom: 6 * p,
    };
  });

  return (
    <View style={[styles.root, { paddingTop: Math.max(0, topPad - 1) }]} testID="stays-header">
      {showPinned ? (
      <>
      {/* Band A — top bar: back · brand · map · save.
          The brand sits INSIDE this row rather than under it. That is what took
          four stacked rows down to one, and it is also why the block can be
          pinned without pushing BANCO below the filters. */}
      <Animated.View style={[styles.topBar, { flexDirection: rowDir }, barCollapse]}>
        <View style={[styles.topSide, { flexDirection: rowDir }]}>
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
        </View>

        <View style={styles.brandBlock} testID="stays-boom-brand">
          <Animated.View
            style={[styles.wordmarkRow, { flexDirection: rowDir }, logoCollapse]}
          >
            <Image
              source={BOOM_LOGO}
              style={styles.wordmarkBoom}
              contentFit="contain"
            />
            {/* SNOW, not the accent. The mark's own red measures ~#A00000 and
                the accent is #B81E3C, so painting the word red put two reds
                side by side. The owner's Cars render shows "CAR" in white. */}
            <AppText style={styles.wordmarkStay} numberOfLines={1}>
              STAY
            </AppText>
          </Animated.View>
          <Animated.View
            style={[styles.poweredRow, { flexDirection: rowDir }, poweredCollapse]}
          >
            <AppText style={styles.poweredLabel} numberOfLines={1}>
              {t("booking.poweredBy")}
            </AppText>
            <Image
              source={BANCO_LOGO}
              style={styles.poweredLogo}
              contentFit="contain"
              tintColor={STAYS_ACCENT}
            />
          </Animated.View>
        </View>

        <View style={[styles.topActions, { flexDirection: rowDir }]}>
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
      </Animated.View>

      {/* Band B — tagline.
          PINNED, and it fades on collapse rather than being handed to the list.
          Putting it in the scrolling slot was tried and measured: the loading
          and empty overlays are opaque and cover ListHeaderComponent, so the
          section lost "Banco Owners Open Market" entirely whenever there were
          no results. Fading it on scroll gives the same vertical back without
          ever dropping the identity. */}
      <Animated.View style={[styles.taglineRow, taglineCollapse]}>
        <View style={styles.taglineRule} />
        <AppText style={styles.tagline} numberOfLines={1}>
          {t("search.discover.section.staysTagline")}
        </AppText>
        <View style={styles.taglineRule} />
      </Animated.View>

      {/* Band C — search pill (filter lives on the right, mock-aligned) */}
      {searchOpen ? (
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
      )}

      {/* Band D — property type tabs (no hotels).
          PINNED, deliberately: a buyer who lands on an empty result set needs
          this row to widen the search, and the empty-state overlay would cover
          it if it lived in the scrolling slot. */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { flexDirection: rowDir }]}
          style={styles.tabsScroll}
          testID="stays-type-strip-scroll"
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
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: active }}
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
        {/* Trailing fade — the strip overflows and used to end in a half-drawn
            tab with nothing to say there was more. Sits on the leading edge in
            RTL, and never eats taps. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(9,9,9,0)", VOID]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.tabsFade,
            isRTL
              ? { left: 0, transform: [{ scaleX: -1 }] }
              : { right: 0 },
          ]}
        />
      </View>
      </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingHorizontal: PAD_H,
    paddingBottom: 4,
  },
  topBar: {
    alignItems: "center",
    // Floor for the "all" slot, which has no scroll offset and never animates.
    minHeight: HEADER_COLLAPSED,
    gap: 4,
  },
  iconHit: {
    width: TAP,
    height: TAP,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Equal flanks so the centre gets a fixed budget and the wordmark gives way
   *  on a narrow screen rather than pushing a control off the row. */
  topSide: {
    minWidth: TAP,
    alignItems: "center",
  },
  topActions: {
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: TAP * 2,
    gap: 4,
  },
  brandBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  wordmarkRow: {
    alignItems: "center",
    gap: 6,
  },
  wordmarkBoom: {
    width: 74,
    height: 28,
    flexShrink: 0,
  },
  wordmarkStay: {
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    color: SNOW,
    letterSpacing: 2.5,
    // Never shrinks: the section name truncating to "ST…" is the exact defect
    // that shipped in Properties as "PRO…" before it was caught in a render.
    flexShrink: 0,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    maxWidth: "100%",
    paddingHorizontal: 8,
    overflow: "hidden",
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
  },
  /** "POWERED BY" and the mark share ONE row. They used to sit on two, which is
   *  the orphaned line the owner has raised repeatedly. */
  poweredRow: {
    alignItems: "center",
    gap: 5,
  },
  poweredLogo: {
    width: 58,
    height: 14,
  },
  searchPill: {
    height: SEARCH_H,
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
  tabsWrap: {
    marginTop: 8,
    marginHorizontal: -PAD_H,
  },
  tabsScroll: {},
  tabsFade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 28,
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
