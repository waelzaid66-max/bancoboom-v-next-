// Import Documents — the required-paperwork checklist for a car import.
// Informational in this wave: each document explains itself; per-order upload
// plugs into the existing upload system in a later wave without changing this
// structure.
import { Feather, MaterialCommunityIcons } from "@/components/icons";
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
import { sectionAccent, sectionAccentAlpha } from "@/lib/sectionTheme";

/** Car import is the CAR world, so its accent is the CAR token — bound, never
 *  written as a literal. #E53935 was Material Design's default red: a sixth
 *  family the app never chose, sitting ΔE ≈ 19 from the logo. Owner ruling
 *  2026-08-02: colours track the identity of the app as a whole. */
const RED = sectionAccent("car");

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const DOCS: { key: string; icon: MCIName; titleKey: string; descKey: string }[] = [
  { key: "invoice", icon: "receipt", titleKey: "importDocs.invoiceTitle", descKey: "importDocs.invoiceDesc" },
  { key: "export", icon: "certificate-outline", titleKey: "importDocs.exportTitle", descKey: "importDocs.exportDesc" },
  { key: "passport", icon: "passport", titleKey: "importDocs.passportTitle", descKey: "importDocs.passportDesc" },
  { key: "id", icon: "card-account-details-outline", titleKey: "importDocs.idTitle", descKey: "importDocs.idDesc" },
  { key: "poa", icon: "file-sign", titleKey: "importDocs.poaTitle", descKey: "importDocs.poaDesc" },
  { key: "insurance", icon: "shield-check-outline", titleKey: "importDocs.insuranceTitle", descKey: "importDocs.insuranceDesc" },
  { key: "shipping", icon: "ferry", titleKey: "importDocs.shippingTitle", descKey: "importDocs.shippingDesc" },
  { key: "customs", icon: "bank-outline", titleKey: "importDocs.customsTitle", descKey: "importDocs.customsDesc" },
];

export default function ImportDocumentsScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";

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
        testID="import-docs-header"
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
          {t("importDocs.title")}
        </AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.sub, { color: colors.mutedForeground, textAlign }]}>
          {t("importDocs.subtitle")}
        </AppText>

        {DOCS.map((doc) => (
          <View
            key={doc.key}
            style={[
              styles.docCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                flexDirection: rowDir,
              },
            ]}
            testID={`import-doc-${doc.key}`}
          >
            <View style={styles.docIcon}>
              <MaterialCommunityIcons name={doc.icon} size={22} color={RED} />
            </View>
            <View style={styles.docBody}>
              <AppText style={[styles.docTitle, { color: colors.foreground, textAlign }]}>
                {t(doc.titleKey as never)}
              </AppText>
              <AppText
                style={[styles.docDesc, { color: colors.mutedForeground, textAlign }]}
              >
                {t(doc.descKey as never)}
              </AppText>
              <View style={[styles.badge, { alignSelf: isRTL ? "flex-end" : "flex-start" }]}>
                <Feather name="check-circle" size={10} color={RED} />
                <AppText style={styles.badgeText}>{t("importDocs.badge")}</AppText>
              </View>
            </View>
          </View>
        ))}
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
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60, gap: 10 },
  sub: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  docCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: sectionAccentAlpha("car", 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  docBody: { flex: 1, gap: 4 },
  docTitle: { fontSize: 14, fontFamily: "Cairo_700Bold" },
  docDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: sectionAccentAlpha("car", 0.10),
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 4,
  },
  badgeText: { color: RED, fontSize: 10.5, fontFamily: "Inter_600SemiBold" },
});
