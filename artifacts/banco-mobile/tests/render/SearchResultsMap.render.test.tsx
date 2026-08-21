import React from "react";
import { act, render } from "@testing-library/react-native";
import { Alert, View } from "react-native";

import { SearchResultsMap } from "@/components/search/SearchResultsMap";

const mockGetMapClusters = jest.fn();
let latestWebViewProps: Record<string, any> = {};

jest.mock("@workspace/api-client-react", () => ({
  getMapClusters: (...args: unknown[]) => mockGetMapClusters(...args),
}));

jest.mock("react-native-webview", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: (props: Record<string, unknown>) => {
      latestWebViewProps = props;
      return ReactRuntime.createElement(Native.View, { testID: "mock-webview" });
    },
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
  buildMapHtml: () => "<html></html>",
  feedItemsToMarkers: (items: Array<{ id: string; coordinates?: { lat: number; lng: number } | null }>) =>
    items
      .filter((item) => item.coordinates)
      .map((item) => ({
        id: item.id,
        lat: item.coordinates!.lat,
        lng: item.coordinates!.lng,
        label: item.id,
      })),
}));

jest.mock("@/components/search/MapOverlayChrome", () => ({
  MapOverlayChrome: () => <View testID="mock-map-overlay-chrome" />,
}));

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

const ITEM_A = {
  id: "map-a",
  category: "car",
  coordinates: { lat: 30.1, lng: 31.2 },
  price_display: "EGP 100",
} as any;

const ITEM_B = {
  id: "map-b",
  category: "car",
  coordinates: { lat: 30.2, lng: 31.3 },
  price_display: "EGP 200",
} as any;

function bridge(type: string, extra: Record<string, unknown> = {}) {
  act(() => {
    latestWebViewProps.onMessage({
      nativeEvent: { data: JSON.stringify({ type, ...extra }) },
    });
  });
}

function renderMap(items = [ITEM_A]) {
  return render(
    <SearchResultsMap
      items={items}
      criteria={CRITERIA}
      onOpenListing={jest.fn()}
      onOpenListingId={jest.fn()}
      onSave={jest.fn()}
      isSaved={() => false}
    />,
  );
}

describe("SearchResultsMap bootstrap state", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    latestWebViewProps = {};
    mockGetMapClusters.mockReset();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("fails closed on bootstrap error and a later tile_error cannot revive overlay chrome", () => {
    const view = renderMap();

    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();
    expect(view.queryByTestId("search-map-bootstrap-failed")).toBeNull();

    bridge("error");

    expect(view.getByTestId("search-map-bootstrap-failed")).toBeTruthy();
    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();

    bridge("tile_error");

    expect(view.getByTestId("search-map-bootstrap-failed")).toBeTruthy();
    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("mounts overlay chrome only after ready and keeps it mounted through degraded tile failure", () => {
    const view = renderMap();

    bridge("ready");

    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();
    expect(view.queryByTestId("search-map-bootstrap-failed")).toBeNull();

    bridge("tile_error");

    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();
    expect(view.queryByTestId("search-map-bootstrap-failed")).toBeNull();
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("resets back to loading when the mapped source signature changes", () => {
    const view = renderMap([ITEM_A]);

    bridge("ready");
    expect(view.getByTestId("mock-map-overlay-chrome")).toBeTruthy();

    view.rerender(
      <SearchResultsMap
        items={[ITEM_B]}
        criteria={CRITERIA}
        onOpenListing={jest.fn()}
        onOpenListingId={jest.fn()}
        onSave={jest.fn()}
        isSaved={() => false}
      />,
    );

    expect(view.queryByTestId("mock-map-overlay-chrome")).toBeNull();
    expect(view.queryByTestId("search-map-bootstrap-failed")).toBeNull();
  });
});
