import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { MapPinPicker } from "@/components/MapPinPicker";

let mockLatestWebViewProps: Record<string, any> = {};

jest.mock("react-native-webview", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: (props: Record<string, unknown>) => {
      mockLatestWebViewProps = props;
      return ReactRuntime.createElement(Native.View, {
        testID: "mock-map-pin-webview",
      });
    },
  };
});

jest.mock("@/components/icons", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Feather: () =>
      ReactRuntime.createElement(Native.View, { testID: "mock-feather" }),
  };
});

jest.mock("@/components/AppText", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    AppText: ({
      children,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) =>
      ReactRuntime.createElement(Native.Text, props, children),
  };
});

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
  }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#FFFFFF",
    foreground: "#111111",
    mutedForeground: "#666666",
    secondary: "#EEEEEE",
  }),
}));

jest.mock("@/lib/sectionTheme", () => ({
  sectionAccent: () => "#CC1E24",
  sectionAccentAlpha: () => "rgba(204,30,36,0.2)",
}));

jest.mock("@/lib/searchTaxonomy", () => ({
  marketCountryMapCenter: () => ({
    lat: 30.0444,
    lng: 31.2357,
    zoom: 6,
  }),
}));

jest.mock("@/components/search/mapVendorInline", () => ({
  LEAFLET_CSS: "",
  LEAFLET_JS: "",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

type BridgePayload = Record<string, unknown>;

type NavigationRequest = {
  url: string;
  mainDocumentURL?: string;
  navigationType?: string;
};

function currentOnMessage(): (event: {
  nativeEvent: { data: string };
}) => void {
  const handler = mockLatestWebViewProps.onMessage as
    | ((event: { nativeEvent: { data: string } }) => void)
    | undefined;
  expect(handler).toEqual(expect.any(Function));
  return handler as (event: { nativeEvent: { data: string } }) => void;
}

function bridge(payload: BridgePayload): void {
  const onMessage = currentOnMessage();
  act(() => {
    onMessage({
      nativeEvent: { data: JSON.stringify(payload) },
    });
  });
}

function renderPicker() {
  const onConfirm = jest.fn();
  const view = render(
    <MapPinPicker
      visible
      marketCountry="EG"
      initial={null}
      onClose={jest.fn()}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm, view };
}

describe("MapPinPicker bridge trust boundary", () => {
  beforeEach(() => {
    mockLatestWebViewProps = {};
  });

  it.each([
    ["string latitude", { type: "center", lat: "30.1", lng: 31.2 }],
    ["null longitude", { type: "center", lat: 30.1, lng: null }],
    ["latitude above range", { type: "center", lat: 90.0001, lng: 31.2 }],
    ["latitude below range", { type: "center", lat: -90.0001, lng: 31.2 }],
    ["longitude above range", { type: "center", lat: 30.1, lng: 180.0001 }],
    ["longitude below range", { type: "center", lat: 30.1, lng: -180.0001 }],
  ])("RED: rejects %s before a legitimate ready", (_name, payload) => {
    const { onConfirm, view } = renderPicker();

    bridge(payload as BridgePayload);
    bridge({ type: "ready" });

    const confirm = view.getByTestId("create-map-pin-confirm");
    expect(confirm.props.disabled).toBe(true);
    fireEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("preserves a valid current-epoch center and ignores unknown messages", () => {
    const { onConfirm, view } = renderPicker();

    bridge({ type: "unknown", lat: 88, lng: 177 });
    bridge({ type: "ready" });
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);

    bridge({ type: "center", lat: 30.2, lng: 31.3 });
    const confirm = view.getByTestId("create-map-pin-confirm");
    expect(confirm.props.disabled).toBe(false);
    fireEvent.press(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({ lat: 30.2, lng: 31.3 });
  });

  it("RED: explicitly rejects external top-level navigation while preserving the local map document", () => {
    renderPicker();

    const shouldStart = mockLatestWebViewProps.onShouldStartLoadWithRequest as
      | ((request: NavigationRequest) => boolean)
      | undefined;
    expect(shouldStart).toEqual(expect.any(Function));

    expect(
      shouldStart?.({
        url: "about:blank",
        mainDocumentURL: "about:blank",
        navigationType: "other",
      }),
    ).toBe(true);

    expect(
      shouldStart?.({
        url: "https://leafletjs.com/",
        mainDocumentURL: "about:blank",
        navigationType: "click",
      }),
    ).toBe(false);

    expect(
      shouldStart?.({
        url: "https://www.openstreetmap.org/copyright",
        mainDocumentURL: "about:blank",
        navigationType: "click",
      }),
    ).toBe(false);

    expect(
      (mockLatestWebViewProps.source as { html?: string } | undefined)?.html,
    ).toContain("OpenStreetMap");
  });
});
