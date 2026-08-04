// Import order detail — the buyer's live view of one import_order: full stage
// timeline, quote/budget, notes, and cancel (early stages only; later stages
// route to support via the existing messenger). First consumer of the
// already-generated useGetImportOrder / useCancelImportOrder hooks.
import { Feather } from "@/components/icons";
import {
  useGetImportOrder,
  getGetImportOrderQueryKey,
  useCancelImportOrder,
  getListMyImportOrdersQueryKey,
  createSupportTicket,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { OrderDocuments } from "@/components/import/OrderDocuments";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { SECTION_GRADIENT, sectionAccent } from "@/lib/sectionTheme";

/** Car import is the CAR world, so its accent is the CAR token — bound, never
 *  written as a literal. #E53935 was Material Design's default red: a sixth
 *  family the app never chose, sitting ΔE ≈ 19 from the logo. Owner ruling
 *  2026-08-02: colours track the identity of the app as a whole. */
const RED = sectionAccent("car");

// Mirrors import-tracking's stage strip — one visual language.
const STAGES: {
  key: string;
  stage: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}[] = [
  { key: "stageOrder", stage: "order", icon: "file-text" },
  { key: "stageReview", stage: "review", icon: "clock" },
  { key: "stageConfirm", stage: "confirm", icon: "check-circle" },
  { key: "stageShipping", stage: "shipping", icon: "truck" },
  { key: "stageCustoms", stage: "customs", icon: "shield" },
  { key: "stageDelivered", stage: "delivered", icon: "package" },
];

/**
 * Progress is told by FILL, not by hue.
 *
 * Every stage used to carry its own colour: red, orange, amber, sky, violet,
 * green. Six hues on one rail, five of them outside the family sectionTheme.ts
 * locks the app to. They also carried nothing — the rail already says where the
 * order is by which dots are filled, so the hue was decoration dressed as data,
 * and it asked a buyer to learn a legend for a line they could already read.
 *
 * What replaces it is the section's own two-stop gradient, which existed
 * already and needed no new value invented:
 *      behind you   the deeper shade — done, settled
 *      right now    the flagship red — where the order actually is
 *      ahead        the border grey the rail was using anyway
 *
 * Delivered keeps its green, and earns the exception: arrival reads as green
 * everywhere, and it fires once, at the end, so it never competes with the red
 * for attention on the way there.
 */
const [STAGE_NOW, STAGE_DONE] = SECTION_GRADIENT.car;
const STAGE_DELIVERED = "#22C55E";
const DELIVERED_IDX = STAGES.length - 1;

function stageTone(idx: number, isCurrent: boolean): string {
  if (idx === DELIVERED_IDX) return STAGE_DELIVERED;
  return isCurrent ? STAGE_NOW : STAGE_DONE;
}

// Buyer-side cancel is offered only before the order is confirmed; once the
// pipeline is moving (confirm/shipping/customs) changes go through support.
const SELF_CANCEL_STAGES = new Set(["order", "review"]);
const SUPPORT_STAGES = new Set(["confirm", "shipping", "customs"]);

function fmtAmount(n: number | null | undefined, currency: string | null | undefined) {
  if (n == null) return null;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}${currency ? ` ${currency}` : ""}`;
}

export default function ImportOrderDetailScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const orderQuery = useGetImportOrder(id ?? "", {
    query: {
      queryKey: getGetImportOrderQueryKey(id ?? ""),
      enabled: !!id,
    },
  });
  const order = orderQuery.data?.data;
  const [supportBusy, setSupportBusy] = useState(false);

  const { mutate: cancelOrder, isPending: cancelling } = useCancelImportOrder({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetImportOrderQueryKey(id ?? "") });
        void queryClient.invalidateQueries({ queryKey: getListMyImportOrdersQueryKey() });
      },
      onError: () => Alert.alert(t("importOrder.cancelError")),
    },
  });

  const contactSupport = async () => {
    if (!order || supportBusy) return;
    setSupportBusy(true);
    try {
      await createSupportTicket({
        subject: `Import order ${order.id}`,
        category: "import_order",
        message: [
          `Import order support request`,
          `Order ID: ${order.id}`,
          `Stage: ${order.stage}`,
          order.origin_country ? `Origin: ${order.origin_country}` : null,
          order.destination_country ? `Destination: ${order.destination_country}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      Alert.alert(t("importOrder.supportSentTitle"), t("importOrder.supportSentBody"));
    } catch {
      Alert.alert(t("common.error"), t("importOrder.supportError"));
    } finally {
      setSupportBusy(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert(t("importOrder.cancelTitle"), t("importOrder.cancelBody"), [
      { text: t("importOrder.cancelKeep"), style: "cancel" },
      {
        text: t("importOrder.cancelConfirm"),
        style: "destructive",
        onPress: () => cancelOrder({ id: id ?? "" }),
      },
    ]);
  };

  const cancelled = order?.stage === "cancelled";
  const currentIdx = order
    ? STAGES.findIndex((s) => s.stage === order.stage)
    : -1;

  const vehicle =
    order?.details && typeof order.details === "object"
      ? String((order.details as Record<string, unknown>).vehicle ?? "") || null
      : null;

  const detailRows: { key: string; labelKey: string; value: string | null }[] = order
    ? [
        { key: "vehicle", labelKey: "importOrder.vehicle", value: vehicle },
        { key: "origin", labelKey: "importOrder.origin", value: order.origin_country ?? null },
        { key: "destination", labelKey: "importOrder.destination", value: order.destination_country ?? null },
        { key: "budget", labelKey: "importOrder.budget", value: fmtAmount(order.budget_amount, order.currency) },
        { key: "quote", labelKey: "importOrder.quote", value: fmtAmount(order.quote_amount, order.currency) },
        { key: "notes", labelKey: "importOrder.notes", value: order.notes ?? null },
        {
          key: "created",
          labelKey: "importOrder.created",
          value: order.created_at ? new Date(order.created_at).toLocaleDateString() : null,
        },
      ]
    : [];

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
        testID="import-order-header"
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
          {t("importOrder.title")}
        </AppText>
        <View style={styles.iconBtn} />
      </View>

      {orderQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={RED} />
        </View>
      ) : !order ? (
        <View style={styles.center} testID="import-order-error">
          <AppText style={[styles.errText, { color: colors.mutedForeground }]}>
            {t("importOrder.notFound")}
          </AppText>
          <Pressable
            onPress={() => orderQuery.refetch()}
            style={[styles.retryBtn, { borderColor: RED }]}
            accessibilityRole="button"
            testID="import-order-retry"
          >
            <Feather name="refresh-cw" size={14} color={RED} />
            <AppText style={{ color: RED, fontFamily: "Inter_600SemiBold" }}>
              {t("common.retry")}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Cancelled banner */}
          {cancelled && (
            <View
              style={[
                styles.cancelledBanner,
                {
                  flexDirection: rowDir,
                  backgroundColor: colors.secondary,
                },
              ]}
              testID="import-order-cancelled"
            >
              <Feather name="x-circle" size={16} color={colors.mutedForeground} />
              <AppText
                style={[styles.cancelledText, { color: colors.mutedForeground }]}
              >
                {t("importTrack.stageCancelled")}
              </AppText>
            </View>
          )}

          {/* Stage timeline — current stage highlighted, past stages solid. */}
          <AppText style={[styles.secTitle, { color: colors.foreground, textAlign }]}>
            {t("importOrder.stageTitle")}
          </AppText>
          <View
            style={[
              styles.timelineCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {STAGES.map((stage, idx) => {
              const reached = !cancelled && currentIdx >= 0 && idx <= currentIdx;
              const isCurrent = !cancelled && idx === currentIdx;
              const dim = colors.mutedForeground;
              const tone = stageTone(idx, isCurrent);
              return (
                <View key={stage.key} style={[styles.stageRow, { flexDirection: rowDir }]}>
                  <View style={styles.stageTrack}>
                    <View
                      style={[
                        styles.stageDot,
                        {
                          backgroundColor: reached ? tone : colors.background,
                          borderColor: reached ? tone : colors.border,
                          borderWidth: reached ? 0 : 1,
                        },
                      ]}
                    >
                      <Feather
                        name={stage.icon}
                        size={13}
                        color={reached ? "#FFFFFF" : dim}
                      />
                    </View>
                    {idx < STAGES.length - 1 && (
                      <View
                        style={[
                          styles.stageLine,
                          {
                            // The segment BETWEEN two dots is travelled ground,
                            // so it always takes the settled shade — never the
                            // "right now" red, which belongs to one dot only.
                            backgroundColor:
                              !cancelled && idx < currentIdx ? STAGE_DONE : colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.stageLabelWrap}>
                    <AppText
                      style={[
                        styles.stageLabel,
                        {
                          color: reached ? colors.foreground : dim,
                          fontFamily: isCurrent ? "Cairo_700Bold" : "Cairo_600SemiBold",
                        },
                      ]}
                    >
                      {t(`importTrack.${stage.key}` as never)}
                      {isCurrent ? "  ●" : ""}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Details */}
          <AppText style={[styles.secTitle, { color: colors.foreground, textAlign }]}>
            {t("importOrder.detailsTitle")}
          </AppText>
          <View
            style={[
              styles.detailsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {detailRows
              .filter((r) => r.value)
              .map((row) => (
                <View key={row.key} style={[styles.detailRow, { flexDirection: rowDir }]}>
                  <AppText
                    style={[styles.detailLabel, { color: colors.mutedForeground, textAlign }]}
                  >
                    {t(row.labelKey as never)}
                  </AppText>
                  <AppText
                    style={[styles.detailValue, { color: colors.foreground, textAlign }]}
                  >
                    {row.value}
                  </AppText>
                </View>
              ))}
          </View>

          {/* Paperwork — attach photos of the checklist documents (wave 3).
              Terminal orders show what was uploaded, read-only. */}
          <OrderDocuments
            orderId={order.id}
            readOnly={cancelled || order.stage === "delivered"}
          />

          {/* Actions */}
          {!cancelled && SELF_CANCEL_STAGES.has(order.stage) && (
            <Pressable
              onPress={confirmCancel}
              disabled={cancelling}
              style={[
                styles.cancelBtn,
                {
                  opacity: cancelling ? 0.6 : 1,
                  flexDirection: rowDir,
                  // Destructive is a THEME role, not a colour to type out. It
                  // was rgba(239,68,68,0.5) — Tailwind's red, unrelated to the
                  // app's — and it slipped past a hex-only guard.
                  borderColor: colors.destructive,
                },
              ]}
              accessibilityRole="button"
              testID="import-order-cancel"
            >
              {cancelling ? (
                <ActivityIndicator color={colors.destructive} size="small" />
              ) : (
                <Feather name="x-circle" size={16} color={colors.destructive} />
              )}
              <AppText
                style={[styles.cancelBtnText, { color: colors.destructive }]}
              >
                {t("importOrder.cancelCta")}
              </AppText>
            </Pressable>
          )}
          {!cancelled && SUPPORT_STAGES.has(order.stage) && (
            <View>
              <AppText
                style={[styles.supportHint, { color: colors.mutedForeground, textAlign }]}
              >
                {t("importOrder.supportHint")}
              </AppText>
              <Pressable
                onPress={() => void contactSupport()}
                disabled={supportBusy}
                style={[
                  styles.supportBtn,
                  {
                    borderColor: colors.border,
                    flexDirection: rowDir,
                    opacity: supportBusy ? 0.6 : 1,
                  },
                ]}
                accessibilityRole="button"
                testID="import-order-support"
              >
                {supportBusy ? (
                  <ActivityIndicator color={colors.foreground} size="small" />
                ) : (
                  <Feather name="message-circle" size={16} color={colors.foreground} />
                )}
                <AppText style={[styles.supportBtnText, { color: colors.foreground }]}>
                  {t("importOrder.supportCta")}
                </AppText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  errText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60, gap: 10 },
  cancelledBanner: {
    alignItems: "center",
    gap: 8,
    // Tint comes from the theme at the call site — a StyleSheet cannot read the
    // hook, and hard-coding it is how rgba(156,163,175,…) got in and then slid
    // past a guard that only knew how to read hex.
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  // Colour comes from the theme at the call site — a StyleSheet cannot read the
  // hook, and hard-coding it here is how #9CA3AF and #EF4444 got in.
  cancelledText: { fontSize: 13, fontFamily: "Cairo_700Bold" },
  secTitle: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
    marginTop: 6,
  },
  timelineCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stageRow: { alignItems: "flex-start", paddingVertical: 2 },
  stageTrack: { alignItems: "center", width: 32 },
  stageDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stageLine: { width: 2, height: 20, marginTop: 2 },
  stageLabelWrap: { flex: 1, paddingHorizontal: 12, paddingTop: 5 },
  stageLabel: { fontSize: 13.5 },
  detailsCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  detailRow: { justifyContent: "space-between", gap: 10 },
  detailLabel: { fontSize: 12.5, fontFamily: "Inter_400Regular", flexShrink: 0 },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelBtnText: { fontSize: 13.5, fontFamily: "Cairo_700Bold" },
  supportHint: {
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  supportBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 12,
  },
  supportBtnText: { fontSize: 13.5, fontFamily: "Cairo_700Bold" },
});
