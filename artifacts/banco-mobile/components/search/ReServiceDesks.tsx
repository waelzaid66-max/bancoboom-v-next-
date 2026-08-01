/**
 * B-PROPERTY service desks — compact quick actions inside /section/real-estate.
 *
 * STATUS (2026-07-31): Kept on disk (owner: no silent deletes). First-paint
 * chrome lives in PropertyHomeHeader (map / stays / request / offer / types).
 * Do NOT remount this wall without an explicit owner decision — Stay-parity
 * header already wires every desk action to a real criteria change or route.
 *
 * Import-hub rule, applied here: every desk must fire a REAL criteria change or
 * a REAL router.push. No brochure cards, no empty pages, no "coming soon".
 *
 * In-section desks (sale / rent / types / map / more) mutate the live mini-app
 * state so the shopper stays on one layered surface. Sibling desks push existing
 * routes (Booking & Stays, custom request).
 */
import { Feather, Ionicons } from "@/components/icons";
import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/context/LanguageContext";
import { PROPERTY_TYPES } from "@/constants/listingCreateTaxonomy";
import { sectionAccent } from "@/lib/sectionTheme";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

/** Registry-mapped Ionicons names only (see components/icons.tsx + test:icons). */
type DeskIcon = React.ComponentProps<typeof Ionicons>["name"];

const COMMERCIAL_TYPES = ["office", "shop", "warehouse", "commercial_land"] as const;

type DeskKind =
  | { kind: "offer"; engineKey: "sale" | "rent" }
  | { kind: "type"; propertyType: string }
  | { kind: "commercial" }
  | { kind: "map" }
  | { kind: "more" }
  | { kind: "href"; href: Href };

type DeskDef = {
  id: string;
  icon: DeskIcon;
  labelKey: string;
  testID: string;
  action: DeskKind;
};

const DESKS: DeskDef[] = [
  {
    id: "sale",
    icon: "home",
    labelKey: "search.discover.section.deskSale",
    testID: "re-desk-sale",
    action: { kind: "offer", engineKey: "sale" },
  },
  {
    id: "rent",
    icon: "key",
    labelKey: "search.discover.section.deskRent",
    testID: "re-desk-rent",
    action: { kind: "offer", engineKey: "rent" },
  },
  {
    id: "apartment",
    icon: "business",
    labelKey: "search.discover.section.deskApartment",
    testID: "re-desk-apartment",
    action: { kind: "type", propertyType: "apartment" },
  },
  {
    id: "villa",
    icon: "home",
    labelKey: "search.discover.section.deskVilla",
    testID: "re-desk-villa",
    action: { kind: "type", propertyType: "villa" },
  },
  {
    id: "land",
    icon: "map-outline",
    labelKey: "search.discover.section.deskLand",
    testID: "re-desk-land",
    action: { kind: "type", propertyType: "land" },
  },
  {
    id: "commercial",
    icon: "grid-outline",
    labelKey: "search.discover.section.deskCommercial",
    testID: "re-desk-commercial",
    action: { kind: "commercial" },
  },
  {
    id: "map",
    icon: "map",
    labelKey: "search.discover.section.deskMap",
    testID: "re-desk-map",
    action: { kind: "map" },
  },
  {
    id: "stays",
    icon: "calendar",
    labelKey: "search.discover.section.deskStays",
    testID: "re-desk-stays",
    action: { kind: "href", href: "/section/booking" as Href },
  },
  {
    id: "request",
    icon: "document-text-outline",
    labelKey: "search.discover.section.deskRequest",
    testID: "re-desk-request",
    action: { kind: "href", href: "/listings/create?request=1&category=real_estate" as Href },
  },
  {
    id: "more",
    icon: "settings",
    labelKey: "search.discover.section.deskMore",
    testID: "re-desk-more",
    action: { kind: "more" },
  },
];

export function ReServiceDesks({
  onSelectOffer,
  onSelectType,
  onOpenMap,
  onOpenMore,
  playSound,
}: {
  onSelectOffer: (engineKey: "sale" | "rent") => void;
  onSelectType: (propertyType: string) => void;
  onOpenMap: () => void;
  onOpenMore: () => void;
  playSound?: (name: "tap") => void;
}) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const rowDir = isRTL ? "row-reverse" : "row";
  const accent = sectionAccent("real_estate");
  const [commercialOpen, setCommercialOpen] = useState(false);

  const run = (desk: DeskDef) => {
    playSound?.("tap");
    void Haptics.selectionAsync();
    const a = desk.action;
    if (a.kind === "offer") {
      onSelectOffer(a.engineKey);
      return;
    }
    if (a.kind === "type") {
      onSelectType(a.propertyType);
      return;
    }
    if (a.kind === "commercial") {
      setCommercialOpen(true);
      return;
    }
    if (a.kind === "map") {
      onOpenMap();
      return;
    }
    if (a.kind === "more") {
      onOpenMore();
      return;
    }
    router.push(a.href);
  };

  return (
    <View testID="re-service-desks">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hScroll}
        contentContainerStyle={[styles.row, { flexDirection: rowDir }]}
      >
        {DESKS.map((desk) => (
          <Pressable
            key={desk.id}
            onPress={() => run(desk)}
            style={[styles.desk, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID={desk.testID}
            accessibilityRole="button"
            accessibilityLabel={t(desk.labelKey)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
              <Ionicons name={desk.icon} size={16} color={accent} />
            </View>
            <AppText
              style={[styles.label, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {t(desk.labelKey)}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={commercialOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCommercialOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setCommercialOpen(false)}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AppText
              style={[
                styles.sheetTitle,
                { color: colors.foreground, borderBottomColor: colors.border },
              ]}
            >
              {t("search.discover.section.deskCommercial")}
            </AppText>
            {COMMERCIAL_TYPES.map((value) => {
              const def = PROPERTY_TYPES.find((p) => p.value === value);
              const label = def ? (isRTL ? def.ar : def.en) : value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setCommercialOpen(false);
                    onSelectType(value);
                  }}
                  style={[
                    styles.sheetRow,
                    {
                      flexDirection: rowDir,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  testID={`re-desk-commercial-${value}`}
                >
                  <AppText style={[styles.sheetRowText, { color: colors.foreground }]}>
                    {label}
                  </AppText>
                  <Feather
                    name={isRTL ? "chevron-left" : "chevron-right"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hScroll: {
    flexGrow: 0,
  },
  row: {
    alignItems: "stretch",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  desk: {
    width: 72,
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetRowText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
