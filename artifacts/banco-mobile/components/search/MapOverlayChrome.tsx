import { FeedItem } from "@workspace/api-client-react";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Feather } from "@/components/icons";
import { SmartAssetCard } from "@/components/SmartAssetCard";
import { useColors } from "@/hooks/useColors";
import { miniAppNavClearance } from "@/components/MiniAppBottomNav";
import { useI18n } from "@/context/LanguageContext";

export type MapPreviewCardProps = {
  item: FeedItem;
  onPress?: (item: FeedItem) => void;
  onSave?: (item: FeedItem) => void;
  isSaved?: boolean;
  compact?: boolean;
};

interface MapOverlayChromeProps {
  /** How many results are actually plotted (the honest mapped count). */
  count: number;
  /**
   * Set when a search area is drawn. `exact` is false whenever a cluster falls
   * inside the shape — a cluster sits at the centroid of what it holds, so it
   * can contain listings outside the shape, and the total becomes a floor
   * rather than a count. The caption says which it is; it never rounds the
   * distinction away.
   */
  areaCount?: { total: number; exact: boolean } | null;
  /** The pin the user tapped, or null when nothing is selected. */
  selected: FeedItem | null;
  onClose: () => void;
  onOpenListing: (item: FeedItem) => void;
  onSave?: (item: FeedItem) => void;
  isSaved: (id: string) => boolean;
  /**
   * Preview card override. Defaults to SmartAssetCard; Booking & Stays passes
   * StayCard so map taps match the stay list surface.
   */
  CardComponent?: React.ComponentType<MapPreviewCardProps>;
}

/**
 * The native-RN chrome drawn on top of the map surface (shared by the WebView
 * and the web <iframe> hosts): a top-left honest "N on the map" caption and,
 * when a pin is tapped, a bottom preview card reusing the same card as the list
 * so tapping it opens the listing exactly like a list row would.
 */
export function MapOverlayChrome({
  count,
  areaCount,
  selected,
  onClose,
  onOpenListing,
  onSave,
  isSaved,
  CardComponent = SmartAssetCard,
}: MapOverlayChromeProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const closeSide = isRTL ? { left: 4 } : { right: 4 };
  const Preview = CardComponent;

  return (
    <>
      <View
        style={[
          styles.caption,
          {
            flexDirection: isRTL ? "row-reverse" : "row",
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
        pointerEvents="none"
      >
        <Feather
          // "edit-2" (a pen) not "pen-tool": the icon registry maps a curated
          // subset to lucide SVGs, and an unmapped name renders the fallback
          // warning glyph on Android. The guard catches it; taking a name the
          // registry already carries is better than widening the registry for
          // one caption.
          name={areaCount ? "edit-2" : "map-pin"}
          size={13}
          color={colors.primary}
        />
        <AppText style={[styles.captionText, { color: colors.foreground }]}>
          {/* With a shape drawn the caption reports the shape, not the screen.
              And it only says a bare number when it can prove one: a cluster
              inside the shape may hold listings outside it, so a count that
              includes one is a floor and is written as such. */}
          {areaCount
            ? t(
                areaCount.exact
                  ? "search.mapAreaCount"
                  : "search.mapAreaCountAtLeast",
                { count: areaCount.total },
              )
            : t("search.mappedResults", { count })}
        </AppText>
      </View>

      {/* The card's bottom used to be a bare 132 that happened to clear the
          bottom bar. It derives from the bar now, so the day that capsule
          changes height this moves with it instead of quietly sliding under it.
          The +59 keeps the gap that was already tuned above the bar — same
          pixels today, no magic number tomorrow. */}
      {selected ? (
        <View
          style={[
            styles.cardWrap,
            { bottom: miniAppNavClearance(insets.bottom) + 59 },
          ]}
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={[
              styles.close,
              closeSide,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            testID="map-card-close"
          >
            <Feather name="x" size={15} color={colors.foreground} />
          </Pressable>
          <Preview
            item={selected}
            onPress={onOpenListing}
            onSave={onSave}
            isSaved={isSaved(selected.id)}
            compact
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  caption: {
    position: "absolute",
    top: 12,
    left: 12,
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  captionText: { fontSize: 12, fontWeight: "600" },
  cardWrap: {
    position: "absolute",
    left: 12,
    right: 12,
  },
  close: {
    position: "absolute",
    top: -12,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
