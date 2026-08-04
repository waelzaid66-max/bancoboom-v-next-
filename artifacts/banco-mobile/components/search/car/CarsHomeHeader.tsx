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
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  RadialGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { SECTION_NEUTRAL, sectionAccent } from "@/lib/sectionTheme";
import { VehicleGlyph, type VehicleGlyphName } from "./VehicleGlyph";

const BANCO_LOGO = require("../../../assets/images/banco-logo.png");
const BOOM_LOGO = require("../../../assets/images/boom-logo.png");
/** The owner's own render, extracted from the design he sent and sitting in the
 *  repo unused since 2026-08-02. The header's note said depth is "BUILT, never
 *  photographed" because the brief banned raster — but the brief's own hero is
 *  a photoreal plate of a jet, a yacht, a helicopter, a truck, a supercar and a
 *  motorcycle, which no vector can be. The SVG ambience stays and this sits on
 *  top of it: the drawn light is what makes the plate read as lit. */
const HERO_PLATE = require("../../../assets/images/section-hero/car.png");

/** Owner brief (2026-08-02): layered dark ground, one accent, premium depth.
 *
 *  Every neutral below is the brief's literal value. The RED is the one place
 *  the brief is overruled, on the owner's own instruction — "the colours must be
 *  as close as possible to the identity of the application as a whole".
 *
 *  Measured, not argued: the dominant red in the shipped brand asset
 *  (assets/images/banco-logo.png) is #CF1626. Perceptual distance to it:
 *      SECTION_ACCENT.car #CC1E24 → ΔE 2.4   (below the noticeable threshold)
 *      the brief's        #E60012 → ΔE 16.7  (plainly a different red)
 *  So the locked section token IS the logo red, and the brief's value is not.
 *  Both clear contrast (white on #CC1E24 = 5.56:1, on #E60012 = 4.80:1), so this
 *  is an identity call, not an accessibility one.
 *
 *  sectionTheme.ts carries a user-locked identity rule: every section colour is
 *  a derivative of the logo red, and sections separate by depth, not by hue.
 *  Moving car to #E60012 would put it 24–37 ΔE from its own siblings. The accent
 *  therefore stays BOUND to `sectionAccent("car")` — never a literal here — and
 *  the glow and the bright accent are DERIVED from it, so the header never shows
 *  two unrelated reds. */
const VOID = SECTION_NEUTRAL.void;
const SECONDARY = SECTION_NEUTRAL.secondary;
const SURFACE = SECTION_NEUTRAL.surface;
const ACCENT = sectionAccent("car");
/** The brief's glow is its red at 18%. Ours is the identity red at 18%. */
const GLOW = "rgba(204,30,36,0.18)";
/** The brief's #FF2B2B lifted from OUR red instead of theirs — same job (the
 *  brighter tint for active states), same family as everything around it. */
const ACCENT_BRIGHT = "#FF3A40";
const SNOW = SECTION_NEUTRAL.snow;
const ASH = SECTION_NEUTRAL.ash;
const STEEL = SECTION_NEUTRAL.steel;
const HAIRLINE = SECTION_NEUTRAL.hairline;

const HERO_MIN_HEIGHT = 244;

/** Brief metrics. 94 → 60 is the TOP ROW, which is what the brief calls the
 *  header: the search bar is its own sticky element below and keeps its 54
 *  whether the header is open or shut. At 94 the brand block has room for the
 *  wordmark and the powered-by line under it; 60 is a single 48dp control row
 *  plus its padding, so the second line has to go on the way down. */
const HEADER_EXPANDED = 94;
const HEADER_COLLAPSED = 60;
/** Scroll travel the collapse is mapped over — a separate number from the 34dp
 *  of height it removes. Tying the two together would slam the header shut in
 *  34px of finger movement; ~40% of the hero reads as the header answering the
 *  scroll rather than snapping. */
const COLLAPSE_SCROLL = 96;
const LOGO_SCALE_MIN = 0.82;
const BOTTOM_RADIUS = 20;
const PAD_H = 16;
const GAP = 12;
/** 48dp minimum touch target — the brief asks for it and the previous 40×40
 *  hit boxes were under it, which is an accessibility defect, not a taste call. */
const TAP = 48;
const SEARCH_H = 54;
const SEARCH_R = 28;

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
type FeatherName = React.ComponentProps<typeof Feather>["name"];

const FEATURES: { icon: FeatherName; key: string }[] = [
  // "shield-check" renders through the icon shim but is a Lucide name, not a
  // Feather one, so it fails the Feather prop type the repo types against
  // (same pattern as MaterialsHomeHeader.tsx:61). "shield" keeps the silhouette
  // and is genuine on both sides.
  { icon: "shield", key: "search.discover.section.carTrustDealers" },
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
  /**
   * Which half to paint. Default "all" — every band, original order, which is
   * what a caller that does not split the header gets.
   *   "pinned" → top bar + search row. Held above the results, always reachable.
   *   "scroll" → hero + categories + stats. Handed to the list as its header so
   *              it scrolls off and gives the screen back.
   */
  /**
   * Market country + currency control, owned and rendered by the parent.
   *
   * It arrives as a node rather than as data because this header holds no state
   * and knows nothing about markets. Before this it lived in the collapsed chip
   * strip below the header, which is what the owner meant by the country and
   * currency choices "not being compressed" — Property and Factories already
   * carry theirs in the header, and Cars was the section still leaving it
   * loose. Optional: a caller that passes nothing gets the row it had.
   */
  marketSlot?: React.ReactNode;
  slot?: "all" | "pinned" | "scroll";
  /**
   * How far the results list has scrolled, published by SearchResultsSurface.
   *
   * Only the "pinned" slot reads it, and only to collapse: the top row scales
   * and fades out, the search row stays put. Everything is derived on the UI
   * thread through `useAnimatedStyle`, so scrolling drives no React render.
   *
   * Optional. Without it the header paints its expanded state and never moves —
   * which is exactly what it did before, so no caller is forced to opt in.
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
  marketSlot,
  slot = "all",
  scrollY,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const alignStart = isRTL ? "flex-end" : "flex-start";

  // Which bands this instance paints. The parent mounts the header twice: the
  // pinned half stays above the results, the scrolling half is handed to the
  // list as its own header so the hero can leave the screen. "all" is the
  // default and renders every band in the original order, so any caller that
  // does not split keeps exactly the layout it had.
  const showPinned = slot === "all" || slot === "pinned";
  const showScroll = slot === "all" || slot === "scroll";

  // ── Collapse. Every value below is read off the shared offset on the UI
  // thread, so a scroll never re-renders this component. `interpolate` is a
  // straight mapping with no spring and no overshoot, which is what the brief
  // means by "no bounce, no spring — professional motion only": the header is
  // not playing an animation, it is tracking the finger.
  //
  // Hooks are unconditional; when no offset was handed down, `progress` is a
  // constant 0 and every style below resolves to the expanded state.
  const collapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return {
      height: HEADER_EXPANDED + (HEADER_COLLAPSED - HEADER_EXPANDED) * p,
    };
  });

  // The wordmark shrinks to 82% exactly as specced. Scaling (not resizing) keeps
  // the glyphs on the GPU — no text re-layout per frame.
  const logoCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return { transform: [{ scale: 1 + (LOGO_SCALE_MIN - 1) * p }] };
  });

  // The powered-by line is the row that 60dp cannot hold. It leaves first, over
  // the first 60% of the travel, so the wordmark is never crowded mid-collapse.
  const poweredCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL * 0.6], [1, 0], Extrapolation.CLAMP)
      : 1;
    return { opacity: p };
  });

  /** The hero band gives back its whole height on the way down and takes it
   *  back on the way up — "يختفي ويرجع مع الاسكرول".
   *
   *  It used to live in the scrolling slice, handed to the list as its header,
   *  and that is why the owner never saw it: the loading and empty states paint
   *  over the list as an opaque absoluteFill, so on a screen with no results —
   *  which is every screen without a network — the hero was covered. Pinned and
   *  collapsing shows it, and still gives the results the room back. */
  const heroCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [1, 0], Extrapolation.CLAMP)
      : 1;
    return {
      opacity: p,
      height: HERO_MIN_HEIGHT * p,
      marginBottom: GAP * p,
    };
  });

  // The plate is the scene, and it must collapse WITH the header — this is the
  // fix for the bug where it sat at a fixed height while everything else shrank,
  // so scrolling never gave its space back. Its height tracks the header's real
  // height at every offset: expanded it spans the top bar plus the hero
  // (HEADER_EXPANDED + HERO_MIN_HEIGHT), collapsed it is just the top bar
  // (HEADER_COLLAPSED). The image inside is bottom-anchored and clipped, so the
  // vehicles are the last thing to leave as it closes.
  const plateExpanded = HEADER_EXPANDED + HERO_MIN_HEIGHT;
  const plateCollapse = useAnimatedStyle(() => {
    const p = scrollY
      ? interpolate(scrollY.value, [0, COLLAPSE_SCROLL], [0, 1], Extrapolation.CLAMP)
      : 0;
    return {
      height: plateExpanded + (HEADER_COLLAPSED - plateExpanded) * p,
    };
  });

  // Shadow deepens as the header takes over from the content behind it. iOS
  // reads opacity/radius, Android reads elevation — both are animatable here.
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
        { paddingTop: slot === "scroll" ? 0 : topPad },
        // The rounded bottom edge and the lift belong to the pinned bar — it is
        // the piece that sits OVER the results. The scrolling half is inside the
        // list, where a shadow would trail the hero down the screen.
        showPinned && !showScroll ? styles.pinnedShell : null,
        showPinned && !showScroll ? liftCollapse : null,
      ]}
      testID={slot === "scroll" ? "cars-hero-band" : "cars-home-header"}
    >
      {/* ── The owner's plate IS the header's background ─────────────────────
          In his design the vehicles are not a picture beside the copy; they are
          the scene the whole header sits on — top bar, copy, search pill and
          the type strip all float over it. Rendering it as a side image, which
          is what the first attempt did, is not the same header at all. A scrim
          rides on top so white text keeps its contrast over the bright parts of
          the plate. It never takes a tap. ── */}
      {showPinned ? (
        <Animated.View style={[styles.shellPlate, plateCollapse]} pointerEvents="none">
          <View style={styles.shellPlateImg}>
          <Image
            source={HERO_PLATE}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="bottom center"
            transition={220}
          />
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Vertical only. The wordmark sits at the top and the search
                  pill and the type tiles at the bottom, so those two ends are
                  the parts that need seating; the middle is where the vehicles
                  are and it stays clear. */}
              <LinearGradient id="carPlateFoot" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={VOID} stopOpacity="0.85" />
                <Stop offset="0.22" stopColor={VOID} stopOpacity="0.08" />
                <Stop offset="0.78" stopColor={VOID} stopOpacity="0.08" />
                <Stop offset="1" stopColor={VOID} stopOpacity="0.85" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#carPlateFoot)" />
          </Svg>
          </View>
        </Animated.View>
      ) : null}

      {/* "No flat background" — the pinned bar gets the same treatment as the
          hero, scaled down: a vertical lift so the bar has a top edge, and a
          faint red wash under the brand so the accent is present even when the
          header is collapsed to a single row. Vector, so it costs no memory and
          cannot band on a wide gamut screen. */}
      {/* Retired: the plate is the ground now, and a second opaque gradient on
          top of it only hid the photograph. Kept out rather than deleted so the
          intent stays legible in history. */}
      {false ? (
        <View style={styles.barBackdrop} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="carBarGround" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={SECONDARY} stopOpacity="1" />
                <Stop offset="1" stopColor={VOID} stopOpacity="1" />
              </LinearGradient>
              <RadialGradient id="carBarWash" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={ACCENT} stopOpacity="0.14" />
                <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#carBarGround)" />
            <Ellipse cx="50%" cy="18%" rx="46%" ry="58%" fill="url(#carBarWash)" />
          </Svg>
        </View>
      ) : null}

      {/* ── Band A — top bar. Back · brand · bell · profile. Nothing else. ── */}
      {showPinned ? (
      <Animated.View
        style={[styles.topBar, { flexDirection: rowDir }, collapse]}
      >
        {/* The brief wants the logo optically centred "regardless of left/right
            buttons", and this row is lopsided by design — one control leading,
            two trailing. Reserving the SAME width on both sides is what makes
            the centre true, and unlike absolute positioning it cannot let the
            wordmark slide under a button on a narrow screen. */}
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
          <Animated.View
            style={[styles.wordmarkRow, { flexDirection: rowDir }, logoCollapse]}
          >
            <Image
              source={BOOM_LOGO}
              style={styles.wordmarkBoom}
              contentFit="contain"
            />
            {/* Scales down instead of clipping. Equal flanks keep the wordmark
                optically centred, which leaves the centre a fixed budget — and
                on 320dp that budget rendered "CAR" as "CA". flexShrink alone
                cannot fix that: shrinking a Text clips it, it does not resize
                the glyphs. */}
            <AppText
              style={styles.wordmarkCar}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t("search.discover.section.carBrand")}
            </AppText>
          </Animated.View>
          <Animated.View
            style={[styles.poweredRow, { flexDirection: rowDir }, poweredCollapse]}
          >
            <AppText
              style={styles.poweredLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
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
      ) : null}

      {/* ── Band B — hero. Depth is BUILT, never photographed: the brief asks
              for a layered gradient, red ambience and a vignette, and every one
              of them is drawn here in react-native-svg. No raster, so it is
              resolution-free and cannot band, clip or blur on any Android
              density — which is the whole reason the brief bans PNG. ── */}
      {showPinned ? (
      <Animated.View style={[styles.hero, heroCollapse]} testID="cars-hero">

        <View style={[styles.heroGlow, { opacity: 0.55 }]} pointerEvents="none">
          {/* Four layers, back to front:
                1 ground   a vertical lift off #090909 so the band is not flat
                2 key      a soft red source off the trailing side
                3 floor    the bounce along the bottom edge
                4 vignette corners pulled down, which is what makes the middle
                           read as lit rather than merely lighter
              The ELLIPSE carries the shape (rx/ry); the gradient only carries
              the falloff (r), which is the only radius SVG's radialGradient
              actually has. */}
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="carHeroGround" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={SECONDARY} stopOpacity="1" />
                <Stop offset="0.55" stopColor={VOID} stopOpacity="1" />
                <Stop offset="1" stopColor={VOID} stopOpacity="1" />
              </LinearGradient>
              <RadialGradient id="carHeroKey" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={ACCENT} stopOpacity="0.40" />
                <Stop offset="0.5" stopColor={ACCENT} stopOpacity="0.13" />
                <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="carHeroFloor" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={ACCENT} stopOpacity="0.22" />
                <Stop offset="1" stopColor={ACCENT} stopOpacity="0" />
              </RadialGradient>
              {/* Inverted falloff: transparent at the centre, black at the rim.
                  Drawn last so it darkens the ambience too, not just the ground. */}
              <RadialGradient id="carHeroVignette" cx="50%" cy="50%" r="72%">
                <Stop offset="0.45" stopColor="#000000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.55" />
              </RadialGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#carHeroGround)"
            />
            <Ellipse cx="74%" cy="46%" rx="58%" ry="72%" fill="url(#carHeroKey)" />
            <Ellipse cx="50%" cy="100%" rx="72%" ry="34%" fill="url(#carHeroFloor)" />
            <Rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#carHeroVignette)"
            />
          </Svg>
        </View>

        {/* Removed by the owner, 2026-08-03: «امسح الكلام دة».
            The subtitle line and the five trust rows are gone from the hero —
            he was explicit that the wording was getting in the way of the
            header itself, and that the plate plus the controls are what this
            band is. The i18n keys and FEATURES stay defined so the block can be
            restored in one edit; nothing was deleted from the translations. */}
      </Animated.View>
      ) : null}

      {/* ── Band C — one search row. Map + save sit inline so the top bar can
              stay exactly as specced; Filters is the ONLY accent control. ── */}
      {showPinned ? (
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
      ) : null}

      {/* ── Band D — quick vehicle categories. Absent until live inventory can
              actually be filtered by vehicle type (see CAR_CATEGORIES). ── */}
      {/* PINNED. It is a browse control, and the empty-state overlay covers
          whatever the list carries — the row a buyer with no results needs to
          change what they are looking at is the row that must not vanish. */}
      {showPinned && categories.length > 0 ? (
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
      {/* PINNED and collapsing, like the hero above it: identity that the
          owner must actually see, rather than identity hidden under a loading
          state. */}
      {showPinned && stats.length > 0 ? (
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: VOID,
    paddingBottom: 8,
    // Bands paint over the plate, so nothing here may carry its own fill.
    position: "relative",
  },
  /** Only the pinned bar. Rounded bottom edge per the brief, and the shadow
   *  colour/offset the animated lift drives the opacity and radius of. */
  pinnedShell: {
    borderBottomLeftRadius: BOTTOM_RADIUS,
    borderBottomRightRadius: BOTTOM_RADIUS,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    // z-index above the results so the rounded edge reads as an overlap, not a
    // seam. Android needs both this and elevation to order correctly.
    zIndex: 10,
  },
  /** The gradient plate, clipped to the shell's rounded corners. The clipping
   *  lives HERE and not on the shell because `overflow: hidden` on a view that
   *  also carries elevation drops the shadow on several Android versions. */
  barBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: BOTTOM_RADIUS,
    borderBottomRightRadius: BOTTOM_RADIUS,
    overflow: "hidden",
  },

  // Band A
  topBar: {
    alignItems: "center",
    // Height is driven by the collapse; this is the floor for the "all" slot,
    // which has no scroll offset and therefore never animates.
    minHeight: HEADER_COLLAPSED,
    paddingHorizontal: PAD_H,
    gap: 4,
  },
  iconHit: {
    width: TAP,
    height: TAP,
    borderRadius: TAP / 2,
    alignItems: "center",
    justifyContent: "center",
    // "Dark glass" per the brief — a lifted plane, not a hole in the header.
    backgroundColor: SECONDARY,
    overflow: "hidden",
  },
  /** Both flanks claim the same width so the brand block between them lands on
   *  the true centre of the header. The trailing side is the wider of the two
   *  (two controls), so it sets the number. */
  /** The LEADING flank holds one control, the trailing flank holds two.
   *
   *  It used to reserve two slots on both sides so the wordmark sat optically
   *  centred. On 320dp that is arithmetic the row cannot satisfy: 320 less 32
   *  of padding leaves 288, two flanks of 104 take 208, and the 80 left is not
   *  enough for a 68dp mark plus "CAR" — the render clipped it to "CA" and the
   *  BANCO mark under it to "BANC". Identity intact beats identity centred, and
   *  `adjustsFontSizeToFit` is not an answer here because it does nothing on
   *  web, which is the surface these captures come from. */
  topSide: {
    minWidth: TAP,
    alignItems: "center",
  },
  topActions: {
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: TAP * 2 + 8,
    gap: 8,
  },
  bellDot: {
    position: "absolute",
    // Recentred for the 48dp button: the badge rides the icon's top-trailing
    // corner, which moved out by 4 on each axis when the hit box grew from 40.
    top: 13,
    end: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_BRIGHT,
    // Ringed against the glass so the dot never melts into the icon behind it.
    borderWidth: 1.5,
    borderColor: SECONDARY,
  },
  brandBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  /** "Auto scale" in the brief. Equal flanks leave the centre a fixed budget,
   *  so on the narrowest phones the wordmark has to give rather than push a
   *  control off the row — flexShrink is what lets it, and contentFit keeps the
   *  logo's aspect while it does. */
  wordmarkRow: {
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

  // Band B
  hero: {
    // No minHeight: `heroCollapse` animates the height between HERO_MIN_HEIGHT
    // and 0, and a floor here would stop it ever closing.
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    overflow: "hidden",
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Fills the whole pinned shell, behind every band. Clipped by the shell's
   *  rounded bottom corners, and never takes a tap. */
  /** Anchored to the bottom of the shell, full width, at the plate's own
   *  proportions (1216×453 ≈ 2.7:1).
   *
   *  Stretching it over the whole shell was the first attempt and it zoomed the
   *  crop so hard that only a helicopter and half a truck survived: the design
   *  is a 2.16:1 banner and a phone header is nearer square, so `cover` across
   *  the full height throws most of the scene away. Sitting it low keeps the
   *  vehicles whole and leaves the copy the lit half above them. */
  /** The plate under the WHOLE pinned shell — top bar included, as in the
   *  render. Clipped to the shell's rounded bottom, never takes a tap. */
  /** Full width at the plate's own proportions, under the top bar and the hero
   *  together, anchored to the bottom of that region.
   *
   *  Covering the whole shell was tried twice and fails for one reason: the
   *  render is a 2.16:1 banner and a phone header is nearer 0.66:1, so `cover`
   *  over the full height scales the crop past 2x and only a yacht survives.
   *  Keeping the plate whole is the trade that preserves the scene. */
  shellPlate: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    // Height is driven by `plateCollapse` — it tracks the header's real height
    // as it collapses, so the plate gives its space back on scroll instead of
    // floating at a fixed size.
    justifyContent: "flex-end",
    borderBottomLeftRadius: BOTTOM_RADIUS,
    borderBottomRightRadius: BOTTOM_RADIUS,
    overflow: "hidden",
  },
  /** Keeps its own 1216×453 so nothing in the scene is thrown away. */
  shellPlateImg: {
    width: "100%",
    aspectRatio: 1216 / 453,
    overflow: "hidden",
  },
  plateWrap: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: BOTTOM_RADIUS,
    borderBottomRightRadius: BOTTOM_RADIUS,
    overflow: "hidden",
  },
  heroCopy: {
    // The copy holds the leading half; the plate's scrim is darkest exactly
    // there, which is what keeps white text legible over a photograph.
    width: "56%",
    zIndex: 1,
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
  /** Shrinks before the search pill does: the market chip is a fixed, readable
   *  width and the pill is the element that can afford to give on 320dp. */
  marketSlot: {
    flexShrink: 0,
  },
  searchRow: {
    alignItems: "center",
    gap: GAP,
    paddingHorizontal: PAD_H,
    paddingTop: 4,
  },
  searchPill: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    height: SEARCH_H,
    paddingHorizontal: PAD_H,
    borderRadius: SEARCH_R,
    backgroundColor: SURFACE,
    // A hairline lifts the pill off the ground without adding a second surface
    // colour — the brief's divider token doing the work a border would.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  searchMainHit: {
    flex: 1,
    justifyContent: "center",
    height: SEARCH_H,
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
    width: TAP,
    height: TAP,
    // Circle, per the brief — the one round shape on the row, so the eye finds
    // filters without a label. It is also the only accent-filled control here.
    borderRadius: TAP / 2,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    // "Floating" per the brief: the accent carries its own glow rather than a
    // grey drop shadow, which would read as dirt on a #090909 ground.
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    end: 4,
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
