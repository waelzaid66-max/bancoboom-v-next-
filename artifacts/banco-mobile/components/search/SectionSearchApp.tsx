import { Feather, Ionicons } from "@/components/icons";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import type { TextInput as RNTextInput } from "react-native";
import {
  getAutocomplete,
  sendBehaviorSignal,
  FeedItem,
  SearchListingsCategory,
} from "@workspace/api-client-react";
import { router, useLocalSearchParams, useNavigation, type Href } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValue } from "react-native-reanimated";

import { AppText } from "@/components/AppText";
import { CarPicker } from "@/components/CarPicker";
import { LocationPicker } from "@/components/LocationPicker";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SearchResultsSurface } from "@/components/search/SearchResultsSurface";
import { SearchResultsMap } from "@/components/search/SearchResultsMap";
import { FilterSheet } from "@/components/search/FilterSheet";
import { FilterPillSelect } from "@/components/search/FilterPillSelect";
import {
  PropertyHomeHeader,
  RE_COMMERCIAL_TAB,
  RE_COMMERCIAL_TYPES,
  RE_MORE_TAB,
  RE_MORE_TYPES,
} from "@/components/search/property/PropertyHomeHeader";
import { MaterialsHomeHeader } from "@/components/search/materials/MaterialsHomeHeader";
import {
  FacilitiesHomeHeader,
  type FacilityType,
} from "@/components/search/facilities/FacilitiesHomeHeader";
import {
  CAR_CATEGORIES,
  CarsHomeHeader,
  type CarHeroStat,
} from "@/components/search/car/CarsHomeHeader";
import type { VehicleGlyphName } from "@/components/search/car/VehicleGlyph";
import { axisShape, type SectionChrome } from "@/components/search/sectionChrome";
import { MiniAppBottomNav } from "@/components/MiniAppBottomNav";
import {
  Category,
  CategoryIcon,
  type IndustrialType,
  apiCategoryFor,
  industrialGroupForCategory,
} from "@/components/CategoryTabs";
import {
  useInventoryFacets,
  visibleEngines,
  visibleIndustrialTypes,
} from "@/lib/facets";
import {
  POPULAR_BRANDS,
  brandLabel,
  brandQuery,
  type CarBrand,
} from "@/constants/cars";
import { labelForValue } from "@/constants/locations";
import {
  DEFAULT_MARKET_COUNTRY,
  MARKET_COUNTRIES,
  MATERIAL_TYPES,
  PROPERTY_TYPES,
  sectionEmptyPostRequestCategory,
} from "@/constants/listingCreateTaxonomy";
import {
  loadPreferredMarketCountry,
  savePreferredMarketCountry,
} from "@/lib/marketPreference";
import {
  engineByKey,
  enginesForCategory,
  type EngineDef,
} from "@/constants/engines";
import { useI18n } from "@/context/LanguageContext";
import { useSession } from "@/context/SessionContext";
import { soundForCategory, useSound } from "@/context/SoundContext";
import { useColors } from "@/hooks/useColors";
import { useSearchMiniApp } from "@/hooks/useSearchMiniApp";
import {
  CLEAR_SECTION_ATTRS,
  DEFAULT_CRITERIA,
  SearchCriteria,
  mapAnchorKey,
} from "@/lib/searchParams";
import { openOrLatchMap, resolveMapLatch, wantsMapFromParam } from "@/lib/mapLatch";
import { DEFAULT_NEAR_RADIUS_KM, requestNearMeCoords } from "@/lib/nearMe";
import {
  MarketCountryButton,
  MarketCountryPicker,
} from "@/components/MarketCountryPicker";
import {
  rentalTermsForSearch,
  sanitizeRentalTermForMarket,
} from "@/lib/searchTaxonomy";
import { SECTION_NEUTRAL, sectionAccent } from "@/lib/sectionTheme";

const QUICK_BRANDS: CarBrand[] = POPULAR_BRANDS;
const CLEAR_ATTRS = CLEAR_SECTION_ATTRS;

/** RE primary type strip — Stay-parallel axis via criteria.propertyType.
 *  Core + commercial types; facet-gated extras appear when inventory exists. */
const RE_TYPE_PRIMARY = [
  "apartment",
  "villa",
  "land",
  "studio",
  "chalet",
  "townhouse",
  "duplex",
  "penthouse",
  "office",
  "shop",
  "warehouse",
  "hotel",
  "commercial_land",
] as const;

const RE_TYPE_ALL = "__all__";

/** Offer-axis engines only (تمليك / إيجار). Property-type engines belong on
 *  the separate type strip via propertyType — never mixed into this row. */
function isReOfferEngine(engine: EngineDef): boolean {
  if (engine.key === "all") return true;
  return engine.params.offer_type === "sale" || engine.params.offer_type === "rent";
}

/** FilterSheet engines for RE: refinements only (compound/furnished/…).
 *  Offer sale/rent lives on PropertyHomeHeader strip; property-type engines
 *  stay out — Band D / propertyType owns those. */
function isReSheetEngine(engine: EngineDef): boolean {
  if (engine.key === "all") return true;
  if (engine.params.property_type) return false;
  if (
    engine.params.offer_type === "sale" ||
    engine.params.offer_type === "rent"
  ) {
    return false;
  }
  return true;
}

/**
 * Deterministic serialization of a criteria object (key-sorted) so the section
 * page can detect "dirtiness" as a delta against the per-entry baseline rather
 * than against hardcoded defaults. This keeps a freshly-entered page (which may
 * carry a persisted non-default market) from being falsely flagged dirty, while
 * still catching ANY user-applied change — including listing mode.
 */
function serializeCriteria(c: SearchCriteria): string {
  return (Object.keys(c) as (keyof SearchCriteria)[])
    .sort()
    .map((k) => `${String(k)}=${JSON.stringify(c[k])}`)
    .join("|");
}

export interface SectionSearchAppProps {
  /** The locked browse category — this page only ever shows this section. */
  category: Category;
  /**
   * Optional locked engine (e.g. "rent" for Booking & Stays). When set the
   * engine chips are hidden and the engine can never change for this page.
   */
  lockedEngine?: string;
  /** i18n key for the header title. */
  titleKey: string;
  /** i18n key for the small header subtitle. */
  subtitleKey?: string;
  /** Optional Feather icon name overriding the CategoryIcon in the header. */
  headerIcon?: React.ComponentProps<typeof Feather>["name"];
  /**
   * How THIS section renders its own axes. Owner rule: sections must not share a
   * shape by accident — cars, real-estate, factories and materials segment on
   * genuinely different things, so each screen states its own and this component
   * executes it. Omitted axes keep the shipped chip behaviour (see sectionChrome).
   */
  chrome?: SectionChrome;
}

/**
 * A self-contained, single-category search engine rendered as a full-screen
 * pushed page. Each mount owns its OWN `useSearchMiniApp` instance seeded to the
 * locked category (+ optional locked engine), so entering the page always starts
 * from a clean slate and leaving it discards all state (automatic reset by
 * lifecycle). It reuses every search sub-component (engine/industrial chips,
 * filter sheet, results surface, map) but renders NO category tabs — the
 * category is fixed. When the shopper has active filters, a back gesture / button
 * asks to confirm before discarding them.
 */
export function SectionSearchApp({
  category,
  lockedEngine,
  titleKey,
  subtitleKey,
  headerIcon,
  chrome,
}: SectionSearchAppProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { playSound } = useSound();
  // This mini-app is one section at a time, so its taps can carry that
  // section's cue instead of the neutral one. Read once — `category` is locked
  // for the life of the screen by the anti-melt guards.
  const tap = soundForCategory(category);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    sessionId,
    isSaved,
    toggleSave,
    saveSearch,
    isSearchSaved,
    cacheFeedItem,
    recordQuery,
  } = useSession();
  // Never invent a 67px web pad — that crushed/pushed section chrome on Replit
  // web and made headers look "destroyed". Use real safe-area insets only.
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);

  const accent = sectionAccent(category);

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
    [sessionId],
  );

  const search = useSearchMiniApp(onCommitted);
  const {
    criteria,
    items,
    viewState,
    phase,
    hasNext,
    commit: commitRaw,
    update: updateRaw,
    applyPatch: applyPatchRaw,
    loadMore,
    retry,
  } = search;

  // Hard lock (fact): this mini-app's prop category must never drift through
  // update/commit/applyPatch. FilterSheet already hides category UI, but a
  // partial that carries `category` would otherwise melt the section.
  const commit = useCallback(
    (next: SearchCriteria) => {
      commitRaw({
        ...next,
        category,
        ...(lockedEngine ? { engineKey: lockedEngine } : {}),
      });
    },
    [commitRaw, category, lockedEngine],
  );
  const update = useCallback(
    (partial: Partial<SearchCriteria>) => {
      updateRaw({
        ...partial,
        category,
        ...(lockedEngine ? { engineKey: lockedEngine } : {}),
      });
    },
    [updateRaw, category, lockedEngine],
  );
  const applyPatch = useCallback(
    (partial: Partial<SearchCriteria>) => {
      applyPatchRaw({
        ...partial,
        category,
        ...(lockedEngine ? { engineKey: lockedEngine } : {}),
      });
    },
    [applyPatchRaw, category, lockedEngine],
  );

  // The seeded baseline for this section — the "clean" state a page starts in.
  const baseEngine = lockedEngine ?? "all";
  const buildSeed = useCallback(
    (market: string): SearchCriteria => ({
      ...DEFAULT_CRITERIA,
      marketCountry: market,
      category,
      engineKey: baseEngine,
      rentalTerm:
        lockedEngine === "rent"
          ? sanitizeRentalTermForMarket(null, market)
          : null,
    }),
    [category, baseEngine, lockedEngine],
  );

  // The clean, per-entry baseline. Captured when the page seeds (and updated
  // when the async market preference hydrates) so "dirty" means "changed from
  // the state the shopper actually landed on", never "differs from hardcoded
  // defaults". This is what makes a freshly-entered page never prompt on exit.
  const baselineRef = useRef<SearchCriteria | null>(null);

  // Route intents: ?map=1 (MOB-07) · ?engine=import (Discover car-import CTA).
  // Must be read before seed so the first commit carries the deep-link engine.
  const params = useLocalSearchParams<{
    map?: string | string[];
    engine?: string | string[];
    property_type?: string | string[];
  }>();
  const mapParam = Array.isArray(params.map) ? params.map[0] : params.map;
  const engineParam = Array.isArray(params.engine)
    ? params.engine[0]
    : params.engine;
  const propertyTypeParam = Array.isArray(params.property_type)
    ? params.property_type[0]
    : params.property_type;

  // Seed the engine once on mount → entering the page immediately loads this
  // section's results with no category chooser in sight.
  // RE desks may also deep-link ?property_type=apartment (composes with ?engine=sale|rent).
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const allowed = enginesForCategory(category);
    const deepEngine =
      !lockedEngine &&
      engineParam &&
      allowed?.some((e) => e.key === engineParam)
        ? engineParam
        : null;
    const deepPropertyType =
      category === "real_estate" &&
      propertyTypeParam &&
      (RE_TYPE_PRIMARY as readonly string[]).includes(propertyTypeParam)
        ? propertyTypeParam
        : null;
    // Type-only engines (apartment/villa/…) migrate to propertyType below in
    // the normalize effect; if both engine=sale and property_type=… are set,
    // keep the offer engine and apply the type from the dedicated param.
    const seed: SearchCriteria = {
      ...buildSeed(criteria.marketCountry),
      ...(deepEngine ? { engineKey: deepEngine } : {}),
      ...(deepPropertyType ? { propertyType: deepPropertyType } : {}),
    };
    baselineRef.current = seed;
    commit(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native: confirm the preferred market once (AsyncStorage is async). Mirrors
  // the Search tab's safe pattern — applyPatch merges into the LATEST criteria
  // (no stale-closure overwrite of newer user changes), rentalTerm is derived
  // from a null basis, and we only re-query once a fetch is already in flight.
  // The baseline is advanced in lockstep so a hydrated market isn't "dirty".
  const marketHydrated = useRef(Platform.OS === "web");
  useEffect(() => {
    if (marketHydrated.current) return;
    let cancelled = false;
    void loadPreferredMarketCountry().then((iso) => {
      if (cancelled) return;
      marketHydrated.current = true;
      if (iso === criteria.marketCountry) return;
      const marketPatch: Partial<SearchCriteria> = {
        marketCountry: iso,
        rentalTerm: sanitizeRentalTermForMarket(null, iso),
      };
      if (baselineRef.current) {
        baselineRef.current = { ...baselineRef.current, ...marketPatch };
      }
      applyPatch(marketPatch);
      if (items.length > 0 || phase !== "idle") retry();
    });
    return () => {
      cancelled = true;
    };
  }, [applyPatch, retry, items.length, phase, criteria.marketCountry]);

  // ── Map view ──────────────────────────────────────────────────────────────
  // Expo Router may deliver query values as string | string[] — normalize so
  // ?map=1 always latches (MOB-07 must not silently no-op on web/native).
  const [mapMode, setMapMode] = useState(false);
  // Discover "Explore on map" / section ?map=1 — latch until results arrive.
  const [wantMap, setWantMap] = useState(() => wantsMapFromParam(mapParam));
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const mappableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.coordinates &&
          Number.isFinite(i.coordinates.lat) &&
          Number.isFinite(i.coordinates.lng),
      ),
    [items],
  );
  const inResultsView = viewState === "results";
  const hasPagePins = mappableItems.length > 0;
  const showMapChrome = inResultsView;
  useEffect(() => {
    if (!inResultsView && mapMode) setMapMode(false);
  }, [inResultsView, mapMode]);

  useEffect(() => {
    resolveMapLatch({
      wantMap,
      inResultsView,
      viewState,
      setMapMode,
      setWantMap,
    });
  }, [wantMap, inResultsView, viewState]);

  const mapSectionKey = mapAnchorKey(criteria);
  const prevMapSectionKey = useRef(mapSectionKey);
  useEffect(() => {
    if (prevMapSectionKey.current === mapSectionKey) return;
    prevMapSectionKey.current = mapSectionKey;
    // Keep a Discover map latch across the first seed/query; only clear map
    // when the shopper changes filters after that.
    if (!wantMap) setMapMode(false);
  }, [mapSectionKey, wantMap]);

  // ── Facet gating (scoped to the locked category) ───────────────────────────
  const { scopedFacets, loading: facetsLoading } =
    useInventoryFacets(criteria.category, criteria.marketCountry);
  const engineList = useMemo(
    () => visibleEngines(criteria.category, scopedFacets),
    [criteria.category, scopedFacets],
  );
  const isRealEstateSection = criteria.category === "real_estate";
  /** RE strip 1: offer only. Other sections keep the full engine bar. */
  const stripEngineList = useMemo(() => {
    if (!isRealEstateSection) return engineList;
    return engineList.filter(isReOfferEngine);
  }, [engineList, isRealEstateSection]);
  /** FilterSheet = refinements only (furnished/compound/payment…). Offer +
   *  property type live on dedicated strips so sheet never fights the chrome. */
  const filterSheetEngines = useMemo(() => {
    if (!isRealEstateSection) return engineList;
    return engineList.filter(isReSheetEngine);
  }, [engineList, isRealEstateSection]);
  /** RE strip 2: property types (composes with offer via propertyType). */
  const reTypeTabs = useMemo(() => {
    if (!isRealEstateSection) return [] as string[];
    const counts = scopedFacets?.property_type;
    const tabs = RE_TYPE_PRIMARY.filter((ty) => {
      // Core residential/land always visible (fail-open identity of the section).
      if (ty === "apartment" || ty === "villa" || ty === "land") return true;
      // Keep the shopper's current selection visible even when facet count is 0
      // so desk/FilterSheet taps are never silently wiped after normalize.
      if (criteria.propertyType === ty) return true;
      if (!counts) return true;
      return (counts[ty] ?? 0) > 0;
    });
    return tabs as string[];
  }, [isRealEstateSection, scopedFacets, criteria.propertyType]);
  /** When a sheet refinement owns engineKey, offer strip still highlights all. */
  const activeOfferKey = useMemo(() => {
    if (!isRealEstateSection) return criteria.engineKey;
    const eng = engineByKey(criteria.category, criteria.engineKey);
    if (!eng || isReOfferEngine(eng)) return criteria.engineKey;
    return "all";
  }, [isRealEstateSection, criteria.category, criteria.engineKey]);
  const activeGroup = industrialGroupForCategory(criteria.category);
  const visibleIndTypes = useMemo(
    () =>
      activeGroup ? visibleIndustrialTypes(activeGroup, scopedFacets) : null,
    [activeGroup, scopedFacets],
  );
  // Show industrial baseline chips while facets load (fail-open). Gating on
  // facetsLoading hid the whole strip and caused a reload flash per section.
  const showIndustrialChips =
    !!visibleIndTypes && visibleIndTypes.length > 1;

  // Normalize criteria if facets reveal the committed engine/sub-type is empty.
  // Never touches a locked engine.
  useEffect(() => {
    if (facetsLoading) return;
    const patch: Partial<SearchCriteria> = {};
    // Migrate legacy RE property-type engines → propertyType strip so
    // تمليك/إيجار can compose with شقة/فيلا (single engineKey could not).
    if (criteria.category === "real_estate" && !lockedEngine) {
      const eng = engineByKey(criteria.category, criteria.engineKey);
      if (eng?.params.property_type) {
        patch.propertyType =
          criteria.propertyType ?? eng.params.property_type;
        patch.engineKey = "all";
      }
    }
    if (
      !lockedEngine &&
      criteria.engineKey !== "all" &&
      !patch.engineKey &&
      engineList.length > 0 &&
      !engineList.some((e) => e.key === criteria.engineKey)
    ) {
      patch.engineKey = "all";
      if (criteria.category === "car" && criteria.originType) {
        patch.originType = null;
      }
      if (criteria.category === "real_estate" && criteria.rentalTerm) {
        patch.rentalTerm = null;
      }
    }
    if (
      criteria.industrialType !== "all" &&
      visibleIndTypes &&
      !visibleIndTypes.includes(criteria.industrialType)
    ) {
      patch.industrialType = "all";
      if (criteria.category === "materials") {
        patch.industry = null;
        patch.material = null;
      }
    }
    if (
      criteria.category === "real_estate" &&
      criteria.propertyType &&
      !(RE_TYPE_PRIMARY as readonly string[]).includes(criteria.propertyType)
    ) {
      // Only wipe values outside the RE primary taxonomy (e.g. stale junk).
      // Never wipe a desk/FilterSheet type just because facets say count=0.
      patch.propertyType = null;
    }
    if (Object.keys(patch).length === 0) return;
    applyPatch(patch);
    retry();
  }, [
    engineList,
    stripEngineList,
    visibleIndTypes,
    reTypeTabs,
    criteria,
    applyPatch,
    retry,
    facetsLoading,
    lockedEngine,
    isRealEstateSection,
    scopedFacets,
  ]);

  // ── Text query + autocomplete ──────────────────────────────────────────────
  const [draftQuery, setDraftQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [brandValue, setBrandValue] = useState<string | null>(null);
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  /** B-oom Car: the filter axes open COLLAPSED. They used to paint five wrapped
   *  chip rows across the first screen and bury the results (owner, 2026-08-01).
   *  Nothing is deleted — market/sort/mode/engines/brand/origin all keep their
   *  single seat, they just wait behind one control. */
  /** Hero quick-category → free text. Not a taxonomy enum on purpose: the
   *  marine/aviation vehicle taxonomy is unapproved (REL-21) and an unsupported
   *  enum returns nothing. See the note in CarsHomeHeader. */
  const [carCategory, setCarCategory] = useState<VehicleGlyphName | null>(null);

  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<RNTextInput>(null);
  const autocompleteSeq = useRef(0);

  useEffect(
    () => () => {
      if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
      if (commitTimer.current) clearTimeout(commitTimer.current);
    },
    [],
  );

  const fetchAutocomplete = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      const seq = ++autocompleteSeq.current;
      try {
        const params: {
          q: string;
          category?: SearchListingsCategory;
          industrial_type?: string;
        } = { q };
        if (criteria.category === "car" || criteria.category === "real_estate") {
          params.category = criteria.category;
        } else if (
          criteria.category === "facilities" ||
          criteria.category === "materials"
        ) {
          params.category = "industrial";
          if (criteria.industrialType !== "all") {
            params.industrial_type = criteria.industrialType;
          } else {
            const group = industrialGroupForCategory(criteria.category);
            if (group?.length) params.industrial_type = group.join(",");
          }
        }
        const res = await getAutocomplete(params);
        if (seq !== autocompleteSeq.current) return;
        setSuggestions(res.data ?? []);
      } catch {
        if (seq !== autocompleteSeq.current) return;
        setSuggestions([]);
      }
    },
    [criteria.category, criteria.industrialType],
  );

  const handleQueryChange = (text: string) => {
    setDraftQuery(text);
    setBrandValue(null);
    setShowSuggestions(true);
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    autocompleteTimer.current = setTimeout(() => fetchAutocomplete(text), 250);
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      update({ q: text, brand: null, model: null });
    }, 350);
  };

  const commitQueryNow = (q: string) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setShowSuggestions(false);
    recordQuery(q);
    update({ q, brand: null, model: null });
  };

  const clearQuery = () => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    setDraftQuery("");
    setBrandValue(null);
    setSuggestions([]);
    setShowSuggestions(false);
    update({ q: "", brand: null, model: null });
  };

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
    [update],
  );

  const handleSuggestionTap = (s: string) => {
    setDraftQuery(s);
    setBrandValue(null);
    commitQueryNow(s);
  };

  const handleCardPress = useCallback(
    (item: FeedItem) => {
      cacheFeedItem(item);
      router.push(`/listing/${item.id}`);
    },
    [cacheFeedItem],
  );

  // ── Chrome handlers (engine locked category, no category switching) ─────────
  const selectEngine = (key: string) => {
    if (lockedEngine) return;
    const engine = engineByKey(criteria.category, key);
    const patch: Partial<SearchCriteria> = { engineKey: key };
    if (criteria.category === "real_estate") {
      patch.rentalTerm =
        engine?.params.offer_type === "rent" ? criteria.rentalTerm : null;
    }
    // Mirror Search-host: fuel/transmission engines also set attribute fields
    // so FilterSheet toggles stay in sync with the strip.
    if (criteria.category === "car") {
      if (engine?.params.fuel_type) patch.fuelType = engine.params.fuel_type;
      if (engine?.params.transmission) {
        patch.transmission = engine.params.transmission;
      }
    }
    if (engine?.params.origin_type) {
      patch.originType = engine.params.origin_type;
    } else if (criteria.category === "car" && criteria.originType) {
      patch.originType = null;
    }
    update(patch);
  };

  const selectIndustrialType = (type: IndustrialType) => {
    const patch: Partial<SearchCriteria> = { industrialType: type };
    if (
      criteria.category === "materials" &&
      (type === "all" || type === "raw_material")
    ) {
      patch.industry = null;
    }
    if (
      criteria.category === "materials" &&
      type !== "all" &&
      type !== "raw_material"
    ) {
      patch.material = null;
    }
    update(patch);
  };

  const selectOrigin = (o: "all" | "local" | "imported") => {
    if (criteria.category === "car") {
      // Keep origin strip and import engine on one axis (no dual conflict).
      const patch: Partial<SearchCriteria> = {
        originType: o === "all" ? null : o,
      };
      if (o === "imported") patch.engineKey = "import";
      else if (criteria.engineKey === "import") patch.engineKey = "all";
      update(patch);
      return;
    }
    update({ originType: o === "all" ? null : o });
  };

  const selectListingMode = (mode: "all" | "sale" | "buy") =>
    update({ listingMode: mode });

  /** RE type strip — composes with offer engine (sale/rent) via propertyType. */
  const selectRePropertyType = (value: string) => {
    // Band D picker sentinels — never commit as propertyType.
    if (value === RE_COMMERCIAL_TAB || value === RE_MORE_TAB) return;
    if (value === RE_TYPE_ALL || value === criteria.propertyType) {
      update({ propertyType: null });
      return;
    }
    update({ propertyType: value });
  };

  /** Materials commodity strip — steel/resin/… via criteria.material. */
  const selectMaterial = (value: string) => {
    update({ material: criteria.material === value ? null : value });
  };

  const selectRentalTerm = (term: string) => {
    const next = criteria.rentalTerm === term ? null : term;
    update({
      rentalTerm: next,
      ...(next && criteria.category === "real_estate"
        ? { engineKey: "rent" }
        : {}),
    });
  };

  const selectMarketCountry = (code: string) => {
    void savePreferredMarketCountry(code);
    update({
      marketCountry: code,
      rentalTerm: sanitizeRentalTermForMarket(criteria.rentalTerm, code),
    });
  };

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

  const openSearch = () => {
    playSound(tap);
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const browseBrandChip = useCallback(
    (b: CarBrand) => browseBrand(b, null),
    [browseBrand],
  );

  // "Clear all" resets to THIS section's clean entry baseline (locked category /
  // engine + the market the shopper landed on), never to "all" and without
  // discarding their market preference. Post-reset the page is not "dirty".
  const clearAllFilters = useCallback(() => {
    setDraftQuery("");
    setBrandValue(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchOpen(false);
    setShowFilters(false);
    setMapMode(false);
    const baseline =
      baselineRef.current ?? buildSeed(criteria.marketCountry);
    commit(baseline);
  }, [buildSeed, commit, criteria.marketCountry]);

  const rentalTerms = rentalTermsForSearch(criteria.marketCountry);
  const originKey: "all" | "local" | "imported" =
    criteria.originType === "local" || criteria.originType === "imported"
      ? criteria.originType
      : "all";
  const isMaterialsSection = criteria.category === "materials";
  const isCarSection = criteria.category === "car";
  const isFacilitiesSection = criteria.category === "facilities";

  /** B-INDUSTRY browse types. Every entry is a type the live `industrial_type`
   *  facet actually returned with a count above zero, so the strip can never
   *  offer a chip that leads to an empty result — and the number beside the
   *  label is the same number the search will produce. Unlike the car section,
   *  whose vehicle-type facet does not exist, this one is real. */
  const facilityTypes = useMemo<FacilityType[]>(() => {
    if (!isFacilitiesSection) return [];
    const counts = scopedFacets?.industrial_type;
    if (!counts) return [];
    const icon: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
      factory: "home",
      warehouse: "package",
      land: "map",
    };
    return (visibleIndTypes ?? [])
      .map((ty) => ({
        key: ty,
        label: t(`home.industrialTypes.${ty}` as never),
        count: counts[ty] ?? 0,
        icon: icon[ty] ?? "grid",
      }))
      .filter((ty) => ty.count > 0);
  }, [isFacilitiesSection, scopedFacets, visibleIndTypes, t]);
  // B-CORE upper header: identity + search/Filters + market beside BANCO.
  // Smart horizontal strip under header: industrial types + origin (wrap, flexGrow:0).
  // Commodity strip when raw/all. listingMode + refinements stay in FilterSheet
  // (sliders in search). Never erase strips.
  const showOriginChrome = isMaterialsSection;
  const showMaterialChrome =
    isMaterialsSection &&
    (criteria.industrialType === "all" ||
      criteria.industrialType === "raw_material");
  const showMaterialsAxisStrip = showOriginChrome;
  const showMaterialsLayer2 = showMaterialChrome;
  const showCarOriginChrome = criteria.category === "car" && !lockedEngine;
  const showCarBrandStrip = criteria.category === "car" && !lockedEngine;
  /**
   * Hero quick-category gate. Owner rule 2026-08-01: no fake anything.
   *
   * FacetCounts has no vehicle-type map (category · condition · fuel_type ·
   * transmission · payment_plan · property_type · finishing_type · offer_type ·
   * industrial_type · industry · origin_type), and GET /v1/search has no
   * body_type param — the API cannot separate a yacht from a sedan today. So
   * every one of the owner's 21 types is ungated and the strip stays empty,
   * exactly as lib/facets.ts requires ("never surface a chip that returns
   * nothing"). Point `typeCounts` at the real map when it ships; the strip,
   * the glyphs and the labels are already built.
   */
  /**
   * The eleven types from the owner's render, in his order.
   *
   * This memo used to declare `typeCounts` as undefined and return an empty
   * array on the next line, so the strip was drawn in the header and could
   * never paint — the two lines after that were unreachable. It was written
   * that way because there is no vehicle_type facet to gate the list against,
   * and a chip that leads to an empty screen is worse than no chip.
   *
   * That reasoning does not hold here, because a tap is NOT a guess: the
   * handler puts the type's own label into the query and runs a real search.
   * An empty result is then an honest answer about the catalogue, not a broken
   * control. The day the facet exists this gates against it and the strip only
   * shows types with stock.
   */
  const carHeroCategories = useMemo(() => {
    if (!isCarSection) return [];
    const inDesign = new Set([
      "cars",
      "motorcycles",
      "trucks",
      "buses",
      "heavy",
      "boats",
      "yachts",
      "ships",
      "aircraft",
      "helicopters",
      "more",
    ]);
    return CAR_CATEGORIES.filter((c) => inDesign.has(c.key));
  }, [isCarSection]);

  /**
   * Hero stats. Every entry is a live count or it does not exist.
   *
   * `scopedFacets.category` is the real per-category tally of active, publicly
   * visible listings for the chosen market — the same source the browse chips
   * already trust. While it loads, the band is simply absent (no skeleton
   * pretending to be a number, no last-known value).
   *
   * The mock's other five figures — 1.2M+ vehicles, 950+ dealers, 18+ auctions,
   * 34+ ports, 92+ shipping lines — have NO endpoint behind them anywhere in
   * this repo. They are not written here as literals and must not be: this
   * screen is the front door of a marketplace people spend money in.
   */
  const carHeroStats = useMemo<CarHeroStat[]>(() => {
    if (!isCarSection) return [];
    const out: CarHeroStat[] = [];
    const liveCars = scopedFacets?.category?.car;
    if (typeof liveCars === "number" && liveCars > 0) {
      out.push({
        key: "vehicles",
        value: `${liveCars}`,
        labelKey: "search.discover.section.carStatVehicles",
      });
    }
    out.push({
      key: "markets",
      value: `${MARKET_COUNTRIES.length}`,
      labelKey: "search.discover.section.carStatCountries",
    });
    return out;
  }, [isCarSection, scopedFacets]);
  const showRentalTerms =
    criteria.category === "real_estate" &&
    (activeOfferKey === "rent" ||
      engineByKey(criteria.category, criteria.engineKey)?.params.offer_type ===
        "rent");
  const showIndustrialChipsInStrip =
    showIndustrialChips && !isMaterialsSection;
  // Keep engine chips visible during facet load — visibleEngines already
  // fails open when scopedFacets are undefined. Hiding on facetsLoading made
  // every section entry flash an empty strip then repaint.
  // RE: offer strip + type tabs live in PropertyHomeHeader (not primary chips).
  const showEngineChips =
    !lockedEngine &&
    stripEngineList.length > 1 &&
    !showIndustrialChips &&
    !isRealEstateSection && !isMaterialsSection;
  // listingMode "For sale / Wanted" collides with RE offer sale/rent labels —
  // keep it for cars; RE uses offer engines + type strip (+ FilterSheet for مطلوب).
  const showListingMode = !lockedEngine && !isRealEstateSection && !isMaterialsSection;
  // Types live in PropertyHomeHeader Band D (mock-aligned primary set).
  const showReTypeStrip = false;
  /** Band D tabs — All / Apartments / Villas / Commercial / Land / More.
   *  Commercial + More are picker sentinels — never sent as API enums. */
  const reHeaderTypeTabs = useMemo(() => {
    if (!isRealEstateSection) return [] as { value: string; label: string }[];
    return [
      { value: RE_TYPE_ALL, label: t("search.discover.section.propertyTabAll") },
      { value: "apartment", label: t("search.discover.section.deskApartment") },
      { value: "villa", label: t("search.discover.section.deskVilla") },
      {
        value: RE_COMMERCIAL_TAB,
        label: t("search.discover.section.propertyTabCommercial"),
      },
      { value: "land", label: t("search.discover.section.deskLand") },
      {
        value: RE_MORE_TAB,
        label: t("search.discover.section.deskMore"),
      },
    ];
  }, [isRealEstateSection, t]);
  const reHeaderActiveType = useMemo(() => {
    if (!criteria.propertyType) return RE_TYPE_ALL;
    if (
      (RE_COMMERCIAL_TYPES as readonly string[]).includes(criteria.propertyType)
    ) {
      return RE_COMMERCIAL_TAB;
    }
    if ((RE_MORE_TYPES as readonly string[]).includes(criteria.propertyType)) {
      return RE_MORE_TAB;
    }
    if (
      criteria.propertyType === "apartment" ||
      criteria.propertyType === "villa" ||
      criteria.propertyType === "land"
    ) {
      return criteria.propertyType;
    }
    return RE_TYPE_ALL;
  }, [criteria.propertyType]);
  const materialsHeaderTypeTabs = useMemo(() => {
    if (!isMaterialsSection) return [] as { value: IndustrialType; label: string }[];
    return [
      { value: "all" as IndustrialType, label: t("home.industrialTypes.all") },
      { value: "machine" as IndustrialType, label: t("home.industrialTypes.machine") },
      {
        value: "raw_material" as IndustrialType,
        label: t("home.industrialTypes.raw_material"),
      },
      {
        value: "production_line" as IndustrialType,
        label: t("home.industrialTypes.production_line"),
      },
    ];
  }, [isMaterialsSection, t]);
  // Smart materials axis strip uses the same tab list (horizontal wrap chips).
  const materialsAxisTabs = materialsHeaderTypeTabs;
  // Country + currency live in ONE compact MarketCountryButton on the primary
  // strip — every section, no exception (owner 2026-07-20, completed for RE +
  // materials 2026-07-27). The old spread matrix laid 21 country cells in a
  // horizontal strip ≈ 6 screens wide; the button is ~140px and opens the same
  // picker the matrix's "…" button already opened, so nothing is lost.

  // ── Section-scoped "dirty" filter count (excludes the locked baseline) ──────
  const rentEngineActive =
    criteria.category === "real_estate" &&
    engineByKey(criteria.category, criteria.engineKey)?.params.offer_type ===
      "rent";
  const activeFilterCount = [
    !lockedEngine && criteria.engineKey !== "all",
    isRealEstateSection && !!criteria.propertyType,
    criteria.category === "facilities" || criteria.category === "materials"
      ? criteria.industrialType !== "all"
      : false,
    !!criteria.minPrice || !!criteria.maxPrice,
    !!criteria.location,
    criteria.paymentType !== "any" &&
      (criteria.category === "car" || criteria.category === "real_estate"),
    rentEngineActive && !!criteria.rentalTerm,
    criteria.category === "car" && (!!criteria.brand || !!criteria.model),
    criteria.category === "car" && !!criteria.fuelType,
    criteria.category === "car" && !!criteria.transmission,
    criteria.category === "car" && (!!criteria.minYear || !!criteria.maxYear),
    (criteria.category === "facilities" ||
      (criteria.category === "materials" &&
        (criteria.industrialType === "machine" ||
          criteria.industrialType === "production_line"))) &&
      !!criteria.industry,
    (criteria.category === "car" || criteria.category === "materials") &&
      !!criteria.originType,
    criteria.category === "materials" && !!criteria.material,
    criteria.listingMode !== "all",
    criteria.nearMeEnabled,
    // Sort chip lives on the primary strip — count it like Stay so the
    // filter badge stays honest when shopper cycles off recommended.
    criteria.sort !== "recommended",
    // Baseline-aware: the market only counts as an active filter once the
    // shopper changes it from the market they entered on (not just from the
    // global default), keeping the badge consistent with isDirty.
    criteria.marketCountry !==
      (baselineRef.current?.marketCountry ?? DEFAULT_MARKET_COUNTRY),
  ].filter(Boolean).length;

  /** Removable summary chips for B-PROPERTY — only real applied criteria. */
  const reActiveChips = useMemo(() => {
    if (!isRealEstateSection) return [] as { id: string; label: string; onClear: () => void }[];
    const chips: { id: string; label: string; onClear: () => void }[] = [];
    const q = draftQuery.trim() || criteria.q.trim();
    if (q) {
      chips.push({
        id: "q",
        label: q,
        onClear: () => {
          setDraftQuery("");
          commitQueryNow("");
        },
      });
    }
    if (activeOfferKey === "sale" || activeOfferKey === "rent") {
      const eng = engineByKey(criteria.category, activeOfferKey);
      chips.push({
        id: "offer",
        label: eng ? t(eng.i18nKey) : activeOfferKey,
        onClear: () => selectEngine("all"),
      });
    }
    if (criteria.propertyType) {
      const def = PROPERTY_TYPES.find((p) => p.value === criteria.propertyType);
      chips.push({
        id: "propertyType",
        label: def ? (isRTL ? def.ar : def.en) : criteria.propertyType,
        onClear: () => update({ propertyType: null }),
      });
    }
    if (criteria.listingMode === "buy") {
      chips.push({
        id: "wanted",
        label: t("search.listingModeBuy"),
        onClear: () => selectListingMode("all"),
      });
    }
    if (criteria.rentalTerm) {
      const term = rentalTermsForSearch(criteria.marketCountry).find(
        (r) => r.value === criteria.rentalTerm,
      );
      chips.push({
        id: "rentalTerm",
        label: term ? (isRTL ? term.ar : term.en) : criteria.rentalTerm,
        onClear: () => update({ rentalTerm: null }),
      });
    }
    if (criteria.location) {
      chips.push({
        id: "location",
        label: criteria.location,
        onClear: () => update({ location: "" }),
      });
    }
    if (criteria.nearMeEnabled) {
      chips.push({
        id: "nearMe",
        label: t("search.nearMe"),
        onClear: () => update({ nearMeEnabled: false, nearLat: null, nearLng: null }),
      });
    }
    if (criteria.minPrice || criteria.maxPrice) {
      const lo = criteria.minPrice || "…";
      const hi = criteria.maxPrice || "…";
      chips.push({
        id: "price",
        label: `${lo}–${hi}`,
        onClear: () => update({ minPrice: "", maxPrice: "" }),
      });
    }
    if (criteria.paymentType === "installment") {
      chips.push({
        id: "payment",
        label: t("search.installmentOnly"),
        onClear: () => update({ paymentType: "any" }),
      });
    }
    if (criteria.sort !== "recommended") {
      chips.push({
        id: "sort",
        label: t(`search.sortOptions.${criteria.sort}`),
        onClear: () => update({ sort: "recommended" }),
      });
    }
    return chips;
  }, [
    isRealEstateSection,
    draftQuery,
    criteria.q,
    criteria.category,
    criteria.propertyType,
    criteria.listingMode,
    criteria.rentalTerm,
    criteria.marketCountry,
    criteria.location,
    criteria.nearMeEnabled,
    criteria.minPrice,
    criteria.maxPrice,
    criteria.paymentType,
    criteria.sort,
    activeOfferKey,
    isRTL,
    t,
    selectEngine,
    selectListingMode,
    update,
    commitQueryNow,
  ]);

  // "Dirty" for exit-confirm = the criteria (or query text) diverges from the
  // per-entry baseline. Delta-based so a freshly-landed page with a persisted
  // non-default market is NOT dirty, yet ANY user change (including listing
  // mode, engine, market, etc.) correctly arms the confirmation.
  const isDirty =
    (baselineRef.current !== null &&
      serializeCriteria(criteria) !== serializeCriteria(baselineRef.current)) ||
    !!draftQuery.trim();

  const searchSaved = isSearchSaved({
    criteria: { ...criteria, q: draftQuery.trim() },
    q: draftQuery.trim(),
    category: criteria.category,
    minPrice: criteria.minPrice,
    maxPrice: criteria.maxPrice,
    location: criteria.location,
    paymentType: criteria.paymentType,
  });

  const handleSaveSearch = () => {
    const snapshot: SearchCriteria = { ...criteria, q: draftQuery.trim() };
    saveSearch({
      // The name is read back to the user inside the "new listing matches your
      // search" alert and its email, so it is localised here where `t` lives.
      name: snapshot.q.trim() || t(`home.categories.${snapshot.category}`),
      criteria: snapshot,
      q: snapshot.q,
      category: snapshot.category,
      minPrice: snapshot.minPrice,
      maxPrice: snapshot.maxPrice,
      location: snapshot.location,
      paymentType: snapshot.paymentType,
    });
  };

  // Auto-reset filters on exit (header / hardware / swipe) — same Stay contract.
  // No confirm dialog: leaving a browse mini-app clears chrome for next entry.
  const exitingRef = useRef(false);
  const resetAndLeave = useCallback(
    (leave: () => void) => {
      exitingRef.current = true;
      clearAllFilters();
      leave();
    },
    [clearAllFilters],
  );

  usePreventRemove(isDirty && !exitingRef.current, ({ data }) => {
    resetAndLeave(() => navigation.dispatch(data.action));
  });

  const goBack = () => {
    playSound(tap);
    if (isDirty) {
      resetAndLeave(() => router.back());
      return;
    }
    router.back();
  };

  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";
  const locationLabel = criteria.location
    ? labelForValue(criteria.location, isRTL) || criteria.location
    : "";

  // ── Overlay (discover surface is never shown — the engine is always active) ──
  let overlay: React.ReactNode = null;
  if (viewState === "loading" || viewState === "discover") {
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
              backgroundColor: accent,
              borderRadius: colors.radius,
              paddingHorizontal: 28,
              marginTop: 16,
            },
          ]}
          testID="section-retry"
        >
          <AppText style={[styles.applyText, { color: "#FFFFFF" }]}>
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
        {activeFilterCount > 0 || draftQuery.trim() ? (
          <Pressable
            onPress={() => {
              playSound(tap);
              clearAllFilters();
            }}
            style={[
              styles.emptyCta,
              {
                flexDirection: rowDir,
                backgroundColor: accent,
                borderRadius: colors.radius,
              },
            ]}
            testID="section-empty-clear"
          >
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            <AppText style={[styles.emptyCtaText, { color: "#FFFFFF" }]}>
              {t("search.discover.section.reset")}
            </AppText>
          </Pressable>
        ) : null}
        {/* Demand bridges — an empty result must never dead-end. Every section
            offers "post what you're looking for" (buyer request) locked to THIS
            section's create category (REL-07); supply sections additionally
            bridge into the B2B RFQ flow. */}
        <Pressable
          onPress={() => {
            playSound(tap);
            const createCategory = sectionEmptyPostRequestCategory(
              category as "car" | "real_estate" | "facilities" | "materials",
            );
            router.push(
              `/listings/create?request=1&category=${createCategory}` as Href,
            );
          }}
          style={[
            styles.emptyCta,
            {
              flexDirection: rowDir,
              backgroundColor: colors.card,
              borderColor: accent,
              borderWidth: 1,
              borderRadius: colors.radius,
            },
          ]}
          testID="section-empty-post-request"
        >
          <Feather name="edit-2" size={16} color={accent} />
          <AppText style={[styles.emptyCtaText, { color: accent }]}>
            {t("search.emptyPostRequest")}
          </AppText>
        </Pressable>
        {activeGroup ? (
          <Pressable
            onPress={() => {
              playSound(tap);
              router.push("/rfq/create" as Href);
            }}
            style={[
              styles.emptyCta,
              {
                flexDirection: rowDir,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: colors.radius,
              },
            ]}
            testID="section-empty-rfq"
          >
            <Feather name="briefcase" size={16} color={colors.foreground} />
            <AppText
              style={[styles.emptyCtaText, { color: colors.foreground }]}
            >
              {t("search.emptyRfq")}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  /**
   * The half of the Cars header that scrolls.
   *
   * The hero is 244dp of brand atmosphere; measured on a 932dp screen it helped
   * push the first card down to 511dp. It is identity, not a control, so it
   * belongs with the content: handed to the results list as its own header it
   * leaves the screen on the first scroll and never comes back uninvited.
   *
   * The top bar and the search row stay pinned above the list — they are how a
   * buyer changes the query, and the non-results overlay would swallow them if
   * they lived in here.
   *
   * `carScrollY` is how the two halves stay in step. The list writes its offset
   * to it on the UI thread and the pinned half interpolates its collapse from
   * it, so the header answers the scroll without either half re-rendering, and
   * without the hero having to leave the list to be animated.
   */
  const carScrollY = useSharedValue(0);
  /** Same contract as `carScrollY`, for the Property split. Separate values
   *  rather than one shared offset: only one section is ever mounted, but a
   *  single value would carry the previous section's scroll position into the
   *  next one's first frame. */
  const propertyScrollY = useSharedValue(0);
  /** Same again for Materials. */
  const materialsScrollY = useSharedValue(0);
  /** Same mechanism for Factories: the pinned half reads it to collapse the
   *  brand lockup. Separate value per section — one shared offset would carry
   *  a stale scroll position across a section change. */
  const facilitiesScrollY = useSharedValue(0);

  /** B-INDUSTRY's scrolling slice — hero, type strip, proven count. Placed here,
   *  immediately before the return, because it reads state declared above it. */
  const facilitiesScrollHeader = useMemo(() => {
    if (!isFacilitiesSection) return null;
    return (
      <FacilitiesHomeHeader
        slot="scroll"
        searchOpen={searchOpen}
        draftQuery={draftQuery}
        searchSaved={searchSaved}
        activeFilterCount={activeFilterCount}
        marketCountry={criteria.marketCountry}
        sort={criteria.sort}
        inputRef={inputRef}
        types={facilityTypes}
        activeType={criteria.industrialType}
        onSelectType={(key) => {
          playSound("tap");
          selectIndustrialType(key as IndustrialType);
        }}
        onBack={goBack}
        onSaveSearch={handleSaveSearch}
        onOpenMap={() => {
          playSound("tap");
          Haptics.selectionAsync();
          openOrLatchMap({ inResultsView, setMapMode, setWantMap });
        }}
        onOpenFilters={() => setShowFilters(true)}
        onOpenSearch={openSearch}
        onCloseSearch={closeSearch}
        onQueryChange={handleQueryChange}
        onSubmitQuery={() => commitQueryNow(draftQuery)}
        onClearQuery={clearQuery}
        onOpenMarket={() => {
          playSound("tap");
          setMarketPickerOpen(true);
        }}
        onCycleSort={() => {
          playSound("tap");
          const cycle = ["recommended", "newest", "price_asc", "price_desc"] as const;
          const next =
            cycle[(cycle.indexOf(criteria.sort as (typeof cycle)[number]) + 1) % cycle.length];
          update({ sort: next });
        }}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFacilitiesSection,
    searchOpen,
    draftQuery,
    searchSaved,
    activeFilterCount,
    criteria.marketCountry,
    criteria.sort,
    criteria.industrialType,
    facilityTypes,
  ]);


  /**
   * The half of the B-CORE header that scrolls — just the tagline today.
   *
   * Small, and deliberately so: this header was already the leanest of the
   * five, so the win here is not height, it is that identity prose stops
   * holding a permanent slice of the viewport. The browse strips this section
   * uses live under the header in this file, not inside it, so there is
   * nothing else to hand down.
   */
  const materialsScrollHeader = useMemo(() => {
    if (!isMaterialsSection) return null;
    return (
      <MaterialsHomeHeader
        slot="scroll"
        searchOpen={searchOpen}
        draftQuery={draftQuery}
        searchSaved={searchSaved}
        activeFilterCount={activeFilterCount}
        marketCountry={criteria.marketCountry}
        sort={criteria.sort}
        inputRef={inputRef}
        onBack={goBack}
        onSaveSearch={handleSaveSearch}
        // Wired to the real handlers rather than no-ops even though this slot
        // paints no control today — an empty handler is a dead control, and the
        // guard fails one on sight.
        onOpenMap={() => {
          playSound(tap);
          Haptics.selectionAsync();
          openOrLatchMap({ inResultsView, setMapMode, setWantMap });
        }}
        onOpenFilters={() => {
          playSound(tap);
          setShowFilters(true);
        }}
        onOpenSearch={openSearch}
        onCloseSearch={closeSearch}
        onQueryChange={handleQueryChange}
        onSubmitQuery={() => commitQueryNow(draftQuery)}
        onClearQuery={clearQuery}
        onOpenMarket={() => {
          playSound(tap);
          setMarketPickerOpen(true);
        }}
        onCycleSort={() => {
          playSound(tap);
          const cycle = ["recommended", "newest", "price_asc", "price_desc"] as const;
          const next =
            cycle[(cycle.indexOf(criteria.sort as (typeof cycle)[number]) + 1) % cycle.length];
          update({ sort: next });
        }}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isMaterialsSection,
    searchOpen,
    draftQuery,
    searchSaved,
    activeFilterCount,
    criteria.marketCountry,
    criteria.sort,
  ]);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={isCarSection ? styles.carsHeaderDock : undefined}
        testID={isCarSection ? "cars-header-dock" : undefined}
        collapsable={false}
      >
      {isRealEstateSection ? (
        <PropertyHomeHeader
          slot="pinned"
          scrollY={propertyScrollY}
          searchOpen={searchOpen}
          draftQuery={draftQuery}
          searchSaved={searchSaved}
          activeFilterCount={activeFilterCount}
          activePropertyType={reHeaderActiveType}
          activeOfferKey={activeOfferKey ?? "all"}
          wantedActive={criteria.listingMode === "buy"}
          selectedPropertyType={criteria.propertyType}
          typeTabs={reHeaderTypeTabs}
          marketCountry={criteria.marketCountry}
          sort={criteria.sort}
          inputRef={inputRef}
          onBack={goBack}
          onSaveSearch={handleSaveSearch}
          onOpenStays={() => {
            playSound(tap);
            router.push("/section/booking" as Href);
          }}
          onOpenRequest={() => {
            playSound(tap);
            router.push("/listings/create?request=1&category=real_estate" as Href);
          }}
          onOpenMap={() => {
            playSound(tap);
            Haptics.selectionAsync();
            openOrLatchMap({ inResultsView, setMapMode, setWantMap });
          }}
          onOpenFilters={() => {
            playSound(tap);
            setShowFilters(true);
          }}
          onOpenSearch={openSearch}
          onCloseSearch={closeSearch}
          onQueryChange={handleQueryChange}
          onSubmitQuery={() => commitQueryNow(draftQuery)}
          onClearQuery={clearQuery}
          onSelectType={(value) => {
            playSound(tap);
            Haptics.selectionAsync();
            selectRePropertyType(value);
          }}
          onSelectOffer={(engineKey) => {
            playSound(tap);
            Haptics.selectionAsync();
            selectEngine(engineKey);
          }}
          onToggleWanted={() => {
            playSound(tap);
            Haptics.selectionAsync();
            selectListingMode(criteria.listingMode === "buy" ? "all" : "buy");
          }}
          onOpenMarket={() => {
            playSound(tap);
            setMarketPickerOpen(true);
          }}
          onCycleSort={() => {
            playSound(tap);
            const cycle = ["recommended", "newest", "price_asc", "price_desc"] as const;
            const next =
              cycle[(cycle.indexOf(criteria.sort as (typeof cycle)[number]) + 1) % cycle.length];
            update({ sort: next });
          }}
        />
      ) : isMaterialsSection ? (
        <MaterialsHomeHeader
          slot="pinned"
          scrollY={materialsScrollY}
          searchOpen={searchOpen}
          draftQuery={draftQuery}
          searchSaved={searchSaved}
          activeFilterCount={activeFilterCount}
          marketCountry={criteria.marketCountry}
          sort={criteria.sort}
          inputRef={inputRef}
          onBack={goBack}
          onSaveSearch={handleSaveSearch}
          onOpenMap={() => {
            playSound(tap);
            Haptics.selectionAsync();
            openOrLatchMap({ inResultsView, setMapMode, setWantMap });
          }}
          onOpenFilters={() => {
            playSound(tap);
            setShowFilters(true);
          }}
          onOpenSearch={openSearch}
          onCloseSearch={closeSearch}
          onQueryChange={handleQueryChange}
          onSubmitQuery={() => commitQueryNow(draftQuery)}
          onClearQuery={clearQuery}
          onOpenMarket={() => {
            playSound(tap);
            setMarketPickerOpen(true);
          }}
          onCycleSort={() => {
            playSound(tap);
            const cycle = ["recommended", "newest", "price_asc", "price_desc"] as const;
            const next =
              cycle[(cycle.indexOf(criteria.sort as (typeof cycle)[number]) + 1) % cycle.length];
            update({ sort: next });
          }}
        />
      ) : isFacilitiesSection ? (
        <FacilitiesHomeHeader
          slot="pinned"
          scrollY={facilitiesScrollY}
          searchOpen={searchOpen}
          draftQuery={draftQuery}
          searchSaved={searchSaved}
          activeFilterCount={activeFilterCount}
          marketCountry={criteria.marketCountry}
          sort={criteria.sort}
          inputRef={inputRef}
          types={facilityTypes}
          activeType={criteria.industrialType}
          onSelectType={(key) => {
            playSound("tap");
            selectIndustrialType(key as IndustrialType);
          }}
          onBack={goBack}
          onSaveSearch={handleSaveSearch}
          onOpenMap={() => {
            playSound("tap");
            Haptics.selectionAsync();
            openOrLatchMap({ inResultsView, setMapMode, setWantMap });
          }}
          onOpenFilters={() => {
            playSound("tap");
            setShowFilters(true);
          }}
          onOpenSearch={openSearch}
          onCloseSearch={closeSearch}
          onQueryChange={handleQueryChange}
          onSubmitQuery={() => commitQueryNow(draftQuery)}
          onClearQuery={clearQuery}
          onOpenMarket={() => {
            playSound("tap");
            setMarketPickerOpen(true);
          }}
          onCycleSort={() => {
            playSound("tap");
            const cycle = ["recommended", "newest", "price_asc", "price_desc"] as const;
            const next =
              cycle[(cycle.indexOf(criteria.sort as (typeof cycle)[number]) + 1) % cycle.length];
            update({ sort: next });
          }}
        />
      ) : isCarSection ? (
        <CarsHomeHeader
          slot="pinned"
          // The filter bands below are painted here, in this component, right
          // under the pinned header. Telling the header they continue it drops
          // its rounded bottom + shadow so the two stop reading as separate
          // cards — the closing edge moves to the last filter row.
          continuesBelow
          scrollY={carScrollY}
          searchOpen={searchOpen}
          draftQuery={draftQuery}
          searchSaved={searchSaved}
          activeFilterCount={activeFilterCount}
          inputRef={inputRef}
          onBack={goBack}
          onSaveSearch={handleSaveSearch}
          onOpenMap={() => {
            playSound(tap);
            Haptics.selectionAsync();
            openOrLatchMap({ inResultsView, setMapMode, setWantMap });
          }}
          onOpenFilters={() => {
            playSound(tap);
            setShowFilters(true);
          }}
          onOpenSearch={openSearch}
          onCloseSearch={closeSearch}
          onQueryChange={handleQueryChange}
          onSubmitQuery={() => commitQueryNow(draftQuery)}
          onClearQuery={clearQuery}
          categories={carHeroCategories}
          selectedCategory={carCategory}
          stats={carHeroStats}
          onSelectCategory={(key) => {
            playSound(tap);
            const next = carCategory === key ? null : key;
            setCarCategory(next);
            const term = next
              ? t(
                  CAR_CATEGORIES.find((c) => c.key === next)?.i18nKey ??
                    "search.discover.section.carTypeCars",
                )
              : "";
            setDraftQuery(term);
            commitQueryNow(term);
          }}
          onOpenNotifications={() => {
            playSound(tap);
            router.push("/notifications");
          }}
          onOpenProfile={() => {
            playSound(tap);
            router.push("/(tabs)/profile" as Href);
          }}
        />
      ) : (
      <>
      {/* ── Section header: back + title/subtitle + section icon ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            flexDirection: rowDir,
          },
        ]}
      >
        <Pressable
          onPress={goBack}
          style={styles.backBtn}
          hitSlop={12}
          testID="section-back"
        >
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.headerTitleRow, { flexDirection: rowDir }]}>
            <View style={[styles.headerIcon, { backgroundColor: accent }]}>
              {headerIcon ? (
                <Feather name={headerIcon} size={15} color="#FFFFFF" />
              ) : (
                <CategoryIcon category={category} size={15} color="#FFFFFF" />
              )}
            </View>
            <AppText
              style={[styles.headerTitle, { color: colors.foreground, textAlign }]}
              numberOfLines={1}
            >
              {t(titleKey)}
            </AppText>
          </View>
          {subtitleKey ? (
            <AppText
              style={[
                styles.headerSub,
                { color: colors.mutedForeground, textAlign },
              ]}
              numberOfLines={1}
            >
              {t(subtitleKey)}
            </AppText>
          ) : null}
        </View>
        <Pressable
          onPress={openSearch}
          style={[
            styles.iconBtn,
            {
              backgroundColor: draftQuery ? accent : colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
          testID="section-search-open"
        >
          <Feather name="search" size={18} color={draftQuery ? "#FFFFFF" : colors.foreground} />
        </Pressable>
        {/* W9 D-W9-02: generic-header worlds need a header map hit — the FAB
            alone is easy to miss. Facilities has its own FacilitiesHomeHeader
            now (imported, memoised and rendered above); this affordance still
            serves the sections that fall back to the generic header. */}
        <Pressable
          onPress={() => {
            playSound(tap);
            Haptics.selectionAsync();
            openOrLatchMap({ inResultsView, setMapMode, setWantMap });
          }}
          style={[
            styles.iconBtn,
            {
              backgroundColor: colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("search.viewMap")}
          testID="section-header-map"
        >
          <Feather name="map" size={18} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={() => {
            playSound(tap);
            setShowFilters((v) => !v);
          }}
          style={[
            styles.iconBtn,
            {
              backgroundColor: activeFilterCount > 0 ? accent : colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
          testID="section-filter-toggle"
        >
          <Feather
            name="sliders"
            size={18}
            color={activeFilterCount > 0 ? "#FFFFFF" : colors.foreground}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: "#FFFFFF" }]}>
              <AppText style={[styles.filterBadgeText, { color: accent }]}>
                {activeFilterCount}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>
      </>
      )}

      {/* ── Collapsible search bar — non-RE/materials/car (those search live in home headers) ── */}
      {!isRealEstateSection && !isMaterialsSection && !isCarSection && searchOpen && (
        <View
          style={[
            styles.searchBar,
            {
              flexDirection: rowDir,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <CategoryIcon category={category} size={17} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            value={draftQuery}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => commitQueryNow(draftQuery)}
            onFocus={() => playSound(tap)}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchBarInput, { color: colors.foreground, textAlign }]}
            returnKeyType="search"
            testID="section-search-input"
            autoCorrect={false}
          />
          <Pressable
            onPress={handleSaveSearch}
            disabled={searchSaved}
            hitSlop={8}
            testID="section-save-search"
          >
            <Feather
              name="bookmark"
              size={16}
              color={searchSaved ? accent : colors.mutedForeground}
            />
          </Pressable>
          <Pressable onPress={draftQuery.length > 0 ? clearQuery : closeSearch} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* Inline autocomplete — below search bar / section home headers */}
      {searchOpen && showSuggestions && suggestions.length > 0 && (
        <View
          style={[
            styles.suggestions,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
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
              <Ionicons name="search-outline" size={14} color={colors.mutedForeground} />
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

      {/* ── B-PROPERTIES service desks retired from first paint — offer/map/request
          live in FilterSheet + Band D. Import-hub rule still holds: no dead taps. ── */}

      {/* ── B-oom Car: ONE control in front of every axis below.
          Before this, market + sort + mode + engines + brand + origin painted
          five wrapped chip rows over the first screen and the results started
          off-screen. The axes are unchanged and un-deleted — they are simply
          collapsed until asked for, which is what "الفلاتر" now means. ── */}

      {/* ── Primary chip strip: country/currency · sort · mode/engines.
          RE/materials: country + sort live inside home headers.
          B-oom Car: market/sort SoT = this strip only (W8 D-W8-01); listingMode
          + engines chips stay visible (REL-17) — visible meaning "on this strip
          and nowhere else", now behind the car collapse above. ── */}
      {!isRealEstateSection && !isMaterialsSection ? (
      // Cars: the outer panel carries the SAME dark surface as the header above
      // (#090909), so the chips continue the header card instead of floating on
      // the page. The section flag lives HERE, on the wrapper — never between
      // the strip and MarketCountryButton, which a guard keeps ungated.
      <View style={isCarSection ? styles.carFilterPanel : undefined}>
      {/* One clean horizontal strip instead of a wrapping block. The axes used
          to wrap into ragged two- and three-line rows that read as loose chips
          dumped under the header; on a horizontal scroll they stay a single
          strip inside the header design, the way the type strip and the brand
          strip already do. Nothing is removed — every axis is still here and
          reachable, just on one line with the divider marking the compartments
          (market · sort │ offer · condition). */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.hScroll,
          isCarSection ? styles.carDockLane : null,
        ]}
        contentContainerStyle={[styles.chipStripRow, { flexDirection: rowDir }]}
        testID="section-primary-strip"
      >
        <MarketCountryButton
          selected={criteria.marketCountry}
          onPress={() => {
            playSound(tap);
            setMarketPickerOpen(true);
          }}
        />
        {/* Quick sort — one seat only (strip). Cycles recommended → newest
            → price low→high → high→low. */}
        <Pressable
          onPress={() => {
            playSound(tap);
            const cycle = ["recommended", "newest", "price_asc", "price_desc"] as const;
            const next =
              cycle[(cycle.indexOf(criteria.sort as (typeof cycle)[number]) + 1) % cycle.length];
            update({ sort: next });
          }}
          style={[
            styles.sortChip,
            {
              backgroundColor: criteria.sort !== "recommended" ? accent : colors.secondary,
              flexDirection: rowDir,
            },
          ]}
          accessibilityLabel={t(`search.sortOptions.${criteria.sort}`)}
          testID="section-sort-cycle"
        >
          <Feather
            name={
              criteria.sort === "price_asc"
                ? "trending-up"
                : criteria.sort === "price_desc"
                  ? "trending-down"
                  : criteria.sort === "newest"
                    ? "clock"
                    : "list"
            }
            size={14}
            color={criteria.sort !== "recommended" ? "#FFFFFF" : colors.mutedForeground}
          />
        </Pressable>
        {showListingMode ? (
          <View style={[styles.chipStripDivider, { backgroundColor: colors.border }]} />
        ) : null}
        {/* Offer axis stays on the primary strip next to market + sort. The
            engine/condition chips (new/used/import/instalment) moved to their
            own strip below so they lead their own line and are not pushed off
            the right edge behind the offer pill — visible, not hidden. */}
        {showListingMode ? (
          axisShape(chrome, "listingMode") === "pill" ? (
            <FilterPillSelect
              icon="tag"
              title={t("search.listingModeAll")}
              options={[
                { value: "sale", label: t("search.listingModeSale") },
                { value: "buy", label: t("search.listingModeBuy") },
              ]}
              selected={criteria.listingMode}
              allValue="all"
              allLabel={t("search.offerAny")}
              onSelect={(v) => {
                playSound(tap);
                Haptics.selectionAsync();
                selectListingMode(v as "all" | "sale" | "buy");
              }}
              accentColor={accent}
              testID="section-listing-mode"
            />
          ) : (
            (["all", "sale", "buy"] as const).map((mode) => {
              const active = criteria.listingMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => { playSound(tap); Haptics.selectionAsync(); selectListingMode(mode); }}
                  style={[styles.stripChip, { backgroundColor: active ? accent : colors.secondary }]}
                  testID={`section-listing-mode-${mode}`}
                >
                  <AppText style={[styles.stripChipText, { color: active ? "#FFFFFF" : colors.mutedForeground }]}>
                    {mode === "all" ? t("search.listingModeAll") : mode === "sale" ? t("search.listingModeSale") : t("search.listingModeBuy")}
                  </AppText>
                </Pressable>
              );
            })
          )
        ) : null}
      </ScrollView>
      {/* Condition/engine strip — its own clean line so new/used/import/
          instalment lead the row instead of scrolling off behind the offer
          pill. Same compartment surface as the strip above; a section that
          wants its axis as a single pill still gets one, here. */}
      {(showEngineChips || showIndustrialChips) ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.hScroll,
          isCarSection ? styles.carDockLane : null,
        ]}
        contentContainerStyle={[styles.chipStripRow, { flexDirection: rowDir }]}
        testID="section-engine-strip"
      >
        {showEngineChips ? (
          axisShape(chrome, "engines") === "pill" ? (
            <FilterPillSelect
              icon="sliders"
              title={t("search.type")}
              options={stripEngineList
                .filter((e) => e.key !== "all")
                .map((e) => ({ value: e.key, label: t(e.i18nKey) }))}
              selected={activeOfferKey ?? "all"}
              allValue="all"
              allLabel={t("search.typeAny")}
              onSelect={(v) => {
                playSound(tap);
                Haptics.selectionAsync();
                selectEngine(v);
              }}
              accentColor={accent}
              testID="section-engine"
            />
          ) : (
            stripEngineList.map((e) => {
              const active = activeOfferKey === e.key;
              return (
                <Pressable
                  key={e.key}
                  onPress={() => { playSound(tap); Haptics.selectionAsync(); selectEngine(e.key); }}
                  style={[styles.stripChip, { backgroundColor: active ? accent : colors.secondary }]}
                  testID={`engine-${e.key}`}
                >
                  <AppText style={[styles.stripChipText, { color: active ? "#FFFFFF" : colors.mutedForeground }]}>
                    {t(e.i18nKey)}
                  </AppText>
                </Pressable>
              );
            })
          )
        ) : null}
        {showIndustrialChips ? [
          { key: "all" as IndustrialType, i18nKey: "home.industrialTypes.all" },
          ...((visibleIndTypes ?? []).map((ty) => ({ key: ty, i18nKey: `home.industrialTypes.${ty}` }))),
        ].map((item) => {
          const active = criteria.industrialType === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => { playSound(tap); Haptics.selectionAsync(); selectIndustrialType(item.key); }}
              style={[styles.stripChip, { backgroundColor: active ? accent : colors.secondary }]}
              testID={`industrial-type-${item.key}`}
            >
              <AppText style={[styles.stripChipText, { color: active ? "#FFFFFF" : colors.mutedForeground }]}>
                {t(item.i18nKey)}
              </AppText>
            </Pressable>
          );
        }) : null}
      </ScrollView>
      ) : null}

      {/* ── RE property-type axis (Stay-parallel) — never mixed into offer row.
          Shape comes from the section screen via chrome.propertyType:
          "pill" collapses 16 types into one control (B-PROPERTY content-first);
          "chips" keeps the horizontal strip for any section that still wants it. ── */}
      {showReTypeStrip ? (
        axisShape(chrome, "propertyType") === "pill" ? (
          <View
            style={[styles.reTypeStrip, { flexDirection: rowDir }]}
            testID="re-type-strip"
          >
            <FilterPillSelect
              icon="home"
              title={t("create.fields.propertyType")}
              options={reTypeTabs.map((v) => {
                const def = PROPERTY_TYPES.find((p) => p.value === v);
                return {
                  value: v,
                  label: def ? (isRTL ? def.ar : def.en) : v,
                };
              })}
              selected={criteria.propertyType ?? RE_TYPE_ALL}
              allValue={RE_TYPE_ALL}
              allLabel={t("search.discover.section.propertyTypeAny")}
              onSelect={(v) => {
                playSound(tap);
                Haptics.selectionAsync();
                selectRePropertyType(v);
              }}
              accentColor={accent}
              testID="re-type-pill"
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hScroll}
            contentContainerStyle={[styles.reTypeStrip, { flexDirection: rowDir }]}
            testID="re-type-strip"
          >
            {[{ value: RE_TYPE_ALL, label: t("home.engines.all") }]
              .concat(
                reTypeTabs.map((v) => {
                  const def = PROPERTY_TYPES.find((p) => p.value === v);
                  return {
                    value: v,
                    label: def ? (isRTL ? def.ar : def.en) : v,
                  };
                }),
              )
              .map((tab) => {
                const active =
                  tab.value === RE_TYPE_ALL
                    ? !criteria.propertyType
                    : criteria.propertyType === tab.value;
                return (
                  <Pressable
                    key={tab.value}
                    onPress={() => {
                      playSound(tap);
                      Haptics.selectionAsync();
                      selectRePropertyType(tab.value);
                    }}
                    style={[
                      styles.stripChip,
                      {
                        backgroundColor: active ? accent : colors.card,
                        borderWidth: 1,
                        borderColor: active ? accent : colors.border,
                      },
                    ]}
                    testID={`re-type-${tab.value}`}
                  >
                    <AppText
                      style={[
                        styles.stripChipText,
                        { color: active ? "#FFFFFF" : colors.foreground },
                      ]}
                    >
                      {tab.label}
                    </AppText>
                  </Pressable>
                );
              })}
          </ScrollView>
        )
      ) : null}

      {/* ── Cars: brand-picker button + origin chips — ONE compact strip.
          Replaces the old brand-only row + the separate origin row, saving
          ~50dp of vertical chrome. Brand collapses to a single icon+label
          button (active = accent, shows chosen brand; idle = grid icon).  ── */}
      {showCarBrandStrip ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
           style={[
             styles.hScroll,
             styles.carFilterPanelFooter,
             isCarSection ? styles.carDockLane : null,
           ]}
          contentContainerStyle={[styles.chipStrip, { flexDirection: rowDir }]}
          testID="car-brand-origin-strip"
        >
          {/* Collapsed brand button — single picker entry point */}
          <View testID="car-brand-strip">
          <Pressable
            onPress={() => {
              playSound(tap);
              setCarPickerOpen(true);
            }}
            style={[
              styles.carBrandBtn,
              {
                flexDirection: rowDir,
                backgroundColor: brandValue ? accent : colors.secondary,
                borderColor: brandValue ? accent : colors.border,
              },
            ]}
            testID="car-brand-btn"
          >
            <Feather
              name="grid"
              size={13}
              color={brandValue ? "#FFFFFF" : colors.foreground}
            />
            <AppText
              style={[styles.stripChipText, { color: brandValue ? "#FFFFFF" : colors.foreground }]}
              numberOfLines={1}
            >
              {brandValue
                ? brandLabel(
                    QUICK_BRANDS.find((b) => b.value === brandValue) ??
                      ({ value: brandValue, en: brandValue, ar: brandValue } as CarBrand),
                    isRTL,
                  )
                : t("search.allBrands")}
            </AppText>
            <Feather
              name="chevron-down"
              size={12}
              color={brandValue ? "#FFFFFF" : colors.mutedForeground}
            />
          </Pressable>
          </View>
          {/* Thin divider between brand and origin */}
          <View style={[styles.chipStripDivider, { backgroundColor: colors.border }]} />
          {/* Origin chips inline */}
          <View testID="car-origin-strip" style={{ flexDirection: rowDir, gap: 6 }}>
            {(["all", "local", "imported"] as const).map((o) => {
              const active = originKey === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    playSound(tap);
                    Haptics.selectionAsync();
                    selectOrigin(o);
                  }}
                  style={[
                    styles.stripChip,
                    { backgroundColor: active ? accent : colors.secondary },
                  ]}
                  testID={`car-origin-${o}`}
                >
                  <AppText
                    style={[
                      styles.stripChipText,
                      { color: active ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {o === "all" ? t("home.engines.all") : t(`create.opts.${o}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
       ) : null}
       </View>
      ) : null}

      {/* ── Materials smart axis strip: types + origin ONE horizontal scroll.
          flexGrow:0 via hScroll — never eat results. FilterSheet = refinements. ── */}
      {showMaterialsAxisStrip ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.hScroll, { flexGrow: 0 }]}
          contentContainerStyle={[
            styles.materialsAxisStrip,
            { flexDirection: rowDir },
          ]}
          testID="materials-type-strip"
        >
          {materialsAxisTabs.map((tab) => {
            const active = criteria.industrialType === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => {
                  playSound(tap);
                  Haptics.selectionAsync();
                  selectIndustrialType(tab.value);
                }}
                style={[
                  styles.materialsAxisChip,
                  {
                    backgroundColor: active ? accent : colors.secondary,
                    borderColor: active ? accent : colors.border,
                  },
                ]}
                testID={`industrial-type-${tab.value}`}
              >
                <AppText
                  style={[
                    styles.materialsAxisChipText,
                    { color: active ? "#FFFFFF" : colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
          <View
            style={[styles.materialsAxisDivider, { backgroundColor: colors.border }]}
          />
          <View
            style={[styles.materialsOriginCluster, { flexDirection: rowDir }]}
            testID="materials-origin-strip"
          >
            {(["all", "local", "imported"] as const).map((o) => {
              const active = originKey === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    playSound(tap);
                    Haptics.selectionAsync();
                    selectOrigin(o);
                  }}
                  style={[
                    styles.materialsAxisChip,
                    {
                      backgroundColor: active ? accent : colors.secondary,
                      borderColor: active ? accent : colors.border,
                    },
                  ]}
                  testID={`section-origin-${o}`}
                >
                  <AppText
                    style={[
                      styles.materialsAxisChipText,
                      { color: active ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {o === "all"
                      ? t("home.engines.all")
                      : t(`create.opts.${o}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {/* ── Materials commodities (Steel / Aluminum / …) — horizontal scroll ── */}
      {showMaterialsLayer2 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
          contentContainerStyle={[
            styles.reTypeStrip,
            styles.materialsLayer2Strip,
            { flexDirection: rowDir },
          ]}
          testID="materials-material-strip"
        >
          <Pressable
            onPress={() => {
              playSound(tap);
              Haptics.selectionAsync();
              update({ material: null });
            }}
            style={[
              styles.stripChip,
              styles.materialsCommodityChip,
              {
                backgroundColor: !criteria.material ? accent : colors.card,
                borderWidth: 1,
                borderColor: !criteria.material ? accent : colors.border,
              },
            ]}
            testID="materials-material-all"
          >
            <AppText
              style={[
                styles.stripChipText,
                {
                  color: !criteria.material ? "#FFFFFF" : colors.foreground,
                },
              ]}
            >
              {t("home.engines.all")}
            </AppText>
          </Pressable>
          {MATERIAL_TYPES.map((m) => {
            const active = criteria.material === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => {
                  playSound(tap);
                  Haptics.selectionAsync();
                  selectMaterial(m.value);
                }}
                style={[
                  styles.stripChip,
                  styles.materialsCommodityChip,
                  {
                    backgroundColor: active ? accent : colors.card,
                    borderWidth: 1,
                    borderColor: active ? accent : colors.border,
                  },
                ]}
                testID={`materials-material-${m.value}`}
              >
                <AppText
                  style={[
                    styles.stripChipText,
                    { color: active ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  {isRTL ? m.ar : m.en}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* ── Rental term (RE rent) — pill, not a full chip row.
          Same axis as before (criteria.rentalTerm); only the chrome shape
          changes so rent browse keeps vertical space for listings. ── */}
      {showRentalTerms ? (
        <View
          style={[styles.rentalChrome, { flexDirection: rowDir }]}
          testID="section-rental-chrome"
        >
          <FilterPillSelect
            icon="calendar"
            title={t("create.fields.rentalTerm")}
            options={rentalTerms.map((r) => ({
              value: r.value,
              label: isRTL ? r.ar : r.en,
            }))}
            selected={criteria.rentalTerm ?? "any"}
            allValue="any"
            allLabel={t("search.discover.rentalTermAny")}
            onSelect={(v) => {
              playSound(tap);
              Haptics.selectionAsync();
              if (v === "any") {
                update({ rentalTerm: null });
                return;
              }
              selectRentalTerm(v);
            }}
            accentColor={accent}
            testID="section-rental-pill"
          />
        </View>
      ) : null}

      {/* ── B-PROPERTY active filters — removable chips for applied refinements.
          Only mounts when something is actually applied; each chip clears ONE
          real criteria field (no fake filters). ── */}
      {isRealEstateSection && reActiveChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
          contentContainerStyle={[styles.activeChipStrip, { flexDirection: rowDir }]}
          testID="re-active-filters"
        >
          {reActiveChips.map((chip) => (
            <Pressable
              key={chip.id}
              onPress={() => {
                playSound(tap);
                Haptics.selectionAsync();
                chip.onClear();
              }}
              style={[
                styles.activeChip,
                {
                  backgroundColor: `${accent}22`,
                  borderColor: accent,
                  flexDirection: rowDir,
                },
              ]}
              testID={`re-active-${chip.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${chip.label}. ${t("common.close")}`}
            >
              <AppText style={[styles.activeChipText, { color: accent }]} numberOfLines={1}>
                {chip.label}
              </AppText>
              <Feather name="x" size={12} color={accent} />
            </Pressable>
          ))}
          {reActiveChips.length > 1 ? (
            <Pressable
              onPress={() => {
                playSound(tap);
                clearAllFilters();
              }}
              style={[
                styles.activeChip,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  flexDirection: rowDir,
                },
              ]}
              testID="re-active-clear-all"
            >
              <AppText
                style={[styles.activeChipText, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {t("search.clearAll")}
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}

      {/* ── Results count ── */}
      {viewState === "results" && items.length > 0 && (
        <AppText
          style={[styles.resultsCount, { color: colors.mutedForeground, textAlign }]}
          testID="section-results-count"
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
        shownCategories={[category]}
        engines={filterSheetEngines}
        quickBrands={QUICK_BRANDS}
        brandValue={brandValue}
        locationLabel={locationLabel}
        lockCategory
        // Materials axis strip owns origin (D-W9-03) — sheet keeps material refinements.
        hideOriginAxis={isMaterialsSection}
        // Stay-parallel: scope RE sheet types to the primary taxonomy so
        // twinhouse/clinic cannot drift away from the pill / desks.
        propertyTypeOptions={
          isRealEstateSection ? [...RE_TYPE_PRIMARY] : undefined
        }
        onSelectCategory={() => {}}
        onSelectEngine={selectEngine}
        onBrowseBrand={browseBrandChip}
        onOpenBrandPicker={() => setCarPickerOpen(true)}
        onUpdate={(partial) => {
          if (partial.marketCountry) {
            void savePreferredMarketCountry(partial.marketCountry);
          }
          if (
            partial.rentalTerm &&
            criteria.category === "real_estate" &&
            criteria.engineKey !== "rent"
          ) {
            partial = { ...partial, engineKey: "rent" };
          }
          update(partial);
        }}
        onOpenLocationPicker={() => setLocationPickerOpen(true)}
        onClearLocation={() => update({ location: "" })}
        onToggleNearMe={() => void toggleNearMe()}
        onClearAll={clearAllFilters}
      />


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
          onRefresh={retry}
          overlay={overlay}
          contentPaddingBottom={insets.bottom + 150}
          // Cars keep every band pinned now — the hero, the type strip and the
          // stats were all being covered by the empty-state overlay when they
          // rode in the list header, which is why none of them were ever on
          // screen. Property does the same. Materials and Facilities still hand
          // the list a scrolling half.
          listHeader={materialsScrollHeader ?? facilitiesScrollHeader}
          // Every section that animates its collapse needs the offset: Cars and
          // Property read it from their pinned half, Materials and Facilities
          // from their scrolling half. Every other section leaves this
          // undefined and the list attaches no scroll handler at all.
          scrollY={
            isCarSection
              ? carScrollY
              : isRealEstateSection
                ? propertyScrollY
                : isMaterialsSection
                  ? materialsScrollY
                  : isFacilitiesSection
                    ? facilitiesScrollY
                    : undefined
          }
        />

        {mapMode && inResultsView ? (
          <SearchResultsMap
            items={mappableItems}
            criteria={criteria}
            onOpenListing={handleCardPress}
            onOpenListingId={(id) => {
              // Only focus booking chrome when the pin is actually bookable
              // (or unknown off-page). Non-bookable RE pins open the listing.
              const hit = items.find((i) => i.id === id);
              const focusBooking =
                criteria.category === "real_estate" &&
                (hit == null || hit.is_bookable === true);
              router.push(
                focusBooking
                  ? `/listing/${id}?focus=booking`
                  : `/listing/${id}`,
              );
            }}
            onSave={toggleSave}
            isSaved={isSaved}
          />
        ) : null}

        {showMapChrome ? (
          <View
            style={[styles.mapToggleWrap, { bottom: insets.bottom + 88 }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => {
                playSound(tap);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMapMode((m) => !m);
              }}
              style={[
                styles.mapToggle,
                {
                  backgroundColor: colors.foreground,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
              testID="section-map-toggle"
            >
              <Feather
                name={mapMode ? "list" : "map"}
                size={16}
                color={colors.background}
              />
              <AppText
                style={[styles.mapToggleText, { color: colors.background }]}
              >
                {mapMode
                  ? t("search.viewList")
                  : hasPagePins
                    ? `${t("search.viewMap")} (${mappableItems.length})`
                    : t("search.viewMap")}
              </AppText>
            </Pressable>
          </View>
        ) : null}
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

      <MiniAppBottomNav lightened={searchOpen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultsArea: { flex: 1 },
  header: {
    // Match Search-host chrome (16/gap 8). Shrinking H-pad + icon hits to
    // "fix crush" pushed search/filter buttons outside the header band
    // (Owner: الهيدر كويس لما صغّر باظ والزراير خرجت منه).
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    padding: 8,
    flexShrink: 0,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  headerTitleRow: {
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  headerBrand: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  hScroll: {
    flexGrow: 0,
  },
  searchBar: {
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  iconBtn: {
    // Restored to Search-host 12. Padding 8 let icon hits escape the header.
    // Title shrinks (minWidth:0); buttons never flex-shrink.
    padding: 12,
    position: "relative",
    flexShrink: 0,
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    // Logical end — flips correctly under RTL (was pinned `right`).
    end: 6,
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
  // Every stacked strip in a section shares ONE left edge (12) and ONE vertical
  // rhythm (8 / 2). Before: this row sat at 16/10 between neighbours at 12/8, so
  // the materials origin strip visibly jutted out 4px from the strips above and
  // below it. Alignment, not decoration — see MASTER-TRACKER §7.
  chipRow: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  // Unified horizontal chip strip — globe first, then mode/engine chips inline
  /** Wraps, and every axis stays on screen.
   *
   *  Two wrong answers were tried on this strip and both HID controls: putting
   *  the axes behind a Filters toggle, and turning the row into a sideways
   *  scroll. Sideways scroll is what this guard was written against — 999px of
   *  chips in a 375px window left 624px of the user's own segmentation off the
   *  right edge with nothing hinting it was there. Compression here means
   *  smaller chips, never fewer visible ones. `flexGrow: 0` is load-bearing:
   *  without it RN lets the strip expand and crush the results column. */
  chipStrip: {
    alignItems: "center",
    flexWrap: "wrap",
    flexGrow: 0,
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  /** Single-line variant of chipStrip for the primary axis strip. No wrap: it
   *  is the content of a horizontal scroll, so the axes stay on one clean line
   *  (market · sort · offer · condition) instead of wrapping into ragged rows.
   *  Same rhythm/padding as chipStrip so the compartment lines up with the
   *  bands above and below it. */
  chipStripRow: {
    alignItems: "center",
    flexGrow: 0,
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  /** Cars filter surface — the same #090909 the header root uses, so the chips
   *  continue the header card rather than floating on the page. */
  carFilterPanel: {
    backgroundColor: SECTION_NEUTRAL.void,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxHeight: 70,
    overflow: "hidden",
    zIndex: 9,
    elevation: 2,
  },
  /** CAR-only outer surface: header, hero, search and the compact dock share
   * one native tree node, so the results list starts after one measured block. */
  carsHeaderDock: {
    backgroundColor: SECTION_NEUTRAL.void,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  /** Each CAR axis owns a compact horizontal viewport inside the one-row dock.
   * flexBasis 0 prevents any single axis from pushing the other lanes off
   * narrow phones; the lane itself remains horizontally scrollable. */
  carDockLane: {
    flexBasis: 0,
    flexShrink: 1,
    minWidth: 0,
    maxHeight: 58,
  },
  /** The last cars filter row: same surface, and the rounded bottom that closes
   *  the card off. This row is now the bottom edge of the whole header+filters
   *  card, so it also carries the soft shadow the pinned header used to own —
   *  the card floats over the results from here, its one closing edge. */
  carFilterPanelFooter: {
    backgroundColor: SECTION_NEUTRAL.void,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  chipStripDivider: {
    width: 1,
    height: 20,
    opacity: 0.5,
    marginHorizontal: 2,
  },
  // B-oom Car collapse. Sits on the same 12 left edge / 8 rhythm as every other
  // strip so opening it does not shift the column sideways.
  /** Compressed and moved into the strip 2026-08-03. It used to sit on its own
   *  line above, with 10 of margin and 9 of vertical padding, reading as a
   *  separate row of chrome rather than a control on the row it opens. */
  carFilterToggle: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  carFilterToggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  carFilterToggleCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  carFilterToggleCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  /** On FilterPill's metrics — the ONE approved filter shape in this app
   *  (paddingHorizontal 10, paddingVertical 4, guard at
   *  section-miniapp-guard:590). These ran 14/7, which is what put the car axes
   *  on three wrapped rows. Smaller chips, not fewer visible ones. */
  stripChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  // Materials smart axis — types + origin one horizontal scroll row (~3mm lifted).
  materialsAxisStrip: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 1,
  },
  materialsAxisChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  materialsAxisChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  materialsAxisDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    opacity: 0.7,
    marginHorizontal: 2,
  },
  materialsOriginCluster: {
    alignItems: "center",
    gap: 6,
  },
  // Materials commodities strip rhythm
  materialsLayer2Strip: {
    alignItems: "center",
    gap: 6,
    paddingTop: 3,
    paddingBottom: 1,
  },
  materialsCommodityChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  carBrandBtn: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 150,
    flexShrink: 1,
  },
  sortChip: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  stripChipText: {
    fontSize: 12.5,
    fontFamily: "Inter_500Medium",
  },
  rentalChrome: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  reTypeStrip: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  resultsCount: { fontSize: 12.5, paddingHorizontal: 16, paddingTop: 8 },
  activeChipStrip: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  activeChip: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 180,
  },
  activeChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  suggestions: {
    marginHorizontal: 16,
    marginTop: 2,
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
  applyBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyCta: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  emptyCtaText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
