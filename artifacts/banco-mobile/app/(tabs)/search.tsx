import { Feather, Ionicons } from "@/components/icons";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import {
  getAutocomplete,
  sendBehaviorSignal,
  FeedItem,
  SearchListingsCategory,
} from "@workspace/api-client-react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/AppText";
import { CarPicker } from "@/components/CarPicker";
import { LocationPicker } from "@/components/LocationPicker";
import { SearchDiscover } from "@/components/SearchDiscover";
import { SkeletonCard } from "@/components/SkeletonCard";
import RecentSearchChips from "@/components/search/RecentSearchChips";
import { SearchResultsSurface } from "@/components/search/SearchResultsSurface";
import { SearchResultsMap } from "@/components/search/SearchResultsMap";
import { FilterSheet } from "@/components/search/FilterSheet";
import {
  Category,
  CategoryIcon,
  CategoryTabs,
  EngineChips,
  IndustrialSubChips,
  type IndustrialType,
  apiCategoryFor,
  industrialGroupForCategory,
} from "@/components/CategoryTabs";
import {
  useInventoryFacets,
  visibleCategories,
  visibleEngines,
  visibleIndustrialTypes,
} from "@/lib/facets";
import {
  POPULAR_BRANDS,
  brandQuery,
  type CarBrand,
} from "@/constants/cars";
import { labelForValue } from "@/constants/locations";
import { DEFAULT_MARKET_COUNTRY } from "@/constants/listingCreateTaxonomy";
import { engineByKey, enginesForCategory } from "@/constants/engines";
import { useI18n } from "@/context/LanguageContext";
import { useSession } from "@/context/SessionContext";
import { useSound } from "@/context/SoundContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useColors } from "@/hooks/useColors";
import { useSearchMiniApp } from "@/hooks/useSearchMiniApp";
import shouldShowRecentSearches from "@/lib/recentSearchPolicy";
import {
  DEFAULT_CRITERIA,
  SearchCriteria,
  hasActiveCriteria,
  type PaymentType,
  type SearchSort,
} from "@/lib/searchParams";
import {
  hasIncomingSearchNavParams,
  parseMobileSearchNavParams,
} from "@/lib/searchNavParams";
import {
  DEFAULT_NEAR_RADIUS_KM,
  requestNearMeCoords,
} from "@/lib/nearMe";
import {
  rentalTermsForSearch,
  sanitizeRentalTermForMarket,
} from "@/lib/searchTaxonomy";
import {
  MarketCountryButton,
  MarketCountryPicker,
} from "@/components/MarketCountryPicker";

type FilterCategory = Category;

const CATEGORIES: FilterCategory[] = [
  "all",
  "car",
  "real_estate",
  "facilities",
  "materials",
];

const QUICK_BRANDS: CarBrand[] = POPULAR_BRANDS.filter((b) => b.createSafe);

const CLEAR_ATTRS: Partial<SearchCriteria> = {
  engineKey: "all",
  brand: null,
  model: null,
  fuelType: null,
  transmission: null,
  minYear: "",
  maxYear: "",
  industry: null,
  originType: null,
  industrialType: "all",
  rentalTerm: null,
};

const CLEAR_FILTERS: Partial<SearchCriteria> = {
  category: "all",
  sort: "recommended",
  minPrice: "",
  maxPrice: "",
  location: "",
  paymentType: "any",
  marketCountry: DEFAULT_MARKET_COUNTRY,
  nearMeEnabled: false,
  nearLat: null,
  nearLng: null,
  nearRadiusKm: DEFAULT_NEAR_RADIUS_KM,
};

const SORTS: SearchSort[] = [
  "recommended",
  "newest",
  "price_asc",
  "price_desc",
  "popular",
];

function MorphSearchIcon({
  category,
  color,
}: {
  category: FilterCategory;
  color: string;
}) {
  const active = category !== "all";
  const [lastCat, setLastCat] = useState<FilterCategory>(
    active ? category : "car"
  );
  useEffect(() => {
    if (active) setLastCat(category);
  }, [active, category]);

  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, { duration: 240 });
  }, [active, p]);

  const searchStyle = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ scale: 1 - p.value * 0.3 }],
  }));
  const catStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.7 + p.value * 0.3 }],
  }));

  return (
    <View style={styles.morphIcon}>
      <Animated.View style={[styles.morphLayer, searchStyle]}>
        <Feather name="search" size={18} color={color} />
      </Animated.View>
      <Animated.View style={[styles.morphLayer, catStyle]}>
        <CategoryIcon category={lastCat} size={18} color={color} />
      </Animated.View>
    </View>
  );
}

export default function SearchScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { playSound } = useSound();
  const insets = useSafeAreaInsets();
  const {
    sessionId,
    isSaved,
    toggleSave,
    saveSearch,
    isSearchSaved,
    cacheFeedItem,
    recordQuery,
    recentQueries,
  } = useSession();
  const { requireAuth } = useAuthGate();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);

  const params = useLocalSearchParams() as Record<
    string,
    string | string[] | undefined
  >;

  const onCommitted = useCallback(
    (c: SearchCriteria) => {
      sendBehaviorSignal({
        session_id: sessionId,
        action: "click",
        category: apiCategoryFor(c.category) as
          | SearchListingsCategory
          | undefined,
      }).catch(() => {});
    },
    [sessionId]
  );

  const search = useSearchMiniApp(onCommitted);
  const { criteria, items, viewState, phase, hasNext, commit, update, applyPatch, loadMore, retry } =
    search;

  const [mapMode, setMapMode] = useState(false);
  const mappableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.coordinates &&
          Number.isFinite(i.coordinates.lat) &&
          Number.isFinite(i.coordinates.lng)
      ),
    [items]
  );
  const canMap = viewState === "results" && mappableItems.length > 0;
  useEffect(() => {
    if (!canMap && mapMode) setMapMode(false);
  }, [canMap, mapMode]);

  const { globalFacets, scopedFacets, loading: facetsLoading } =
    useInventoryFacets(criteria.category, criteria.marketCountry);
  const shownCategories = useMemo(() => {
    const visible = visibleCategories(CATEGORIES, globalFacets);
    return CATEGORIES.filter(
      (c) => visible.includes(c) || c === criteria.category
    );
  }, [globalFacets, criteria.category]);

  const engineList = useMemo(
    () => visibleEngines(criteria.category, scopedFacets),
    [criteria.category, scopedFacets]
  );
  const activeGroup = industrialGroupForCategory(criteria.category);
  const visibleIndTypes = useMemo(
    () => (activeGroup ? visibleIndustrialTypes(activeGroup, scopedFacets) : null),
    [activeGroup, scopedFacets]
  );
  const showIndustrialChips =
    !facetsLoading && !!visibleIndTypes && visibleIndTypes.length > 1;
  useEffect(() => {
    if (facetsLoading) return;
    const patch: Partial<SearchCriteria> = {};
    if (
      criteria.engineKey !== "all" &&
      !engineList.some((e) => e.key === criteria.engineKey)
    ) {
      patch.engineKey = "all";
    }
    if (
      criteria.industrialType !== "all" &&
      visibleIndTypes &&
      !visibleIndTypes.includes(criteria.industrialType)
    ) {
      patch.industrialType = "all";
    }
    if (Object.keys(patch).length === 0) return;
    applyPatch(patch);
    const next = { ...criteria, ...patch };
    if (hasActiveCriteria(next)) retry();
  }, [
    engineList,
    visibleIndTypes,
    criteria,
    applyPatch,
    retry,
    facetsLoading,
  ]);

  const [draftQuery, setDraftQuery] = useState("");
  const [searchEngaged, setSearchEngaged] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [brandValue, setBrandValue] = useState<string | null>(null);
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);

  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(
    () => () => {
      if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
      if (commitTimer.current) clearTimeout(commitTimer.current);
    },
    []
  );

  const autocompleteSeq = useRef(0);

  const fetchAutocomplete = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const seq = ++autocompleteSeq.current;
    try {
      const res = await getAutocomplete({ q });
      if (seq !== autocompleteSeq.current) return;
      setSuggestions(res.data ?? []);
    } catch {
      if (seq !== autocompleteSeq.current) return;
      setSuggestions([]);
    }
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setDraftQuery(text);
    setBrandValue(null);
    setShowSuggestions(true);
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    autocompleteTimer.current = setTimeout(() => fetchAutocomplete(text), 250);
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      update({ q: text, brand: null, model: null });
    }, 350);
  }, [fetchAutocomplete, update]);

  const commitQueryNow = useCallback((q: string) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setShowSuggestions(false);
    recordQuery(q);
    update({ q, brand: null, model: null });
  }, [recordQuery, update]);

  const clearQuery = useCallback(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setDraftQuery("");
    setBrandValue(null);
    setSuggestions([]);
    setShowSuggestions(false);
    update({ q: "", brand: null, model: null });
  }, [update]);

  const browseBrand = useCallback(
    (brand: CarBrand, model: string | null) => {
      const display = model
        ? `${brandQuery(brand)} ${model}`
        : brandQuery(brand);
      setDraftQuery(display);
      setBrandValue(brand.value);
      setShowFilters(false);
      setShowSuggestions(false);
      setCarPickerOpen(false);
      update({
        ...CLEAR_ATTRS,
        q: "",
        category: "car",
        brand: brandQuery(brand),
        model,
      });
    },
    [update]
  );

  const appliedSig = useRef<string>("");
  useEffect(() => {
    if (!hasIncomingSearchNavParams(params)) return;
    const sig = JSON.stringify(params);
    if (sig === appliedSig.current) return;
    appliedSig.current = sig;

    const next = parseMobileSearchNavParams(params) as SearchCriteria;
    setDraftQuery(next.q);
    setBrandValue(null);
    commit(next);
  }, [params]);

  const handleSuggestionTap = useCallback((s: string) => {
    setDraftQuery(s);
    setBrandValue(null);
    commitQueryNow(s);
  }, [commitQueryNow]);

  const handleRecentSearchTap = useCallback((query: string) => {
    setDraftQuery(query);
    setBrandValue(null);
    commitQueryNow(query);
  }, [commitQueryNow]);

  const handleCardPress = useCallback(
    (item: FeedItem) => {
      if (!requireAuth()) return;
      cacheFeedItem(item);
      router.push(`/listing/${item.id}`);
    },
    [requireAuth, cacheFeedItem],
  );

  const selectCategory = useCallback((cat: FilterCategory) => {
    if (brandValue) setDraftQuery("");
    setBrandValue(null);
    update({ ...CLEAR_ATTRS, category: cat });
  }, [brandValue, update]);

  const exploreOnMap = () => {
    if (brandValue) setDraftQuery("");
    setBrandValue(null);
    router.push("/section/maps");
  };

  const selectEngine = (key: string) => {
    const engine = engineByKey(criteria.category, key);
    const patch: Partial<SearchCriteria> = { engineKey: key };
    if (engine?.params.offer_type === "sale") patch.rentalTerm = null;
    if (engine?.params.fuel_type) patch.fuelType = engine.params.fuel_type;
    if (engine?.params.transmission) {
      patch.transmission = engine.params.transmission;
    }
    update(patch);
  };

  const selectIndustrialType = (type: IndustrialType) =>
    update({ industrialType: type });

  const selectOrigin = (o: "all" | "local" | "imported") =>
    update({ originType: o === "all" ? null : o });

  const selectRentalTerm = (term: string) =>
    update({ rentalTerm: criteria.rentalTerm === term ? null : term });

  const selectMarketCountry = (code: string) =>
    update({
      marketCountry: code,
      rentalTerm: sanitizeRentalTermForMarket(criteria.rentalTerm, code),
    });

  const toggleNearMe = useCallback(async () => {
    if (criteria.nearMeEnabled) {
      update({
        nearMeEnabled: false,
        nearLat: null,
        nearLng: null,
        ...(criteria.sort === "nearest" ? { sort: "recommended" as const } : {}),
      });
      return;
    }
    const coords = await requestNearMeCoords();
    if (!coords) {
      Alert.alert(t("search.nearMe"), t("search.nearMeDenied"));
      return;
    }
    update({
      nearMeEnabled: true,
      nearLat: coords.lat,
      nearLng: coords.lng,
      nearRadiusKm: DEFAULT_NEAR_RADIUS_KM,
    });
  }, [criteria.nearMeEnabled, criteria.sort, t, update]);

  const rentalTerms = rentalTermsForSearch(criteria.marketCountry);

  const originKey: "all" | "local" | "imported" =
    criteria.originType === "local" || criteria.originType === "imported"
      ? criteria.originType
      : "all";

  const showRentalTerms =
    criteria.category === "real_estate" &&
    engineByKey(criteria.category, criteria.engineKey)?.params.offer_type !==
      "sale";

  const browseBrandChip = useCallback(
    (b: CarBrand) => browseBrand(b, null),
    [browseBrand]
  );

  const clearAllFilters = useCallback(() => {
    setBrandValue(null);
    update({ ...CLEAR_ATTRS, ...CLEAR_FILTERS });
  }, [update]);

  const handleSaveSearch = () => {
    saveSearch({
      name: draftQuery.trim() || t(`home.categories.${criteria.category}`),
      q: draftQuery.trim(),
      category: criteria.category,
      minPrice: criteria.minPrice,
      maxPrice: criteria.maxPrice,
      location: criteria.location,
      paymentType: criteria.paymentType,
      criteria: { ...criteria, q: draftQuery.trim() },
    });
  };

  const activeFilterCount = [
    criteria.category !== "all",
    !!criteria.minPrice || !!criteria.maxPrice,
    !!criteria.location,
    criteria.paymentType !== "any",
  ].filter(Boolean).length;

  const searchSaved =
    !!draftQuery.trim() &&
    isSearchSaved({
      q: draftQuery.trim(),
      category: criteria.category,
      minPrice: criteria.minPrice,
      maxPrice: criteria.maxPrice,
      location: criteria.location,
      paymentType: criteria.paymentType,
    });

  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const showRecentSearches = shouldShowRecentSearches({
    draftQuery,
    showSuggestions,
    searchEngaged,
    recentQueries,
    viewState,
  });

  const locationLabel = criteria.location
    ? labelForValue(criteria.location, isRTL) || criteria.location
    : "";

  let overlay: React.ReactNode = null;
  if (viewState === "discover") {
    overlay = <SearchDiscover onExploreMap={exploreOnMap} />;
  } else if (viewState === "loading") {
    overlay = (
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  } else if (viewState === "error") {
    overlay = (
      <View style={styles.emptyState}>
        <Feather name="wifi-off" size={52} color={colors.mutedForeground} />
        <AppText style={[styles.emptyTitle, { color: colors.foreground }]}>
          {t("search.errorTitle")}
        </AppText>
        <AppText style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {t("search.errorHint")}
        </AppText>
        <Pressable
          onPress={retry}
          style={[
            styles.applyBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              paddingHorizontal: 28,
              marginTop: 16,
            },
          ]}
          testID="search-retry"
        >
          <AppText style={[styles.applyText, { color: colors.primaryForeground }]}>
            {t("search.retry")}
          </AppText>
        </Pressable>
      </View>
    );
  } else if (viewState === "empty") {
    overlay = (
      <View style={styles.emptyState}>
        <Feather name="alert-circle" size={52} color={colors.mutedForeground} />
        <AppText style={[styles.emptyTitle, { color: colors.foreground }]}>
          {t("search.noResults")}
        </AppText>
        <AppText style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {t("search.noResultsHint")}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + (viewState === "discover" ? 6 : 12),
            paddingBottom: viewState === "discover" ? 8 : 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            flexDirection: rowDir,
          },
        ]}
      >
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              flexDirection: rowDir,
              paddingVertical: viewState === "discover" ? 8 : 10,
            },
          ]}
        >
          <MorphSearchIcon
            category={criteria.category}
            color={colors.mutedForeground}
          />
          <TextInput
            ref={inputRef}
            value={draftQuery}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => commitQueryNow(draftQuery)}
            onFocus={() => {
              setSearchEngaged(true);
              playSound("tap");
            }}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, textAlign }]}
            returnKeyType="search"
            testID="search-input"
            autoCorrect={false}
          />
          {draftQuery.length > 0 && (
            <Pressable onPress={clearQuery} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {!!draftQuery.trim() && (
          <Pressable
            onPress={handleSaveSearch}
            disabled={searchSaved}
            style={[
              styles.iconBtn,
              {
                backgroundColor: searchSaved ? colors.primary : colors.secondary,
                borderRadius: colors.radius,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("search.saveSearch")}
            testID="save-search"
          >
            <Feather
              name="bookmark"
              size={18}
              color={searchSaved ? colors.primaryForeground : colors.foreground}
            />
          </Pressable>
        )}

        {viewState !== "discover" ? (
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            style={[
              styles.iconBtn,
              {
                backgroundColor:
                  activeFilterCount > 0 ? colors.primary : colors.secondary,
                borderRadius: colors.radius,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("search.filters")}
            testID="filter-toggle"
          >
            <Feather
              name="sliders"
              size={18}
              color={
                activeFilterCount > 0
                  ? colors.primaryForeground
                  : colors.foreground
              }
            />
            {activeFilterCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.primaryForeground },
                ]}
              >
                <AppText
                  style={[styles.filterBadgeText, { color: colors.primary }]}
                >
                  {activeFilterCount}
                </AppText>
              </View>
            )}
          </Pressable>
        ) : null}
      </View>

      {showRecentSearches ? (
        <RecentSearchChips
          queries={recentQueries}
          onSelect={handleRecentSearchTap}
        />
      ) : null}

      {viewState !== "discover" ? (
        <>
          <CategoryTabs
            selected={criteria.category}
            onChange={selectCategory}
            visible={shownCategories}
          />
          <View style={[styles.marketRow, { flexDirection: rowDir }]}>
            <MarketCountryButton
              selected={criteria.marketCountry}
              onPress={() => {
                playSound("tap");
                setMarketPickerOpen(true);
              }}
            />
          </View>
          {!facetsLoading && engineList.length > 1 && !showIndustrialChips && (
            <EngineChips
              engines={engineList}
              selected={criteria.engineKey}
              onChange={selectEngine}
            />
          )}
          {showIndustrialChips && (
            <IndustrialSubChips
              types={visibleIndTypes!}
              selected={criteria.industrialType}
              onChange={selectIndustrialType}
            />
          )}
          {activeGroup ? (
            <View style={[styles.originRow, { flexDirection: rowDir }]}>
              {(["all", "local", "imported"] as const).map((o) => {
                const active = originKey === o;
                return (
                  <Pressable
                    key={o}
                    onPress={() => {
                      playSound("tap");
                      selectOrigin(o);
                    }}
                    style={[
                      styles.originChip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.secondary,
                      },
                    ]}
                    testID={`search-origin-${o}`}
                  >
                    <AppText
                      style={[
                        styles.originChipText,
                        {
                          color: active
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {o === "all"
                        ? t("search.any")
                        : t(`create.opts.${o}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {showRentalTerms ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.hScroll}
              contentContainerStyle={[
                styles.originRow,
                { flexDirection: rowDir },
              ]}
            >
              {rentalTerms.map((r) => {
                const active = criteria.rentalTerm === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => {
                      playSound("tap");
                      selectRentalTerm(r.value);
                    }}
                    style={[
                      styles.originChip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.secondary,
                      },
                    ]}
                    testID={`search-rental-${r.value}`}
                  >
                    <AppText
                      style={[
                        styles.originChipText,
                        {
                          color: active
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {isRTL ? r.ar : r.en}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </>
      ) : null}

      {viewState === "results" && items.length > 0 && (
        <AppText
          style={[
            styles.resultsCount,
            { color: colors.mutedForeground, textAlign },
          ]}
          testID="results-count"
        >
          {t("search.resultsCount", {
            count: `${items.length}${hasNext ? "+" : ""}`,
          })}
        </AppText>
      )}

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        criteria={criteria}
        shownCategories={shownCategories}
        engines={engineList}
        quickBrands={QUICK_BRANDS}
        brandValue={brandValue}
        locationLabel={locationLabel}
        onSelectCategory={selectCategory}
        onSelectEngine={selectEngine}
        onBrowseBrand={browseBrandChip}
        onOpenBrandPicker={() => setCarPickerOpen(true)}
        onUpdate={update}
        onOpenLocationPicker={() => setLocationPickerOpen(true)}
        onClearLocation={() => update({ location: "" })}
        onToggleNearMe={() => void toggleNearMe()}
        onClearAll={clearAllFilters}
      />

      {showSuggestions && suggestions.length > 0 && (
        <View
          style={[
            styles.suggestions,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              ...(isRTL
                ? { left: 76, right: 16 }
                : { left: 16, right: 76 }),
            },
          ]}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => handleSuggestionTap(s)}
              style={[
                styles.suggestionItem,
                {
                  flexDirection: rowDir,
                  borderBottomColor:
                    i < suggestions.length - 1 ? colors.border : "transparent",
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={14}
                color={colors.mutedForeground}
              />
              <AppText
                style={[
                  styles.suggestionText,
                  { color: colors.foreground, textAlign },
                ]}
              >
                {s}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.resultsArea}>
        <SearchResultsSurface
          items={items}
          onCardPress={handleCardPress}
          onSave={toggleSave}
          isSaved={isSaved}
          onEndReached={loadMore}
          loadingMore={phase === "loadingMore"}
          refreshing={phase === "refreshing"}
          error={phase === "error"}
          onRetry={retry}
          overlay={overlay}
        />

        {mapMode && canMap ? (
          <SearchResultsMap
            items={mappableItems}
            criteria={criteria}
            onOpenListing={handleCardPress}
            onOpenListingId={(id) =>
              router.push(
                criteria.category === "real_estate"
                  ? `/listing/${id}?focus=booking`
                  : `/listing/${id}`,
              )
            }
            onSave={toggleSave}
            isSaved={isSaved}
          />
        ) : null}

        {canMap ? (
          <View
            style={[styles.mapToggleWrap, { bottom: insets.bottom + 80 }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => {
                playSound("tap");
                setMapMode((m) => !m);
              }}
              style={[
                styles.mapToggle,
                {
                  backgroundColor: colors.foreground,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              testID="map-toggle"
            >
              <Feather
                name={mapMode ? "list" : "map"}
                size={16}
                color={colors.background}
              />
              <AppText style={[styles.mapToggleText, { color: colors.background }]}>
                {mapMode
                  ? t("search.viewList")
                  : `${t("search.viewMap")} (${mappableItems.length})`}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {viewState === "discover" && (
          <View
            style={[styles.mapToggleWrap, { bottom: insets.bottom + 80 }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => {
                playSound("tap");
                exploreOnMap();
              }}
              style={[
                styles.mapToggle,
                {
                  backgroundColor: colors.foreground,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("search.viewMap")}
              testID="discover-map-toggle"
            >
              <Feather name="map" size={16} color={colors.background} />
              <AppText style={[styles.mapToggleText, { color: colors.background }]}>
                {t("search.viewMap")}
              </AppText>
            </Pressable>
          </View>
        )}
      </View>

      <LocationPicker
        visible={locationPickerOpen}
        selectedValue={criteria.location}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(value) => {
          update({ location: value });
          setLocationPickerOpen(false);
        }}
        onClear={() => {
          update({ location: "" });
          setLocationPickerOpen(false);
        }}
      />

      <CarPicker
        visible={carPickerOpen}
        mode="browse"
        selectedBrand={brandValue ?? undefined}
        onClose={() => setCarPickerOpen(false)}
        onSelect={(brand, model) => browseBrand(brand, model)}
        onClear={() => {
          setBrandValue(null);
          setDraftQuery("");
          update({ q: "", brand: null, model: null });
          setCarPickerOpen(false);
        }}
      />

      <MarketCountryPicker
        visible={marketPickerOpen}
        selected={criteria.marketCountry}
        onClose={() => setMarketPickerOpen(false)}
        onSelect={(iso) => {
          selectMarketCountry(iso);
          setMarketPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultsArea: { flex: 1 },
  mapToggleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  mapToggle: {
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    elevation: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  mapToggleText: { fontSize: 14, fontWeight: "700" },
  resultsCount: { fontSize: 12.5, paddingHorizontal: 16, paddingTop: 8 },
  originRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  marketRow: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  originChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  originChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  hScroll: {
    flexGrow: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  searchRow: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
  },
  morphIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  morphLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  iconBtn: {
    padding: 12,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  applyBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  suggestions: {
    position: "absolute",
    top: 90,
    zIndex: 100,
    borderWidth: 1,
    overflow: "hidden",
  },
  suggestionItem: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
