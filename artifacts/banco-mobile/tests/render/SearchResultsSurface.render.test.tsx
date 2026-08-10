/**
 * Renderer proof for the shared results-state contract.
 *
 * The section apps deliberately keep one FlatList mounted and put blocking
 * loading/error/empty content above it. Static guards protect where controls
 * live, but only mounting the component can prove the old rows and scrolling
 * header survive while that overlay is present.
 */
import React from "react";
import { FlatList, Pressable, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import type { FeedItem } from "@workspace/api-client-react";
import type { SharedValue } from "react-native-reanimated";

import { SearchResultsSurface } from "@/components/search/SearchResultsSurface";

jest.mock("react-native-reanimated", () => {
  const Native = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  return {
    __esModule: true,
    default: { FlatList: Native.FlatList, View: Native.View },
    FadeInDown: { duration: () => undefined },
    useAnimatedScrollHandler:
      (handler: (event: { contentOffset: { y: number } }) => void) =>
      (
        event:
          | { contentOffset: { y: number } }
          | { nativeEvent: { contentOffset: { y: number } } },
      ) => handler("nativeEvent" in event ? event.nativeEvent : event),
  };
});

jest.mock("@/components/SmartAssetCard", () => ({
  SmartAssetCard: () => null,
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#FFFFFF",
    card: "#FFFFFF",
    border: "#DDDDDD",
    foreground: "#111111",
    mutedForeground: "#666666",
    primary: "#E8002D",
    primaryForeground: "#FFFFFF",
    radius: 12,
  }),
}));

jest.mock("@/context/LanguageContext", () => ({
  useI18n: () => ({ t: (key: string) => key, isRTL: false }),
}));

const ITEM = { id: "item-1" } as FeedItem;

function Card({
  item,
  onPress,
}: {
  item: FeedItem;
  onPress?: (item: FeedItem) => void;
}) {
  return (
    <Pressable testID={`card-${item.id}`} onPress={() => onPress?.(item)}>
      <Text>{item.id}</Text>
    </Pressable>
  );
}

function surface(
  overrides: Partial<React.ComponentProps<typeof SearchResultsSurface>> = {},
) {
  return (
    <SearchResultsSurface
      items={[ITEM]}
      onCardPress={jest.fn()}
      isSaved={() => false}
      onEndReached={jest.fn()}
      loadingMore={false}
      refreshing={false}
      overlay={null}
      CardComponent={Card}
      {...overrides}
    />
  );
}

describe("SearchResultsSurface", () => {
  it("keeps previous rows mounted underneath a blocking overlay", () => {
    const view = render(
      surface({ overlay: <Text testID="blocking-overlay">loading</Text> }),
    );

    expect(view.getByTestId("blocking-overlay")).toBeTruthy();
    expect(view.getByTestId("card-item-1")).toBeTruthy();
  });

  it("keeps an empty list scrollable when it owns scrolling chrome", () => {
    const view = render(
      surface({
        items: [],
        listHeader: <Text testID="scrolling-header">identity</Text>,
      }),
    );

    expect(view.getByTestId("scrolling-header")).toBeTruthy();
    expect(view.UNSAFE_getByType(FlatList).props.scrollEnabled).toBe(true);
  });

  it("publishes list movement through the shared UI-thread scroll value", () => {
    const scrollY = { value: 0 } as SharedValue<number>;
    const view = render(surface({ scrollY }));

    fireEvent.scroll(view.UNSAFE_getByType(FlatList), {
      nativeEvent: { contentOffset: { y: 73 } },
    });

    expect(scrollY.value).toBe(73);
  });

  it("shows a retry without replacing the earlier successful rows", () => {
    const onRetry = jest.fn();
    const view = render(surface({ error: true, onRetry }));

    expect(view.getByTestId("card-item-1")).toBeTruthy();
    fireEvent.press(view.getByTestId("search-refresh-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
