/**
 * Renderer proof for the Materials header lineage.
 *
 * Commit 1bfa485 split the header so identity/search stay pinned while only the
 * prose tagline enters the list, and gave the lockup real 46 → 0 collapse.
 * Commit e495e02 then moved its neutral palette onto the shared section tokens.
 * The current blob is byte-identical to that implementation. This suite freezes
 * the component boundary without mounting or rewriting SectionSearchApp.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { MaterialsHomeHeader } from "@/components/search/materials/MaterialsHomeHeader";

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
  onOpenFilters: jest.fn(),
  onOpenMap: jest.fn(),
  onOpenSearch: jest.fn(),
  onCloseSearch: jest.fn(),
  onQueryChange: jest.fn(),
  onSubmitQuery: jest.fn(),
  onClearQuery: jest.fn(),
  onOpenMarket: jest.fn(),
  onCycleSort: jest.fn(),
};

function header(
  overrides: Partial<React.ComponentProps<typeof MaterialsHomeHeader>> = {},
) {
  return (
    <MaterialsHomeHeader
      slot="pinned"
      searchOpen={false}
      draftQuery=""
      searchSaved={false}
      activeFilterCount={0}
      marketCountry="EG"
      sort="recommended"
      inputRef={React.createRef()}
      {...callbacks}
      {...overrides}
    />
  );
}

describe("MaterialsHomeHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRTL = false;
  });

  it("mounts identity, market, actions, and search in the pinned slice", () => {
    const view = render(header());

    for (const id of [
      "materials-core-header",
      "section-back",
      "materials-header-map",
      "section-sort-cycle",
      "section-save-search",
      "materials-core-brand",
      "materials-core-seal",
      "materials-powered-market-row",
      "materials-market-beside-banco",
      "section-search-open",
      "section-filter-toggle",
    ]) {
      expect(view.getByTestId(id)).toBeTruthy();
    }
    expect(view.getByText("search.discover.section.materialsBrand")).toBeTruthy();
    expect(
      view.getByText("search.discover.section.materialsHubLabel"),
    ).toBeTruthy();
    expect(view.getByText("booking.poweredBy")).toBeTruthy();
    expect(view.getByTestId("section-back").props.hitSlop).toBe(12);
  });

  it("routes every pinned direct action to its parent", () => {
    const view = render(header());

    for (const id of [
      "section-back",
      "materials-header-map",
      "section-sort-cycle",
      "section-save-search",
      "materials-market-beside-banco",
      "section-search-open",
      "section-filter-toggle",
    ]) {
      fireEvent.press(view.getByTestId(id));
    }

    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMap).toHaveBeenCalledTimes(1);
    expect(callbacks.onCycleSort).toHaveBeenCalledTimes(1);
    expect(callbacks.onSaveSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMarket).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);
  });

  it("hands only the prose tagline to the scrolling slice", () => {
    const view = render(header({ slot: undefined }));

    expect(view.getByTestId("materials-core-brand")).toBeTruthy();
    expect(view.getByTestId("section-search-open")).toBeTruthy();
    expect(
      view.getByText("search.discover.section.materialsTagline"),
    ).toBeTruthy();

    view.rerender(header({ slot: "scroll" }));

    expect(view.getByTestId("materials-scroll-band")).toBeTruthy();
    expect(
      view.getByText("search.discover.section.materialsTagline"),
    ).toBeTruthy();
    expect(view.queryByTestId("materials-core-brand")).toBeNull();
    expect(view.queryByTestId("section-search-open")).toBeNull();
    expect(view.queryByTestId("section-back")).toBeNull();
  });

  it("reclaims lockup height and raises the pinned plane while search remains", () => {
    const scrollY = { value: 0 } as SharedValue<number>;
    const view = render(header({ scrollY }));
    const expandedBrand = StyleSheet.flatten(
      view.getByTestId("materials-core-brand").props.style,
    );
    const expandedRoot = StyleSheet.flatten(
      view.getByTestId("materials-core-header").props.style,
    );

    expect(expandedBrand).toMatchObject({
      height: 46,
      opacity: 1,
      transform: [{ scale: 1 }],
    });
    expect(expandedRoot).toMatchObject({
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 2,
    });

    scrollY.value = 96;
    view.rerender(header({ scrollY }));
    const collapsedBrand = StyleSheet.flatten(
      view.getByTestId("materials-core-brand").props.style,
    );
    const collapsedRoot = StyleSheet.flatten(
      view.getByTestId("materials-core-header").props.style,
    );

    expect(collapsedBrand).toMatchObject({
      height: 0,
      opacity: 0,
      transform: [{ scale: 0.82 }],
    });
    expect(collapsedRoot).toMatchObject({
      shadowOpacity: 0.52,
      shadowRadius: 20,
      elevation: 12,
    });
    expect(view.getByTestId("section-search-open")).toBeTruthy();
    expect(view.getByTestId("section-filter-toggle")).toBeTruthy();
  });

  it("does not duplicate the section-owned type, origin, or commodity axes", () => {
    const view = render(header({ slot: undefined }));

    expect(view.queryByTestId("materials-type-strip")).toBeNull();
    expect(view.queryByTestId("materials-origin-strip")).toBeNull();
    expect(view.queryByTestId("materials-material-strip")).toBeNull();
  });

  it("keeps search input, submit, clear, close, and filter callbacks reachable", () => {
    const view = render(header({ searchOpen: true, draftQuery: "steel" }));

    fireEvent.changeText(view.getByTestId("section-search-input"), "resin");
    fireEvent(view.getByTestId("section-search-input"), "submitEditing");
    fireEvent.press(view.getByTestId("section-search-clear"));
    fireEvent.press(view.getByTestId("section-filter-toggle"));

    expect(callbacks.onQueryChange).toHaveBeenCalledWith("resin");
    expect(callbacks.onSubmitQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onClearQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);

    view.rerender(header({ searchOpen: true, draftQuery: "" }));
    fireEvent.press(view.getByTestId("section-search-close"));
    expect(callbacks.onCloseSearch).toHaveBeenCalledTimes(1);
  });

  it("disables a saved search and exposes honest filter and sort state", () => {
    const view = render(
      header({
        searchSaved: true,
        activeFilterCount: 3,
        sort: "price_desc",
      }),
    );

    fireEvent.press(view.getByTestId("section-save-search"));
    expect(callbacks.onSaveSearch).not.toHaveBeenCalled();
    expect(view.getByText("3")).toBeTruthy();
    expect(view.getByTestId("section-sort-cycle")).toHaveStyle({
      backgroundColor: "#A82A1C",
    });
  });

  it("uses the logical back direction in Arabic", () => {
    mockIsRTL = true;
    const view = render(header());

    expect(view.getByTestId("icon-arrow-right")).toBeTruthy();
  });
});
