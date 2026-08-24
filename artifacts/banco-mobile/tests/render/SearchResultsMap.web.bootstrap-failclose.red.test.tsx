import React from "react";
import { act, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { SearchResultsMap } from "@/components/search/SearchResultsMap.web";
import type { SearchCriteria } from "@/lib/searchParams";

const mockGetMapClusters = jest.fn();
const mockBuildMapHtml = jest.fn((...args: unknown[]) => {
  const center = args[2] as { lat?: number; lng?: number } | undefined;
  return `<html>map:${center?.lat ?? "unknown"}:${center?.lng ?? "unknown"}</html>`;
});
const mockSetClusters = jest.fn();
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

type MockIframeWindow = {
  BANCO_MAP: { setClusters: typeof mockSetClusters };
  epoch: number;
};

let mockIframeWindows: MockIframeWindow[] = [];
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
  marketCountryMapCenter: (country: string) =>
    country === "SA"
      ? { lat: 24.7136, lng: 46.6753, zoom: 10 }
      : { lat: 30, lng: 31, zoom: 10 },
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

const SAME_MARKER_NEXT_CRITERIA = {
  ...CRITERIA,
  marketCountry: "SA",
} as SearchCriteria;

function mapElement(
  items: FeedItem[] = [MAPPED_ITEM],
  criteria: SearchCriteria = CRITERIA,
) {
  return (
    <SearchResultsMap
      items={items}
      criteria={criteria}
      onOpenListing={jest.fn()}
      onOpenListingId={jest.fn()}
      isSaved={() => false}
    />
  );
}

function createIframeNode() {
  const contentWindow: MockIframeWindow = {
    BANCO_MAP: { setClusters: mockSetClusters },
    epoch: mockIframeWindows.length + 1,
  };
  mockIframeWindows.push(contentWindow);
  return { contentWindow };
}

function currentIframeWindow(): MockIframeWindow {
  const current = mockIframeWindows[mockIframeWindows.length - 1];
  expect(current).toBeDefined();
  return current;
}

function mountMap(items: FeedItem[] = [MAPPED_ITEM]) {
  return render(mapElement(items), {
    createNodeMock: (element) =>
      element.type === "iframe" ? createIframeNode() : null,
  });
}

function dispatchMapMessage(payload: object, source?: unknown) {
  act(() => {
    mockMessageHandler?.({
      data: JSON.stringify(payload),
      source: source ?? currentIframeWindow(),
    } as unknown as MessageEvent);
  });
}

describe("SearchResultsMap web bootstrap fail-close", () => {
  beforeEach(() => {
    mockGetMapClusters.mockReset();
    mockBuildMapHtml.mockClear();
    mockSetClusters.mockReset();
    mockAlert.mockClear();
    mockIframeWindows = [];
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

  it("resets same-marker srcDoc source epoch and rejects the previous window", () => {
    const view = mountMap();
    dispatchMapMessage({ type: "ready" });
    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();

    const previousWindow = currentIframeWindow();
    const previousHtml = mockBuildMapHtml.mock.results.at(-1)?.value;
    view.rerender(mapElement([MAPPED_ITEM], SAME_MARKER_NEXT_CRITERIA));

    const latestBuildArgs = mockBuildMapHtml.mock.calls.at(-1);
    expect(latestBuildArgs?.[2]).toEqual(
      expect.objectContaining({ lat: 24.7136, lng: 46.6753 }),
    );
    const nextHtml = mockBuildMapHtml.mock.results.at(-1)?.value;
    expect(nextHtml).not.toBe(previousHtml);
    expect(view.queryByTestId("mock-map-overlay")).toBeNull();

    dispatchMapMessage({ type: "ready" }, previousWindow);
    expect(view.queryByTestId("mock-map-overlay")).toBeNull();

    const nextWindow = currentIframeWindow();
    expect(nextWindow).not.toBe(previousWindow);
    dispatchMapMessage({ type: "ready" }, nextWindow);
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
