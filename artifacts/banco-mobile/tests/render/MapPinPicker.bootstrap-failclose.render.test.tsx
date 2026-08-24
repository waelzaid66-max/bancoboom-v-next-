import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { MapPinPicker } from "@/components/MapPinPicker";

let latestWebViewProps: Record<string, any> = {};

jest.mock("react-native-webview", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: (props: Record<string, unknown>) => {
      latestWebViewProps = props;
      return ReactRuntime.createElement(Native.View, { testID: "mock-map-pin-webview" });
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

jest.mock("@/components/icons", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Feather: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, { ...props, testID: "mock-feather" }),
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
    marketCountry === "AE"
      ? { lat: 25.2048, lng: 55.2708, zoom: 9 }
      : { lat: 30.0444, lng: 31.2357, zoom: 6 },
}));

jest.mock("@/components/search/mapVendorInline", () => ({
  LEAFLET_CSS: "",
  LEAFLET_JS: "",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 10, left: 0 }),
}));

function bridge(message: unknown): void {
  const onMessage = latestWebViewProps.onMessage as
    | ((event: { nativeEvent: { data: string } }) => void)
    | undefined;
  expect(onMessage).toEqual(expect.any(Function));
  act(() => {
    onMessage!({
      nativeEvent: {
        data: typeof message === "string" ? message : JSON.stringify(message),
      },
    });
  });
}

function renderPicker({
  initial = null,
  marketCountry = "EG",
  onConfirm = jest.fn(),
}: {
  initial?: { lat: number; lng: number } | null;
  marketCountry?: string;
  onConfirm?: jest.Mock;
} = {}) {
  const onClose = jest.fn();
  const view = render(
    <MapPinPicker
      visible
      marketCountry={marketCountry}
      initial={initial}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  return { view, onClose, onConfirm };
}

describe("MapPinPicker bootstrap fail-close behavior", () => {
  beforeEach(() => {
    latestWebViewProps = {};
  });

  it("fails closed after bootstrap error even when an initial coordinate is already seeded", () => {
    const onConfirm = jest.fn();
    const { view } = renderPicker({
      initial: { lat: 30.1, lng: 31.2 },
      onConfirm,
    });
    const confirm = view.getByTestId("create-map-pin-confirm");

    expect(confirm.props.accessibilityState?.disabled ?? confirm.props.disabled).toBeTruthy();

    bridge({ type: "error" });

    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();
    expect(view.getByText("search.mapUnavailableBody")).toBeTruthy();
    expect(confirm.props.accessibilityState?.disabled ?? confirm.props.disabled).toBeTruthy();

    fireEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();

    bridge({ type: "ready" });
    expect(view.getByText("search.mapUnavailableTitle")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("allows confirmation only after ready plus a valid center message", () => {
    const onConfirm = jest.fn();
    const { view } = renderPicker({ onConfirm });
    const confirm = view.getByTestId("create-map-pin-confirm");

    bridge({ type: "ready" });
    expect(confirm.props.accessibilityState?.disabled ?? confirm.props.disabled).toBeTruthy();

    bridge({ type: "center", lat: 30.55, lng: 31.77 });

    const enabledConfirm = view.getByTestId("create-map-pin-confirm");
    expect(
      enabledConfirm.props.accessibilityState?.disabled ?? enabledConfirm.props.disabled,
    ).toBeFalsy();
    fireEvent.press(enabledConfirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({ lat: 30.55, lng: 31.77 });
  });

  it("returns to loading when the visible picker is reframed for another market", () => {
    const onConfirm = jest.fn();
    const { view } = renderPicker({ onConfirm });

    bridge({ type: "ready" });
    bridge({ type: "center", lat: 30.5, lng: 31.5 });
    expect(
      view.getByTestId("create-map-pin-confirm").props.accessibilityState?.disabled ??
        view.getByTestId("create-map-pin-confirm").props.disabled,
    ).toBeFalsy();

    view.rerender(
      <MapPinPicker
        visible
        marketCountry="AE"
        initial={null}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );

    const confirm = view.getByTestId("create-map-pin-confirm");
    expect(confirm.props.accessibilityState?.disabled ?? confirm.props.disabled).toBeTruthy();
    expect(view.queryByText("search.mapUnavailableTitle")).toBeNull();
  });

  it("ignores malformed bridge payloads without opening confirmation", () => {
    const onConfirm = jest.fn();
    const { view } = renderPicker({ onConfirm });

    expect(() => bridge("{not-json")).not.toThrow();

    const confirm = view.getByTestId("create-map-pin-confirm");
    expect(confirm.props.accessibilityState?.disabled ?? confirm.props.disabled).toBeTruthy();
    fireEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
