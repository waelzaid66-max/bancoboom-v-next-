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

const RED = "#E53935";

// Mirrors import-tracking's stage strip (same icons/colors — one visual language).
const STAGES: {
  key: string;
  stage: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
}[] = [
  { key: "stageOrder", stage: "order", icon: "file-text", color: "#E53935" },
  { key: "stageReview", stage: "review", icon: "clock", color: "#F97316" },
  { key: "stageConfirm", stage: "confirm", icon: "check-circle", color: "#F59E0B" },
  { key: "stageShipping", stage: "shipping", icon: "truck", color: "#0EA5E9" },
  { key: "stageCustoms", stage: "customs", icon: "shield", color: "#8B5CF6" },
  { key: "stageDelivered", stage: "delivered", icon: "package", color: "#22C55E" },
];

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
              style={[styles.cancelledBanner, { flexDirection: rowDir }]}
              testID="import-order-cancelled"
            >
              <Feather name="x-circle" size={16} color="#9CA3AF" />
              <AppText style={styles.cancelledText}>
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
              return (
                <View key={stage.key} style={[styles.stageRow, { flexDirection: rowDir }]}>
                  <View style={styles.stageTrack}>
                    <View
                      style={[
                        styles.stageDot,
                        {
                          backgroundColor: reached ? stage.color : colors.background,
                          borderColor: reached ? stage.color : colors.border,
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
                            backgroundColor:
                              !cancelled && idx < currentIdx ? stage.color : colors.border,
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
              style={[styles.cancelBtn, { opacity: cancelling ? 0.6 : 1, flexDirection: rowDir }]}
              accessibilityRole="button"
              testID="import-order-cancel"
            >
              {cancelling ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <Feather name="x-circle" size={16} color="#EF4444" />
              )}
              <AppText style={styles.cancelBtnText}>{t("importOrder.cancelCta")}</AppText>
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
    backgroundColor: "rgba(156,163,175,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelledText: { color: "#9CA3AF", fontSize: 13, fontFamily: "Cairo_700Bold" },
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
    borderColor: "rgba(239,68,68,0.5)",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelBtnText: { color: "#EF4444", fontSize: 13.5, fontFamily: "Cairo_700Bold" },
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
