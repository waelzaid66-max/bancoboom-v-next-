/**
 * Renderer proof for the Property header lineage.
 *
 * Commit 1bfa485 split the header, then 9d402d4 corrected the semantic defect:
 * offer/type browse controls inside the list header disappeared beneath the
 * opaque empty/error overlay. The current component keeps every control pinned
 * and collapses identity only. This suite freezes that distinction without
 * mounting or rewriting the conflict-damaged SectionSearchApp integration.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { SharedValue } from "react-native-reanimated";

import {
  PropertyHomeHeader,
  RE_COMMERCIAL_TAB,
  RE_MORE_TAB,
} from "@/components/search/property/PropertyHomeHeader";

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

jest.mock("@/components/MarketCountryPicker", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    MarketCountryButton: ({ onPress }: { onPress?: () => void }) =>
      ReactRuntime.createElement(Native.Pressable, {
        onPress,
        testID: "market-country",
      }),
  };
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
  onOpenStays: jest.fn(),
  onOpenRequest: jest.fn(),
  onOpenMap: jest.fn(),
  onOpenFilters: jest.fn(),
  onOpenSearch: jest.fn(),
  onCloseSearch: jest.fn(),
  onQueryChange: jest.fn(),
  onSubmitQuery: jest.fn(),
  onClearQuery: jest.fn(),
  onSelectType: jest.fn(),
  onSelectOffer: jest.fn(),
  onToggleWanted: jest.fn(),
  onOpenMarket: jest.fn(),
  onCycleSort: jest.fn(),
};

const typeTabs = [
  { value: "__all__", label: "All" },
  { value: "apartment", label: "Apartments" },
  { value: RE_COMMERCIAL_TAB, label: "Commercial" },
  { value: RE_MORE_TAB, label: "More" },
];

function header(
  overrides: Partial<React.ComponentProps<typeof PropertyHomeHeader>> = {},
) {
  return (
    <PropertyHomeHeader
      slot="pinned"
      searchOpen={false}
      draftQuery=""
      searchSaved={false}
      activeFilterCount={0}
      activePropertyType="__all__"
      activeOfferKey="all"
      wantedActive={false}
      selectedPropertyType={null}
      typeTabs={typeTabs}
      marketCountry="EG"
      sort="recommended"
      inputRef={React.createRef()}
      {...callbacks}
      {...overrides}
    />
  );
}

describe("PropertyHomeHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRTL = false;
  });

  it("mounts the complete pinned identity and browse-control contract", () => {
    const view = render(header());

    for (const id of [
      "re-property-header",
      "section-back",
      "re-header-map",
      "re-header-stays",
      "re-header-request",
      "section-save-search",
      "re-property-brand",
      "market-country",
      "section-sort-cycle",
      "section-search-open",
      "section-filter-toggle",
      "re-offer-strip",
      "re-offer-all",
      "re-offer-sale",
      "re-offer-rent",
      "re-offer-wanted",
      "re-type-strip",
      "re-type-apartment",
      `re-type-${RE_COMMERCIAL_TAB}`,
      `re-type-${RE_MORE_TAB}`,
    ]) {
      expect(view.getByTestId(id)).toBeTruthy();
    }
  });

  it("routes the top, market, offer, wanted, and direct-type actions", () => {
    const view = render(header());

    for (const id of [
      "section-back",
      "re-header-map",
      "re-header-stays",
      "re-header-request",
      "section-save-search",
      "market-country",
      "section-sort-cycle",
      "section-search-open",
      "section-filter-toggle",
      "re-offer-rent",
      "re-offer-wanted",
      "re-type-apartment",
    ]) {
      fireEvent.press(view.getByTestId(id));
    }

    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMap).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenStays).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenRequest).toHaveBeenCalledTimes(1);
    expect(callbacks.onSaveSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMarket).toHaveBeenCalledTimes(1);
    expect(callbacks.onCycleSort).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(callbacks.onSelectOffer).toHaveBeenCalledWith("rent");
    expect(callbacks.onToggleWanted).toHaveBeenCalledTimes(1);
    expect(callbacks.onSelectType).toHaveBeenCalledWith("apartment");
  });

  it("keeps controls in the pinned slice and leaves the scrolling slice empty", () => {
    const view = render(header());

    expect(view.getByTestId("re-offer-strip")).toBeTruthy();
    expect(view.getByTestId("re-type-strip")).toBeTruthy();
    view.rerender(header({ slot: "scroll" }));

    expect(view.getByTestId("re-property-scroll-band")).toBeTruthy();
    expect(view.queryByTestId("re-property-brand")).toBeNull();
    expect(view.queryByTestId("section-search-open")).toBeNull();
    expect(view.queryByTestId("re-offer-strip")).toBeNull();
    expect(view.queryByTestId("re-type-strip")).toBeNull();
  });

  it("collapses identity height while every browse control remains mounted", () => {
    const scrollY = { value: 0 } as SharedValue<number>;
    const view = render(header({ scrollY }));

    expect(view.getByTestId("re-property-brand")).toHaveStyle({
      height: 40,
      opacity: 1,
      transform: [{ scale: 1 }],
    });
    scrollY.value = 96;
    view.rerender(header({ scrollY }));

    expect(view.getByTestId("re-property-brand")).toHaveStyle({
      height: 0,
      opacity: 0,
      transform: [{ scale: 0.82 }],
    });
    expect(view.getByTestId("section-search-open")).toBeTruthy();
    expect(view.getByTestId("re-offer-strip")).toBeTruthy();
    expect(view.getByTestId("re-type-strip")).toBeTruthy();
  });

  it("opens Commercial as a picker and emits only a real API type", () => {
    const view = render(header());

    fireEvent.press(view.getByTestId(`re-type-${RE_COMMERCIAL_TAB}`));
    expect(view.getByTestId("re-type-picker-sheet")).toBeTruthy();
    expect(callbacks.onSelectType).not.toHaveBeenCalled();
    fireEvent.press(view.getByTestId("re-commercial-office"));

    expect(callbacks.onSelectType).toHaveBeenCalledWith("office");
    expect(callbacks.onSelectType).not.toHaveBeenCalledWith(RE_COMMERCIAL_TAB);
    expect(view.queryByTestId("re-type-picker-sheet")).toBeNull();
  });

  it("opens More as a picker and emits only a real deep type", () => {
    const view = render(header());

    fireEvent.press(view.getByTestId(`re-type-${RE_MORE_TAB}`));
    expect(view.getByTestId("re-type-picker-sheet")).toBeTruthy();
    fireEvent.press(view.getByTestId("re-more-studio"));

    expect(callbacks.onSelectType).toHaveBeenCalledWith("studio");
    expect(callbacks.onSelectType).not.toHaveBeenCalledWith(RE_MORE_TAB);
  });

  it("keeps the search input and filter actions reachable", () => {
    const view = render(header({ searchOpen: true, draftQuery: "cairo" }));

    fireEvent.changeText(view.getByTestId("section-search-input"), "giza");
    fireEvent(view.getByTestId("section-search-input"), "submitEditing");
    fireEvent.press(view.getByTestId("section-search-clear"));
    fireEvent.press(view.getByTestId("section-filter-toggle"));

    expect(callbacks.onQueryChange).toHaveBeenCalledWith("giza");
    expect(callbacks.onSubmitQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onClearQuery).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);
  });

  it("uses the logical back direction in Arabic", () => {
    mockIsRTL = true;
    const view = render(header());

    expect(view.getByTestId("icon-arrow-right")).toBeTruthy();
  });
});
