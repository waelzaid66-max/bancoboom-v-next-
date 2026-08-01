import { Feather } from "@/components/icons";
import { AppTextInput as TextInput } from "@/components/AppTextInput";
import { useAuth } from "@clerk/expo";
import {
  getGetListingQueryKey,
  getListing,
  useUpdateListing,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { LocationPicker } from "@/components/LocationPicker";
import { MapPinPicker } from "@/components/MapPinPicker";
import {
  ListingCurrencyButton,
  MarketCountryButton,
  MarketCountryPicker,
} from "@/components/MarketCountryPicker";
import {
  ListingMediaEditor,
  type ListingMediaEditorHandle,
} from "@/components/listings/ListingMediaEditor";
import {
  currencyForMarket,
  EXTRA_CURRENCIES,
} from "@/constants/listingCreateTaxonomy";
import { useI18n } from "@/context/LanguageContext";
import { useSession } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";
import { requestNearMeCoords } from "@/lib/nearMe";

function digitsToNumber(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const { isSignedIn } = useAuth();
  const { bumpListings } = useSession();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  // Same safe-area contract as Search/Section — fake web 67 crushed chrome.
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";

  const listingQ = useQuery({
    queryKey: getGetListingQueryKey(id ?? ""),
    queryFn: () => getListing(id ?? ""),
    // REL-12: do not hydrate edit chrome for guests (MOB-C-10).
    enabled: !!id && !!isSignedIn,
  });

  const listing = listingQ.data?.data;
  const specs = (listing?.specs ?? {}) as Record<string, unknown>;
  const isFurnishedDaily = specs.rental_term === "furnished_daily";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationValue, setLocationValue] = useState<string | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [marketPickerOpen, setMarketPickerOpen] = useState(false);
  const [mapPinPickerOpen, setMapPinPickerOpen] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pinTouched, setPinTouched] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [price, setPrice] = useState("");
  // Manual multi-market editing (user requirement): the listing's market and
  // pricing currency stay editable after publish. Server-side the specs patch
  // MERGES, so sending only these two keys never touches other specs.
  const [marketCountry, setMarketCountry] = useState("EG");
  const [currency, setCurrency] = useState("EGP");
  const [hydrated, setHydrated] = useState(false);
  const mediaRef = useRef<ListingMediaEditorHandle>(null);

  useEffect(() => {
    if (!listing || hydrated) return;
    setTitle(listing.title ?? "");
    setDescription(listing.description ?? "");
    setLocation(listing.location ?? "");
    setLocationValue(listing.location ?? null);
    if (typeof listing.price_cash === "number") {
      setPrice(String(Math.round(listing.price_cash)));
    }
    const sp = (listing.specs ?? {}) as Record<string, unknown>;
    const mkt =
      typeof sp.market_country === "string" && /^[A-Za-z]{2}$/.test(sp.market_country)
        ? sp.market_country.toUpperCase()
        : "EG";
    setMarketCountry(mkt);
    setCurrency(
      typeof sp.currency === "string" && sp.currency.trim()
        ? sp.currency.trim().toUpperCase()
        : currencyForMarket(mkt),
    );
    // Seed pin from listing coordinates when present (MAP-09) — do not mark
    // touched until the seller confirms map/GPS so we don't overwrite silently.
    const coords = listing.coordinates;
    if (
      coords &&
      typeof coords.lat === "number" &&
      typeof coords.lng === "number" &&
      Number.isFinite(coords.lat) &&
      Number.isFinite(coords.lng)
    ) {
      setPin({ lat: coords.lat, lng: coords.lng });
    }
    setHydrated(true);
  }, [listing, hydrated]);

  const { mutate, isPending } = useUpdateListing({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Session bump refreshes list surfaces; also invalidate this listing so
        // detail/edit reload does not show stale title/media after PATCH.
        bumpListings();
        if (id) {
          void queryClient.invalidateQueries({
            queryKey: getGetListingQueryKey(id),
          });
        }
        Alert.alert(t("editListing.savedTitle"), t("editListing.savedBody"), [
          { text: t("common.done"), onPress: () => router.back() },
        ]);
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t("common.error"), t("editListing.error"));
      },
    },
  });

  const captureLocation = async () => {
    if (pinBusy) return;
    setPinBusy(true);
    try {
      const coords = await requestNearMeCoords();
      if (!coords) {
        Alert.alert(t("search.locateFailedTitle"), t("search.locateFailedBody"));
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPin(coords);
      setPinTouched(true);
    } finally {
      setPinBusy(false);
    }
  };

  const onSave = () => {
    if (!isSignedIn || !id || !title.trim() || !listing) return;
    // Buyer requests carry no sale price (parity with create): do not require
    // or PATCH base_price_cash. Sending 0 would risk price-drop notify side
    // effects on the API update path (MOB-C-09 / REL-11).
    const isRequest = !!listing.is_request;
    const base_price_cash = isRequest ? undefined : digitsToNumber(price);
    if (!isRequest && (base_price_cash === undefined || base_price_cash <= 0)) {
      Alert.alert(t("common.error"), t("editListing.priceRequired"));
      return;
    }
    // Media editor is production-complete (WAVE-10) but was left unwired after
    // wipe restores — edit previously PATCH'd text/price only (EDIT-MEDIA-DEAD).
    if (mediaRef.current?.hasPendingUploads()) {
      Alert.alert(t("common.error"), t("create.uploading"));
      return;
    }
    const media = mediaRef.current?.buildMediaPayload();
    if (media === null) {
      Alert.alert(t("common.error"), t("create.errPhotos"));
      return;
    }
    mutate({
      id,
      data: {
        title: title.trim(),
        description: description.trim() || undefined,
        location: locationValue ?? location.trim(),
        ...(base_price_cash !== undefined ? { base_price_cash } : {}),
        // Merged server-side — only these two keys change, other specs stay.
        specs: { market_country: marketCountry, currency },
        media,
        ...(pinTouched && pin
          ? { latitude: pin.lat, longitude: pin.lng }
          : {}),
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <AppText style={[styles.headerTitle, { color: colors.foreground }]}>
          {t("editListing.title")}
        </AppText>
        <Pressable
          onPress={onSave}
          disabled={!isSignedIn || isPending || listingQ.isLoading}
          style={styles.iconBtn}
          hitSlop={12}
          testID="edit-listing-save"
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText style={{ color: colors.primary, fontWeight: "700" }}>
              {t("editListing.save")}
            </AppText>
          )}
        </Pressable>
      </View>

      {!isSignedIn ? (
        <View style={styles.centered}>
          <Feather name="lock" size={56} color={colors.mutedForeground} />
          <AppText style={{ color: colors.foreground, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
            {t("editListing.signInTitle")}
          </AppText>
          <AppText style={{ color: colors.mutedForeground, marginTop: 8, textAlign: "center", paddingHorizontal: 24 }}>
            {t("editListing.signInHint")}
          </AppText>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={{ marginTop: 18, paddingHorizontal: 28, paddingVertical: 13, backgroundColor: colors.primary, borderRadius: colors.radius }}
            testID="edit-listing-signin"
          >
            <AppText style={{ color: colors.primaryForeground, fontWeight: "600" }}>
              {t("editListing.signInCta")}
            </AppText>
          </Pressable>
        </View>
      ) : listingQ.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : listingQ.isError || !listing ? (
        <View style={styles.centered}>
          <AppText style={{ color: colors.mutedForeground }}>
            {t("listing.notAvailable")}
          </AppText>
        </View>
      ) : (
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
        >
          {isFurnishedDaily ? (
            <View style={[styles.badge, { backgroundColor: colors.primary + "14" }]}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>
                {t("rentals.hub.unitBadge")}
              </AppText>
            </View>
          ) : null}

          <AppText style={[styles.locked, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {t("editListing.lockedType")}
          </AppText>

          {/* WAVE-10 media editor — was dead (no importer) until EDIT-MEDIA-DEAD repair. */}
          <ListingMediaEditor
            ref={mediaRef}
            initialMedia={listing.media ?? []}
            isRequest={!!listing.is_request}
            testIdPrefix="edit-listing"
          />

          <Field label={t("create.titleField")} colors={colors} isRTL={isRTL}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
              placeholder={t("create.titlePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
            />
          </Field>

          <Field label={t("create.descriptionField")} colors={colors} isRTL={isRTL}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[
                styles.input,
                styles.textArea,
                { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" },
              ]}
              placeholder={t("create.descriptionPlaceholder")}
              placeholderTextColor={colors.mutedForeground}
            />
          </Field>

          <Field label={t("create.locationField")} colors={colors} isRTL={isRTL}>
            <Pressable
              onPress={() => setLocationPickerOpen(true)}
              style={[styles.input, styles.pressField, { borderColor: colors.border, flexDirection: rowDir }]}
            >
              <AppText style={{ color: location ? colors.foreground : colors.mutedForeground, flex: 1, textAlign: isRTL ? "right" : "left" }}>
                {location || t("create.locationPlaceholder")}
              </AppText>
              <Feather name="map-pin" size={16} color={colors.mutedForeground} />
            </Pressable>
          </Field>

          {/* MAP-09: optional precise pin tools (parity with create). */}
          <View
            style={[styles.pinToolsRow, { flexDirection: rowDir }]}
            testID="edit-pin-tools"
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setMapPinPickerOpen(true);
              }}
              style={[
                styles.pinToolBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: pin ? "#16a34a" : colors.border,
                  borderRadius: colors.radius,
                  flexDirection: rowDir,
                },
              ]}
              testID="edit-pick-on-map"
            >
              <Feather
                name="map"
                size={16}
                color={pin ? "#16a34a" : colors.foreground}
              />
              <AppText
                style={[
                  styles.pinToolText,
                  { color: pin ? colors.foreground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {pin ? t("create.locationCaptured") : t("create.pickOnMap")}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => void captureLocation()}
              disabled={pinBusy}
              style={[
                styles.pinToolBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  flexDirection: rowDir,
                  opacity: pinBusy ? 0.6 : 1,
                },
              ]}
              testID="edit-use-location"
            >
              {pinBusy ? (
                <ActivityIndicator color={colors.foreground} size="small" />
              ) : (
                <Feather name="map-pin" size={16} color={colors.foreground} />
              )}
              <AppText
                style={[styles.pinToolText, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {pinBusy ? t("create.locationCapturing") : t("create.useMyLocation")}
              </AppText>
            </Pressable>
          </View>

          {!listing.is_request ? (
            <Field
              label={isFurnishedDaily ? t("editListing.priceNightHint") : t("editListing.priceHint")}
              colors={colors}
              isRTL={isRTL}
            >
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                testID="edit-listing-price"
              />
            </Field>
          ) : null}

          {/* Compact market + currency (same chrome as create) — no chip clouds. */}
          <Field label={t("create.fields.marketCountry")} colors={colors} isRTL={isRTL}>
            <MarketCountryButton
              selected={marketCountry}
              showCurrency={false}
              testID="edit-market-country-btn"
              onPress={() => {
                Haptics.selectionAsync();
                setMarketPickerOpen(true);
              }}
            />
          </Field>

          <Field label={t("create.fields.currency")} colors={colors} isRTL={isRTL}>
            <ListingCurrencyButton
              value={currency}
              marketCountry={marketCountry}
              testIDPrefix="edit-currency"
              onChange={(code) => {
                Haptics.selectionAsync();
                setCurrency(code);
              }}
            />
          </Field>
        </KeyboardAwareScrollViewCompat>
      )}

      <MarketCountryPicker
        visible={marketPickerOpen}
        selected={marketCountry}
        launchMarketsOnly
        onClose={() => setMarketPickerOpen(false)}
        onSelect={(iso) => {
          Haptics.selectionAsync();
          setMarketCountry(iso);
          // Follow the market's currency unless the seller already picked a
          // cross-border one (USD/EUR stay as chosen) — same rule as before.
          if (!EXTRA_CURRENCIES.includes(currency as (typeof EXTRA_CURRENCIES)[number])) {
            setCurrency(currencyForMarket(iso));
          }
          setMarketPickerOpen(false);
        }}
      />

      <MapPinPicker
        visible={mapPinPickerOpen}
        marketCountry={marketCountry}
        initial={pin}
        onClose={() => setMapPinPickerOpen(false)}
        onConfirm={(next) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPin(next);
          setPinTouched(true);
          setMapPinPickerOpen(false);
        }}
      />

      <LocationPicker
        visible={locationPickerOpen}
        selectedValue={locationValue ?? undefined}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(_value, label) => {
          setLocation(label);
          setLocationValue(label);
          setLocationPickerOpen(false);
        }}
        onClear={() => {
          setLocation("");
          setLocationValue(null);
        }}
      />
    </View>
  );
}

function Field({
  label,
  children,
  colors,
  isRTL,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  isRTL: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <AppText style={{ color: colors.foreground, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pinToolsRow: { gap: 8 },
  pinToolBtn: {
    flex: 1,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  pinToolText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  chipRow: { flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { minWidth: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locked: { fontSize: 12, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  pressField: { alignItems: "center" },
});
