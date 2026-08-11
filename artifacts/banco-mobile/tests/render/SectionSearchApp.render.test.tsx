/**
 * Parent-level renderer proof for the conflict-crossed section host.
 *
 * The five home headers and the shared results surface have their own mounted
 * suites. This suite therefore mounts the real SectionSearchApp while replacing
 * those already-frozen children with small probes. It proves the orchestration
 * that source guards cannot: locked criteria, pinned/scrolling composition,
 * blocking states, demand bridges, and the map deep-link latch.
 */
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { SectionSearchApp } from "@/components/search/SectionSearchApp";
import type { Category } from "@/components/CategoryTabs";
import type { UseSearchMiniApp } from "@/hooks/useSearchMiniApp";
import {
  DEFAULT_CRITERIA,
  type SearchCriteria,
} from "@/lib/searchParams";

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockCommit = jest.fn();
const mockUpdate = jest.fn();
const mockApplyPatch = jest.fn();
const mockLoadMore = jest.fn();
const mockRetry = jest.fn();
const mockPlaySound = jest.fn();
const mockToggleSave = jest.fn();
const mockSaveSearch = jest.fn();
const mockCacheFeedItem = jest.fn();
const mockRecordQuery = jest.fn();

let mockParams: Record<string, string | string[] | undefined> = {};
let mockSearchState: UseSearchMiniApp;
let mockSurfaceProps: Record<string, unknown> = {};
let mockMapProps: Record<string, unknown> = {};

jest.mock("@workspace/api-client-react", () => ({
  getAutocomplete: jest.fn(async () => ({ data: [] })),
  sendBehaviorSignal: jest.fn(async () => undefined),
}));

jest.mock("expo-router", () => ({
  router: {
    push: (...mockArgs: unknown[]) => mockRouterPush(...mockArgs),
    back: (...mockArgs: unknown[]) => mockRouterBack(...mockArgs),
  },
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ dispatch: mockNavigationDispatch }),
}));

jest.mock("@react-navigation/native", () => ({
  usePreventRemove: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: "light" },
}));

jest.mock("react-native-reanimated", () => ({
  useSharedValue: (value: number) => ({ value }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("@/components/icons", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  const Icon = (props: Record<string, unknown>) =>
    ReactRuntime.createElement(Native.View, props);
  return { Feather: Icon, Ionicons: Icon };
});

jest.mock("@/components/AppText", () => {
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return { AppText: Native.Text };
});

jest.mock("@/components/AppTextInput", () => {
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return { AppTextInput: Native.TextInput };
});

jest.mock("@/components/SkeletonCard", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    SkeletonCard: () =>
      ReactRuntime.createElement(Native.View, { testID: "mock-skeleton-card" }),
  };
});

jest.mock("@/components/search/SearchResultsSurface", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    SearchResultsSurface: (props: Record<string, unknown>) => {
      mockSurfaceProps = props;
      return ReactRuntime.createElement(
        Native.View,
        { testID: "mock-results-surface" },
        props.listHeader as React.ReactNode,
        props.overlay as React.ReactNode,
      );
    },
  };
});

jest.mock("@/components/search/SearchResultsMap", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    SearchResultsMap: (props: Record<string, unknown>) => {
      mockMapProps = props;
      return ReactRuntime.createElement(Native.View, {
        testID: "mock-search-results-map",
      });
    },
  };
});

jest.mock("@/components/search/FilterSheet", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    FilterSheet: (props: Record<string, unknown>) =>
      props.visible
        ? ReactRuntime.createElement(
            Native.Pressable,
            {
              testID: "mock-filter-update",
              onPress: () =>
                (props.onUpdate as jest.Mock)({
                  category: "car",
                  engineKey: "sale",
                }),
            },
            ReactRuntime.createElement(Native.Text, null, "update"),
          )
        : null,
  };
});

jest.mock("@/components/search/FilterPillSelect", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    FilterPillSelect: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
  };
});

jest.mock("@/components/search/property/PropertyHomeHeader", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    RE_COMMERCIAL_TAB: "__commercial__",
    RE_COMMERCIAL_TYPES: ["office", "shop"],
    RE_MORE_TAB: "__more__",
    RE_MORE_TYPES: ["studio", "chalet"],
    PropertyHomeHeader: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(
        Native.View,
        { testID: `mock-property-${props.slot ?? "pinned"}` },
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-property-open-filters",
          onPress: props.onOpenFilters as jest.Mock,
        }),
      ),
  };
});

jest.mock("@/components/search/materials/MaterialsHomeHeader", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    MaterialsHomeHeader: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(
        Native.View,
        { testID: `mock-materials-${props.slot ?? "pinned"}` },
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-materials-open-filters",
          onPress: props.onOpenFilters as jest.Mock,
        }),
      ),
  };
});

jest.mock("@/components/search/facilities/FacilitiesHomeHeader", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    FacilitiesHomeHeader: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(
        Native.View,
        { testID: `mock-facilities-${props.slot ?? "pinned"}` },
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-facilities-open-filters",
          onPress: props.onOpenFilters as jest.Mock,
        }),
      ),
  };
});

jest.mock("@/components/search/car/CarsHomeHeader", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    CAR_CATEGORIES: [
      { key: "cars", i18nKey: "search.discover.section.carTypeCars" },
    ],
    CarsHomeHeader: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(
        Native.View,
        { testID: `mock-car-${props.slot ?? "pinned"}` },
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-car-open-filters",
          onPress: props.onOpenFilters as jest.Mock,
        }),
      ),
  };
});

jest.mock("@/components/CategoryTabs", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    CategoryIcon: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
    apiCategoryFor: (category: string) =>
      category === "facilities" || category === "materials"
        ? "industrial"
        : category,
    industrialGroupForCategory: (category: string) =>
      category === "facilities"
        ? ["factory"]
        : category === "materials"
          ? ["raw_material"]
          : null,
  };
});

jest.mock("@/lib/facets", () => ({
  useInventoryFacets: () => ({ scopedFacets: undefined, loading: false }),
  visibleEngines: (category: string) =>
    category === "real_estate"
      ? [
          { key: "all", i18nKey: "home.engines.all", params: {} },
          {
            key: "sale",
            i18nKey: "home.engines.sale",
            params: { offer_type: "sale" },
          },
          {
            key: "rent",
            i18nKey: "home.engines.rent",
            params: { offer_type: "rent" },
          },
        ]
      : [{ key: "all", i18nKey: "home.engines.all", params: {} }],
  visibleIndustrialTypes: (types: string[]) => types,
}));

jest.mock("@/constants/engines", () => {
  const engines = [
    { key: "all", i18nKey: "home.engines.all", params: {} },
    {
      key: "sale",
      i18nKey: "home.engines.sale",
      params: { offer_type: "sale" },
    },
    {
      key: "rent",
      i18nKey: "home.engines.rent",
      params: { offer_type: "rent" },
    },
  ];
  return {
    enginesForCategory: () => engines,
    engineByKey: (_category: string, key: string) =>
      engines.find((engine) => engine.key === key),
  };
});

jest.mock("@/constants/cars", () => ({
  POPULAR_BRANDS: [],
  brandLabel: (brand: { en: string }) => brand.en,
  brandQuery: (brand: { en: string }) => brand.en,
}));

jest.mock("@/constants/locations", () => ({
  labelForValue: (value: string) => value,
}));

jest.mock("@/constants/listingCreateTaxonomy", () => ({
  DEFAULT_MARKET_COUNTRY: "EG",
  MARKET_COUNTRIES: [{ code: "EG" }, { code: "SA" }],
  MATERIAL_TYPES: [{ value: "steel", en: "Steel", ar: "حديد" }],
  PROPERTY_TYPES: [
    { value: "apartment", en: "Apartment", ar: "شقة" },
    { value: "villa", en: "Villa", ar: "فيلا" },
  ],
  sectionEmptyPostRequestCategory: (category: string) => {
    if (category === "materials") return "raw_materials";
    if (category === "facilities") return "industrial";
    return category;
  },
}));

jest.mock("@/lib/marketPreference", () => ({
  loadPreferredMarketCountry: jest.fn(async () => "EG"),
  savePreferredMarketCountry: jest.fn(async () => undefined),
}));

jest.mock("@/lib/searchTaxonomy", () => ({
  rentalTermsForSearch: () => [],
  sanitizeRentalTermForMarket: () => null,
}));

jest.mock("@/lib/nearMe", () => ({
  DEFAULT_NEAR_RADIUS_KM: 50,
  requestNearMeCoords: jest.fn(async () => null),
}));

jest.mock("@/lib/sectionTheme", () => ({
  SECTION_NEUTRAL: { void: "#090909" },
  sectionAccent: () => "#E8002D",
}));

jest.mock("@/components/search/sectionChrome", () => ({
  axisShape: () => "chips",
}));

jest.mock("@/components/MarketCountryPicker", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    MarketCountryButton: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
    MarketCountryPicker: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
  };
});

jest.mock("@/components/LocationPicker", () => ({ LocationPicker: () => null }));
jest.mock("@/components/CarPicker", () => ({ CarPicker: () => null }));
jest.mock("@/components/MiniAppBottomNav", () => ({
  MiniAppBottomNav: () => null,
}));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    isRTL: false,
    t: (key: string) => key,
  }),
}));

jest.mock("@/context/SoundContext", () => ({
  soundForCategory: () => "tap",
  useSound: () => ({ playSound: mockPlaySound }),
}));

jest.mock("@/context/SessionContext", () => ({
  useSession: () => ({
    sessionId: "session-1",
    isSaved: () => false,
    toggleSave: mockToggleSave,
    saveSearch: mockSaveSearch,
    isSearchSaved: () => false,
    cacheFeedItem: mockCacheFeedItem,
    recordQuery: mockRecordQuery,
  }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#FFFFFF",
    card: "#FFFFFF",
    border: "#DDDDDD",
    foreground: "#111111",
    mutedForeground: "#666666",
    secondary: "#F2F2F2",
    primary: "#E8002D",
    primaryForeground: "#FFFFFF",
    radius: 12,
  }),
}));

jest.mock("@/hooks/useSearchMiniApp", () => ({
  useSearchMiniApp: () => mockSearchState,
}));

function criteriaFor(
  category: Category,
  overrides: Partial<SearchCriteria> = {},
): SearchCriteria {
  return {
    ...DEFAULT_CRITERIA,
    category,
    marketCountry: "EG",
    ...overrides,
  };
}

function searchState(
  category: Category,
  overrides: Partial<UseSearchMiniApp> = {},
): UseSearchMiniApp {
  return {
    criteria: criteriaFor(category),
    items: [],
    phase: "idle",
    hasNext: false,
    viewState: "empty",
    commit: mockCommit,
    update: mockUpdate,
    applyPatch: mockApplyPatch,
    loadMore: mockLoadMore,
    retry: mockRetry,
    reset: jest.fn(),
    ...overrides,
  };
}

function mountSection(
  category: Category,
  stateOverrides: Partial<UseSearchMiniApp> = {},
  propOverrides: Partial<React.ComponentProps<typeof SectionSearchApp>> = {},
) {
  mockSearchState = searchState(category, stateOverrides);
  return render(
    <SectionSearchApp
      category={category}
      titleKey={`section.${category}`}
      {...propOverrides}
    />,
  );
}

describe("SectionSearchApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockSurfaceProps = {};
    mockMapProps = {};
    mockSearchState = searchState("car");
  });

  it("composes the locked header and only the intended scrolling slice per section", () => {
    const matrix: Array<{
      category: Category;
      pinned: string;
      scrolling?: string;
    }> = [
      { category: "car", pinned: "mock-car-pinned" },
      { category: "real_estate", pinned: "mock-property-pinned" },
      {
        category: "facilities",
        pinned: "mock-facilities-pinned",
        scrolling: "mock-facilities-scroll",
      },
      {
        category: "materials",
        pinned: "mock-materials-pinned",
        scrolling: "mock-materials-scroll",
      },
    ];

    for (const row of matrix) {
      const view = mountSection(row.category);

      expect(view.getByTestId(row.pinned)).toBeTruthy();
      expect(view.getByTestId("mock-results-surface")).toBeTruthy();
      if (row.scrolling) {
        expect(view.getByTestId(row.scrolling)).toBeTruthy();
      } else {
        expect(view.queryByTestId("mock-facilities-scroll")).toBeNull();
        expect(view.queryByTestId("mock-materials-scroll")).toBeNull();
      }
      expect(mockSurfaceProps.listHeader ?? null).toEqual(
        row.scrolling ? expect.anything() : null,
      );
      view.unmount();
    }
  });

  it("keeps the Materials identity and list header mounted through loading", () => {
    const view = mountSection("materials", {
      criteria: criteriaFor("materials"),
      phase: "loading",
      viewState: "loading",
    });

    expect(view.getByTestId("mock-materials-pinned")).toBeTruthy();
    expect(view.getByTestId("mock-materials-scroll")).toBeTruthy();
    expect(view.getAllByTestId("mock-skeleton-card")).toHaveLength(3);
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();
  });

  it("keeps Property identity reachable in error and routes retry", () => {
    const view = mountSection("real_estate", {
      criteria: criteriaFor("real_estate"),
      phase: "error",
      viewState: "error",
    });

    expect(view.getByTestId("mock-property-pinned")).toBeTruthy();
    expect(view.queryByTestId("mock-property-scroll")).toBeNull();
    fireEvent.press(view.getByTestId("section-retry"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("keeps Facilities chrome and honest recovery routes in the empty state", () => {
    const view = mountSection("facilities", {
      criteria: criteriaFor("facilities", { sort: "newest" }),
      viewState: "empty",
    });

    expect(view.getByTestId("mock-facilities-pinned")).toBeTruthy();
    expect(view.getByTestId("mock-facilities-scroll")).toBeTruthy();
    expect(view.getByTestId("section-empty-clear")).toBeTruthy();
    expect(view.getByTestId("section-empty-rfq")).toBeTruthy();

    fireEvent.press(view.getByTestId("section-empty-post-request"));
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/listings/create?request=1&category=industrial",
    );

    fireEvent.press(view.getByTestId("section-empty-clear"));
    expect(mockCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: "facilities",
        engineKey: "all",
        sort: "recommended",
      }),
    );
  });

  it("hard-locks category and engine across seed and FilterSheet updates", () => {
    const view = mountSection(
      "real_estate",
      {
        criteria: criteriaFor("real_estate", { engineKey: "rent" }),
      },
      { lockedEngine: "rent" },
    );

    expect(mockCommit).toHaveBeenCalledWith(
      expect.objectContaining({ category: "real_estate", engineKey: "rent" }),
    );

    fireEvent.press(view.getByTestId("mock-property-open-filters"));
    fireEvent.press(view.getByTestId("mock-filter-update"));

    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "real_estate", engineKey: "rent" }),
    );
  });

  it("honours the map query latch and toggles back without unmounting results", async () => {
    const item = {
      id: "mapped-1",
      coordinates: { lat: 30.0444, lng: 31.2357 },
    } as FeedItem;
    mockParams = { map: "1" };
    const view = mountSection("car", {
      criteria: criteriaFor("car"),
      items: [item],
      viewState: "results",
    });

    await waitFor(() =>
      expect(view.getByTestId("mock-search-results-map")).toBeTruthy(),
    );
    expect(mockMapProps.items).toEqual([item]);
    expect(view.getByTestId("mock-car-pinned")).toBeTruthy();
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();

    fireEvent.press(view.getByTestId("section-map-toggle"));
    await waitFor(() =>
      expect(view.queryByTestId("mock-search-results-map")).toBeNull(),
    );
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();
  });
});
