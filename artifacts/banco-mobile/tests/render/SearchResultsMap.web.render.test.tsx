/**
 * Renderer proof for the web half of the shared map host.
 *
 * The generated Leaflet page already posts draw-area messages on both
 * platforms. This suite mounts the real web host and exercises its message
 * boundary so a control cannot look live while its web parent ignores it.
 */
import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { FeedItem } from "@workspace/api-client-react";

import { SearchResultsMap } from "@/components/search/SearchResultsMap.web";
import type { SearchCriteria } from "@/lib/searchParams";

const mockGetMapClusters = jest.fn();
const mockBuildMapHtml = jest.fn(
  (..._mockArgs: unknown[]) => "<html>map</html>",
);
const mockSetClusters = jest.fn();
const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
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

function mapElement(criteria: SearchCriteria = CRITERIA) {
  return (
    <SearchResultsMap
      items={[MAPPED_ITEM]}
      criteria={criteria}
      onOpenListing={jest.fn()}
      onOpenListingId={jest.fn()}
      isSaved={() => false}
    />
  );
}

/** Post one bridge message from the iframe, as the real srcDoc does. */
function postFromMap(message: Record<string, unknown>) {
  mockMessageHandler?.({
    data: JSON.stringify(message),
    source: mockIframeWindow,
  } as unknown as MessageEvent);
}

function mountMap(criteria: SearchCriteria = CRITERIA) {
  const view = render(
    mapElement(criteria),
    {
      createNodeMock: (element) =>
        element.type === "iframe"
          ? { contentWindow: mockIframeWindow }
          : null,
    },
  );
  // mapHtml.ts posts `ready` once Leaflet is up (see its post({type:"ready"}))
  // and the host now gates MapOverlayChrome on it, at native parity. Every real
  // mount reaches this state, so the helper reproduces it rather than leaving
  // the tests exercising a host state the browser never sits in.
  act(() => {
    postFromMap({ type: "ready" });
  });
  return view;
}

describe("SearchResultsMap web host", () => {
  beforeEach(() => {
    mockGetMapClusters.mockReset();
    mockBuildMapHtml.mockClear();
    mockSetClusters.mockReset();
    mockAlert.mockClear();
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

  afterEach(() => {
    jest.useRealTimers();
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

  it("fails closed on a bootstrap error: no chrome over a dead map", () => {
    const view = render(mapElement(CRITERIA), {
      createNodeMock: (element) =>
        element.type === "iframe" ? { contentWindow: mockIframeWindow } : null,
    });

    act(() => {
      postFromMap({ type: "error" });
    });

    expect(view.root.findAllByProps({ testID: "search-map-bootstrap-failed" }).length)
      .toBeGreaterThan(0);
    expect(mockOverlayProps.count).toBeUndefined();

    // A tile failure must never revive an instance that already failed bootstrap.
    act(() => {
      postFromMap({ type: "tile_error" });
    });
    expect(view.root.findAllByProps({ testID: "search-map-bootstrap-failed" }).length)
      .toBeGreaterThan(0);
  });

  // Both tests below close a RUNTIME_UNPROVEN gap named in
  // audit/recovery/MAPS-CROSS-REPO-REUNION-2026-08-24.md. Measured 2026-08-24:
  // breaking either capability in the source left the whole render suite green,
  // so "present in source" was all anyone could honestly claim for them.

  it("carries the Near Me centre and radius into the map, and only when Near Me is on", () => {
    mountMap();
    expect(mockBuildMapHtml).toHaveBeenCalled();
    // Near Me is off in the default criteria: the map must receive no circle.
    expect(mockBuildMapHtml.mock.calls[0][3]).toBeUndefined();

    mockBuildMapHtml.mockClear();
    mountMap({
      ...CRITERIA,
      nearMeEnabled: true,
      nearLat: 30.05,
      nearLng: 31.25,
      nearRadiusKm: 25,
    } as SearchCriteria);

    expect(mockBuildMapHtml).toHaveBeenCalled();
    expect(mockBuildMapHtml.mock.calls[0][3]).toEqual({
      lat: 30.05,
      lng: 31.25,
      radiusKm: 25,
    });
  });

  it("marks a single-listing pin bookable from the page item when the cluster omits it", async () => {
    mockGetMapClusters.mockResolvedValue({
      data: [
        // count === 1 and a listing_id the page knows is bookable, with the
        // server field absent — the host must fall back to the page item.
        { lat: 0.25, lng: 0.25, count: 1, listing_id: "stay-in" },
        // A different single pin the page does not know: not bookable.
        { lat: 0.4, lng: 0.4, count: 1, listing_id: "unknown-id" },
        // A real cluster is never a bookable pin.
        { lat: 0.75, lng: 0.75, count: 4, listing_id: null },
      ],
    });

    mountMap();

    await act(async () => {
      postFromMap({
        type: "viewport",
        bounds: { min_lat: 0, max_lat: 1, min_lng: 0, max_lng: 1 },
        zoom: 10,
      });
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSetClusters).toHaveBeenCalledWith([
        expect.objectContaining({ listing_id: "stay-in", bookable: true }),
        expect.objectContaining({ listing_id: "unknown-id", bookable: false }),
        expect.objectContaining({ count: 4, bookable: false }),
      ]);
    });
  });

  it("surfaces a trusted tile failure once without blocking listing results", () => {
    const view = mountMap();

    act(() => {
      mockMessageHandler?.({
        data: JSON.stringify({ type: "tile_error" }),
        source: {},
      } as MessageEvent);
      mockMessageHandler?.({
        data: JSON.stringify({ type: "tile_error" }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
      mockMessageHandler?.({
        data: JSON.stringify({ type: "tile_error" }),
        source: mockIframeWindow,
      } as unknown as MessageEvent);
    });

    expect(mockAlert).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith(
      "search.mapUnavailableTitle",
      "search.mapUnavailableBody",
    );
    expect(view.getByTestId("mock-map-overlay")).toBeTruthy();
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

  it("rejects an old-category response during the new category debounce", async () => {
    jest.useFakeTimers();

    type ClusterResponse = {
      data: Array<{
        lat: number;
        lng: number;
        count: number;
        listing_id: string | null;
      }>;
    };
    let resolveOld!: (value: ClusterResponse) => void;
    let resolveCurrent!: (value: ClusterResponse) => void;
    const oldResponse = new Promise<ClusterResponse>((resolve) => {
      resolveOld = resolve;
    });
    const currentResponse = new Promise<ClusterResponse>((resolve) => {
      resolveCurrent = resolve;
    });
    mockGetMapClusters
      .mockImplementationOnce(() => oldResponse)
      .mockImplementationOnce(() => currentResponse);

    const view = mountMap();
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
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    expect(mockGetMapClusters).toHaveBeenCalledTimes(1);

    view.rerender(mapElement({ ...CRITERIA, category: "car" }));
    mockSetClusters.mockClear();

    await act(async () => {
      resolveOld({
        data: [{ lat: 15, lng: 35, count: 7, listing_id: "old-all" }],
      });
      await oldResponse;
      await Promise.resolve();
    });

    expect(mockSetClusters).not.toHaveBeenCalled();
    expect(mockOverlayProps.count).toBe(1);

    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    expect(mockGetMapClusters).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveCurrent({
        data: [{ lat: 15, lng: 35, count: 2, listing_id: "current-cars" }],
      });
      await currentResponse;
      await Promise.resolve();
    });

    expect(mockSetClusters).toHaveBeenCalledTimes(1);
    expect(mockSetClusters).toHaveBeenCalledWith([
      expect.objectContaining({ listing_id: "current-cars" }),
    ]);
    expect(mockOverlayProps.count).toBe(2);
  });
});
