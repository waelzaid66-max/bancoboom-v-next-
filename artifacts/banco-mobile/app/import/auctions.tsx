// Global Auctions — the sources BANCO's import specialists work with.
// Per spec: NO live integration yet; this screen is the architecture-ready
// surface (source cards + regions + request CTA). Real per-source APIs plug in
// later without changing this structure.
import { Feather, MaterialCommunityIcons } from "@/components/icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const RED = "#E53935";

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Brand names stay literal (not translated); regions/types are i18n keys.
/** The sources our specialists actually work with. Exported because the hub
 *  counts them — a count on screen has to come from the list it counts, never
 *  from a number typed next to it. */
export const SOURCES: {
  key: string;
  name: string;
  regionKey: string;
  typeKey: "importAuctions.typeAuction" | "importAuctions.typeDealer";
  icon: MCIName;
}[] = [
  { key: "copart", name: "Copart", regionKey: "importAuctions.regionUS", typeKey: "importAuctions.typeAuction", icon: "gavel" },
  { key: "iaai", name: "IAAI", regionKey: "importAuctions.regionUS", typeKey: "importAuctions.typeAuction", icon: "gavel" },
  { key: "manheim", name: "Manheim", regionKey: "importAuctions.regionUS", typeKey: "importAuctions.typeDealer", icon: "car-multiple" },
  { key: "uss", name: "USS Japan", regionKey: "importAuctions.regionJP", typeKey: "importAuctions.typeAuction", icon: "gavel" },
  { key: "korea", name: "Korea Auto", regionKey: "importAuctions.regionKR", typeKey: "importAuctions.typeDealer", icon: "car-multiple" },
  { key: "europe", name: "Europe", regionKey: "importAuctions.regionEU", typeKey: "importAuctions.typeDealer", icon: "car-multiple" },
  { key: "china", name: "China", regionKey: "importAuctions.regionCN", typeKey: "importAuctions.typeDealer", icon: "car-multiple" },
  { key: "dubai", name: "Dubai", regionKey: "importAuctions.regionAE", typeKey: "importAuctions.typeDealer", icon: "car-multiple" },
];

export default function ImportAuctionsScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";

  const requestFrom = (sourceName: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    // Pre-fill the request form with the chosen source as origin context.
    router.push({ pathname: "/import/request", params: { source: sourceName } } as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            borderBottomColor: colors.border,
            flexDirection: rowDir,
          },
        ]}
        testID="import-auctions-header"
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
          {t("importAuctions.title")}
        </AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.sub, { color: colors.mutedForeground, textAlign }]}>
          {t("importAuctions.subtitle")}
        </AppText>

        <View style={[styles.grid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          {SOURCES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => requestFrom(s.name)}
              accessibilityRole="button"
              accessibilityLabel={`${s.name} — ${t("importAuctions.requestCta")}`}
              testID={`import-auction-${s.key}`}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons name={s.icon} size={22} color={RED} />
              </View>
              <AppText
                numberOfLines={1}
                style={[styles.cardName, { color: colors.foreground }]}
              >
                {s.name}
              </AppText>
              <AppText
                numberOfLines={1}
                style={[styles.cardRegion, { color: colors.mutedForeground }]}
              >
                {t(s.regionKey as never)} · {t(s.typeKey as never)}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 },
  sub: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 14,
  },
  grid: { flexWrap: "wrap", gap: 10 },
  card: {
    flexBasis: "47.5%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(229,57,53,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 14.5, fontFamily: "Cairo_700Bold" },
  cardRegion: { fontSize: 11.5, fontFamily: "Inter_400Regular" },
});
