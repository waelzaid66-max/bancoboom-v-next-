/**
 * B-oom Car — GLOBAL VEHICLE MARKETPLACE hero (owner spec 2026-08-01).
 *
 * Replaces the crowded filter area that used to open this mini-app. The rule
 * the old header broke: a filter axis may never paint itself across the first
 * screen. Filters now live behind ONE control — the accent button on the search
 * row (FilterSheet) — plus the collapsible advanced block the parent renders
 * BELOW the categories. Nothing in this file may render a filter chip.
 *
 * Band order is fixed (8pt rhythm, nothing crowds its neighbour):
 *   A  top bar     back · BOOM+CAR wordmark + powered-by · bell · profile
 *   B  hero        title / subtitle / trust features + red ambient lighting
 *   C  search      one pill (map + save inline) + accent Filters button
 *   D  categories  vehicle-type quick scroll (drives free-text q, see below)
 *   E  stats       thin strip, ONLY renders the numbers it is actually given
 *
 * Contracts held by tests (section-miniapp-guard):
 *   • testID="cars-home-header" and testID="cars-header-map" stay here.
 *   • The country/currency control and the sort cycle keep their single seat on
 *     the parent strip. This header renders neither — no dual seat, and the
 *     guard greps this file for both, so do not name them here either.
 *
 * NOTHING HERE IS DECORATIVE COPY. Owner rule 2026-08-01: every number and
 * every browsable control must resolve to real inventory or not render at all.
 * Concretely:
 *   • `categories` arrives already gated on live facet counts. The API has no
 *     vehicle-type field yet (see the note on CAR_CATEGORIES), so today the
 *     parent passes [] and Band D does not paint. It lights up by itself the
 *     day the facet exists — no edit here.
 *   • `stats` renders only entries the parent could prove. Empty ⇒ no band.
 *   • The trust row states capabilities this repo actually ships. Do not add a
 *     line to it without a feature behind it.
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
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { VehicleGlyph, type VehicleGlyphName } from "./VehicleGlyph";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const BOOM_LOGO = require("../../../assets/images/boom-logo.png");

/** Owner spec: pure black ground, one accent, no multi-colour gradients. */
const VOID = "#050505";
const SURFACE = "#111111";
const ACCENT = "#E60012";
const SNOW = "#FFFFFF";
const ASH = "#8E8E93";
const STEEL = "#C7C7CC";
const HAIRLINE = "rgba(255,255,255,0.10)";

const HERO_MIN_HEIGHT = 244;

/** Trust row — monochrome only, accent is spent on the filter button.
 *
 *  Each line is a capability that EXISTS in this repo, checked before it was
 *  written here. Anything that cannot be pointed at is not a feature, it is an
 *  advert, and it does not belong on a marketplace people spend money in:
 *    verified   → listing/company `is_verified` + `trust_signal`
 *    shipping   → app/import-tracking · app/import/calculator · global-supply
 *    secure     → Paymob HMAC-verified webhooks + encrypted payment config
 *    import     → the whole app/import hub
 *    support    → in-app support requests (settings · import order)
 *  The mock said "24/7 Support". Support is real; the 24/7 is an availability
 *  promise nothing in this repo can keep, so the claim ships without it. */
const FEATURES: { icon: string; key: string }[] = [
  { icon: "shield-check", key: "search.discover.section.carTrustDealers" },
  { icon: "globe", key: "search.discover.section.carTrustShipping" },
  { icon: "lock", key: "search.discover.section.carTrustSecure" },
  { icon: "package", key: "search.discover.section.carTrustImport" },
  { icon: "headphones", key: "search.discover.section.carTrustSupport" },
];

/**
 * The owner's 21 quick categories, in mock order.
 *
 * ⚠️ THIS LIST IS A TARGET, NOT A DATA SOURCE. As of 2026-08-01 the backend
 * cannot tell a yacht from a sedan:
 *   • GET /v1/search  → `category` enum is [car, real_estate, industrial] only.
 *     There is no body_type / vehicle_type query parameter.
 *   • GET /v1/search/facets → FacetCounts exposes category, condition,
 *     fuel_type, transmission, payment_plan, property_type, finishing_type,
 *     offer_type, industrial_type, industry, origin_type. No vehicle type.
 *
 * So a tap on "Yachts" cannot filter — it could only free-text guess, and land
 * the user on an empty screen. lib/facets.ts states the house rule this would
 * break: "gate browse chips so we never surface a chip that returns nothing."
 *
 * Therefore the parent gates this list against live facets and today passes an
 * EMPTY array, so Band D does not render at all. Nothing fake ships. The day a
 * vehicle-type facet exists, point the gate at it and all 21 appear — the strip
 * and these glyphs are already built and waiting.
 */
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

/** A stat only reaches the strip when the parent has a real number for it.
 *  No vanity counts — an unknown number is an absent slot, never a guess. */
export type CarHeroStat = { key: string; value: string; labelKey: string };

type Props = {
  searchOpen: boolean;
  draftQuery: string;
  searchSaved: boolean;
  activeFilterCount: number;
  inputRef: React.RefObject<RNTextInput | null>;
  /** Already gated on live inventory by the parent. Empty ⇒ Band D is absent. */
  categories: { key: VehicleGlyphName; i18nKey: string }[];
  selectedCategory: VehicleGlyphName | null;
  stats: CarHeroStat[];
  notificationCount?: number;
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

  return (
    <View style={[styles.root, { paddingTop: topPad }]} testID="cars-home-header">
      {/* ── Band A — top bar. Back · brand · bell · profile. Nothing else. ── */}
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
            size={22}
            color={SNOW}
          />
        </Pressable>

        <View style={styles.brandBlock} testID="cars-boom-brand">
          <View style={[styles.wordmarkRow, { flexDirection: rowDir }]}>
            <Image
              source={BOOM_LOGO}
              style={styles.wordmarkBoom}
              contentFit="contain"
            />
            <AppText style={styles.wordmarkCar} numberOfLines={1}>
              {t("search.discover.section.carBrand")}
            </AppText>
          </View>
          <View style={[styles.poweredRow, { flexDirection: rowDir }]}>
            <AppText style={styles.poweredLabel} numberOfLines={1}>
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
      </View>

      {/* ── Band B — hero. Red ambient lighting only; no photo collage. ── */}
      <View style={styles.hero} testID="cars-hero">
        <View style={styles.heroGlow} pointerEvents="none">
          {/* Two soft red sources — a key light off to the trailing side and a
              floor bounce along the bottom edge. The ELLIPSE carries the shape
              (rx/ry); the gradient only carries the falloff (r), which is the
              only radius SVG's radialGradient actually has. */}
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="carHeroKey" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={ACCENT} stopOpacity="0.40" />
                <Stop offset="0.5" stopColor={ACCENT} stopOpacity="0.13" />
                <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="carHeroFloor" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={ACCENT} stopOpacity="0.22" />
                <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="74%" cy="46%" rx="58%" ry="72%" fill="url(#carHeroKey)" />
            <Ellipse cx="50%" cy="100%" rx="72%" ry="34%" fill="url(#carHeroFloor)" />
          </Svg>
        </View>

        <View style={[styles.heroCopy, { alignItems: alignStart }]}>
          <AppText style={[styles.heroTitleTop, { textAlign }]} numberOfLines={1}>
            {t("search.discover.section.carHeroTitleTop")}
          </AppText>
          <AppText style={[styles.heroTitleBottom, { textAlign }]} numberOfLines={1}>
            {t("search.discover.section.carHeroTitleBottom")}
          </AppText>
          <AppText style={[styles.heroSubtitle, { textAlign }]} numberOfLines={2}>
            {t("search.discover.section.carHeroSubtitle")}
          </AppText>

          <View style={[styles.featureList, { alignItems: alignStart }]}>
            {FEATURES.map((f) => (
              <View
                key={f.key}
                style={[styles.featureRow, { flexDirection: rowDir }]}
              >
                <Feather name={f.icon} size={13} color={STEEL} />
                <AppText style={styles.featureText} numberOfLines={1}>
                  {t(f.key)}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Band C — one search row. Map + save sit inline so the top bar can
              stay exactly as specced; Filters is the ONLY accent control. ── */}
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
            style={styles.pillIcon}
            hitSlop={6}
            testID="cars-header-map"
            accessibilityRole="button"
            accessibilityLabel={t("search.discover.section.deskMap")}
          >
            <Ionicons name="map" size={18} color={STEEL} />
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
            <Feather name="bookmark" size={18} color={searchSaved ? ACCENT : STEEL} />
          </Pressable>
        </View>

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

      {/* ── Band D — quick vehicle categories. Absent until live inventory can
              actually be filtered by vehicle type (see CAR_CATEGORIES). ── */}
      {categories.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={[
          styles.catContent,
          { flexDirection: rowDir },
        ]}
        testID="cars-category-strip"
      >
        {categories.map((c) => {
          const active = selectedCategory === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => onSelectCategory(c.key)}
              style={styles.catItem}
              testID={`cars-category-${c.key}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.catTile, active && styles.catTileActive]}>
                <VehicleGlyph
                  name={c.key}
                  size={26}
                  color={active ? SNOW : STEEL}
                />
              </View>
              <AppText
                style={[styles.catLabel, active && styles.catLabelActive]}
                numberOfLines={1}
              >
                {t(c.i18nKey)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      ) : null}

      {/* ── Band E — stats. Absent when the parent has no real numbers. ── */}
      {stats.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statScroll}
          contentContainerStyle={[styles.statStrip, { flexDirection: rowDir }]}
          testID="cars-stats-strip"
        >
          {stats.map((s, i) => (
            <View key={s.key} style={[styles.statCell, { flexDirection: rowDir }]}>
              {i > 0 ? <View style={styles.statDivider} /> : null}
              <View style={{ alignItems: alignStart }}>
                <AppText style={styles.statValue} numberOfLines={1}>
                  {s.value}
                </AppText>
                <AppText style={styles.statLabel} numberOfLines={1}>
                  {t(s.labelKey)}
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingBottom: 8,
  },

  // Band A
  topBar: {
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 8,
  },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topActions: {
    alignItems: "center",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    end: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  brandBlock: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  wordmarkRow: {
    alignItems: "center",
    gap: 7,
  },
  wordmarkBoom: {
    width: 78,
    height: 30,
  },
  wordmarkCar: {
    color: SNOW,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
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
  },

  // Band B
  hero: {
    minHeight: HERO_MIN_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    overflow: "hidden",
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCopy: {
    gap: 6,
  },
  heroTitleTop: {
    color: SNOW,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroTitleBottom: {
    color: ACCENT,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    color: STEEL,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  featureList: {
    marginTop: 14,
    gap: 7,
    borderStartWidth: 2,
    borderStartColor: ACCENT,
    paddingStart: 12,
  },
  featureRow: {
    alignItems: "center",
    gap: 9,
  },
  featureText: {
    color: STEEL,
    fontSize: 12.5,
  },

  // Band C
  searchRow: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  searchPill: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: SURFACE,
  },
  searchMainHit: {
    flex: 1,
    justifyContent: "center",
    height: 56,
  },
  searchInput: {
    flex: 1,
    color: SNOW,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  pillDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: HAIRLINE,
  },
  pillIcon: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButton: {
    width: 56,
    height: 56,
    // Circle, per the mock — the one round shape on the row, so the eye finds
    // filters without a label. The pill stays at 20 as specced.
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    end: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: VOID,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: SNOW,
    fontSize: 10,
    fontWeight: "700",
  },

  // Band D
  catScroll: {
    flexGrow: 0,
    marginTop: 18,
  },
  catContent: {
    gap: 10,
    paddingHorizontal: 16,
  },
  catItem: {
    width: 68,
    alignItems: "center",
    gap: 7,
  },
  catTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  catTileActive: {
    backgroundColor: ACCENT,
  },
  catLabel: {
    color: ASH,
    fontSize: 11,
    textAlign: "center",
  },
  catLabelActive: {
    color: SNOW,
  },

  // Band E
  statScroll: {
    flexGrow: 0,
    marginTop: 18,
  },
  statStrip: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statCell: {
    alignItems: "center",
    gap: 14,
    paddingEnd: 14,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: HAIRLINE,
  },
  statValue: {
    color: SNOW,
    fontSize: 15,
    fontWeight: "800",
  },
  statLabel: {
    color: ASH,
    fontSize: 10.5,
  },
});
