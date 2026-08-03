import { Feather } from "@/components/icons";
import { FeedItem, useGetTrending } from "@workspace/api-client-react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import {
  Category,
  CategoryIcon,
  EngineChips,
} from "@/components/CategoryTabs";
import { CompanyOffers } from "@/components/search/CompanyOffers";
import {
  POPULAR_BRANDS,
  brandLabel,
  type CarBrand,
} from "@/constants/cars";
import { enginesForCategory } from "@/constants/engines";
import { useI18n } from "@/context/LanguageContext";
import { SavedSearch, useSession } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";
import { useInventoryFacets, visibleEngines } from "@/lib/facets";

// Concrete, browseable sections (no "all" — these are the real catalogues a
// shopper picks between). Each gets a bold image-style card; cars / real-estate
// then reveal their engine chips, others go straight to results.
const SECTIONS: Category[] = ["car", "real_estate", "facilities", "materials"];
const QUICK_BRANDS: CarBrand[] = POPULAR_BRANDS;

// On-brand gradient pairs per section so each card reads as its own world while
// staying in the BANCO red/charcoal family.
const SECTION_GRADIENT: Record<Category, [string, string]> = {
  all: ["#7A0C12", "#1C0507"],
  car: ["#8A0E14", "#1C0507"],
  real_estate: ["#5A0A2A", "#190509"],
  facilities: ["#6A1410", "#140505"],
  materials: ["#7A2A0C", "#160805"],
};

// Real, representative cover photography per browse section, bundled locally so
// the cards read as authentic (trust) and premium. A cinematic scrim sits over
// each photo for legibility and a framed, editorial feel. The gradient above
// stays as the fallback fill behind the photo while it loads.
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

interface Props {
  onBrowseBrand: (brand: CarBrand) => void;
  onApplySaved: (s: SavedSearch) => void;
  onOpenListing: (item: FeedItem) => void;
  /**
   * Browse a section (and optional engine) by filtering the current Search tab
   * in place — the same committed-criteria path the persistent section tabs use.
   * Replaces the old navigation to a separate /search-results screen so the
   * Search tab has one coherent selection model.
   */
  onBrowseSection: (cat: Category, engine: string) => void;
  /**
   * Open the existing results map over a coordinate-rich category (real-estate).
   * The host latches the intent and auto-enables map mode once mappable results
   * arrive, falling back to the list when none carry coordinates — so tapping
   * this never lands the user on an empty map.
   */
  onExploreMap: (section: Category) => void;
  /** Re-run a recent text search (fills the input + commits immediately). */
  onSearchQuery: (q: string) => void;
}

function CompactCard({
  item,
  onPress,
}: {
  item: FeedItem;
  onPress: (item: FeedItem) => void;
}) {
  const colors = useColors();
  const { isRTL } = useI18n();
  const textAlign = isRTL ? "right" : "left";
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[
        styles.cCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={[styles.cImgWrap, { backgroundColor: colors.secondary }]}>
        {item.media_preview ? (
          <Image
            source={{ uri: item.media_preview }}
            style={styles.cImg}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Feather name="image" size={22} color={colors.mutedForeground} />
        )}
        {item.is_sponsored && (
          <View style={[styles.cTag, { backgroundColor: colors.primary }]}>
            <AppText style={styles.cTagText}>★</AppText>
          </View>
        )}
      </View>
      <View style={styles.cBody}>
        <AppText
          numberOfLines={1}
          style={[styles.cPrice, { color: colors.foreground, textAlign }]}
        >
          {item.price_display}
        </AppText>
        <AppText
          numberOfLines={1}
          style={[styles.cTitle, { color: colors.mutedForeground, textAlign }]}
        >
          {item.title}
        </AppText>
      </View>
    </Pressable>
  );
}

export function SearchDiscover({
  onBrowseBrand,
  onApplySaved,
  onOpenListing,
  onBrowseSection,
  onExploreMap,
  onSearchQuery,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { recentlyViewed, savedSearches, recentQueries } = useSession();
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  // Which section card is expanded to reveal its engine chips (cars/real-estate).
  const [openSection, setOpenSection] = useState<Category | null>(null);

  // Same honest inventory gate as the Search chrome engine bar — never show
  // empty engines / car brands when facets prove there is no backing stock.
  const facetCategory: Category = openSection ?? "all";
  const { globalFacets, scopedFacets } = useInventoryFacets(facetCategory);
  const openEngines = useMemo(
    () => (openSection ? visibleEngines(openSection, scopedFacets) : []),
    [openSection, scopedFacets]
  );
  const showCarBrands =
    !globalFacets || (globalFacets.category.car ?? 0) > 0;

  const { data: trendingRes, isLoading: trendingLoading } = useGetTrending();
  const trending = trendingRes?.data ?? [];

  // Honest gate for the "Explore on map" entry: only surface it when we have
  // coordinate-bearing inventory for the company that exploreOnMap will open.
  // Discover-root (no openSection) defaults to real_estate — require RE pins.
  // An open section requires that section's own mappable evidence.
  const mapAvailable = trending.some((i) => {
    if (
      !i.coordinates ||
      !Number.isFinite(i.coordinates.lat) ||
      !Number.isFinite(i.coordinates.lng)
    ) {
      return false;
    }
    if (openSection === "car") return i.category === "car";
    if (openSection === "real_estate") return i.category === "real_estate";
    if (openSection === "facilities" || openSection === "materials") {
      return i.category === "industrial";
    }
    return i.category === "real_estate";
  });

  const goToResults = (category: Category, engine: string) => {
    onBrowseSection(category, engine);
  };

  const handleSectionPress = (cat: Category) => {
    // Cars & real-estate reveal their engine chips inline; the others have no
    // engine bar, so jump straight to the (browse-all) results screen.
    if (enginesForCategory(cat)) {
      setOpenSection((prev) => (prev === cat ? null : cat));
    } else {
      goToResults(cat, "all");
    }
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <AppText
      style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}
    >
      {label}
    </AppText>
  );

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
        {SECTIONS.map((cat) => {
          const open = openSection === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => handleSectionPress(cat)}
              style={styles.sectionCardWrap}
              testID={`section-card-${cat}`}
            >
              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: SECTION_GRADIENT[cat][1] },
                  open && styles.sectionCardOpen,
                ]}
              >
                <Image
                  source={SECTION_PHOTO[cat]}
                  style={styles.sectionPhoto}
                  contentFit="cover"
                  transition={220}
                />
                {/* Cinematic scrim: keeps the photo legible and lends a premium,
                    editorial depth (light at the top, deep at the base). */}
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
                <View
                  pointerEvents="none"
                  style={styles.sectionWatermarkWrap}
                >
                  <Image
                    source={BANCO_WATERMARK}
                    style={styles.sectionWatermark}
                    contentFit="contain"
                    tintColor="#FFFFFF"
                  />
                </View>
                <View style={styles.sectionBadge}>
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
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <AppText style={[styles.sectionLabel, { textAlign }]}>
                    {t(`home.categories.${cat}`)}
                  </AppText>
                </View>
                {enginesForCategory(cat) && (
                  <Feather
                    name={open ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="rgba(255,255,255,0.92)"
                    style={[
                      styles.sectionChevron,
                      isRTL ? { left: 12 } : { right: 12 },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── 5th portal card: Booking & Stays ────────────────────────────────
          UI-only concept — maps to real_estate + offer_type=rent without
          touching the shared taxonomy type. Full-width to distinguish it
          as a new portal entry rather than a same-tier catalogue section. */}
      <Pressable
        onPress={() => onBrowseSection("real_estate", "rent")}
        style={styles.bookingCardWrap}
        testID="section-card-booking"
      >
        <LinearGradient
          colors={["#0A2840", "#040D14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bookingCard}
        >
          {/* Subtle BANCO watermark behind content */}
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
              styles.bookingCardRow,
              { flexDirection: rowDir },
            ]}
          >
            <View style={[styles.sectionBadge, { backgroundColor: "rgba(26,127,219,0.25)", borderColor: "rgba(26,127,219,0.45)" }]}>
              <Feather name="calendar" size={20} color="#5AB4FF" />
            </View>
            <View style={styles.bookingCardText}>
              <AppText style={[styles.sectionLabel, { textAlign, fontSize: 17 }]}>
                {t("home.categories.booking")}
              </AppText>
              <AppText style={[styles.bookingCardSub, { textAlign }]}>
                {t("search.discover.bookingHubSub")}
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

      {/* Engine chips for the expanded section — facet-gated like Search chrome */}
      {openSection && openEngines.length > 1 && (
        <View style={styles.engineReveal}>
          <EngineChips
            engines={openEngines}
            selected="all"
            onChange={(key) => goToResults(openSection, key)}
          />
        </View>
      )}

      {/* Car import — marketplace cars only (not under Business hub). */}
      {showCarBrands ? (
        <Pressable
          onPress={() => onBrowseSection("car", "import")}
          style={styles.mapCtaWrap}
          testID="discover-car-import"
        >
          <LinearGradient
            colors={["#1A2030", "#0A0C12"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mapCta}
          >
            <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
              <View style={[styles.mapBadge, { backgroundColor: "#2A6FDB" }]}>
                <Feather name="truck" size={20} color="#FFFFFF" />
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
      ) : null}

      {/* Explore on map — marketplace surface (before personal rails). */}
      {mapAvailable && (
        <Pressable
          onPress={() => onExploreMap(openSection ?? "real_estate")}
          style={styles.mapCtaWrap}
          testID="discover-explore-map"
        >
          <LinearGradient
            colors={["#23252B", "#0C0D10"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mapCta}
          >
            <Image
              source={require("../assets/images/banco-glow.png")}
              style={[styles.mapGlow, isRTL ? { left: -24 } : { right: -24 }]}
              contentFit="contain"
            />
            <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
              <View style={[styles.mapBadge, { backgroundColor: colors.primary }]}>
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
      )}

      {/* Recent text searches — the fastest re-entry for a returning user.
          Local-only history (SessionContext), hidden entirely when empty. */}
      {recentQueries.length > 0 && (
        <>
          <SectionHeader label={t("search.discover.recent")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipRow, { flexDirection: rowDir }]}
          >
            {recentQueries.map((q) => (
              <Pressable
                key={q}
                onPress={() => onSearchQuery(q)}
                style={[
                  styles.savedChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    flexDirection: rowDir,
                  },
                ]}
                testID={`recent-query-${q}`}
              >
                <Feather name="clock" size={13} color={colors.mutedForeground} />
                <AppText
                  numberOfLines={1}
                  style={[styles.savedChipText, { color: colors.foreground }]}
                >
                  {q}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Popular car brands — only when car inventory exists (or facets loading) */}
      {showCarBrands ? (
        <>
          <SectionHeader label={t("search.discover.popularBrands")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipRow, { flexDirection: rowDir }]}
          >
            {QUICK_BRANDS.map((b) => (
              <Pressable
                key={b.value}
                onPress={() => onBrowseBrand(b)}
                style={[
                  styles.brandChip,
                  { backgroundColor: colors.secondary, borderRadius: 20 },
                ]}
              >
                <AppText
                  style={[styles.brandChipText, { color: colors.foreground }]}
                >
                  {brandLabel(b, isRTL)}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* Saved searches */}
      {savedSearches.length > 0 && (
        <>
          <SectionHeader label={t("search.discover.saved")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipRow, { flexDirection: rowDir }]}
          >
            {savedSearches.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onApplySaved(s)}
                style={[
                  styles.savedChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    flexDirection: rowDir,
                  },
                ]}
              >
                <Feather name="bookmark" size={13} color={colors.primary} />
                <AppText
                  numberOfLines={1}
                  style={[styles.savedChipText, { color: colors.foreground }]}
                >
                  {s.q.trim() || t(`home.categories.${s.category}` as never)}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Trending */}
      {(trendingLoading || trending.length > 0) && (
        <>
          <SectionHeader label={t("search.discover.trending")} />
          {trendingLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.cardRow, { flexDirection: rowDir }]}
            >
              {trending.map((item) => (
                <CompactCard key={item.id} item={item} onPress={onOpenListing} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* Recently viewed */}
      {recentlyViewed.length > 0 && (
        <>
          <SectionHeader label={t("search.discover.recentlyViewed")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.cardRow, { flexDirection: rowDir }]}
          >
            {recentlyViewed.map((item) => (
              <CompactCard key={item.id} item={item} onPress={onOpenListing} />
            ))}
          </ScrollView>
        </>
      )}

      {/* —— Business hub (B2B only — not marketplace car filters) —— */}
      <SectionHeader label={t("search.discover.businessHub")} />

      <Pressable
        onPress={() => router.push("/business/supply-hub")}
        style={styles.mapCtaWrap}
        testID="discover-supply-portal"
      >
        <LinearGradient
          colors={["#3A0A10", "#120406"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapCta}
        >
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View style={[styles.mapBadge, { backgroundColor: colors.primary }]}>
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

      {/* Global Supply & Importers hub — B2B sourcing / import-export deals */}
      <Pressable
        onPress={() => router.push("/business/global-supply")}
        style={styles.mapCtaWrap}
        testID="discover-importers-hub"
      >
        <LinearGradient
          colors={["#0D1F30", "#060C14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapCta}
        >
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View style={[styles.mapBadge, { backgroundColor: "#1A5FAD" }]}>
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

      {/* Banks & Financiers hub — financial institutions financing portal */}
      <Pressable
        onPress={() => router.push("/business/banks")}
        style={styles.mapCtaWrap}
        testID="discover-banks-hub"
      >
        <LinearGradient
          colors={["#1A1200", "#0A0800"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapCta}
        >
          <View style={[styles.mapCtaRow, { flexDirection: rowDir }]}>
            <View style={[styles.mapBadge, { backgroundColor: "#C9A84C" }]}>
              <Feather name="credit-card" size={20} color="#000000" />
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

      <CompanyOffers />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionCardWrap: {
    width: "47%",
    maxWidth: "47%",
    flexGrow: 0,
    flexBasis: "47%",
  },
  sectionCard: {
    height: 118,
    borderRadius: 20,
    overflow: "hidden",
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    // Premium depth: each card reads as a framed, elevated tile.
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  sectionCardOpen: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
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
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
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
  engineReveal: {
    marginTop: 6,
  },
  mapCtaWrap: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  mapCta: {
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
  },
  mapGlow: {
    position: "absolute",
    top: -16,
    bottom: -16,
    width: 130,
    opacity: 0.5,
  },
  mapCtaRow: {
    alignItems: "center",
    gap: 14,
  },
  mapBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCtaText: {
    flex: 1,
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
  // ── Booking & Stays portal card ──────────────────────────────────────
  bookingCardWrap: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  bookingCard: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(90,180,255,0.18)",
    shadowColor: "#1A7FDB",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
    justifyContent: "center",
  },
  bookingCardRow: {
    alignItems: "center",
    gap: 14,
  },
  bookingCardText: {
    flex: 1,
    gap: 3,
  },
  bookingCardSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },
});
