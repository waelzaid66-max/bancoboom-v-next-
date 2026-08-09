// Order paperwork — the buyer attaches photos of the checklist documents
// (invoice, passport, POA, …) to one import order. Reuses the shared
// presigned-URL upload flow (lib/upload) and the fullscreen viewer; the API
// records only the servable URL + kind. Read-only once the order is terminal.
import { Feather, MaterialCommunityIcons } from "@/components/icons";
import {
  useListImportOrderDocuments,
  getListImportOrderDocumentsQueryKey,
  useAttachImportOrderDocument,
  useDeleteImportOrderDocument,
  type ImportOrderDocument,
  type ImportDocumentKind,
  type MediaItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useAuthenticatedMediaHeaders } from "@/hooks/useAuthenticatedMedia";
import { authenticatedMediaSource } from "@/lib/mediaPolicy";
import { sectionAccent } from "@/lib/sectionTheme";
import { uploadMediaAsset } from "@/lib/upload";

/** Car import is the CAR world, so its accent is the CAR token — bound, never
 *  written as a literal. #E53935 was Material Design's default red: a sixth
 *  family the app never chose, sitting ΔE ≈ 19 from the logo. Owner ruling
 *  2026-08-02: colours track the identity of the app as a whole. */
const RED = sectionAccent("car");

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Same kinds + icons as the Import Documents checklist screen — one vocabulary.
const KINDS: { kind: ImportDocumentKind; icon: MCIName; titleKey: string }[] = [
  { kind: "invoice", icon: "receipt", titleKey: "importDocs.invoiceTitle" },
  { kind: "export", icon: "certificate-outline", titleKey: "importDocs.exportTitle" },
  { kind: "passport", icon: "passport", titleKey: "importDocs.passportTitle" },
  { kind: "id", icon: "card-account-details-outline", titleKey: "importDocs.idTitle" },
  { kind: "poa", icon: "file-sign", titleKey: "importDocs.poaTitle" },
  { kind: "insurance", icon: "shield-check-outline", titleKey: "importDocs.insuranceTitle" },
  { kind: "shipping", icon: "ferry", titleKey: "importDocs.shippingTitle" },
  { kind: "customs", icon: "bank-outline", titleKey: "importDocs.customsTitle" },
];

const KIND_META = new Map(KINDS.map((k) => [k.kind, k]));

export function OrderDocuments({
  orderId,
  readOnly,
}: {
  orderId: string;
  /** Terminal orders (delivered/cancelled) are read-only. */
  readOnly: boolean;
}) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";
  const queryClient = useQueryClient();
  const requestHeaders = useAuthenticatedMediaHeaders();

  // Which kind is mid-upload (drives the chip spinner); null when idle.
  const [uploadingKind, setUploadingKind] = useState<ImportDocumentKind | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const docsQuery = useListImportOrderDocuments(orderId, {
    query: {
      queryKey: getListImportOrderDocumentsQueryKey(orderId),
      enabled: !!orderId,
    },
  });
  const docs: ImportOrderDocument[] = docsQuery.data?.data ?? [];

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: getListImportOrderDocumentsQueryKey(orderId),
    });

  const { mutate: attachDoc } = useAttachImportOrderDocument({
    mutation: {
      onSuccess: invalidate,
      onError: () => Alert.alert(t("importOrder.docsUploadError")),
      onSettled: () => setUploadingKind(null),
    },
  });

  const { mutate: deleteDoc, isPending: deleting } = useDeleteImportOrderDocument({
    mutation: {
      onSuccess: invalidate,
      onError: () => Alert.alert(t("importOrder.docsDeleteError")),
    },
  });

  // Pick a photo of the document, push it through the shared upload flow, then
  // record the servable URL under the tapped kind.
  const handleAddKind = async (kind: ImportDocumentKind) => {
    if (uploadingKind) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("importOrder.docsPermTitle"), t("importOrder.docsPermBody"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setUploadingKind(kind);
      const { url } = await uploadMediaAsset(result.assets[0]);
      attachDoc({ id: orderId, data: { kind, url } });
    } catch {
      setUploadingKind(null);
      Alert.alert(t("importOrder.docsUploadError"));
    }
  };

  const confirmDelete = (doc: ImportOrderDocument) => {
    Alert.alert(t("importOrder.docsDeleteTitle"), t("importOrder.docsDeleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("importOrder.docsDeleteConfirm"),
        style: "destructive",
        onPress: () => deleteDoc({ id: orderId, documentId: doc.id }),
      },
    ]);
  };

  // Fullscreen viewer reuses the shared MediaItem-based component.
  const viewerMedia: MediaItem[] = docs.map((d) => ({
    id: d.id,
    type: "image",
    url: d.url,
    is_thumbnail: false,
  }));

  return (
    <View testID="import-order-documents">
      <AppText style={[styles.secTitle, { color: colors.foreground, textAlign }]}>
        {t("importOrder.docsTitle")}
        {docs.length > 0 ? `  (${docs.length})` : ""}
      </AppText>

      <View
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {docsQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={RED} size="small" />
          </View>
        ) : docsQuery.isError ? (
          <View style={styles.errorBlock} testID="import-order-docs-error">
            <AppText
              style={[styles.emptyText, { color: colors.mutedForeground, textAlign }]}
            >
              {t("importOrder.docsLoadError")}
            </AppText>
            <Pressable
              onPress={() => void docsQuery.refetch()}
              accessibilityRole="button"
              testID="import-order-docs-retry"
              style={styles.retryBtn}
            >
              <AppText style={{ color: RED, fontWeight: "600" }}>
                {t("common.retry")}
              </AppText>
            </Pressable>
          </View>
        ) : docs.length === 0 ? (
          <AppText
            style={[styles.emptyText, { color: colors.mutedForeground, textAlign }]}
            testID="import-order-docs-empty"
          >
            {readOnly ? t("importOrder.docsNone") : t("importOrder.docsEmpty")}
          </AppText>
        ) : (
          docs.map((doc, idx) => {
            const meta = KIND_META.get(doc.kind);
            return (
              <Pressable
                key={doc.id}
                onPress={() => setViewerIndex(idx)}
                style={[styles.docRow, { flexDirection: rowDir }]}
                accessibilityRole="button"
                testID={`import-order-doc-${doc.id}`}
              >
                <Image
                  source={authenticatedMediaSource(doc.url, requestHeaders)}
                  style={[styles.thumb, { borderColor: colors.border }]}
                  contentFit="cover"
                />
                <View style={styles.docBody}>
                  <View style={[styles.docTitleRow, { flexDirection: rowDir }]}>
                    <MaterialCommunityIcons
                      name={meta?.icon ?? "file-outline"}
                      size={14}
                      color={RED}
                    />
                    <AppText
                      numberOfLines={1}
                      style={[styles.docTitle, { color: colors.foreground, textAlign }]}
                    >
                      {meta ? t(meta.titleKey as never) : doc.kind}
                    </AppText>
                  </View>
                  <AppText style={[styles.docDate, { color: colors.mutedForeground, textAlign }]}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </AppText>
                </View>
                {!readOnly && (
                  <Pressable
                    onPress={() => confirmDelete(doc)}
                    disabled={deleting}
                    hitSlop={10}
                    style={styles.trashBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("importOrder.docsDeleteConfirm")}
                    testID={`import-order-doc-delete-${doc.id}`}
                  >
                    <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </Pressable>
            );
          })
        )}

        {/* Add-a-document chips — one per checklist kind. */}
        {!readOnly && (
          <View>
            <AppText
              style={[styles.addHint, { color: colors.mutedForeground, textAlign }]}
            >
              {t("importOrder.docsAddHint")}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.chipsRow,
                { flexDirection: rowDir },
              ]}
            >
              {KINDS.map((k) => {
                const busy = uploadingKind === k.kind;
                return (
                  <Pressable
                    key={k.kind}
                    onPress={() => void handleAddKind(k.kind)}
                    disabled={uploadingKind != null}
                    style={[
                      styles.chip,
                      {
                        borderColor: busy ? RED : colors.border,
                        opacity: uploadingKind && !busy ? 0.5 : 1,
                        flexDirection: rowDir,
                      },
                    ]}
                    accessibilityRole="button"
                    testID={`import-order-doc-add-${k.kind}`}
                  >
                    {busy ? (
                      <ActivityIndicator color={RED} size="small" />
                    ) : (
                      <MaterialCommunityIcons name={k.icon} size={14} color={RED} />
                    )}
                    <AppText style={[styles.chipText, { color: colors.foreground }]}>
                      {t(k.titleKey as never)}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {viewerIndex != null && (
        <FullscreenImageViewer
          media={viewerMedia}
          initialIndex={viewerIndex}
          visible
          onClose={() => setViewerIndex(null)}
          requestHeaders={requestHeaders}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secTitle: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
    marginTop: 6,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  loadingRow: { paddingVertical: 12, alignItems: "center" },
  errorBlock: { gap: 10, paddingVertical: 4 },
  retryBtn: { alignSelf: "flex-start", paddingVertical: 4 },
  emptyText: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 18 },
  docRow: { alignItems: "center", gap: 12 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  docBody: { flex: 1, gap: 2 },
  docTitleRow: { alignItems: "center", gap: 6 },
  docTitle: { fontSize: 13, fontFamily: "Cairo_600SemiBold", flexShrink: 1 },
  docDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  trashBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addHint: {
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginBottom: 10,
  },
  chipsRow: { gap: 8 },
  chip: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontFamily: "Cairo_600SemiBold" },
});
