// Banks & Financiers portal — financial institutions hub.
// Trust-blue identity: the ONE section outside BANCO's red family, in BANKS_ACCENT.
import { Feather, MaterialCommunityIcons } from "@/components/icons";
import {
  useGetInstitutionInbox,
  getGetInstitutionInboxQueryKey,
  useUpdateInstitutionRequest,
  useGetMe,
  getGetMeQueryKey,
  type FinancingRequest,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
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
import * as Clipboard from "expo-clipboard";

import { useAuth } from "@clerk/expo";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { BANKS_ACCENT, SECTION_GRADIENT } from "@/lib/sectionTheme";

const BLUE = BANKS_ACCENT;
const BLUE_DIM = "#0E4C92";
const BLUE_BG = "#1668B518";
const BLUE_BORDER = "#1668B538";

/** Read HTTP status from orval/fetch errors without treating network failures as 403. */
function httpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { status?: number; response?: { status?: number } };
  if (typeof e.status === "number") return e.status;
  if (typeof e.response?.status === "number") return e.response.status;
  return undefined;
}

type Product = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  titleKey: string;
  descKey: string;
};

const PRODUCTS: Product[] = [
  {
    icon: "home-city-outline",
    titleKey: "business.banks.homeLoanTitle",
    descKey: "business.banks.homeLoanDesc",
  },
  {
    icon: "car-outline",
    titleKey: "business.banks.autoLoanTitle",
    descKey: "business.banks.autoLoanDesc",
  },
  {
    icon: "briefcase-outline",
    titleKey: "business.banks.businessLoanTitle",
    descKey: "business.banks.businessLoanDesc",
  },
  {
    icon: "account-cash-outline",
    titleKey: "business.banks.personalLoanTitle",
    descKey: "business.banks.personalLoanDesc",
  },
];

/**
 * FI phase 2 — the bank's own inbox, rendered ONLY for institution members
 * (the owning FI account or an employee seat). Everyone else gets a 403 from
 * the API and sees the unchanged public hub — no flicker, no error banner.
 * Requests here are exclusively the ones Banco forwarded after its risk
 * review; the bank marks them contacted / closed as it works them.
 */
function InstitutionInboxSection({
  onMembershipChange,
}: {
  onMembershipChange?: (active: boolean) => void;
}) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";

  const inbox = useGetInstitutionInbox(
    { limit: 30 },
    {
      query: {
        queryKey: getGetInstitutionInboxQueryKey({ limit: 30 }),
        enabled: !!isSignedIn,
        // 403 = simply not institution staff — never retry-spam it.
        retry: false,
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
      },
    },
  );

  const { mutate: updateRequest, isPending } = useUpdateInstitutionRequest();
  const [pendingLead, setPendingLead] = React.useState<string | null>(null);

  // Tell the hub when membership is known (settled) so Join / awaiting-link
  // never flash during the inbox probe. 401/403 ⇒ not a member; success ⇒ member.
  const membershipSettled = !!isSignedIn && !inbox.isLoading;
  const membershipActive =
    membershipSettled && !inbox.isError && !!inbox.data?.data;
  React.useEffect(() => {
    if (!isSignedIn) {
      onMembershipChange?.(false);
      return;
    }
    if (!membershipSettled) return;
    onMembershipChange?.(membershipActive);
  }, [isSignedIn, membershipSettled, membershipActive, onMembershipChange]);

  const transition = (leadId: string, status: "contacted" | "closed") => {
    setPendingLead(leadId);
    updateRequest(
      { leadId, data: { status } },
      {
        onSettled: () => {
          setPendingLead(null);
          queryClient.invalidateQueries({
            queryKey: getGetInstitutionInboxQueryKey({ limit: 30 }),
          });
        },
      },
    );
  };

  // F-UX-03: only 401/403 mean "not institution staff". Network/5xx must surface.
  const data = inbox.data?.data;
  const errStatus = httpStatus(inbox.error);
  const isNotMember = inbox.isError && (errStatus === 401 || errStatus === 403);
  if (!isSignedIn || inbox.isLoading || isNotMember) return null;
  if (inbox.isError) {
    return (
      <View
        style={[
          styles.inboxErrorBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        testID="banks-inbox-error"
      >
        <AppText style={[styles.inboxEmpty, { color: colors.mutedForeground, textAlign }]}>
          {t("business.banks.inboxLoadError")}
        </AppText>
        <Pressable
          onPress={() => {
            void inbox.refetch();
          }}
          accessibilityRole="button"
          testID="banks-inbox-retry"
          style={[styles.inboxRetryBtn, { borderColor: BLUE, flexDirection: rowDir }]}
        >
          <Feather name="refresh-cw" size={14} color={BLUE} />
          <AppText style={{ color: BLUE, fontWeight: "600" }}>
            {t("business.banks.inboxRetry")}
          </AppText>
        </Pressable>
      </View>
    );
  }
  if (!data) return null;

  const { membership, items } = data;
  // Branch routing: the inbox response carries the institution's branches so
  // owner/manager can assign a forwarded request to a branch inline. Agents
  // see the assigned branch read-only (their scope is enforced server-side).
  const branchList = data.branches ?? [];
  const canRoute = membership.role === "owner" || membership.role === "manager";
  const branchNameOf = (id: string | null | undefined) =>
    branchList.find((b) => b.id === id)?.name ?? null;

  const assignBranch = (leadId: string, branchId: string | null) => {
    setPendingLead(leadId);
    updateRequest(
      { leadId, data: { branch_id: branchId } },
      {
        onSettled: () => {
          setPendingLead(null);
          queryClient.invalidateQueries({
            queryKey: getGetInstitutionInboxQueryKey({ limit: 30 }),
          });
        },
      },
    );
  };

  const statusLabel = (s: FinancingRequest["status"]) =>
    t(`business.banks.inboxStatus.${s}`);
  const statusTint = (s: FinancingRequest["status"]) =>
    s === "forwarded" ? BLUE : s === "contacted" ? "#0E9F6E" : colors.mutedForeground;

  return (
    <View style={styles.inboxWrap} testID="banks-inbox">
      {/* Membership strip — who you are inside the institution */}
      <View
        style={[
          styles.inboxMember,
          { backgroundColor: BLUE_BG, borderColor: BLUE_BORDER, flexDirection: rowDir },
        ]}
      >
        <MaterialCommunityIcons name="bank-check" size={20} color={BLUE} />
        <View style={{ flex: 1 }}>
          <AppText style={[styles.inboxMemberName, { color: colors.foreground, textAlign }]}>
            {membership.intermediary_name}
          </AppText>
          <AppText style={[styles.inboxMemberRole, { color: colors.mutedForeground, textAlign }]}>
            {t(`business.banks.inboxRole.${membership.role}`)}
          </AppText>
        </View>
        <View style={[styles.inboxCountPill, { backgroundColor: BLUE }]}>
          <AppText style={styles.inboxCountText}>{items.length}</AppText>
        </View>
      </View>

      <AppText style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
        {t("business.banks.inboxTitle")}
      </AppText>

      {items.length === 0 ? (
        <AppText style={[styles.inboxEmpty, { color: colors.mutedForeground, textAlign }]}>
          {t("business.banks.inboxEmpty")}
        </AppText>
      ) : (
        items.map((r) => {
          // Generated fields are optional; a row without its lead id is
          // unactionable — skip it rather than render dead buttons.
          const leadId = r.lead_id;
          if (!leadId) return null;
          const busy = isPending && pendingLead === leadId;
          return (
            <View
              key={leadId}
              style={[
                styles.inboxCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              testID={`banks-inbox-${leadId}`}
            >
              <View style={[styles.inboxCardTop, { flexDirection: rowDir }]}>
                <AppText
                  style={[styles.inboxListing, { color: colors.foreground, textAlign }]}
                  numberOfLines={1}
                >
                  {r.listing_title}
                </AppText>
                <View
                  style={[styles.inboxStatus, { backgroundColor: statusTint(r.status) + "22" }]}
                >
                  <AppText style={[styles.inboxStatusText, { color: statusTint(r.status) }]}>
                    {statusLabel(r.status)}
                  </AppText>
                </View>
              </View>

              <View style={[styles.inboxRow, { flexDirection: rowDir }]}>
                <Feather name="user" size={13} color={colors.mutedForeground} />
                <AppText style={[styles.inboxMeta, { color: colors.mutedForeground }]}>
                  {r.buyer_name ?? "—"}
                  {r.buyer_phone ? ` · ${r.buyer_phone}` : ""}
                </AppText>
              </View>

              {(r.down_payment || r.monthly_payment) && (
                <View style={[styles.inboxRow, { flexDirection: rowDir }]}>
                  <Feather name="credit-card" size={13} color={colors.mutedForeground} />
                  <AppText style={[styles.inboxMeta, { color: colors.mutedForeground }]}>
                    {r.down_payment
                      ? `${t("business.banks.inboxDown")} ${r.down_payment}`
                      : ""}
                    {r.down_payment && r.monthly_payment ? " · " : ""}
                    {r.monthly_payment
                      ? `${t("business.banks.inboxMonthly")} ${r.monthly_payment}`
                      : ""}
                    {r.duration_months
                      ? ` · ${r.duration_months} ${t("business.banks.inboxMonths")}`
                      : ""}
                  </AppText>
                </View>
              )}

              {/* Branch routing — owner/manager pick the branch inline; an
                  agent sees where the request is assigned. Hidden entirely
                  when the institution has no branches configured. */}
              {branchList.length > 0 &&
              r.status !== "closed" &&
              r.status !== "rejected" ? (
                canRoute ? (
                  <View style={[styles.inboxBranchRow, { flexDirection: rowDir }]}>
                    <Feather name="git-branch" size={13} color={colors.mutedForeground} />
                    {branchList.map((b) => {
                      const active = r.branch_id === b.id;
                      return (
                        <Pressable
                          key={b.id}
                          disabled={busy}
                          onPress={() => assignBranch(leadId, active ? null : b.id)}
                          style={[
                            styles.inboxBranchChip,
                            {
                              backgroundColor: active ? BLUE : colors.card,
                              borderColor: active ? BLUE : colors.border,
                            },
                          ]}
                          testID={`banks-branch-${leadId}-${b.id}`}
                        >
                          <AppText
                            style={[
                              styles.inboxBranchText,
                              { color: active ? "#FFFFFF" : colors.foreground },
                            ]}
                            numberOfLines={1}
                          >
                            {b.name}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : branchNameOf(r.branch_id) ? (
                  <View style={[styles.inboxRow, { flexDirection: rowDir }]}>
                    <Feather name="git-branch" size={13} color={colors.mutedForeground} />
                    <AppText style={[styles.inboxMeta, { color: colors.mutedForeground }]}>
                      {t("business.banks.inboxBranch")} {branchNameOf(r.branch_id)}
                    </AppText>
                  </View>
                ) : null
              ) : null}

              {r.status !== "closed" && r.status !== "rejected" && (
                <View style={[styles.inboxActions, { flexDirection: rowDir }]}>
                  {r.status === "forwarded" && (
                    <Pressable
                      onPress={() => transition(leadId, "contacted")}
                      disabled={busy}
                      style={[styles.inboxBtn, { backgroundColor: BLUE }]}
                      testID={`banks-contacted-${leadId}`}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <AppText style={styles.inboxBtnText}>
                          {t("business.banks.inboxContacted")}
                        </AppText>
                      )}
                    </Pressable>
                  )}
                  {r.status === "contacted" && (
                    <Pressable
                      onPress={() => transition(leadId, "closed")}
                      disabled={busy}
                      style={[styles.inboxBtn, styles.inboxBtnOutline, { borderColor: BLUE }]}
                      testID={`banks-close-${leadId}`}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={BLUE} />
                      ) : (
                        <AppText style={[styles.inboxBtnText, { color: BLUE }]}>
                          {t("business.banks.inboxClose")}
                        </AppText>
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

function WorkspaceBanner({ status, colors, t, isRTL }: {
  status: string;
  colors: ReturnType<typeof useColors>;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  const textAlign: "left" | "right" = isRTL ? "right" : "left";
  if (status === "active") return null;

  const cfg = {
    draft: {
      icon: "file-document-outline" as const,
      color: "#F59E0B",
      bg: "#F59E0B18",
      border: "#F59E0B38",
      title: t("business.banks.wsDraft"),
      desc: t("business.banks.wsDraftDesc"),
    },
    pending_review: {
      icon: "clock-outline" as const,
      color: "#3B82F6",
      bg: "#3B82F618",
      border: "#3B82F638",
      title: t("business.banks.wsPending"),
      desc: t("business.banks.wsPendingDesc"),
    },
    suspended: {
      icon: "alert-circle-outline" as const,
      color: "#EF4444",
      bg: "#EF444418",
      border: "#EF444438",
      title: t("business.banks.wsSuspended"),
      desc: t("business.banks.wsSuspendedDesc"),
    },
  }[status] ?? {
    icon: "information-outline" as const,
    color: colors.mutedForeground,
    bg: colors.card,
    border: colors.border,
    title: status,
    desc: "",
  };

  return (
    <View style={{
      margin: 16,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: cfg.bg,
      borderColor: cfg.border,
      gap: 8,
    }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        <MaterialCommunityIcons name={cfg.icon} size={20} color={cfg.color} />
        <AppText style={{ color: cfg.color, fontFamily: "Inter_700Bold", fontSize: 14, textAlign }}>
          {cfg.title}
        </AppText>
      </View>
      {cfg.desc ? (
        <AppText style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, textAlign }}>
          {cfg.desc}
        </AppText>
      ) : null}
      {status === "draft" && (
        <Pressable
          onPress={() => router.push("/business/verification")}
          style={{ alignSelf: "flex-start", flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: cfg.color, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 }}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="upload" size={14} color="#FFFFFF" />
          <AppText style={{ color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
            {t("business.banks.wsUploadDocs")}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

export default function BanksScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  // Same safe-area contract as Search/Section — fake web 67 crushed chrome.
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const { isSignedIn } = useAuth();
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";
  const [isFiMember, setIsFiMember] = React.useState(false);
  const [membershipKnown, setMembershipKnown] = React.useState(false);
  const onMembershipChange = React.useCallback((active: boolean) => {
    setIsFiMember(active);
    setMembershipKnown(true);
  }, []);
  React.useEffect(() => {
    if (!isSignedIn) {
      setIsFiMember(false);
      setMembershipKnown(true);
    } else {
      setMembershipKnown(false);
    }
  }, [isSignedIn]);
  // DB role — when FI role exists but inbox is 403, show awaiting-admin (not Join again).
  const meQuery = useGetMe({
    query: { queryKey: getGetMeQueryKey(), enabled: !!isSignedIn, staleTime: 60_000 },
  });
  const meRole = meQuery.data?.data?.role ?? "";
  const meUserId = meQuery.data?.data?.id ?? "";
  const isFiRole = meRole === "financial_institution";
  // Wait for /me + inbox membership probe before Join vs awaiting.
  const roleReady = !isSignedIn || (!meQuery.isLoading && membershipKnown);
  // Awaiting link: signed-in FI without institution membership (admin owner_user_id / seat).
  const showAwaitingAdminLink = roleReady && !!isSignedIn && isFiRole && !isFiMember;
  const showJoinCta = roleReady && !isFiMember && !showAwaitingAdminLink;

  const copyLinkAccountId = React.useCallback(async () => {
    if (!meUserId) return;
    try {
      await Clipboard.setStringAsync(meUserId);
      Alert.alert(t("business.banks.linkAccountIdCopied"));
    } catch {
      // Clipboard can fail in restricted web/iframe contexts — still show the ID.
      Alert.alert(t("business.banks.linkAccountIdLabel"), meUserId);
    }
  }, [meUserId, t]);

  // Workspace lifecycle — FI role users see a banner based on their workspace status.
  const [wsStatus, setWsStatus] = React.useState<string | null>(null);
  const [wsLoading, setWsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isSignedIn || !isFiRole) { setWsStatus(null); return; }
    setWsLoading(true);
    fetch("/api/v1/financing/workspace", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => setWsStatus(data?.data?.workspace_status ?? null))
      .catch(() => setWsStatus(null))
      .finally(() => setWsLoading(false));
  }, [isSignedIn, isFiRole]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
            flexDirection: rowDir,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={12}
          testID="banks-back"
        >
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        <AppText style={[styles.headerTitle, { color: colors.foreground }]}>
          {t("business.banks.title")}
        </AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — expressive blue-gradient banner that states the section's world */}
        <LinearGradient
          colors={SECTION_GRADIENT.banks}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderWidth: 0 }]}
        >
          <View
            style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.16)" }]}
          >
            <MaterialCommunityIcons name="bank-outline" size={40} color="#FFFFFF" />
          </View>
          <AppText style={[styles.heroTitle, { color: "#FFFFFF", textAlign }]}>
            {t("business.banks.title")}
          </AppText>
          <AppText
            style={[styles.heroSub, { color: "rgba(255,255,255,0.88)", textAlign }]}
          >
            {t("business.banks.subtitle")}
          </AppText>
        </LinearGradient>

        {/* FI phase 2 — only show inbox for active workspace (or unknown status) */}
        {(!isFiRole || wsStatus === "active" || wsStatus === null) && (
          <InstitutionInboxSection onMembershipChange={onMembershipChange} />
        )}

        {/* Workspace status banner — shown to FI role users when workspace is not active */}
        {isFiRole && !wsLoading && wsStatus && wsStatus !== "active" && (
          <WorkspaceBanner status={wsStatus} colors={colors} t={t} isRTL={isRTL} />
        )}

        {/* Product types — explanatory brochure only (not a live partner directory).
            Rows are non-interactive examples — no card chrome that reads as a
            browsable partner catalog (ADS-FIRST / MOB-02 honesty). */}
        <AppText
          style={[
            styles.sectionTitle,
            { color: colors.foreground, textAlign },
          ]}
        >
          {t("business.banks.productsTitle")}
        </AppText>
        <AppText
          style={[styles.productsHint, { color: colors.mutedForeground, textAlign }]}
          testID="banks-products-hint"
        >
          {t("business.banks.productsHint")}
        </AppText>

        <View testID="banks-examples-list" style={styles.examplesList}>
          {PRODUCTS.map((p, index) => (
            <View
              key={p.titleKey}
              accessibilityRole="text"
              style={[
                styles.productRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < PRODUCTS.length - 1 ? StyleSheet.hairlineWidth : 0,
                  flexDirection: rowDir,
                },
              ]}
            >
              <View style={[styles.productIcon, { backgroundColor: BLUE_BG }]}>
                <MaterialCommunityIcons
                  name={p.icon}
                  size={18}
                  color={BLUE_DIM}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText
                  style={[
                    styles.productTitle,
                    { color: colors.foreground, textAlign },
                  ]}
                >
                  {t(p.titleKey)}
                </AppText>
                <AppText
                  style={[
                    styles.productDesc,
                    { color: colors.mutedForeground, textAlign },
                  ]}
                >
                  {t(p.descKey)}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Awaiting admin link (S2): the account already holds the FI role, so
            showing "Join" again would read as if the registration never landed.
            Verification alone does not open the inbox — an admin must link the
            institution — so this state says exactly that. */}
        {showAwaitingAdminLink ? (
          <View
            style={[
              styles.joinBox,
              {
                backgroundColor: BLUE_BG,
                borderColor: BLUE_BORDER,
                borderRadius: colors.radius,
              },
            ]}
            testID="banks-awaiting-link"
          >
            <View style={[styles.joinIconWrap, { backgroundColor: BLUE_BG }]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={32}
                color={BLUE}
              />
            </View>
            <AppText
              style={[styles.joinTitle, { color: colors.foreground, textAlign }]}
            >
              {t("business.banks.awaitingLinkTitle")}
            </AppText>
            <AppText
              style={[
                styles.joinDesc,
                { color: colors.mutedForeground, textAlign },
              ]}
            >
              {t("business.banks.awaitingLinkDesc")}
            </AppText>
            {meUserId ? (
              <View
                style={[styles.linkIdBox, { borderColor: BLUE_BORDER }]}
                testID="banks-link-account-id"
              >
                <AppText
                  style={[
                    styles.linkIdLabel,
                    { color: colors.foreground, textAlign },
                  ]}
                >
                  {t("business.banks.linkAccountIdLabel")}
                </AppText>
                <AppText
                  style={[
                    styles.linkIdHint,
                    { color: colors.mutedForeground, textAlign },
                  ]}
                >
                  {t("business.banks.linkAccountIdHint")}
                </AppText>
                <AppText
                  style={[styles.linkIdValue, { color: colors.foreground }]}
                  selectable
                  testID="banks-link-account-id-value"
                >
                  {meUserId}
                </AppText>
                <Pressable
                  onPress={() => void copyLinkAccountId()}
                  style={[styles.linkIdCopyBtn, { borderColor: BLUE }]}
                  accessibilityRole="button"
                  accessibilityLabel={t("business.banks.linkAccountIdCopy")}
                  testID="banks-link-account-id-copy"
                >
                  <Feather name="copy" size={14} color={BLUE} />
                  <AppText style={[styles.linkIdCopyText, { color: BLUE }]}>
                    {t("business.banks.linkAccountIdCopy")}
                  </AppText>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={() => router.push("/business/verification")}
              style={styles.joinBtn}
              accessibilityRole="button"
              accessibilityLabel={t("business.banks.awaitingLinkCta")}
              testID="banks-awaiting-verify"
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={18}
                color="#FFFFFF"
              />
              <AppText style={styles.joinBtnText}>
                {t("business.banks.awaitingLinkCta")}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* Join CTA — hidden for institution members who already have an inbox
            AND for FI-role users still awaiting the admin owner link (S2). */}
        {showJoinCta ? (
          <View
            style={[
              styles.joinBox,
              {
                backgroundColor: BLUE_BG,
                borderColor: BLUE_BORDER,
                borderRadius: colors.radius,
              },
            ]}
            testID="banks-join-box"
          >
            <View style={[styles.joinIconWrap, { backgroundColor: BLUE_BG }]}>
              <MaterialCommunityIcons
                name="bank-check"
                size={32}
                color={BLUE}
              />
            </View>
            <AppText
              style={[
                styles.joinTitle,
                { color: colors.foreground, textAlign },
              ]}
            >
              {t("business.banks.joinTitle")}
            </AppText>
            <AppText
              style={[
                styles.joinDesc,
                { color: colors.mutedForeground, textAlign },
              ]}
            >
              {t("business.banks.joinDesc")}
            </AppText>
            <Pressable
              onPress={() => {
                if (isSignedIn) {
                  // intent=fi forces FI account_type + bank activity on onboarding
                  // so this CTA can never leave the user as a dealer.
                  router.push("/business/onboarding?intent=fi");
                } else {
                  router.push("/(tabs)/profile");
                }
              }}
              style={styles.joinBtn}
              testID="banks-register-cta"
            >
              <MaterialCommunityIcons
                name="bank-plus"
                size={18}
                color="#FFFFFF"
              />
              <AppText style={styles.joinBtnText}>
                {t("business.banks.joinCta")}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* Neutral disclaimer */}
        <View
          style={[
            styles.disclaimer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              flexDirection: rowDir,
            },
          ]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <AppText
            style={[
              styles.disclaimerText,
              { color: colors.mutedForeground, textAlign },
            ]}
          >
            {t("business.banks.note")}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, paddingBottom: 120, gap: 12 },

  // Hero
  hero: {
    alignItems: "center",
    padding: 28,
    borderWidth: 1,
    borderRadius: 20,
    gap: 12,
    marginBottom: 8,
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 21, fontFamily: "Inter_700Bold" },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    maxWidth: 300,
  },

  // Products
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    marginBottom: 2,
  },
  productsHint: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 4,
  },
  examplesList: {
    marginBottom: 4,
  },
  // Example rows — not cards (no fill/border that reads as a partner catalog).
  productRow: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  productTitle: { fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  productDesc: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  linkIdBox: {
    alignSelf: "stretch",
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
  },
  linkIdLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  linkIdHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  linkIdValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  linkIdCopyBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
  },
  linkIdCopyText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Join CTA
  joinBox: {
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  joinIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  joinTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  joinDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    textAlign: "center",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    marginTop: 4,
  },
  joinBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  // Disclaimer
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  /* ── FI phase 2: institution inbox ── */
  inboxWrap: { marginTop: 4 },
  inboxMember: {
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  inboxMemberName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  inboxMemberRole: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  inboxCountPill: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  inboxCountText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },
  inboxEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginHorizontal: 16,
    marginTop: 4,
  },
  inboxErrorBox: {
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    gap: 10,
  },
  inboxRetryBtn: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  inboxCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  inboxCardTop: { alignItems: "center", justifyContent: "space-between", gap: 8 },
  inboxListing: { flex: 1, fontSize: 14.5, fontFamily: "Inter_600SemiBold" },
  inboxStatus: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inboxStatusText: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  inboxRow: { alignItems: "center", gap: 6 },
  inboxMeta: { fontSize: 12.5, fontFamily: "Inter_400Regular", flexShrink: 1 },
  inboxActions: { gap: 8, marginTop: 3 },
  inboxBranchRow: { alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 },
  inboxBranchChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 150,
  },
  inboxBranchText: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  inboxBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inboxBtnOutline: { backgroundColor: "transparent", borderWidth: 1.5 },
  inboxBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
