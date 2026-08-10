/**
 * Renderer proof for the Facilities header lineage.
 *
 * Commit ca19018 corrected the hidden-overlay defect by moving the live type
 * strip into the pinned slice and added real brand-height collapse. The current
 * blob is byte-identical to that implementation. This suite freezes the
 * component boundary without mounting or rewriting SectionSearchApp.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import {
  FacilitiesHomeHeader,
  type FacilityType,
} from "@/components/search/facilities/FacilitiesHomeHeader";

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
  onSelectType: jest.fn(),
};

const types: FacilityType[] = [
  { key: "factory", label: "Factory", count: 2, icon: "home" },
  { key: "land", label: "Industrial land", count: 3, icon: "map-pin" },
];

function header(
  overrides: Partial<React.ComponentProps<typeof FacilitiesHomeHeader>> = {},
) {
  return (
    <FacilitiesHomeHeader
      slot="pinned"
      searchOpen={false}
      draftQuery=""
      searchSaved={false}
      activeFilterCount={0}
      marketCountry="EG"
      sort="recommended"
      inputRef={React.createRef()}
      types={types}
      activeType={null}
      {...callbacks}
      {...overrides}
    />
  );
}

describe("FacilitiesHomeHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRTL = false;
  });

  it("mounts identity, market, actions, search, and live type controls pinned", () => {
    const view = render(header());

    for (const id of [
      "facilities-home-header",
      "section-back",
      "facilities-header-map",
      "section-sort-cycle",
      "section-save-search",
      "facilities-industry-brand",
      "facilities-market-beside-banco",
      "section-search-open",
      "section-filter-toggle",
      "facilities-type-strip",
      "facilities-type-factory",
      "facilities-type-land",
    ]) {
      expect(view.getByTestId(id)).toBeTruthy();
    }
    expect(
      view.getByText("search.discover.section.facilitiesBrand"),
    ).toBeTruthy();
    expect(view.getByText("booking.poweredBy")).toBeTruthy();
    expect(view.getByTestId("section-back").props.hitSlop).toBe(12);
  });

  it("routes every pinned direct action and the selected facet type", () => {
    const view = render(header());

    for (const id of [
      "section-back",
      "facilities-header-map",
      "section-sort-cycle",
      "section-save-search",
      "facilities-market-beside-banco",
      "section-search-open",
      "section-filter-toggle",
      "facilities-type-factory",
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
    expect(callbacks.onSelectType).toHaveBeenCalledWith("factory");
  });

  it("keeps the type control pinned while hero and proven total scroll", () => {
    const view = render(header({ slot: undefined }));

    expect(view.getByTestId("facilities-industry-brand")).toBeTruthy();
    expect(view.getByTestId("facilities-type-strip")).toBeTruthy();
    expect(view.getByTestId("facilities-hero")).toBeTruthy();
    expect(view.getByTestId("facilities-count")).toBeTruthy();
    expect(view.getByText("5")).toBeTruthy();

    view.rerender(header({ slot: "scroll" }));

    expect(view.getByTestId("facilities-hero-band")).toBeTruthy();
    expect(view.getByTestId("facilities-hero")).toBeTruthy();
    expect(view.getByTestId("facilities-count")).toBeTruthy();
    expect(view.queryByTestId("facilities-industry-brand")).toBeNull();
    expect(view.queryByTestId("facilities-type-strip")).toBeNull();
    expect(view.queryByTestId("section-search-open")).toBeNull();
  });

  it("reclaims brand-lockup height while browse controls remain mounted", () => {
    const scrollY = { value: 0 } as SharedValue<number>;
    const view = render(header({ scrollY }));
    const expanded = StyleSheet.flatten(
      view.getByTestId("facilities-industry-brand").props.style,
    );

    expect(expanded).toMatchObject({
      height: 34,
      opacity: 1,
      marginBottom: 6,
    });

    scrollY.value = 96;
    view.rerender(header({ scrollY }));
    const collapsed = StyleSheet.flatten(
      view.getByTestId("facilities-industry-brand").props.style,
    );

    expect(collapsed).toMatchObject({
      height: 0,
      opacity: 0,
      marginBottom: 0,
    });
    expect(view.getByTestId("section-search-open")).toBeTruthy();
    expect(view.getByTestId("facilities-type-strip")).toBeTruthy();
  });

  it("renders no invented type strip or total when no facet is proven", () => {
    const view = render(header({ slot: undefined, types: [] }));

    expect(view.queryByTestId("facilities-type-strip")).toBeNull();
    expect(view.queryByTestId("facilities-count")).toBeNull();
    expect(view.getByTestId("facilities-hero")).toBeTruthy();
  });

  it("keeps search input, submit, clear, close, and filter callbacks reachable", () => {
    const view = render(header({ searchOpen: true, draftQuery: "cairo" }));

    fireEvent.changeText(view.getByTestId("section-search-input"), "giza");
    fireEvent(view.getByTestId("section-search-input"), "submitEditing");
    fireEvent.press(view.getByTestId("section-search-clear"));
    fireEvent.press(view.getByTestId("section-filter-toggle"));

    expect(callbacks.onQueryChange).toHaveBeenCalledWith("giza");
    expect(callbacks.onSubmitQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onClearQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);

    view.rerender(header({ searchOpen: true, draftQuery: "" }));
    fireEvent.press(view.getByTestId("section-search-close"));
    expect(callbacks.onCloseSearch).toHaveBeenCalledTimes(1);
  });

  it("disables a saved search and exposes honest active state and count", () => {
    const view = render(
      header({
        searchSaved: true,
        activeFilterCount: 4,
        activeType: "land",
        sort: "price_asc",
      }),
    );

    fireEvent.press(view.getByTestId("section-save-search"));
    expect(callbacks.onSaveSearch).not.toHaveBeenCalled();
    expect(view.getByText("4")).toBeTruthy();
    expect(
      view.getByTestId("facilities-type-land").props.accessibilityState,
    ).toEqual({ selected: true });
    expect(view.getByTestId("section-sort-cycle")).toHaveStyle({
      backgroundColor: "#BE3222",
    });
  });

  it("uses the logical back direction in Arabic", () => {
    mockIsRTL = true;
    const view = render(header());

    expect(view.getByTestId("icon-arrow-right")).toBeTruthy();
  });
});
