import { Feather } from "@/components/icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import {
  Category,
  CategoryIcon,
} from "@/components/CategoryTabs";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import {
  BANKS_ACCENT,
  SECTION_GRADIENT as SECTION_IDENTITY_GRADIENT,
  SECTION_NEUTRAL,
  sectionAccent,
} from "@/lib/sectionTheme";

// Concrete, browseable sections (no "all" — these are the real catalogues a
// shopper picks between). Each card pushes a dedicated section mini-app —
// never filters the shared Search tab in place (that melt collapsed every
// catalogue into one melted search surface).
// "all" is a Search-tab filter chip only — it is NOT a Discover portal and must
// never resolve to /section/car (owner: «بيفتح قسم السيارات»).
type BrowseSection = Exclude<Category, "all">;
const SECTIONS: BrowseSection[] = [
  "car",
  "real_estate",
  "facilities",
  "materials",
];

// Dedicated section mini-app routes. Must stay registered in app/_layout.tsx
// as Stack.Screen entries or router.push 404s. No entry for "all".
const SECTION_ROUTE: Record<BrowseSection, Href> = {
  car: "/section/car",
  real_estate: "/section/real-estate",
  facilities: "/section/factories",
  materials: "/section/materials",
};

// Real, representative cover photography per browse section, bundled locally so
// the cards read as authentic (trust) and premium. A cinematic scrim sits over
// each photo for legibility and a framed, editorial feel.
const SECTION_PHOTO: Partial<Record<Category, number>> = {
  car: require("../assets/images/categories/car.jpg"),
  real_estate: require("../assets/images/categories/real_estate.jpg"),
  facilities: require("../assets/images/categories/facilities.jpg"),
  materials: require("../assets/images/categories/materials.jpg"),
};

// Faint BANCO wordmark embossed behind each card's content — a subtle, premium
// on-brand finish (white-tinted, very low opacity, sits above the scrim but
// below the badge/label/chevron so it never fights legibility).
const BANCO_WATERMARK = require("../assets/images/banco-logo.png");

// 5th portal — Booking & Stays (residential + furnished rental, NOT hotels).
// Wears the real-estate rose identity (blue is reserved for Banks & Financiers)
// and leads with a real photo like the four section cards.
const BOOKING_PHOTO = require("../assets/images/categories/booking.jpg");

interface Props {
  /**
   * Enter Maps mini-app §7 (/section/maps). Must never melt Discover into
   * shared Search, and must never hardcode Real Estate.
   * Brand/saved/listing melt props were removed (Wave8 Tranche B) — Discover
   * only router.pushes section mini-apps; FilterSheet keeps browseBrand live.
   */
  onExploreMap: () => void;
}

export function SearchDiscover({ onExploreMap }: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const handleSectionPress = (cat: BrowseSection) => {
    // ENTER dedicated section mini-app — never show engine strips on Discover
    // and never melt into shared Search criteria (Owner screenshot regression).
    router.push(SECTION_ROUTE[cat]);
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <AppText
      style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}
    >
      {label}
    </AppText>
  );

  const portalPressStyle = ({ pressed }: { pressed: boolean }) => [
    styles.portalWrap,
    pressed ? styles.portalPressed : null,
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Image-style section cards */}
      <SectionHeader label={t("search.discover.sections")} />
      <View style={styles.sectionGrid}>
        {SECTIONS.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => handleSectionPress(cat)}
            style={({ pressed }) => [
              styles.sectionCardWrap,
              pressed ? styles.portalPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(`home.categories.${cat}`)}
            testID={`section-card-${cat}`}
          >
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: SECTION_IDENTITY_GRADIENT[cat][1] },
              ]}
            >
              <Image
                source={SECTION_PHOTO[cat]}
                style={styles.sectionPhoto}
                contentFit="cover"
                transition={220}
              />
              <LinearGradient
                colors={[
                  "rgba(12,4,5,0.10)",
                  "rgba(12,4,5,0.46)",
                  "rgba(12,4,5,0.88)",
                ]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.sectionScrim}
              />
              <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
                <Image
                  source={BANCO_WATERMARK}
                  style={styles.sectionWatermark}
                  contentFit="contain"
                  tintColor="#FFFFFF"
                />
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  { backgroundColor: sectionAccent(cat) },
                ]}
              >
                <CategoryIcon category={cat} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.sectionLabelRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.sectionAccent,
                    { backgroundColor: sectionAccent(cat) },
                  ]}
                />
                <AppText style={[styles.sectionLabel, { textAlign }]}>
                  {t(`home.categories.${cat}`)}
                </AppText>
              </View>
              <Feather
                name={isRTL ? "chevron-left" : "chevron-right"}
                size={16}
                color="rgba(255,255,255,0.92)"
                style={[
                  styles.sectionChevron,
                  isRTL ? { left: 12 } : { right: 12 },
                ]}
              />
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/section/booking" as Href)}
        style={({ pressed }) => [
          styles.bookingCardWrap,
          pressed ? styles.portalPressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("search.discover.bookingHub")}
        testID="section-card-booking"
      >
        <View
          style={[
            styles.bookingCard,
            { backgroundColor: SECTION_IDENTITY_GRADIENT.real_estate[1] },
          ]}
        >
          <Image
            source={BOOKING_PHOTO}
            style={styles.sectionPhoto}
            contentFit="cover"
            transition={220}
          />
          <LinearGradient
            colors={[
              "rgba(12,4,5,0.10)",
              "rgba(12,4,5,0.46)",
              "rgba(12,4,5,0.88)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sectionScrim}
          />
          <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
            <Image
              source={BANCO_WATERMARK}
              style={styles.sectionWatermark}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View style={[styles.bookingTopRow, { flexDirection: rowDir }]}>
            <View
              style={[
                styles.sectionBadge,
                { backgroundColor: sectionAccent("real_estate") },
              ]}
            >
              <Feather name="calendar" size={18} color="#FFFFFF" />
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={20}
              color="rgba(255,255,255,0.85)"
            />
          </View>
          <View>
            <View
              style={[
                styles.sectionLabelRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.sectionAccent,
                  { backgroundColor: sectionAccent("real_estate") },
                ]}
              />
              <AppText style={[styles.sectionLabel, { textAlign, fontSize: 18 }]}>
                {t("search.discover.bookingHub")}
              </AppText>
            </View>
            <AppText style={[styles.bookingSub, { textAlign }]}>
              {t("search.discover.bookingHubSub")}
            </AppText>
          </View>
        </View>
      </Pressable>

      {/* Explore on map — ALWAYS present (owner). Primary CTA enters
          Maps mini-app §7 (/section/maps). Secondary chips intentionally
          duplicate per-catalogue ?map=1 feeds (Owner: maps serve all sections). */}
      <Pressable
        onPress={onExploreMap}
        style={portalPressStyle}
        accessibilityRole="button"
        accessibilityLabel={t("search.discover.exploreMap")}
        testID="discover-explore-map"
      >
        <LinearGradient
          colors={[SECTION_NEUTRAL.secondary, SECTION_NEUTRAL.void]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portalCard}
        >
          <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
            <Image
              source={BANCO_WATERMARK}
              style={styles.hubWatermark}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View
              style={[
                styles.mapBadge,
                { backgroundColor: sectionAccent("all") },
              ]}
            >
              <Feather name="map" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.mapCtaText}>
              <AppText style={[styles.mapTitle, { textAlign }]}>
                {t("search.discover.exploreMap")}
              </AppText>
              <AppText style={[styles.mapSub, { textAlign }]}>
                {t("search.discover.exploreMapSub")}
              </AppText>
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>
      </Pressable>

      <AppText
        style={[styles.mapPortalHint, { color: colors.mutedForeground, textAlign }]}
      >
        {t("search.discover.exploreMapPortals")}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.mapPortalRow, { flexDirection: rowDir }]}
        testID="discover-map-portals"
      >
        {(
          [
            {
              id: "car",
              href: "/section/car?map=1" as Href,
              label: t("search.discover.exploreMapCar"),
              testID: "discover-map-car",
            },
            {
              id: "real_estate",
              href: "/section/real-estate?map=1" as Href,
              label: t("search.discover.exploreMapProperties"),
              testID: "discover-map-properties",
            },
            {
              id: "materials",
              href: "/section/materials?map=1" as Href,
              label: t("search.discover.exploreMapMaterials"),
              testID: "discover-map-materials",
            },
            {
              id: "factories",
              href: "/section/factories?map=1" as Href,
              label: t("search.discover.exploreMapFactories"),
              testID: "discover-map-factories",
            },
            {
              id: "booking",
              href: "/section/booking?map=1" as Href,
              label: t("search.discover.exploreMapStays"),
              testID: "discover-map-stays",
            },
          ] as const
        ).map((portal) => (
          <Pressable
            key={portal.id}
            onPress={() => router.push(portal.href)}
            style={({ pressed }) => [
              styles.mapPortalChip,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                flexDirection: rowDir,
              },
              pressed ? styles.mapPortalPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={portal.label}
            testID={portal.testID}
          >
            <Feather name="map-pin" size={13} color={colors.primary} />
            <AppText style={[styles.mapPortalChipText, { color: colors.foreground }]}>
              {portal.label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/import" as Href)}
        style={portalPressStyle}
        accessibilityRole="button"
        accessibilityLabel={t("search.discover.carImport")}
        testID="discover-car-import"
      >
        <LinearGradient
          colors={SECTION_IDENTITY_GRADIENT.car}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portalCard}
        >
          <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
            <Image
              source={BANCO_WATERMARK}
              style={styles.hubWatermark}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View
              style={[
                styles.mapBadge,
                { backgroundColor: sectionAccent("car") },
              ]}
            >
              <CategoryIcon category="car" color="#FFFFFF" />
            </View>
            <View style={styles.mapCtaText}>
              <AppText style={[styles.mapTitle, { textAlign }]}>
                {t("search.discover.carImport")}
              </AppText>
              <AppText style={[styles.mapSub, { textAlign }]}>
                {t("search.discover.carImportSub")}
              </AppText>
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── Business & supply hubs (الأعمال والتوريد) ────────────────────────
          Rectangular portal rows into the B2B worlds. Each carries the BANCO
          watermark so the identity never drops. Banks & Financiers remains the
          one deliberate trust-blue identity outside the BANCO red family. */}
      <SectionHeader label={t("search.discover.businessHub")} />

      <Pressable
        onPress={() => router.push("/business/global-supply")}
        style={portalPressStyle}
        accessibilityRole="button"
        accessibilityLabel={t("search.discover.supplyPortal")}
        testID="discover-supply-portal"
      >
        <LinearGradient
          colors={SECTION_IDENTITY_GRADIENT.industrial}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portalCard}
        >
          <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
            <Image
              source={BANCO_WATERMARK}
              style={styles.hubWatermark}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View
              style={[
                styles.mapBadge,
                { backgroundColor: SECTION_IDENTITY_GRADIENT.industrial[0] },
              ]}
            >
              <Feather name="globe" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.mapCtaText}>
              <AppText style={[styles.mapTitle, { textAlign }]}>
                {t("search.discover.supplyPortal")}
              </AppText>
              <AppText style={[styles.mapSub, { textAlign }]}>
                {t("search.discover.supplyPortalSub")}
              </AppText>
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={() => router.push("/business/supply-hub")}
        style={portalPressStyle}
        accessibilityRole="button"
        accessibilityLabel={t("search.discover.importersHub")}
        testID="discover-importers-hub"
      >
        <LinearGradient
          colors={[SECTION_NEUTRAL.surface, SECTION_NEUTRAL.void]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portalCard}
        >
          <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
            <Image
              source={BANCO_WATERMARK}
              style={styles.hubWatermark}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View
              style={[
                styles.mapBadge,
                { backgroundColor: sectionAccent("all") },
              ]}
            >
              <Feather name="package" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.mapCtaText}>
              <AppText style={[styles.mapTitle, { textAlign }]}>
                {t("search.discover.importersHub")}
              </AppText>
              <AppText style={[styles.mapSub, { textAlign }]}>
                {t("search.discover.importersHubSub")}
              </AppText>
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={() => router.push("/business/banks" as Href)}
        style={portalPressStyle}
        accessibilityRole="button"
        accessibilityLabel={t("search.discover.banksHub")}
        testID="discover-banks-hub"
      >
        <LinearGradient
          colors={SECTION_IDENTITY_GRADIENT.banks}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portalCard}
        >
          <View pointerEvents="none" style={styles.sectionWatermarkWrap}>
            <Image
              source={BANCO_WATERMARK}
              style={styles.hubWatermark}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View style={[styles.mapBadge, { backgroundColor: BANKS_ACCENT }]}>
              <Feather name="credit-card" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.mapCtaText}>
              <AppText style={[styles.mapTitle, { textAlign }]}>
                {t("search.discover.banksHub")}
              </AppText>
              <AppText style={[styles.mapSub, { textAlign }]}>
                {t("search.discover.banksHubSub")}
              </AppText>
            </View>
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 200 },
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionCardWrap: {
    width: "47%",
    flexGrow: 1,
  },
  sectionCard: {
    height: 118,
    borderRadius: 20,
    overflow: "hidden",
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  portalPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  sectionPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionWatermarkWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionWatermark: {
    width: "52%",
    height: "34%",
    opacity: 0.1,
  },
  sectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionAccent: {
    width: 3,
    height: 15,
    borderRadius: 2,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sectionChevron: {
    position: "absolute",
    top: 14,
  },
  portalWrap: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  portalCard: {
    minHeight: 76,
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mapCtaRow: {
    minHeight: 44,
    alignItems: "center",
    gap: 14,
  },
  mapBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  mapCtaText: {
    flex: 1,
    minWidth: 0,
  },
  mapTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  mapSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
  },
  mapPortalHint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  mapPortalRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  mapPortalChip: {
    minHeight: 44,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  mapPortalPressed: {
    opacity: 0.86,
  },
  mapPortalChipText: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
  },
  bookingCardWrap: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  bookingCard: {
    height: 150,
    borderRadius: 20,
    overflow: "hidden",
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  bookingTopRow: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  hubWatermark: {
    width: "40%",
    height: "60%",
    opacity: 0.08,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 16,
  },
  brandChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  brandChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  savedChip: {
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 200,
  },
  savedChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  cardRow: {
    gap: 12,
    paddingHorizontal: 16,
  },
  cCard: {
    width: 168,
    borderWidth: 1,
    overflow: "hidden",
  },
  cImgWrap: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  cImg: {
    width: "100%",
    height: "100%",
  },
  cTag: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cTagText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  cBody: {
    padding: 10,
    gap: 3,
  },
  cPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  cTitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginHorizontal: 16,
  },
});