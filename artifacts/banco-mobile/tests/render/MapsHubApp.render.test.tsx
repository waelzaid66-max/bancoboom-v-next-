/**
 * Renderer proof for the dedicated Maps mini-app.
 *
 * The selected world is product identity: its tab, section link, list, and map
 * query must never describe different catalogues while persisted market state
 * hydrates asynchronously on native.
 */
import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { MapsHubApp } from "@/components/search/maps/MapsHubApp";
import type { SearchCriteria } from "@/lib/searchParams";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockCommit = jest.fn();
const mockLoadMore = jest.fn();
const mockRetry = jest.fn();
const mockToggleSave = jest.fn();
const mockIsSaved = jest.fn(() => false);
const mockLoadPreferredMarketCountry = jest.fn<Promise<string>, []>();
let mockMapProps: Record<string, unknown> = {};

const DEFAULT_TEST_CRITERIA = {
  q: "",
  category: "all",
  engineKey: "all",
  sort: "recommended",
  minPrice: "",
  maxPrice: "",
  location: "",
  paymentType: "any",
  rentalTerm: null,
  propertyType: null,
  brand: null,
  model: null,
  fuelType: null,
  transmission: null,
  minYear: "",
  maxYear: "",
  industry: null,
  originType: null,
  material: null,
  industrialType: "all",
  marketCountry: "EG",
  nearMeEnabled: false,
  nearLat: null,
  nearLng: null,
  nearRadiusKm: 25,
  listingMode: "all",
} as SearchCriteria;

const MAPPABLE_ITEM = {
  id: "mapped-car",
  category: "car",
  coordinates: { lat: 30.1, lng: 31.2 },
  price_display: "EGP 100",
} as FeedItem;

const UNMAPPABLE_ITEM = {
  id: "unmapped-car",
  category: "car",
  coordinates: null,
  price_display: "EGP 200",
} as FeedItem;

let mockSearchState: {
  criteria: SearchCriteria;
  items: FeedItem[];
  commit: typeof mockCommit;
  loadMore: typeof mockLoadMore;
  retry: typeof mockRetry;
  phase: "idle" | "loading" | "refreshing" | "loadingMore" | "error";
};

jest.mock("expo-router", () => ({
  router: { back: () => mockBack(), push: (href: string) => mockPush(href) },
}));

jest.mock("expo-image", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    Image: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
  };
});

jest.mock("@/components/icons", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    Feather: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
  };
});

jest.mock("@/components/AppText", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    AppText: ({
      children,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) =>
      ReactRuntime.createElement(Native.Text, props, children),
  };
});

jest.mock("@/components/MiniAppBottomNav", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    MiniAppBottomNav: () =>
      ReactRuntime.createElement(Native.View, { testID: "mock-mini-app-nav" }),
  };
});

jest.mock("@/components/SmartAssetCard", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    SmartAssetCard: ({ item }: { item: FeedItem }) =>
      ReactRuntime.createElement(Native.View, {
        testID: `mock-card-${item.id}`,
      }),
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

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
  }),
}));

jest.mock("@/context/SessionContext", () => ({
  useSession: () => ({ isSaved: mockIsSaved, toggleSave: mockToggleSave }),
}));

jest.mock("@/hooks/useSearchMiniApp", () => ({
  useSearchMiniApp: () => mockSearchState,
}));

jest.mock("@/constants/listingCreateTaxonomy", () => ({
  DEFAULT_MARKET_COUNTRY: "EG",
}));

jest.mock("@/lib/marketPreference", () => ({
  loadPreferredMarketCountry: () => mockLoadPreferredMarketCountry(),
}));

jest.mock("@/lib/searchParams", () => ({
  DEFAULT_CRITERIA: DEFAULT_TEST_CRITERIA,
}));

jest.mock("@/lib/sectionTheme", () => ({
  sectionAccent: () => "#CC1E24",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

describe("MapsHubApp", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockPush.mockReset();
    mockCommit.mockReset();
    mockLoadMore.mockReset();
    mockRetry.mockReset();
    mockToggleSave.mockReset();
    mockIsSaved.mockReset().mockReturnValue(false);
    mockLoadPreferredMarketCountry.mockReset();
    mockLoadPreferredMarketCountry.mockImplementation(
      () => new Promise<string>(() => undefined),
    );
    mockMapProps = {};
    mockSearchState = {
      criteria: DEFAULT_TEST_CRITERIA,
      items: [MAPPABLE_ITEM, UNMAPPABLE_ITEM],
      commit: mockCommit,
      loadMore: mockLoadMore,
      retry: mockRetry,
      phase: "idle",
    };
  });

  it("mounts the dedicated map world and excludes only unmappable page pins", () => {
    const view = render(<MapsHubApp />);

    expect(view.getByTestId("maps-hub")).toBeTruthy();
    expect(view.getByTestId("mock-search-results-map")).toBeTruthy();
    expect(view.getByTestId("mock-mini-app-nav")).toBeTruthy();
    expect(mockMapProps.criteria).toBe(DEFAULT_TEST_CRITERIA);
    expect(mockMapProps.items).toEqual([MAPPABLE_ITEM]);
  });

  it("keeps all results reachable in list mode while the map uses mapped pins", () => {
    const view = render(<MapsHubApp />);

    fireEvent.press(view.getByTestId("maps-hub-list-toggle"));

    expect(view.getByTestId("maps-hub-list")).toBeTruthy();
    expect(view.getByTestId("mock-card-mapped-car")).toBeTruthy();
    expect(view.getByTestId("mock-card-unmapped-car")).toBeTruthy();
    expect(view.queryByTestId("mock-search-results-map")).toBeNull();
  });

  it("keeps the selected world authoritative when market hydration finishes late", async () => {
    let resolveMarket!: (iso: string) => void;
    const market = new Promise<string>((resolve) => {
      resolveMarket = resolve;
    });
    mockLoadPreferredMarketCountry.mockImplementationOnce(() => market);
    const view = render(<MapsHubApp />);

    fireEvent.press(view.getByTestId("maps-world-car"));

    expect(mockCommit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        category: "car",
        marketCountry: "EG",
        sort: "newest",
      }),
    );
    expect(view.getByTestId("maps-hub-open-section")).toBeTruthy();

    await act(async () => {
      resolveMarket("SA");
      await market;
      await Promise.resolve();
    });

    expect(mockCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        category: "car",
        marketCountry: "SA",
        sort: "newest",
      }),
    );
  });

  it("does not commit persisted market state after the hub unmounts", async () => {
    let resolveMarket!: (iso: string) => void;
    const market = new Promise<string>((resolve) => {
      resolveMarket = resolve;
    });
    mockLoadPreferredMarketCountry.mockImplementationOnce(() => market);
    const view = render(<MapsHubApp />);

    view.unmount();

    await act(async () => {
      resolveMarket("SA");
      await market;
      await Promise.resolve();
    });

    expect(mockCommit).not.toHaveBeenCalled();
  });
});
