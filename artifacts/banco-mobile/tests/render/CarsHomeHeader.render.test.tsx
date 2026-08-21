/**
 * Renderer proof for the strongest historical Cars header.
 *
 * Commit 310028d fixed a fake collapse: the hero and its plate had to return
 * their real height to the results surface, not merely fade. The static guard
 * protects the arithmetic in source; this suite mounts the current component,
 * drives the shared scroll value, and proves the rendered geometry changes
 * while the buyer's controls remain reachable.
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { SharedValue } from "react-native-reanimated";

import {
  CAR_CATEGORIES,
  CarsHomeHeader,
} from "@/components/search/car/CarsHomeHeader";

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

jest.mock("react-native-svg", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  const MockSvg = (props: Record<string, unknown>) =>
    ReactRuntime.createElement(Native.View, props);
  return {
    __esModule: true,
    default: MockSvg,
    Defs: MockSvg,
    Ellipse: MockSvg,
    LinearGradient: MockSvg,
    Rect: MockSvg,
    RadialGradient: MockSvg,
    Stop: MockSvg,
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
    return ReactRuntime.createElement(Native.View, {
      ...props,
      testID,
    });
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

jest.mock("@/components/search/car/VehicleGlyph", () => {
  const ReactRuntime = jest.requireActual<typeof import("react")>("react");
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    VehicleGlyph: (props: Record<string, unknown>) =>
      ReactRuntime.createElement(Native.View, props),
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
  onOpenMap: jest.fn(),
  onOpenFilters: jest.fn(),
  onOpenSearch: jest.fn(),
  onCloseSearch: jest.fn(),
  onQueryChange: jest.fn(),
  onSubmitQuery: jest.fn(),
  onClearQuery: jest.fn(),
  onSelectCategory: jest.fn(),
  onOpenNotifications: jest.fn(),
  onOpenProfile: jest.fn(),
};

function header(
  overrides: Partial<React.ComponentProps<typeof CarsHomeHeader>> = {},
) {
  return (
    <CarsHomeHeader
      slot="pinned"
      searchOpen={false}
      draftQuery=""
      searchSaved={false}
      activeFilterCount={0}
      inputRef={React.createRef()}
      categories={CAR_CATEGORIES.slice(0, 2)}
      selectedCategory={null}
      stats={[
        {
          key: "markets",
          value: "25",
          labelKey: "search.discover.section.carStatCountries",
        },
      ]}
      notificationCount={2}
      {...callbacks}
      {...overrides}
    />
  );
}

describe("CarsHomeHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRTL = false;
  });

  it("mounts the full current identity and every pinned browse control", () => {
    const view = render(header());

    for (const id of [
      "cars-home-header",
      "cars-boom-brand",
      "cars-hero",
      "cars-unified-dock",
      "section-search-open",
      "cars-header-map",
      "section-save-search",
      "section-filter-toggle",
      "cars-category-strip",
      "cars-stats-strip",
      "cars-header-notifications",
      "cars-header-profile",
    ]) {
      expect(view.getByTestId(id)).toBeTruthy();
    }
  });

  it("routes all critical header presses to the parent", () => {
    const view = render(header());

    fireEvent.press(view.getByTestId("section-back"));
    fireEvent.press(view.getByTestId("cars-header-map"));
    fireEvent.press(view.getByTestId("section-save-search"));
    fireEvent.press(view.getByTestId("section-filter-toggle"));
    fireEvent.press(view.getByTestId("cars-category-cars"));
    fireEvent.press(view.getByTestId("cars-header-notifications"));
    fireEvent.press(view.getByTestId("cars-header-profile"));

    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenMap).toHaveBeenCalledTimes(1);
    expect(callbacks.onSaveSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(callbacks.onSelectCategory).toHaveBeenCalledWith("cars");
    expect(callbacks.onOpenNotifications).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it("keeps search and filters reachable when optional inventory bands are absent", () => {
    const view = render(header({ categories: [], stats: [] }));

    expect(view.queryByTestId("cars-category-strip")).toBeNull();
    expect(view.queryByTestId("cars-stats-strip")).toBeNull();
    expect(view.getByTestId("cars-unified-dock")).toBeTruthy();
    expect(view.getByTestId("section-search-open")).toBeTruthy();
    expect(view.getByTestId("section-filter-toggle")).toBeTruthy();
    expect(view.getByTestId("cars-header-map")).toBeTruthy();
  });

  it("reclaims the real hero height at the historical collapse threshold", () => {
    const scrollY = { value: 0 } as SharedValue<number>;
    const view = render(header({ scrollY }));

    expect(view.getByTestId("cars-hero")).toHaveStyle({
      height: 244,
      opacity: 1,
      marginBottom: 12,
    });
    scrollY.value = 96;
    view.rerender(header({ scrollY }));

    expect(view.getByTestId("cars-hero")).toHaveStyle({
      height: 0,
      opacity: 0,
      marginBottom: 0,
    });
    expect(view.getByTestId("cars-unified-dock")).toBeTruthy();
    expect(view.getByTestId("section-search-open")).toBeTruthy();
    expect(view.getByTestId("section-filter-toggle")).toBeTruthy();
    expect(view.getByTestId("cars-category-strip")).toBeTruthy();
  });

  it("uses the logical back direction in Arabic", () => {
    mockIsRTL = true;
    const view = render(header());

    expect(view.getByTestId("icon-arrow-right")).toBeTruthy();
  });
});