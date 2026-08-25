import React from "react";
import { act, render } from "@testing-library/react-native";

import { SearchResultsMap } from "@/components/search/SearchResultsMap";

const mockGetMapClusters = jest.fn();
const mockInjectJavaScript = jest.fn();
let mockLatestWebViewProps: Record<string, any> = {};

jest.mock("@workspace/api-client-react", () => ({
  getMapClusters: (...args: unknown[]) => mockGetMapClusters(...args),
}));

jest.mock("react-native-webview", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: ReactRuntime.forwardRef((props: Record<string, unknown>, ref) => {
      mockLatestWebViewProps = props;
      ReactRuntime.useImperativeHandle(ref, () => ({
        injectJavaScript: mockInjectJavaScript,
      }));
      return ReactRuntime.createElement(Native.View, { testID: "mock-webview" });
    }),
  };
});

jest.mock("@/components/AppText", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    AppText: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
      ReactRuntime.createElement(Native.Text, props, children),
  };
});

jest.mock("@/components/CategoryTabs", () => ({ apiCategoryFor: () => "car" }));

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
    card: "#FFFFFF",
    foreground: "#111111",
    mutedForeground: "#666666",
    border: "#DDDDDD",
  }),
}));

jest.mock("@/components/MiniAppBottomNav", () => ({
  miniAppNavClearance: () => 88,
}));

jest.mock("@/lib/geoArea", () => ({
  areaBounds: jest.fn(),
  areaCount: jest.fn(() => null),
  filterByArea: (clusters: unknown[]) => clusters,
  isUsableArea: () => false,
}));

jest.mock("@/lib/searchParams", () => ({
  buildMapClusterParams: jest.fn(() => ({})),
}));

jest.mock("@/lib/searchTaxonomy", () => ({
  marketCountryMapCenter: () => ({ lat: 30.0444, lng: 31.2357, zoom: 6 }),
}));

jest.mock("@/components/search/mapHtml", () => ({
  buildMapHtml: (...args: unknown[]) =>
    JSON.stringify({
      markers: args[0],
      center: args[2],
      nearMe: args[3],
      navClearance: args[4],
      labels: args[5],
    }),
  feedItemsToMarkers: (
    items: Array<{ id: string; coordinates?: { lat: number; lng: number } | null }>,
  ) =>
    items
      .filter((item) => item.coordinates)
      .map((item) => ({
        id: item.id,
        lat: item.coordinates!.lat,
        lng: item.coordinates!.lng,
        label: item.id,
      })),
}));

jest.mock("@/components/search/MapOverlayChrome", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    MapOverlayChrome: () =>
      ReactRuntime.createElement(Native.View, { testID: "mock-map-overlay-chrome" }),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

const CRITERIA = {
  q: "",
  category: "car",
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
} as any;

const NEAR_ME_CRITERIA = {
  ...CRITERIA,
  nearMeEnabled: true,
  nearLat: 30.12,
  nearLng: 31.34,
  nearRadiusKm: 15,
} as any;

const ITEM = {
  id: "map-source-epoch-a",
  category: "car",
  coordinates: { lat: 30.1, lng: 31.2 },
  price_display: "EGP 100",
} as any;

const ITEM_B = {
  ...ITEM,
  coordinates: { lat: 30.15, lng: 31.25 },
  price_display: "EGP 200",
} as any;

const onOpenListing = jest.fn();
const onOpenListingId = jest.fn();
const onSave = jest.fn();
const isSaved = jest.fn(() => false);

type BridgeHandler = (event: { nativeEvent: { data: string } }) => void;

function mapElement(criteria: any, items = [ITEM]) {
  return (
    <SearchResultsMap
      items={items}
      criteria={criteria}
      onOpenListing={onOpenListing}
      onOpenListingId={onOpenListingId}
      onSave={onSave}
      isSaved={isSaved}
    />
  );
}

function currentBridgeHandler(): BridgeHandler {
  const onMessage = mockLatestWebViewProps.onMessage as BridgeHandler | undefined;
  expect(onMessage).toEqual(expect.any(Function));
  return onMessage!;
}

function sendBridge(handler: BridgeHandler, message: Record<string, unknown>): void {
  act(() => {
    handler({ nativeEvent: { data: JSON.stringify(message) } });
  });
}

function bridge(type: string): void {
  sendBridge(currentBridgeHandler(), { type });
}

function currentHtml(): string {
  return ((mockLatestWebViewProps.source as { html?: string } | undefined)?.html ?? "");
}

describe("SearchResultsMap bootstrap source epochs", () => {
  beforeEach(() => {
    mockLatestWebViewProps = {};
    mockGetMapClusters.mockReset();
    mockInjectJavaScript.mockReset();
    onOpenListing.mockReset();
    onOpenListingId.mockReset();
    onSave.mockReset();
    isSaved.mockReset().mockReturnValue(false);
  });

  it("RED: same-marker HTML rebuild resets a ready epoch to loading before the new ready signal", () => {
    const view = render(mapElement(CRITERIA));

    bridge("ready");
    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();
    const beforeHtml = currentHtml();

    view.rerender(mapElement(NEAR_ME_CRITERIA));

    expect(currentHtml()).not.toBe(beforeHtml);
    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();
    expect(view.queryByTestId("search-map-bootstrap-failed")).toBeNull();

    bridge("ready");
    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();
  });

  it("RED: same-marker HTML rebuild starts a new epoch after terminal failure", () => {
    const view = render(mapElement(CRITERIA));

    bridge("error");
    expect(view.getByTestId("search-map-bootstrap-failed")).toBeTruthy();
    const beforeHtml = currentHtml();

    view.rerender(mapElement(NEAR_ME_CRITERIA));

    expect(currentHtml()).not.toBe(beforeHtml);
    expect(view.queryByTestId("search-map-bootstrap-failed")).toBeNull();
    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();

    bridge("ready");
    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();
  });

  it("RED: a stale ready callback from the previous HTML epoch cannot authorize the new page", () => {
    const view = render(mapElement(CRITERIA));
    const staleEpochHandler = currentBridgeHandler();
    const beforeHtml = currentHtml();

    view.rerender(mapElement(NEAR_ME_CRITERIA));

    expect(currentHtml()).not.toBe(beforeHtml);
    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();

    sendBridge(staleEpochHandler, { type: "ready" });
    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();

    sendBridge(currentBridgeHandler(), { type: "ready" });
    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();
  });

  it("RED: a stale select callback from the previous HTML epoch cannot navigate after the rebuild", () => {
    const view = render(mapElement(CRITERIA));
    const staleEpochHandler = currentBridgeHandler();
    const beforeHtml = currentHtml();

    view.rerender(mapElement(NEAR_ME_CRITERIA));

    expect(currentHtml()).not.toBe(beforeHtml);

    sendBridge(staleEpochHandler, { type: "select", id: "old-epoch-off-page" });
    expect(onOpenListingId).not.toHaveBeenCalled();

    sendBridge(currentBridgeHandler(), { type: "select", id: "current-epoch-off-page" });
    expect(onOpenListingId).toHaveBeenCalledTimes(1);
    expect(onOpenListingId).toHaveBeenCalledWith("current-epoch-off-page");
  });

  it("RED: a new mapped-result epoch cannot publish stale item-derived cluster enrichment", async () => {
    jest.useFakeTimers();
    try {
      mockGetMapClusters.mockResolvedValue({
        data: [
          {
            lat: 30.1,
            lng: 31.2,
            count: 1,
            listing_id: ITEM.id,
          },
        ],
      });

      const viewport = {
        type: "viewport",
        bounds: { min_lat: 29.9, max_lat: 30.3, min_lng: 31.0, max_lng: 31.4 },
        zoom: 10,
      };

      const view = render(mapElement(CRITERIA, [ITEM]));
      bridge("ready");
      sendBridge(currentBridgeHandler(), viewport);
      await act(async () => {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      });
      expect(mockGetMapClusters).toHaveBeenCalledTimes(1);
      expect(mockInjectJavaScript.mock.calls.flat().join("\n")).toContain("EGP 100");

      view.rerender(mapElement(CRITERIA, [ITEM_B]));
      bridge("ready");
      mockInjectJavaScript.mockClear();
      sendBridge(currentBridgeHandler(), viewport);
      await act(async () => {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      });

      const currentEpochInjection = mockInjectJavaScript.mock.calls.flat().join("\n");
      expect(currentEpochInjection).not.toContain("EGP 100");
      expect(currentEpochInjection).toContain("EGP 200");
    } finally {
      jest.useRealTimers();
    }
  });
});
