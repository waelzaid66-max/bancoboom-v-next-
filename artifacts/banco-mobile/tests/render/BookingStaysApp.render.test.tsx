/**
 * Parent-level renderer proof for the independent Booking & Stays host.
 *
 * StaysHomeHeader and SearchResultsSurface are already mounted in their own
 * suites. This file mounts the real BookingStaysApp while replacing those
 * frozen children with observable probes. It protects orchestration only:
 * rental locks, blocking states, reset/navigation, card routing, and map latch.
 */
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { BookingStaysApp } from "@/components/search/BookingStaysApp";
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
let mockHeaderProps: Record<string, unknown> = {};
let mockSurfaceProps: Record<string, unknown> = {};
let mockMapProps: Record<string, unknown> = {};
let mockFilterProps: Record<string, unknown> = {};

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

jest.mock("@/components/search/FilterPill", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    FilterPill: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(
        Native.Pressable,
        { testID: props.testID as string, onPress: props.onPress as jest.Mock },
        ReactRuntime.createElement(Native.Text, null, props.label as string),
      ),
  };
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

jest.mock("@/components/StayCard", () => ({
  STAYS_ACCENT: "#B81E3C",
  StayCard: () => null,
}));

jest.mock("@/components/search/stays/StaysHomeHeader", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    StaysHomeHeader: (props: Record<string, unknown>) => {
      mockHeaderProps = props;
      return ReactRuntime.createElement(
        Native.View,
        { testID: "mock-stays-header" },
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-stays-open-filters",
          onPress: props.onOpenFilters as jest.Mock,
        }),
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-stays-open-map",
          onPress: props.onOpenMap as jest.Mock,
        }),
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-stays-select-type",
          onPress: () => (props.onSelectType as jest.Mock)("villa"),
        }),
        ReactRuntime.createElement(Native.Pressable, {
          testID: "mock-stays-back",
          onPress: props.onBack as jest.Mock,
        }),
      );
    },
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
      const items = props.items as FeedItem[];
      return ReactRuntime.createElement(
        Native.View,
        { testID: "mock-results-surface" },
        props.overlay as React.ReactNode,
        items.length > 0
          ? ReactRuntime.createElement(Native.Pressable, {
              testID: "mock-first-card",
              onPress: () => (props.onCardPress as jest.Mock)(items[0]),
            })
          : null,
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
    FilterSheet: (props: Record<string, unknown>) => {
      mockFilterProps = props;
      return props.visible
        ? ReactRuntime.createElement(Native.Pressable, {
            testID: "mock-filter-update",
            onPress: () =>
              (props.onUpdate as jest.Mock)({
                category: "car",
                engineKey: "sale",
                propertyType: "villa",
              }),
          })
        : null;
    },
  };
});

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
jest.mock("@/components/MiniAppBottomNav", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    MiniAppBottomNav: () =>
      ReactRuntime.createElement(Native.View, { testID: "mock-mini-nav" }),
  };
});

jest.mock("@/components/CategoryTabs", () => ({
  apiCategoryFor: (category: string) => category,
}));

jest.mock("@/constants/locations", () => ({
  labelForValue: (value: string) => value,
}));

jest.mock("@/constants/listingCreateTaxonomy", () => ({
  DEFAULT_MARKET_COUNTRY: "EG",
  PROPERTY_TYPES: [
    { value: "studio", en: "Studio", ar: "استوديو" },
    { value: "apartment", en: "Apartment", ar: "شقة" },
    { value: "villa", en: "Villa", ar: "فيلا" },
    { value: "chalet", en: "Chalet", ar: "شاليه" },
    { value: "office", en: "Office", ar: "مكتب" },
  ],
}));

jest.mock("@/lib/marketPreference", () => ({
  loadPreferredMarketCountry: jest.fn(async () => "EG"),
  savePreferredMarketCountry: jest.fn(async () => undefined),
}));

jest.mock("@/lib/nearMe", () => ({
  DEFAULT_NEAR_RADIUS_KM: 50,
  requestNearMeCoords: jest.fn(async () => null),
}));

jest.mock("@/lib/searchTaxonomy", () => ({
  rentalTermsForSearch: () => [
    { value: "furnished_daily", en: "Daily", ar: "يومي" },
    { value: "annual", en: "Annual", ar: "سنوي" },
  ],
  sanitizeRentalTermForMarket: (value: string | null) => value,
}));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    isRTL: false,
    t: (key: string) => key,
  }),
}));

jest.mock("@/context/SoundContext", () => ({
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
    radius: 12,
  }),
}));

jest.mock("@/hooks/useSearchMiniApp", () => ({
  useSearchMiniApp: () => mockSearchState,
}));

function staysCriteria(
  overrides: Partial<SearchCriteria> = {},
): SearchCriteria {
  return {
    ...DEFAULT_CRITERIA,
    category: "real_estate",
    engineKey: "rent",
    marketCountry: "EG",
    ...overrides,
  };
}

function searchState(
  overrides: Partial<UseSearchMiniApp> = {},
): UseSearchMiniApp {
  return {
    criteria: staysCriteria(),
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

function mountStays(overrides: Partial<UseSearchMiniApp> = {}) {
  mockSearchState = searchState(overrides);
  return render(<BookingStaysApp />);
}

describe("BookingStaysApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockHeaderProps = {};
    mockSurfaceProps = {};
    mockMapProps = {};
    mockFilterProps = {};
    mockSearchState = searchState();
  });

  it("keeps the pinned Stay identity and one scroll contract through loading", () => {
    const view = mountStays({
      phase: "loading",
      viewState: "loading",
    });

    expect(view.getByTestId("mock-stays-header")).toBeTruthy();
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();
    expect(view.getByTestId("mock-mini-nav")).toBeTruthy();
    expect(view.getAllByTestId("mock-skeleton-card")).toHaveLength(3);
    expect(mockHeaderProps.slot).toBe("pinned");
    expect(mockHeaderProps.scrollY).toBe(mockSurfaceProps.scrollY);
  });

  it("keeps Stay identity reachable in error and routes retry", () => {
    const view = mountStays({
      phase: "error",
      viewState: "error",
    });

    expect(view.getByTestId("mock-stays-header")).toBeTruthy();
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();
    fireEvent.press(view.getByTestId("stays-retry"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("keeps honest empty recovery and clears to the locked Stay baseline", () => {
    const view = mountStays({
      criteria: staysCriteria({ sort: "newest" }),
      viewState: "empty",
    });

    expect(view.getByTestId("mock-stays-header")).toBeTruthy();
    expect(view.getByTestId("stays-empty-clear")).toBeTruthy();
    expect(view.getByTestId("stays-empty-post-request")).toBeTruthy();

    fireEvent.press(view.getByTestId("stays-empty-post-request"));
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/listings/create?request=1&category=real_estate",
    );

    fireEvent.press(view.getByTestId("stays-empty-clear"));
    expect(mockCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: "real_estate",
        engineKey: "rent",
        marketCountry: "EG",
        sort: "recommended",
      }),
    );
  });

  it("hard-locks real_estate and rent across seed and FilterSheet updates", () => {
    const view = mountStays();

    expect(mockCommit).toHaveBeenCalledWith(
      expect.objectContaining({ category: "real_estate", engineKey: "rent" }),
    );

    fireEvent.press(view.getByTestId("mock-stays-open-filters"));
    fireEvent.press(view.getByTestId("mock-filter-update"));

    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: "real_estate",
        engineKey: "rent",
        propertyType: "villa",
      }),
    );
    expect(mockFilterProps.lockCategory).toBe(true);
    expect(mockFilterProps.propertyTypeOptions).toEqual([
      "studio",
      "apartment",
      "villa",
      "chalet",
      "office",
    ]);
  });

  it("uses StayCard and routes a result into the booking-focused detail", () => {
    const item = { id: "stay-1" } as FeedItem;
    const view = mountStays({
      items: [item],
      hasNext: true,
      viewState: "results",
    });
    const mockedStayCard = (
      jest.requireMock("@/components/StayCard") as {
        StayCard: React.ComponentType;
      }
    ).StayCard;

    expect(mockSurfaceProps.CardComponent).toBe(mockedStayCard);
    expect(mockSurfaceProps.onEndReached).toBe(mockLoadMore);
    expect(view.getByTestId("stays-results-count")).toBeTruthy();
    fireEvent.press(view.getByTestId("mock-first-card"));
    expect(mockCacheFeedItem).toHaveBeenCalledWith(item);
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/listing/stay-1?focus=booking",
    );
  });

  it("honours the map query latch and excludes unmappable Stay results", async () => {
    const mapped = {
      id: "stay-mapped",
      coordinates: { lat: 30.0444, lng: 31.2357 },
    } as FeedItem;
    const unmapped = { id: "stay-unmapped" } as FeedItem;
    mockParams = { map: "1" };
    const view = mountStays({
      items: [mapped, unmapped],
      viewState: "results",
    });

    await waitFor(() =>
      expect(view.getByTestId("mock-search-results-map")).toBeTruthy(),
    );
    expect(mockMapProps.items).toEqual([mapped]);
    expect(view.getByTestId("mock-stays-header")).toBeTruthy();
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();

    fireEvent.press(view.getByTestId("stays-map-toggle"));
    await waitFor(() =>
      expect(view.queryByTestId("mock-search-results-map")).toBeNull(),
    );
    expect(view.getByTestId("mock-results-surface")).toBeTruthy();
  });

  it("auto-resets dirty Stay filters before the header back action leaves", () => {
    const view = mountStays({
      criteria: staysCriteria({ sort: "newest" }),
      viewState: "results",
    });

    fireEvent.press(view.getByTestId("mock-stays-back"));
    expect(mockCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: "real_estate",
        engineKey: "rent",
        sort: "recommended",
      }),
    );
    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });
});
