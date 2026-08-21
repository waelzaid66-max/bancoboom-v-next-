import { AppText } from "@/components/AppText";
import { Feather } from "@/components/icons";
import { MarketCountryButton } from "@/components/MarketCountryPicker";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { SECTION_NEUTRAL, sectionAccent } from "@/lib/sectionTheme";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

export type CarDockEngine = {
  key: string;
  i18nKey: string;
};

type SortKey = "recommended" | "newest" | "price_asc" | "price_desc" | "nearest";
type ListingMode = "all" | "sale" | "buy";
type OriginKey = "all" | "local" | "imported";

type Props = {
  marketCountry: string;
  sort: SortKey;
  listingMode: ListingMode;
  engines: CarDockEngine[];
  activeEngineKey: string;
  brandLabel: string;
  brandActive: boolean;
  origin: OriginKey;
  onOpenMarket: () => void;
  onCycleSort: () => void;
  onSelectListingMode: (mode: ListingMode) => void;
  onSelectEngine: (key: string) => void;
  onOpenBrand: () => void;
  onSelectOrigin: (origin: OriginKey) => void;
};

const ACCENT = sectionAccent("car");
const SURFACE = SECTION_NEUTRAL.surface;
const HAIRLINE = SECTION_NEUTRAL.hairline;

const ENGINE_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  all: "grid",
  new: "star",
  used: "refresh-cw",
  import: "globe",
  imported: "globe",
  bank: "briefcase",
  islamic: "shield",
  installment: "credit-card",
  cash: "dollar-sign",
  electric: "zap",
};

const SORT_ICONS: Record<SortKey, React.ComponentProps<typeof Feather>["name"]> = {
  recommended: "sliders",
  newest: "clock",
  price_asc: "trending-up",
  price_desc: "trending-down",
  nearest: "navigation",
};

export function CarBrowseAxes({
  marketCountry,
  sort,
  listingMode,
  engines,
  activeEngineKey,
  brandLabel,
  brandActive,
  origin,
  onOpenMarket,
  onCycleSort,
  onSelectListingMode,
  onSelectEngine,
  onOpenBrand,
  onSelectOrigin,
}: Props) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const rowDir = isRTL ? "row-reverse" : "row";

  const press = (action: () => void) => {
    void Haptics.selectionAsync();
    action();
  };

  return (
    <View style={styles.root} testID="cars-host-axes">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.row, { flexDirection: rowDir }]}
        testID="section-primary-strip"
      >
        <View style={styles.marketWrap}>
          <MarketCountryButton selected={marketCountry} onPress={onOpenMarket} />
        </View>

        <Pressable
          onPress={() => press(onCycleSort)}
          style={[
            styles.iconPill,
            {
              flexDirection: rowDir,
              backgroundColor: sort === "recommended" ? SURFACE : `${ACCENT}24`,
              borderColor: sort === "recommended" ? HAIRLINE : ACCENT,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t(`search.sortOptions.${sort}`)}
          testID="section-sort-cycle"
        >
          <Feather
            name={SORT_ICONS[sort]}
            size={15}
            color={sort === "recommended" ? colors.mutedForeground : ACCENT}
          />
          <AppText
            style={[
              styles.compactLabel,
              { color: sort === "recommended" ? colors.foreground : ACCENT },
            ]}
            numberOfLines={1}
          >
            {t(`search.sortOptions.${sort}`)}
          </AppText>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: HAIRLINE }]} />

        <View style={[styles.listingPill, { flexDirection: rowDir }]} testID="section-listing-mode">
          {(["all", "sale", "buy"] as const).map((mode) => {
            const active = listingMode === mode;
            const label =
              mode === "all"
                ? t("search.listingModeAll")
                : mode === "sale"
                  ? t("search.listingModeSale")
                  : t("search.listingModeBuy");
            const icon: React.ComponentProps<typeof Feather>["name"] =
              mode === "all" ? "layers" : mode === "sale" ? "tag" : "search";
            return (
              <Pressable
                key={mode}
                onPress={() => press(() => onSelectListingMode(mode))}
                style={[styles.listingSegment, active && styles.listingSegmentActive]}
                testID={`section-listing-mode-${mode}`}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Feather
                  name={icon}
                  size={13}
                  color={active ? "#FFFFFF" : colors.mutedForeground}
                />
                <AppText
                  style={[styles.segmentText, { color: active ? "#FFFFFF" : colors.foreground }]}
                  numberOfLines={1}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {engines.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={[styles.row, styles.secondaryRow, { flexDirection: rowDir }]}
          testID="section-engine-strip"
        >
          {engines.map((engine) => {
            const active = activeEngineKey === engine.key;
            const label = t(engine.i18nKey);
            return (
              <Pressable
                key={engine.key}
                onPress={() => press(() => onSelectEngine(engine.key))}
                style={[
                  styles.engineChip,
                  {
                    flexDirection: rowDir,
                    backgroundColor: active ? ACCENT : SURFACE,
                    borderColor: active ? ACCENT : HAIRLINE,
                  },
                ]}
                testID={`engine-${engine.key}`}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Feather
                  name={ENGINE_ICONS[engine.key] ?? "circle"}
                  size={14}
                  color={active ? "#FFFFFF" : colors.mutedForeground}
                />
                <AppText
                  style={[styles.chipText, { color: active ? "#FFFFFF" : colors.foreground }]}
                  numberOfLines={1}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.row, styles.secondaryRow, { flexDirection: rowDir }]}
        testID="car-brand-origin-strip"
      >
        <View testID="car-brand-strip">
          <Pressable
            onPress={() => press(onOpenBrand)}
            style={[
              styles.brandChip,
              {
                flexDirection: rowDir,
                backgroundColor: brandActive ? `${ACCENT}24` : SURFACE,
                borderColor: brandActive ? ACCENT : HAIRLINE,
              },
            ]}
            testID="car-brand-btn"
            accessibilityRole="button"
            accessibilityLabel={brandLabel}
          >
            <Feather name="grid" size={15} color={brandActive ? ACCENT : colors.foreground} />
            <AppText
              style={[styles.brandText, { color: brandActive ? ACCENT : colors.foreground }]}
              numberOfLines={1}
            >
              {brandLabel}
            </AppText>
            <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: HAIRLINE }]} />

        <View style={[styles.originCluster, { flexDirection: rowDir }]} testID="car-origin-strip">
          {(["all", "local", "imported"] as const).map((value) => {
            const active = origin === value;
            const label = value === "all" ? t("home.engines.all") : t(`create.opts.${value}`);
            const icon: React.ComponentProps<typeof Feather>["name"] =
              value === "local" ? "map-pin" : value === "imported" ? "globe" : "compass";
            return (
              <Pressable
                key={value}
                onPress={() => press(() => onSelectOrigin(value))}
                style={[
                  styles.originChip,
                  {
                    flexDirection: rowDir,
                    backgroundColor: active ? ACCENT : SURFACE,
                    borderColor: active ? ACCENT : HAIRLINE,
                  },
                ]}
                testID={`car-origin-${value}`}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Feather
                  name={icon}
                  size={13}
                  color={active ? "#FFFFFF" : colors.mutedForeground}
                />
                <AppText
                  style={[styles.chipText, { color: active ? "#FFFFFF" : colors.foreground }]}
                  numberOfLines={1}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 0,
    gap: 5,
    paddingTop: 2,
    paddingBottom: 3,
  },
  scroll: {
    flexGrow: 0,
    maxWidth: "100%",
  },
  row: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  secondaryRow: {
    paddingTop: 1,
  },
  marketWrap: {
    flexShrink: 0,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    opacity: 0.65,
    marginHorizontal: 1,
  },
  iconPill: {
    minHeight: 34,
    maxWidth: 154,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
  },
  compactLabel: {
    maxWidth: 108,
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
  },
  listingPill: {
    minHeight: 34,
    alignItems: "center",
    padding: 2,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    overflow: "hidden",
  },
  listingSegment: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  listingSegmentActive: {
    backgroundColor: ACCENT,
  },
  segmentText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  engineChip: {
    minHeight: 32,
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
  },
  brandChip: {
    minHeight: 34,
    maxWidth: 170,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandText: {
    maxWidth: 112,
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
  },
  originCluster: {
    alignItems: "center",
    gap: 6,
  },
  originChip: {
    minHeight: 32,
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
