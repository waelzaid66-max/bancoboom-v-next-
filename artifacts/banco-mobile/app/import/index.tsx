// CAR IMPORT mini-app hub — the front door of the import system.
// Same philosophy as the other section mini-apps: pushed ABOVE (tabs) with the
// standard back header + MiniAppBottomNav mirror. Reuses the existing
// import_orders API, theme tokens and i18n. No new navigation shells.
import { Feather, MaterialCommunityIcons } from "@/components/icons";
import {
  useListMyImportOrders,
  getListMyImportOrdersQueryKey,
  createSupportTicket,
} from "@workspace/api-client-react";
import { useUser } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { MiniAppBottomNav } from "@/components/MiniAppBottomNav";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

import { SOURCES as AUCTION_SOURCES } from "./auctions";

const RED = "#E53935";

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// The 9-card service grid. Every destination is a REAL screen today — no dead
// taps, no empty pages. Track resolves dynamically to the latest active order.
const SERVICES: {
  key: string;
  icon: MCIName;
  titleKey: string;
  subKey: string;
  href: Href | "track" | "myImports" | "support";
  testID: string;
}[] = [
  {
    key: "search",
    icon: "car-search-outline",
    titleKey: "importHub.searchCars",
    subKey: "importHub.searchCarsSub",
    href: "/section/car?engine=import" as Href,
    testID: "import-hub-search",
  },
  {
    key: "marketplaces",
    icon: "gavel",
    titleKey: "importHub.marketplaces",
    subKey: "importHub.marketplacesSub",
    href: "/import/auctions" as Href,
    testID: "import-hub-auctions",
  },
  {
    key: "shipping",
    icon: "ferry",
    titleKey: "importHub.shippingCost",
    subKey: "importHub.shippingCostSub",
    href: "/import/calculator?focus=shipping" as Href,
    testID: "import-hub-shipping",
  },
  {
    key: "process",
    icon: "map-marker-path",
    titleKey: "importHub.process",
    subKey: "importHub.processSub",
    href: "/import-tracking" as Href,
    testID: "import-hub-process",
  },
  {
    key: "documents",
    icon: "file-document-multiple-outline",
    titleKey: "importHub.documents",
    subKey: "importHub.documentsSub",
    href: "/import/documents" as Href,
    testID: "import-hub-documents",
  },
  {
    key: "customs",
    icon: "bank-outline",
    titleKey: "importHub.customsTaxes",
    subKey: "importHub.customsTaxesSub",
    href: "/import/calculator?focus=customs" as Href,
    testID: "import-hub-customs",
  },
  {
    key: "track",
    icon: "map-marker-radius-outline",
    titleKey: "importHub.track",
    subKey: "importHub.trackSub",
    href: "track",
    testID: "import-hub-track",
  },
  {
    key: "myImports",
    icon: "car-multiple",
    titleKey: "importHub.myImports",
    subKey: "importHub.myImportsSub",
    href: "myImports",
    testID: "import-hub-my-imports",
  },
  {
    key: "support",
    icon: "headset",
    titleKey: "importHub.support",
    subKey: "importHub.supportSub",
    href: "support",
    testID: "import-hub-support",
  },
];

const ACTIVE_STAGES = new Set(["order", "review", "confirm", "shipping", "customs"]);

export default function CarImportHubScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";
  const { user } = useUser();
  const [supportBusy, setSupportBusy] = useState(false);

  const ordersQuery = useListMyImportOrders({
    query: {
      queryKey: getListMyImportOrdersQueryKey(),
      enabled: !!user,
      staleTime: 30_000,
    },
  });
  const orders = ordersQuery.data?.data ?? [];
  const activeCount = orders.filter((o) => ACTIVE_STAGES.has(o.stage)).length;
  // Track Shipment: jump straight into the most advanced in-transit order when
  // one exists; otherwise land on the tracking guide.
  const trackTarget: Href = React.useMemo(() => {
    const inTransit =
      orders.find((o) => o.stage === "customs") ??
      orders.find((o) => o.stage === "shipping") ??
      orders.find((o) => ACTIVE_STAGES.has(o.stage));
    return inTransit
      ? ({ pathname: "/import/order/[id]", params: { id: inTransit.id } } as Href)
      : ("/import-tracking" as Href);
  }, [orders]);

  const go = (href: Href) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push(href);
  };

  const contactSupport = async () => {
    if (supportBusy) return;
    if (!user) {
      go("/(tabs)/profile" as Href);
      return;
    }
    setSupportBusy(true);
    try {
      if (Platform.OS !== "web") Haptics.selectionAsync();
      await createSupportTicket({
        subject: "BANCO car import support",
        category: "import",
        message:
          "Car import hub support request — please follow up with the buyer on their import journey.",
      });
      Alert.alert(t("importOrder.supportSentTitle"), t("importOrder.supportSentBodyHub"));
    } catch {
      Alert.alert(t("common.error"), t("importOrder.supportError"));
    } finally {
      setSupportBusy(false);
    }
  };

  /**
   * Capability strip — what this hub DOES. A number may sit here only when
   * something in the repo can be counted to produce it.
   *
   * Both "8+" auctions and "21" countries were typed by hand. The auction list
   * is exactly eight entries long, so that count now reads the list it
   * describes and can never drift from it; the "+" was the part that lied. No
   * list of twenty-one countries exists anywhere, so that row drops its value
   * and reads as the capability it always was — the three rows under it never
   * carried a number either. A real count can take the `value` slot the day an
   * endpoint can prove it.
   */
  const stats: { key: string; labelKey: string; value?: string }[] = [
    {
      key: "auctions",
      labelKey: "importHub.statAuctions",
      value: String(AUCTION_SOURCES.length),
    },
    { key: "countries", labelKey: "importHub.statCountries" },
    { key: "shipping", labelKey: "importHub.statShipping" },
    { key: "customs", labelKey: "importHub.statCustoms" },
    { key: "tracking", labelKey: "importHub.statTracking" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Standard mini-app back header — the global header/tabs stay untouched. */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
            flexDirection: rowDir,
          },
        ]}
        testID="import-hub-header"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        <AppText style={[styles.headerTitle, { color: colors.foreground }]}>
          {t("importHub.title")}
        </AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!user && ordersQuery.isRefetching}
            onRefresh={() => {
              void ordersQuery.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {/* Hero — section-scoped identity card (BANCO dark + red accent). */}
        <View style={styles.heroWrap} testID="import-hub-hero">
          <LinearGradient
            colors={["#1A0A0C", "#2A0E12", "#151518"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={[styles.heroTitleRow, { flexDirection: rowDir }]}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="car-sports" size={22} color="#FFFFFF" />
              </View>
              <AppText style={styles.heroTitle}>{t("importHub.title")}</AppText>
            </View>
            <AppText style={[styles.heroSub, { textAlign }]}>
              {t("importHub.heroSubtitle")}
            </AppText>
            <View style={[styles.statsRow, { flexDirection: rowDir }]}>
              {stats.map((s) => (
                <View key={s.key} style={styles.statChip}>
                  {s.value ? (
                    <AppText style={styles.statValue}>{s.value}</AppText>
                  ) : (
                    <Feather name="check" size={12} color={RED} />
                  )}
                  <AppText style={styles.statLabel}>{t(s.labelKey as never)}</AppText>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Services grid — 3 columns of animated glass cards, mockup-faithful. */}
        <View style={[styles.grid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          {SERVICES.map((svc) => {
            const isMyImports = svc.href === "myImports";
            const isSupport = svc.href === "support";
            const target: Href | null = isSupport
              ? null
              : svc.href === "track"
                ? trackTarget
                : isMyImports
                  ? ("/import-tracking" as Href)
                  : (svc.href as Href);
            return (
              <Pressable
                key={svc.key}
                onPress={() => {
                  if (isSupport) void contactSupport();
                  else if (target) go(target);
                }}
                disabled={isSupport && supportBusy}
                accessibilityRole="button"
                accessibilityLabel={t(svc.titleKey as never)}
                testID={svc.testID}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: pressed || (isSupport && supportBusy) ? 0.9 : 1,
                  },
                ]}
              >
                <View style={styles.cardIconWrap}>
                  <MaterialCommunityIcons name={svc.icon} size={22} color={RED} />
                  {isMyImports && activeCount > 0 ? (
                    <View style={[styles.cardBadge, { backgroundColor: RED }]}>
                      <AppText style={styles.cardBadgeText}>
                        {activeCount > 9 ? "9+" : String(activeCount)}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText
                  numberOfLines={2}
                  style={[styles.cardTitle, { color: colors.foreground }]}
                >
                  {t(svc.titleKey as never)}
                </AppText>
                <AppText
                  numberOfLines={2}
                  style={[styles.cardSub, { color: colors.mutedForeground }]}
                >
                  {t(svc.subKey as never)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Import Calculator banner — mockup-faithful wide card. */}
        <Pressable
          onPress={() => go("/import/calculator" as Href)}
          accessibilityRole="button"
          accessibilityLabel={t("importHub.calcBannerTitle")}
          testID="import-hub-calculator"
          style={({ pressed }) => [
            styles.banner,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              flexDirection: rowDir,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}
        >
          <View style={styles.bannerIcon}>
            <MaterialCommunityIcons name="calculator-variant-outline" size={24} color={RED} />
          </View>
          <View style={styles.bannerBody}>
            <AppText style={[styles.bannerTitle, { color: colors.foreground, textAlign }]}>
              {t("importHub.calcBannerTitle")}
            </AppText>
            <AppText
              numberOfLines={2}
              style={[styles.bannerSub, { color: colors.mutedForeground, textAlign }]}
            >
              {t("importHub.calcBannerSub")}
            </AppText>
            <View style={[styles.bannerCta, { flexDirection: rowDir }]}>
              <AppText style={styles.bannerCtaText}>{t("importHub.calcBannerCta")}</AppText>
              <Feather
                name={isRTL ? "arrow-left" : "arrow-right"}
                size={14}
                color="#FFFFFF"
              />
            </View>
          </View>
        </Pressable>

        {/* Start New Import — the one full-width primary action of the hub. */}
        <Pressable
          onPress={() => go("/import/request" as Href)}
          accessibilityRole="button"
          accessibilityLabel={t("importHub.startNewImport")}
          testID="import-hub-start"
          style={({ pressed }) => [
            styles.startCta,
            { flexDirection: rowDir, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="car-arrow-right" size={20} color="#FFFFFF" />
          <AppText style={styles.startCtaText}>{t("importHub.startNewImport")}</AppText>
          <Feather
            name={isRTL ? "arrow-left" : "arrow-right"}
            size={18}
            color="#FFFFFF"
          />
        </Pressable>
      </ScrollView>

      {/* Same five app tabs, mirrored above the pushed stack — never a 6th tab. */}
      <MiniAppBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    // Clears the floating MiniAppBottomNav capsule.
    paddingBottom: 132,
    gap: 14,
  },
  heroWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  heroGradient: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  heroTitleRow: {
    alignItems: "center",
    gap: 10,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(229,57,53,0.22)",
    borderWidth: 1,
    borderColor: "rgba(229,57,53,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Cairo_700Bold",
  },
  heroSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  statsRow: {
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statValue: {
    color: RED,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
  },
  grid: {
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    // 3 columns: 30% basis leaves room for the two 10px gaps at 390pt width
    // (31.5% overflowed and collapsed the grid to 2 columns — verified visually).
    flexBasis: "30%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
    minHeight: 108,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(229,57,53,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cardBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  cardTitle: {
    fontSize: 12.5,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  cardSub: {
    fontSize: 10.5,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 14,
  },
  banner: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(229,57,53,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerBody: { flex: 1, gap: 4 },
  bannerTitle: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  bannerCta: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    backgroundColor: RED,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 4,
  },
  bannerCtaText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontFamily: "Cairo_700Bold",
  },
  startCta: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 15,
  },
  startCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
  },
});
