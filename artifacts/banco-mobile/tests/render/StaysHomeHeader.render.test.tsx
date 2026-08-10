/**
 * Renderer proof for the Stay header lineage.
 *
 * The 80b1a17 split put identity in the list header, where opaque loading and
 * empty overlays hid it. After the revert, e66a561 rebuilt the compact header
 * and d098047 kept every identity/control band pinned while reclaiming height
 * through scroll-driven collapse. This suite freezes the current behavior
 * without mounting the independent BookingStaysApp data/runtime journey.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { StaysHomeHeader } from "@/components/search/stays/StaysHomeHeader";

let mockIsRTL = false;

jest.mock("react-native-reanimated", () => {
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    __esModule: true,
    default: { View: Native.View },
    Extrapolation: { CLAMP: "clamp" },
    interpolate: (
      value: number,
      input: number[],
      output: number[],
    ): number => {
      const ratio = Math.max(
        0,
        Math.min(1, (value - input[0]) / (input[1] - input[0])),
      );
      return output[0] + (output[1] - output[0]) * ratio;
    },
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
  };
});

jest.mock("expo-image", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    Image: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
  };
});

jest.mock("expo-linear-gradient", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    LinearGradient: ({
      children,
      colors: _colors,
      start: _start,
      end: _end,
      ...props
    }: {
      children?: React.ReactNode;
      colors?: unknown;
      start?: unknown;
      end?: unknown;
      [key: string]: unknown;
    }) => ReactRuntime.createElement(Native.View, props, children),
  };
});

jest.mock("@/components/icons", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  const Icon = (props: Record<string, unknown>) => {
    const testID =
      typeof props.testID === "string"
        ? props.testID
        : `icon-${String(props.name)}`;
    return ReactRuntime.createElement(Native.View, { testID });
  };
  return { Feather: Icon, Ionicons: Icon };
});

jest.mock("@/components/AppText", () => {
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return { AppText: Native.Text };
});

jest.mock("@/components/AppTextInput", () => {
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return { AppTextInput: Native.TextInput };
});

jest.mock("@/components/StayCard", () => ({
  STAYS_ACCENT: "#B81E3C",
}));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({
    isRTL: mockIsRTL,
    t: (key: string) => key,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 34, left: 0 }),
}));

const callbacks = {
  onBack: jest.fn(),
  onSaveSearch: jest.fn(),
  onOpenMap: jest.fn(),
  onOpenFilters: jest.fn(),
  onOpenSearch: jest.fn(),
  onCloseSearch: jest.fn(),
  onQueryChange: jest.fn(),
  onSubmitQuery: jest.fn(),
  onClearQuery: jest.fn(),
  onSelectType: jest.fn(),
};

const typeTabs = [
  { value: "__all__", label: "All" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "chalet", label: "Chalet" },
];

type RenderNode = ReturnType<ReturnType<typeof render>["getByTestId"]>;

function styleFromAncestor(node: RenderNode, property: string) {
  let current: RenderNode | null = node;
  while (current) {
    const style = StyleSheet.flatten(current.props.style);
    if (style && Object.prototype.hasOwnProperty.call(style, property)) {
      return style;
    }
    current = current.parent;
  }
  throw new Error(`No rendered ancestor exposes style property ${property}`);
}

function header(
  overrides: Partial<React.ComponentProps<typeof StaysHomeHeader>> = {},
) {
  return (
    <StaysHomeHeader
      slot="pinned"
      searchOpen={false}
      draftQuery=""
      searchSaved={false}
      activeFilterCount={0}
      activeStayType="__all__"
      typeTabs={typeTabs}
      inputRef={React.createRef()}
      {...callbacks}
      {...overrides}
    />
  );
}

describe("StaysHomeHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRTL = false;
  });

  it("mounts the complete pinned identity and browse-control contract", () => {
    const view = render(header());

    for (const id of [
      "stays-header",
      "stays-back",
      "stays-boom-brand",
      "stays-header-map",
      "stays-save-search",
      "stays-search-toggle",
      "stays-filter-toggle",
      "stays-type-strip-scroll",
      "stays-type-__all__",
      "stays-type-studio",
      "stays-type-apartment",
      "stays-type-villa",
      "stays-type-chalet",
    ]) {
      expect(view.getByTestId(id)).toBeTruthy();
    }
    expect(view.getByText("STAY")).toBeTruthy();
    expect(
      view.getByText("search.discover.section.staysTagline"),
    ).toBeTruthy();
    expect(view.getByTestId("stays-back")).toHaveStyle({
      width: 48,
      height: 48,
    });
  });

  it("routes top, search, filter, and stay-type actions", () => {
    const view = render(header());

    for (const id of [
      "stays-back",
      "stays-header-map",
      "stays-save-search",
      "stays-search-toggle",
      "stays-filter-toggle",
      "stays-type-studio",
    ]) {
      fireEvent.press(view.getByTestId(id));
    }

    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMap).toHaveBeenCalledTimes(1);
    expect(callbacks.onSaveSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(callbacks.onSelectType).toHaveBeenCalledWith("studio");
  });

  it("keeps every band pinned and leaves the scrolling slice empty", () => {
    const view = render(header());

    expect(view.getByTestId("stays-boom-brand")).toBeTruthy();
    expect(view.getByTestId("stays-search-toggle")).toBeTruthy();
    expect(view.getByTestId("stays-type-strip-scroll")).toBeTruthy();
    view.rerender(header({ slot: "scroll" }));

    expect(view.getByTestId("stays-header")).toBeTruthy();
    expect(view.queryByTestId("stays-boom-brand")).toBeNull();
    expect(view.queryByTestId("stays-search-toggle")).toBeNull();
    expect(view.queryByTestId("stays-type-strip-scroll")).toBeNull();
    expect(
      view.queryByText("search.discover.section.staysTagline"),
    ).toBeNull();
  });

  it("reclaims header and tagline height while controls stay mounted", () => {
    const scrollY = { value: 0 } as SharedValue<number>;
    const view = render(header({ scrollY }));

    expect(
      styleFromAncestor(view.getByTestId("stays-boom-brand"), "height"),
    ).toMatchObject({ height: 94 });
    expect(
      styleFromAncestor(view.getByText("STAY"), "transform"),
    ).toMatchObject({ transform: [{ scale: 1 }] });
    expect(
      styleFromAncestor(view.getByText("booking.poweredBy"), "opacity"),
    ).toMatchObject({ opacity: 1 });
    expect(
      styleFromAncestor(
        view.getByText("search.discover.section.staysTagline"),
        "height",
      ),
    ).toMatchObject({
      height: 18,
      opacity: 1,
      marginTop: 6,
      marginBottom: 6,
    });

    scrollY.value = 96;
    view.rerender(header({ scrollY }));

    expect(
      styleFromAncestor(view.getByTestId("stays-boom-brand"), "height"),
    ).toMatchObject({ height: 60 });
    expect(
      styleFromAncestor(view.getByText("STAY"), "transform"),
    ).toMatchObject({ transform: [{ scale: 0.82 }] });
    expect(
      styleFromAncestor(view.getByText("booking.poweredBy"), "opacity"),
    ).toMatchObject({ opacity: 0 });
    expect(
      styleFromAncestor(
        view.getByText("search.discover.section.staysTagline"),
        "height",
      ),
    ).toMatchObject({
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    });
    expect(view.getByTestId("stays-search-toggle")).toBeTruthy();
    expect(view.getByTestId("stays-type-strip-scroll")).toBeTruthy();
  });

  it("keeps search input, close, clear, and filter callbacks reachable", () => {
    const view = render(header({ searchOpen: true, draftQuery: "cairo" }));

    fireEvent.changeText(view.getByTestId("stays-search-input"), "giza");
    fireEvent(view.getByTestId("stays-search-input"), "submitEditing");
    fireEvent.press(view.getByTestId("stays-search-clear"));
    fireEvent.press(view.getByTestId("stays-filter-toggle"));

    expect(callbacks.onQueryChange).toHaveBeenCalledWith("giza");
    expect(callbacks.onSubmitQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onClearQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);

    view.rerender(header({ searchOpen: true, draftQuery: "" }));
    fireEvent.press(view.getByTestId("stays-search-close"));
    expect(callbacks.onCloseSearch).toHaveBeenCalledTimes(1);
  });

  it("disables a saved search and exposes honest active state and count", () => {
    const view = render(
      header({
        searchSaved: true,
        activeFilterCount: 3,
        activeStayType: "studio",
      }),
    );

    fireEvent.press(view.getByTestId("stays-save-search"));
    expect(callbacks.onSaveSearch).not.toHaveBeenCalled();
    expect(view.getByText("3")).toBeTruthy();
    expect(
      view.getByTestId("stays-type-studio").props.accessibilityState,
    ).toEqual({ selected: true });
  });

  it("uses the logical back direction in Arabic", () => {
    mockIsRTL = true;
    const view = render(header());

    expect(view.getByTestId("icon-arrow-right")).toBeTruthy();
  });
});
