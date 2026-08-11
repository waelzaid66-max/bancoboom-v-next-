/**
 * Renderer proof for the web half of the shared map host.
 *
 * The generated Leaflet page already posts draw-area messages on both
 * platforms. This suite mounts the real web host and exercises its message
 * boundary so a control cannot look live while its web parent ignores it.
 */
import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { SearchResultsMap } from "@/components/search/SearchResultsMap.web";
import type { SearchCriteria } from "@/lib/searchParams";

const mockGetMapClusters = jest.fn();
const mockBuildMapHtml = jest.fn(
  (..._mockArgs: unknown[]) => "<html>map</html>",
);
const mockSetClusters = jest.fn();
const mockIframeWindow = { BANCO_MAP: { setClusters: mockSetClusters } };
let mockOverlayProps: Record<string, unknown> = {};
let mockMessageHandler: ((event: MessageEvent) => void) | null = null;

jest.mock("@workspace/api-client-react", () => ({
  getMapClusters: (...mockArgs: unknown[]) => mockGetMapClusters(...mockArgs),
}));

jest.mock("@/components/search/mapHtml", () => ({
  buildMapHtml: (...mockArgs: unknown[]) => mockBuildMapHtml(...mockArgs),
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
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    MapOverlayChrome: (props: Record<string, unknown>) => {
      mockOverlayProps = props;
      return ReactRuntime.createElement(Native.View, {
        testID: "mock-map-overlay",
      });
    },
  };
});

jest.mock("@/lib/searchParams", () => ({
  buildMapClusterParams: (
    _criteria: SearchCriteria,
    viewport: Record<string, number>,
  ) => viewport,
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
    border: "#222222",
    radius: 12,
  }),
}));

jest.mock("@/lib/searchTaxonomy", () => ({
  marketCountryMapCenter: () => ({ lat: 30, lng: 31, zoom: 10 }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

const MAPPED_ITEM = {
  id: "stay-in",
  coordinates: { lat: 0.25, lng: 0.25 },
  price_display: "EGP 100",
  category: "real_estate",
  is_bookable: true,
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

function mountMap() {
  return render(
    <SearchResultsMap
      items={[MAPPED_ITEM]}
      criteria={CRITERIA}
      onOpenListing={jest.fn()}
      onOpenListingId={jest.fn()}
      isSaved={() => false}
    />,
    {
      createNodeMock: (element) =>
        element.type === "iframe"
          ? { contentWindow: mockIframeWindow }
          : null,
    },
  );
}

describe("SearchResultsMap web host", () => {
  beforeEach(() => {
    mockGetMapClusters.mockReset();
    mockBuildMapHtml.mockClear();
    mockSetClusters.mockReset();
    mockOverlayProps = {};
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

  it("mounts the iframe host with shared map chrome and translated draw controls", () => {
    const view = mountMap();

    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
    expect(mockBuildMapHtml).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ primary: "#CC1E24" }),
      expect.objectContaining({ lat: 30, lng: 31, zoom: 10 }),
      undefined,
      83,
      {
        draw: "search.mapDrawArea",
        done: "search.mapDrawDone",
        undo: "search.mapDrawUndo",
        clear: "search.mapDrawClear",
      },
    );
    expect(mockOverlayProps.count).toBe(1);
    expect(mockMessageHandler).not.toBeNull();
  });

  it("consumes a drawn area, queries its box, and exposes an honest clipped count", async () => {
    mockGetMapClusters.mockResolvedValue({
      data: [
        { lat: 0.25, lng: 0.25, count: 1, listing_id: "stay-in" },
        { lat: 0.75, lng: 0.75, count: 2, listing_id: null },
        { lat: 5, lng: 5, count: 1, listing_id: "outside" },
      ],
    });
    mountMap();

    const points = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
      { lat: 1, lng: 0 },
    ];

    await act(async () => {
      mockMessageHandler?.({
        data: JSON.stringify({ type: "area", points }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockGetMapClusters).toHaveBeenCalledTimes(1);
      expect(mockGetMapClusters).toHaveBeenCalledWith(
        expect.objectContaining({
          min_lat: 0,
          max_lat: 1,
          min_lng: 0,
          max_lng: 1,
          zoom: 10,
        }),
      );
      expect(mockOverlayProps.areaCount).toEqual({ total: 3, exact: false });
      expect(mockSetClusters).toHaveBeenCalledWith([
        expect.objectContaining({ lat: 0.25, lng: 0.25 }),
        expect.objectContaining({ lat: 0.75, lng: 0.75 }),
      ]);
    });
  });

  it("clears back to the real visible viewport instead of the old area box", async () => {
    mockGetMapClusters.mockResolvedValue({ data: [] });
    mountMap();

    await act(async () => {
      mockMessageHandler?.({
        data: JSON.stringify({
          type: "viewport",
          bounds: {
            min_lat: 10,
            max_lat: 20,
            min_lng: 30,
            max_lng: 40,
          },
          zoom: 7,
        }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      mockMessageHandler?.({
        data: JSON.stringify({
          type: "area",
          points: [
            { lat: 0, lng: 0 },
            { lat: 0, lng: 1 },
            { lat: 1, lng: 1 },
          ],
        }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetMapClusters).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockMessageHandler?.({
        data: JSON.stringify({ type: "area", points: [] }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetMapClusters).toHaveBeenCalledTimes(2);
    expect(mockGetMapClusters).toHaveBeenLastCalledWith({
      min_lat: 10,
      max_lat: 20,
      min_lng: 30,
      max_lng: 40,
      zoom: 7,
    });
    expect(mockOverlayProps.areaCount).toBeNull();
  });

  it("keeps a newer cached area when an older area response arrives late", async () => {
    let resolveSlowArea!: (value: {
      data: Array<{
        lat: number;
        lng: number;
        count: number;
        listing_id: string;
      }>;
    }) => void;
    const slowArea = new Promise<{
      data: Array<{
        lat: number;
        lng: number;
        count: number;
        listing_id: string;
      }>;
    }>((resolve) => {
      resolveSlowArea = resolve;
    });
    mockGetMapClusters
      .mockResolvedValueOnce({
        data: [{ lat: 0.25, lng: 0.25, count: 1, listing_id: "cached-a" }],
      })
      .mockImplementationOnce(() => slowArea);
    mountMap();

    const cachedArea = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
    ];
    const slowDifferentArea = [
      { lat: 10, lng: 10 },
      { lat: 10, lng: 11 },
      { lat: 11, lng: 11 },
    ];

    await act(async () => {
      mockMessageHandler?.({
        data: JSON.stringify({ type: "area", points: cachedArea }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(mockSetClusters).toHaveBeenLastCalledWith([
        expect.objectContaining({ listing_id: "cached-a" }),
      ]);
    });

    await act(async () => {
      mockMessageHandler?.({
        data: JSON.stringify({ type: "area", points: slowDifferentArea }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      await Promise.resolve();
    });
    expect(mockGetMapClusters).toHaveBeenCalledTimes(2);

    await act(async () => {
      mockMessageHandler?.({
        data: JSON.stringify({ type: "area", points: cachedArea }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      await Promise.resolve();
    });
    expect(mockSetClusters).toHaveBeenLastCalledWith([
      expect.objectContaining({ listing_id: "cached-a" }),
    ]);

    mockSetClusters.mockClear();
    await act(async () => {
      resolveSlowArea({
        data: [{ lat: 10.25, lng: 10.25, count: 1, listing_id: "stale-b" }],
      });
      await slowArea;
      await Promise.resolve();
    });

    expect(mockSetClusters).not.toHaveBeenCalled();
  });
});
