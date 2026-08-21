/**
 * B-oom Car — unified native browse header.
 *
 * The hero is the master canvas. Search, map/list, save, filters, vehicle
 * categories, live stats and parent-owned CAR browse axes live inside one
 * bounded native surface. Criteria and handlers remain parent-owned.
 */
import { AppText } from "@/components/AppText";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import { Feather, Ionicons } from "@/components/icons";
import {
  VehicleGlyph,
  type VehicleGlyphName,
} from "@/components/search/car/VehicleGlyph";
import { useI18n } from "@/context/LanguageContext";
import { SECTION_NEUTRAL, sectionAccent } from "@/lib/sectionTheme";
import { Image } from "expo-image";
import React from "react";
import type { TextInput as RNTextInput } from "react-native";
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
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const BOOM_LOGO = require("../../../assets/images/boom-logo.png");
const HERO_PLATE = require("../../../assets/images/section-hero/car.png");

const VOID = SECTION_NEUTRAL.void;
const SECONDARY = SECTION_NEUTRAL.secondary;
const SURFACE = SECTION_NEUTRAL.surface;
const ACCENT = sectionAccent("car");
const ACCENT_BRIGHT = "#FF3A40";
const SNOW = SECTION_NEUTRAL.snow;
const ASH = SECTION_NEUTRAL.ash;
const STEEL = SECTION_NEUTRAL.steel;
const HAIRLINE = SECTION_NEUTRAL.hairline;

const HERO_MIN_HEIGHT = 244;
const HEADER_EXPANDED = 94;
const HEADER_COLLAPSED = 60;
const COLLAPSE_SCROLL = 96;
const LOGO_SCALE_MIN = 0.82;
const BOTTOM_RADIUS = 20;
const PAD_H = 16;
const TAP = 48;
const SEARCH_H = 52;
const SEARCH_R = 26;
const DOCK_OVERLAP = 96;
const DOCK_EXTRAS_MAX_HEIGHT = 300;

export const CAR_CATEGORIES: { key: VehicleGlyphName; i18nKey: string }[] = [
  { key: "cars", i18nKey: "search.discover.section.carTypeCars" },
  { key: "suv", i18nKey: "search.discover.section.carTypeSuv" },
  { key: "electric", i18nKey: "search.discover.section.carTypeElectric" },
  { key: "motorcycles", i18nKey: "search.discover.section.carTypeMotorcycles" },
  { key: "trucks", i18nKey: "search.discover.section.carTypeTrucks" },
  { key: "buses", i18nKey: "search.discover.section.carTypeBuses" },
  { key: "vans", i18nKey: "search.discover.section.carTypeVans" },
  { key: "heavy", i18nKey: "search.discover.section.carTypeHeavy" },
  { key: "boats", i18nKey: "search.discover.section.carTypeBoats" },
  { key: "yachts", i18nKey: "search.discover.section.carTypeYachts" },
  { key: "ships", i18nKey: "search.discover.section.carTypeShips" },
  { key: "aircraft", i18nKey: "search.discover.section.carTypeAircraft" },
  { key: "jets", i18nKey: "search.discover.section.carTypeJets" },
  { key: "helicopters", i18nKey: "search.discover.section.carTypeHelicopters" },
  { key: "agricultural", i18nKey: "search.discover.section.carTypeAgricultural" },
  { key: "construction", i18nKey: "search.discover.section.carTypeConstruction" },
  { key: "emergency", i18nKey: "search.discover.section.carTypeEmergency" },
  { key: "military", i18nKey: "search.discover.section.carTypeMilitary" },
  { key: "classic", i18nKey: "search.discover.section.carTypeClassic" },
  { key: "luxury", i18nKey: "search.discover.section.carTypeLuxury" },
  { key: "more", i18nKey: "search.discover.section.carTypeMore" },
];

export type CarHeroStat = { key: string; value: string; labelKey: string };

type Props = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  inputRef: React.RefObject<RNTextInput | null>;
  categories: { key: VehicleGlyphName; i18nKey: string }[];
  selectedCategory: VehicleGlyphName | null;
  stats: CarHeroStat[];
  notificationCount?: number;
  marketSlot?: React.ReactNode;
  controlsSlot?: React.ReactNode;
  /** Force the identity/hero/browse context into its compact native state. */
  compact?: boolean;
  /** Changes the map hit into a clear list-return affordance. */
  mapActive?: boolean;
  /** Kept for compatibility with earlier hosts; new Cars host closes itself. */
  continuesBelow?: boolean;
  slot?: "all" | "pinned" | "scroll";
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
  onSelectCategory: (key: VehicleGlyphName) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
};

export function CarsHomeHeader({
  searchOpen,
  draftQuery,
  searchSaved,
  activeFilterCount,
  inputRef,
  categories,
  selectedCategory,
  stats,
  notificationCount = 0,
  marketSlot,
  controlsSlot,
  compact = false,
  mapActive = false,
  continuesBelow = false,
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
  onSelectCategory,
  onOpenNotifications,
  onOpenProfile,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const alignStart = isRTL ? "flex-end" : "flex-start";
  const showPinned = slot === "all" || slot === "pinned";
  const showScroll = slot === "all" || slot === "scroll";

  const topCollapse = useAnimatedStyle(() => {
    const p = compact
      ? 1
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
        : 0;
    return {
      height: HEADER_EXPANDED + (HEADER_COLLAPSED - HEADER_EXPANDED) * p,
    };
  }, [compact]);

  const logoCollapse = useAnimatedStyle(() => {
    const p = compact
      ? 1
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
        : 0;
    return { transform: [{ scale: 1 + (LOGO_SCALE_MIN - 1) * p }] };
  }, [compact]);

  const poweredCollapse = useAnimatedStyle(() => {
    const opacity = compact
      ? 0
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL * 0.6], [1, 0], Extrapolation.CLAMP)
        : 1;
    return { opacity };
  }, [compact]);

  const heroCollapse = useAnimatedStyle(() => {
    const p = compact
      ? 0
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [1, 0], Extrapolation.CLAMP)
        : 1;
    return {
      opacity: p,
      height: HERO_MIN_HEIGHT * p,
      marginBottom: 12 * p,
    };
  }, [compact]);

  const plateExpanded = HEADER_EXPANDED + HERO_MIN_HEIGHT;
  const plateCollapse = useAnimatedStyle(() => {
    const p = compact
      ? 1
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
        : 0;
    return {
      height: plateExpanded + (HEADER_COLLAPSED - plateExpanded) * p,
    };
  }, [compact]);

  const dockCollapse = useAnimatedStyle(() => {
    const marginTop = compact
      ? 0
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [-DOCK_OVERLAP, 0], Extrapolation.CLAMP)
        : -DOCK_OVERLAP;
    return { marginTop };
  }, [compact]);

  const dockExtrasCollapse = useAnimatedStyle(() => {
    const p = compact
      ? 0
      : scrollY
        ? interpolate(scrollY.value, [28, COLLAPSE_SCROLL], [1, 0], Extrapolation.CLAMP)
        : 1;
    return {
      opacity: p,
      maxHeight: DOCK_EXTRAS_MAX_HEIGHT * p,
      marginTop: 7 * p,
    };
  }, [compact]);

  const liftCollapse = useAnimatedStyle(() => {
    const p = compact
      ? 1
      : scrollY
        ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
        : 0;
    return {
      shadowOpacity: 0.16 + 0.28 * p,
      shadowRadius: 8 + 10 * p,
      elevation: 3 + 8 * p,
    };
  }, [compact]);

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: slot === "scroll" ? 0 : topPad },
        showPinned && !showScroll && !continuesBelow ? styles.pinnedShell : null,
        showPinned && !showScroll && !continuesBelow ? liftCollapse : null,
        showPinned && !showScroll && continuesBelow ? styles.pinnedShellOpen : null,
      ]}
      testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
    >
      {(showPinned || showScroll) && (
        <Animated.View style={[styles.shellPlate, plateCollapse]} pointerEvents="none">
          <View style={styles.shellPlateImg}>
            <Image
              source={HERO_PLATE}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="bottom center"
              transition={180}
            />
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="carPlateFoot" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={VOID} stopOpacity="0.90" />
                  <Stop offset="0.24" stopColor={VOID} stopOpacity="0.10" />
                  <Stop offset="0.72" stopColor={VOID} stopOpacity="0.08" />
                  <Stop offset="1" stopColor={VOID} stopOpacity="0.95" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#carPlateFoot)" />
            </Svg>
          </View>
        </Animated.View>
      )}

      {showPinned && (
        <Animated.View style={[styles.topBar, { flexDirection: rowDir }, topCollapse]}>
          <View style={[styles.topSide, { flexDirection: rowDir }]}>
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
                size={22}
                color={SNOW}
              />
            </Pressable>
          </View>

          <View style={styles.brandBlock} testID="cars-boom-brand">
            <Animated.View style={[styles.wordmarkRow, { flexDirection: rowDir }, logoCollapse]}>
              <Image source={BOOM_LOGO} style={styles.wordmarkBoom} contentFit="contain" />
              <AppText
                style={styles.wordmarkCar}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {t("search.discover.section.carBrand")}
              </AppText>
            </Animated.View>
            <Animated.View style={[styles.poweredRow, { flexDirection: rowDir }, poweredCollapse]}>
              <AppText style={styles.poweredLabel} numberOfLines={1}>
                {t("booking.poweredBy")}
              </AppText>
              <Image
                source={BANCO_LOGO}
                style={styles.poweredLogo}
                contentFit="contain"
                tintColor={ACCENT}
              />
            </Animated.View>
          </View>

          <View style={[styles.topActions, { flexDirection: rowDir }]}>
            <Pressable
              onPress={onOpenNotifications}
              style={styles.iconHit}
              hitSlop={8}
              testID="cars-header-notifications"
              accessibilityRole="button"
              accessibilityLabel={t("notifications.title")}
            >
              <Feather name="bell" size={20} color={SNOW} />
              {notificationCount > 0 ? <View style={styles.bellDot} /> : null}
            </Pressable>
            <Pressable
              onPress={onOpenProfile}
              style={styles.iconHit}
              hitSlop={8}
              testID="cars-header-profile"
              accessibilityRole="button"
              accessibilityLabel={t("tabs.profile")}
            >
              <Feather name="user" size={20} color={SNOW} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {(showPinned || showScroll) && (
        <Animated.View style={[styles.hero, heroCollapse]} testID="cars-hero">
          <View style={styles.heroGlow} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="carHeroGround" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={SECONDARY} stopOpacity="0.35" />
                  <Stop offset="0.65" stopColor={VOID} stopOpacity="0.15" />
                  <Stop offset="1" stopColor={VOID} stopOpacity="0.68" />
                </LinearGradient>
                <RadialGradient id="carHeroKey" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={ACCENT} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#carHeroGround)" />
              <Ellipse cx="76%" cy="52%" rx="58%" ry="72%" fill="url(#carHeroKey)" />
            </Svg>
          </View>
        </Animated.View>
      )}

      {showPinned && (
        <Animated.View style={[styles.dock, dockCollapse]} testID="cars-unified-dock">
          <View style={[styles.searchRow, { flexDirection: rowDir }]}>
            <View style={[styles.searchPill, { flexDirection: rowDir }]}>
              <Ionicons name="search" size={19} color={ACCENT} />
              {searchOpen ? (
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
              ) : (
                <Pressable
                  onPress={onOpenSearch}
                  style={styles.searchMainHit}
                  testID="section-search-open"
                >
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
              )}

              {draftQuery.length > 0 ? (
                <Pressable onPress={onClearQuery} hitSlop={8} testID="section-search-clear">
                  <Feather name="x" size={16} color={ASH} />
                </Pressable>
              ) : searchOpen ? (
                <Pressable onPress={onCloseSearch} hitSlop={8} testID="section-search-close">
                  <Feather name="x" size={16} color={ASH} />
                </Pressable>
              ) : null}

              <View style={styles.pillDivider} />
              <Pressable
                onPress={onOpenMap}
                style={[styles.pillIcon, mapActive ? styles.pillIconActive : null]}
                hitSlop={6}
                testID="cars-header-map"
                accessibilityRole="button"
                accessibilityLabel={
                  mapActive ? t("search.viewList") : t("search.discover.section.deskMap")
                }
                accessibilityState={{ selected: mapActive }}
              >
                <Ionicons
                  name={mapActive ? "list" : "map"}
                  size={18}
                  color={mapActive ? ACCENT : STEEL}
                />
              </Pressable>
              <Pressable
                onPress={onSaveSearch}
                disabled={searchSaved}
                style={styles.pillIcon}
                hitSlop={6}
                testID="section-save-search"
                accessibilityRole="button"
                accessibilityLabel={t("search.saveSearch")}
              >
                <Feather
                  name="bookmark"
                  size={18}
                  color={searchSaved ? ACCENT : STEEL}
                />
              </Pressable>
            </View>

            {marketSlot ? (
              <View style={styles.marketSlot} testID="cars-header-market">
                {marketSlot}
              </View>
            ) : null}

            <Pressable
              onPress={onOpenFilters}
              style={styles.filterButton}
              testID="section-filter-toggle"
              accessibilityRole="button"
              accessibilityLabel={t("search.filters")}
            >
              <Feather name="sliders" size={20} color={SNOW} />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
                </View>
              ) : null}
            </Pressable>
          </View>

          <Animated.View
            style={[styles.dockExtras, dockExtrasCollapse]}
            testID="cars-dock-extras"
            pointerEvents={compact ? "none" : "auto"}
          >
            {categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={[styles.catContent, { flexDirection: rowDir }]}
                testID="cars-category-strip"
              >
                {categories.map((category) => {
                  const active = selectedCategory === category.key;
                  return (
                    <Pressable
                      key={category.key}
                      onPress={() => onSelectCategory(category.key)}
                      style={styles.catItem}
                      testID={`cars-category-${category.key}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <View style={[styles.catTile, active && styles.catTileActive]}>
                        <VehicleGlyph
                          name={category.key}
                          size={24}
                          color={active ? SNOW : STEEL}
                        />
                      </View>
                      <AppText
                        style={[styles.catLabel, active && styles.catLabelActive]}
                        numberOfLines={1}
                      >
                        {t(category.i18nKey)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {stats.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.statScroll}
                contentContainerStyle={[styles.statStrip, { flexDirection: rowDir }]}
                testID="cars-stats-strip"
              >
                {stats.map((stat, index) => (
                  <View key={stat.key} style={[styles.statCell, { flexDirection: rowDir }]}>
                    {index > 0 ? <View style={styles.statDivider} /> : null}
                    <View style={{ alignItems: alignStart }}>
                      <AppText style={styles.statValue} numberOfLines={1}>
                        {stat.value}
                      </AppText>
                      <AppText style={styles.statLabel} numberOfLines={1}>
                        {t(stat.labelKey)}
                      </AppText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {controlsSlot ? (
              <View style={styles.controlsSlot} testID="cars-controls-slot">
                {controlsSlot}
              </View>
            ) : null}
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    backgroundColor: VOID,
    zIndex: 10,
  },
  pinnedShell: {
    borderBottomLeftRadius: BOTTOM_RADIUS,
    borderBottomRightRadius: BOTTOM_RADIUS,
    overflow: "visible",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
  },
  pinnedShellOpen: {
    marginBottom: -10,
    zIndex: 10,
  },
  shellPlate: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  shellPlateImg: {
    width: "100%",
    aspectRatio: 1216 / 453,
    overflow: "hidden",
  },
  topBar: {
    minHeight: HEADER_COLLAPSED,
    paddingHorizontal: PAD_H,
    alignItems: "center",
    gap: 4,
  },
  topSide: {
    minWidth: TAP,
    alignItems: "center",
  },
  topActions: {
    minWidth: TAP * 2 + 8,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  iconHit: {
    width: TAP,
    height: TAP,
    borderRadius: TAP / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(24,24,27,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    overflow: "hidden",
  },
  bellDot: {
    position: "absolute",
    top: 13,
    end: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_BRIGHT,
    borderWidth: 1.5,
    borderColor: SECONDARY,
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  wordmarkRow: {
    minWidth: 0,
    alignItems: "center",
    flexShrink: 1,
    gap: 6,
  },
  wordmarkBoom: {
    width: 68,
    height: 26,
    flexShrink: 1,
  },
  wordmarkCar: {
    color: SNOW,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.5,
    flexShrink: 1,
  },
  poweredRow: {
    alignItems: "center",
    gap: 5,
  },
  poweredLabel: {
    color: ASH,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  poweredLogo: {
    width: 58,
    height: 14,
    flexShrink: 1,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.52,
  },
  dock: {
    position: "relative",
    zIndex: 20,
    paddingTop: 8,
    paddingBottom: 9,
    backgroundColor: "rgba(9,9,9,0.985)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  dockExtras: {
    overflow: "hidden",
    flexGrow: 0,
    minHeight: 0,
  },
  controlsSlot: {
    flexGrow: 0,
    minHeight: 0,
    maxWidth: "100%",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  searchRow: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: PAD_H,
    minWidth: 0,
  },
  searchPill: {
    flex: 1,
    minWidth: 0,
    height: SEARCH_H,
    borderRadius: SEARCH_R,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(27,27,31,0.96)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  searchMainHit: {
    flex: 1,
    minWidth: 0,
    height: SEARCH_H,
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: SNOW,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchPlaceholder: {
    fontSize: 15,
    flexShrink: 1,
  },
  pillDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: HAIRLINE,
    flexShrink: 0,
  },
  pillIcon: {
    width: 26,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pillIconActive: {
    backgroundColor: `${ACCENT}22`,
  },
  marketSlot: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 116,
  },
  filterButton: {
    width: TAP,
    height: TAP,
    borderRadius: TAP / 2,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.20)",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 9,
    elevation: 6,
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    end: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VOID,
  },
  filterBadgeText: {
    color: SNOW,
    fontSize: 10,
    fontWeight: "700",
  },
  catScroll: {
    flexGrow: 0,
    maxHeight: 67,
  },
  catContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  catItem: {
    width: 58,
    alignItems: "center",
    gap: 4,
  },
  catTile: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  catTileActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  catLabel: {
    color: ASH,
    fontSize: 10,
    textAlign: "center",
  },
  catLabelActive: {
    color: SNOW,
  },
  statScroll: {
    flexGrow: 0,
    marginTop: 4,
    maxHeight: 30,
  },
  statStrip: {
    minHeight: 25,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statCell: {
    alignItems: "center",
    gap: 10,
    paddingEnd: 12,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: HAIRLINE,
  },
  statValue: {
    color: SNOW,
    fontSize: 14,
    fontWeight: "800",
  },
  statLabel: {
    color: ASH,
    fontSize: 10,
  },
});
