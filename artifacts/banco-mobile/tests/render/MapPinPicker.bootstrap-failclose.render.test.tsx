import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";

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
  marketCountryMapCenter: (marketCountry: string) =>
    marketCountry === "SA"
      ? { lat: 24.7136, lng: 46.6753, zoom: 6 }
      : { lat: 30.0444, lng: 31.2357, zoom: 6 },
}));

jest.mock("@/components/search/mapVendorInline", () => ({
  LEAFLET_CSS: "",
  LEAFLET_JS: "",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

type Pin = { lat: number; lng: number };

const INITIAL: Pin = { lat: 30.1, lng: 31.2 };
const MOVED: Pin = { lat: 30.2, lng: 31.3 };

function bridge(payload: Record<string, unknown>): void {
  const onMessage = mockLatestWebViewProps.onMessage as
    | ((event: { nativeEvent: { data: string } }) => void)
    | undefined;
  expect(onMessage).toEqual(expect.any(Function));
  act(() => {
    onMessage?.({ nativeEvent: { data: JSON.stringify(payload) } });
  });
}

function bridgeRaw(data: string): void {
  const onMessage = mockLatestWebViewProps.onMessage as
    | ((event: { nativeEvent: { data: string } }) => void)
    | undefined;
  expect(onMessage).toEqual(expect.any(Function));
  act(() => {
    onMessage?.({ nativeEvent: { data } });
  });
}

function picker(
  props: Partial<React.ComponentProps<typeof MapPinPicker>> = {},
) {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  const allProps: React.ComponentProps<typeof MapPinPicker> = {
    visible: true,
    marketCountry: "EG",
    initial: null,
    onClose,
    onConfirm,
    ...props,
  };
  const view = render(<MapPinPicker {...allProps} />);
  return { allProps, onClose, onConfirm, view };
}

describe("MapPinPicker mounted bootstrap fail-close", () => {
  beforeEach(() => {
    mockLatestWebViewProps = {};
  });

  it("shows terminal unavailable UI and cannot commit a seeded coordinate after failure", () => {
    const { onConfirm, view } = picker({ initial: INITIAL });

    expect(view.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);

    bridge({ type: "ready" });
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(false);

    bridge({ type: "error" });

    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();
    expect(view.getByText("search.mapUnavailableBody")).toBeTruthy();
    expect(view.UNSAFE_queryByType(ActivityIndicator)).toBeNull();

    const failedConfirm = view.getByTestId("create-map-pin-confirm");
    expect(failedConfirm.props.disabled).toBe(true);
    fireEvent.press(failedConfirm);
    expect(onConfirm).not.toHaveBeenCalled();

    bridge({ type: "ready" });
    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);
    fireEvent.press(view.getByTestId("create-map-pin-confirm"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("preserves the normal ready-center-confirm path and ignores malformed bridge data", () => {
    const { onConfirm, view } = picker();

    expect(() => bridgeRaw("not-json")).not.toThrow();
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);
    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();

    bridge({ type: "ready" });
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);

    bridge({ type: "center", ...MOVED });
    const confirm = view.getByTestId("create-map-pin-confirm");
    expect(confirm.props.disabled).toBe(false);
    fireEvent.press(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(MOVED);
  });

  it("resets ready and failed bootstrap state when the picker is reframed or reopened", () => {
    const { allProps, view } = picker();

    bridge({ type: "ready" });
    bridge({ type: "center", ...MOVED });
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(false);

    view.rerender(
      <MapPinPicker {...allProps} marketCountry="SA" initial={null} />,
    );
    expect(view.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);

    bridge({ type: "error" });
    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();

    view.rerender(
      <MapPinPicker
        {...allProps}
        visible={false}
        marketCountry="SA"
        initial={null}
      />,
    );
    view.rerender(
      <MapPinPicker
        {...allProps}
        visible
        marketCountry="SA"
        initial={null}
      />,
    );

    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();
    expect(view.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(view.getByTestId("create-map-pin-confirm").props.disabled).toBe(true);
  });
});
