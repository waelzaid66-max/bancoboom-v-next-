import React from "react";
import { act, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { SearchResultsMap } from "@/components/search/SearchResultsMap.web";
import type { SearchCriteria } from "@/lib/searchParams";

const mockGetMapClusters = jest.fn();
const mockBuildMapHtml = jest.fn(() => "<html>map</html>");
const mockSetClusters = jest.fn();
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
const mockIframeWindow = { BANCO_MAP: { setClusters: mockSetClusters } };
let mockMessageHandler: ((event: MessageEvent) => void) | null = null;

jest.mock("@workspace/api-client-react", () => ({
  getMapClusters: (...args: unknown[]) => mockGetMapClusters(...args),
}));

jest.mock("@/components/AppText", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    AppText: ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactRuntime.createElement(Native.Text, props, children),
  };
});

jest.mock("@/components/search/mapHtml", () => ({
  buildMapHtml: (...args: unknown[]) => mockBuildMapHtml(...args),
  feedItemsToMarkers: (items: FeedItem[]) =>
    items.flatMap((item) =>
      item.coordinates
        ? [
            {
              id: item.id,
              lat: item.coordinates.lat,
              lng: item.coordinates.lng,
              label: item.price_display,
              bookable: item.is_bookable === true,
              cat: item.category,
            },
          ]
        : [],
    ),
}));

jest.mock("@/components/search/MapOverlayChrome", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    MapOverlayChrome: () =>
      ReactRuntime.createElement(Native.View, { testID: "mock-map-overlay" }),
  };
});

jest.mock("@/lib/searchParams", () => ({
  buildMapClusterParams: (_criteria: SearchCriteria, viewport: Record<string, number>) =>
    viewport,
}));

jest.mock("@/components/CategoryTabs", () => ({
  apiCategoryFor: () => "real_estate",
}));

jest.mock("@/components/MiniAppBottomNav", () => ({
  miniAppNavClearance: (bottom: number) => bottom + 73,
}));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
  }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    primary: "#CC1E24",
    primaryForeground: "#FFFFFF",
    card: "#111111",
    foreground: "#FFFFFF",
    mutedForeground: "#A0A0A0",
    border: "#222222",
  }),
}));

jest.mock("@/lib/searchTaxonomy", () => ({
  marketCountryMapCenter: () => ({ lat: 30, lng: 31, zoom: 10 }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

const MAPPED_ITEM = {
  id: "listing-a",
  coordinates: { lat: 30.1, lng: 31.2 },
  price_display: "EGP 100",
  category: "real_estate",
  is_bookable: false,
} as FeedItem;

const SECOND_ITEM = {
  ...MAPPED_ITEM,
  id: "listing-b",
  coordinates: { lat: 30.2, lng: 31.3 },
  price_display: "EGP 200",
} as FeedItem;

const CRITERIA = {
  q: "",
  category: "real_estate",
  engineKey: "rent",
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

function mapElement(items: FeedItem[] = [MAPPED_ITEM]) {
  return (
    <SearchResultsMap
      items={items}
      criteria={CRITERIA}
      onOpenListing={jest.fn()}
      onOpenListingId={jest.fn()}
      isSaved={() => false}
    />
  );
}

function mountMap(items: FeedItem[] = [MAPPED_ITEM]) {
  return render(mapElement(items), {
    createNodeMock: (element) =>
      element.type === "iframe" ? { contentWindow: mockIframeWindow } : null,
  });
}

function dispatchMapMessage(payload: object, source: unknown = mockIframeWindow) {
  act(() => {
    mockMessageHandler?.({
      data: JSON.stringify(payload),
      source,
    } as unknown as MessageEvent);
  });
}

describe("SearchResultsMap web bootstrap fail-close", () => {
  beforeEach(() => {
    mockGetMapClusters.mockReset();
    mockBuildMapHtml.mockClear();
    mockSetClusters.mockReset();
    mockAlert.mockClear();
    mockMessageHandler = null;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        addEventListener: jest.fn(
          (type: string, handler: (event: MessageEvent) => void) => {
            if (type === "message") mockMessageHandler = handler;
          },
        ),
        removeEventListener: jest.fn(),
      },
    });
  });

  it("starts loading with usable chrome hidden until trusted ready", () => {
    const view = mountMap();

    expect(view.queryByTestId("mock-map-overlay")).toBeNull();
    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();

    dispatchMapMessage({ type: "ready" });

    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
  });

  it("tile_error while loading never establishes readiness", () => {
    const view = mountMap();

    dispatchMapMessage({ type: "tile_error" });
    dispatchMapMessage({ type: "tile_error" });

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(view.queryByTestId("mock-map-overlay")).toBeNull();
    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();

    dispatchMapMessage({ type: "ready" });
    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
  });

  it("ignores an untrusted bootstrap error after readiness", () => {
    const view = mountMap();
    dispatchMapMessage({ type: "ready" });

    dispatchMapMessage({ type: "error" }, {});

    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();
  });

  it("trusted bootstrap error is terminal and hides usable chrome", () => {
    const view = mountMap();

    dispatchMapMessage({ type: "error" });
    dispatchMapMessage({ type: "error" });
    dispatchMapMessage({ type: "ready" });

    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();
    expect(view.getByText("search.mapUnavailableBody")).toBeTruthy();
    expect(view.queryByTestId("mock-map-overlay")).toBeNull();
  });

  it("a new marker signature resets failed bootstrap before the next ready", () => {
    const view = mountMap();
    dispatchMapMessage({ type: "error" });
    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();

    view.rerender(mapElement([SECOND_ITEM]));

    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();
    expect(view.queryByTestId("mock-map-overlay")).toBeNull();

    dispatchMapMessage({ type: "ready" });
    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
  });

  it("preserves trusted tile-failure alert-once behavior after readiness", () => {
    const view = mountMap();
    dispatchMapMessage({ type: "ready" });

    dispatchMapMessage({ type: "tile_error" });
    dispatchMapMessage({ type: "tile_error" });

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(
      "search.mapUnavailableTitle",
      "search.mapUnavailableBody",
    );
    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
  });
});
