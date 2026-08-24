import React from "react";
import { act, render, fireEvent } from "@testing-library/react-native";

import { MapPinPicker } from "@/components/MapPinPicker";

/**
 * THE PIN PICKER MUST NOT CONFIRM A LOCATION THE MAP NEVER SHOWED.
 *
 * Measured on main 2026-08-24, by reading the source and then driving it:
 *
 *   const [center, setCenter] = useState<Pin | null>(initial ?? null);
 *   ...
 *   disabled={!center}
 *
 * `center` is seeded from `initial` before the WebView loads anything, so the
 * confirm button is enabled on the FIRST frame. And `onMessage` handles only
 * "ready" and "center" — the `{type:"error"}` the page posts when Leaflet fails
 * to load is parsed and dropped.
 *
 * The consequence is a silent data-integrity bug, not a cosmetic one: the map
 * fails, the user sees an empty sheet with a live accent-coloured confirm
 * button, presses it, and the SEEDED coordinate is recorded as if they had
 * chosen it. The listing carries a location nobody picked and nothing reports
 * a failure.
 *
 * The team measured the same gap independently on their snapshot 5c919cd
 * (audit/recovery/MAPS-P0-MAPPINPICKER-EPOCH-ADDENDUM-2026-08-24.md) and wrote
 * the fix there. This file is the executed proof their addendum asked for, and
 * it is mounted rather than static so it cannot pass on prose.
 */

let mockLatestWebViewProps: Record<string, any> = {};

jest.mock("react-native-webview", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: (props: Record<string, unknown>) => {
      mockLatestWebViewProps = props;
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

jest.mock("@/components/icons", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Feather: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
  };
});

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({ t: (k: string) => k, isRTL: false, language: "en" }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#fff",
    foreground: "#000",
    mutedForeground: "#666",
    secondary: "#eee",
    border: "#ddd",
    card: "#fff",
    primary: "#000",
    primaryForeground: "#fff",
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 10, left: 0 }),
}));

/** Push one bridge message from the page, the way the real WebView would. */
function bridge(type: string, extra: Record<string, unknown> = {}) {
  act(() => {
    mockLatestWebViewProps.onMessage({
      nativeEvent: { data: JSON.stringify({ type, ...extra }) },
    });
  });
}

const SEEDED = { lat: 30.0444, lng: 31.2357 };

function renderPicker(initial: { lat: number; lng: number } | null = SEEDED) {
  const onConfirm = jest.fn();
  const utils = render(
    <MapPinPicker
      visible
      initial={initial}
      marketCountry="EG"
      onClose={() => {}}
      onConfirm={onConfirm}
    />,
  );
  return { ...utils, onConfirm };
}

describe("MapPinPicker — a failed map cannot confirm a coordinate", () => {
  it("does not confirm the seeded coordinate when the map never became ready", () => {
    const { getByTestId, onConfirm } = renderPicker();

    // The page could not load Leaflet and said so. Nothing else has happened:
    // no "ready", no user pan, no "center" from the map.
    bridge("error");

    fireEvent.press(getByTestId("create-map-pin-confirm"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not confirm before the map is ready, even with a seeded coordinate", () => {
    const { getByTestId, onConfirm } = renderPicker();

    // No bridge traffic at all — this is the first frame after opening.
    fireEvent.press(getByTestId("create-map-pin-confirm"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("surfaces a localized failure instead of an empty sheet", () => {
    const { queryByText } = renderPicker();
    bridge("error");

    // The same two keys the browse maps use, so the copy cannot drift apart.
    expect(queryByText("search.mapUnavailableTitle")).toBeTruthy();
  });

  it("a late ready cannot revive a failed picker", () => {
    const { getByTestId, onConfirm } = renderPicker();

    bridge("error");
    bridge("ready");
    bridge("center", { lat: 31.2, lng: 29.9 });

    fireEvent.press(getByTestId("create-map-pin-confirm"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms the coordinate the map reported once it is genuinely ready", () => {
    const { getByTestId, onConfirm } = renderPicker();

    bridge("ready");
    bridge("center", { lat: 31.2001, lng: 29.9187 });

    fireEvent.press(getByTestId("create-map-pin-confirm"));

    expect(onConfirm).toHaveBeenCalledWith({ lat: 31.2001, lng: 29.9187 });
  });
});
