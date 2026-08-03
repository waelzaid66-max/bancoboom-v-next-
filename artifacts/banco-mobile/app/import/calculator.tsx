// Import Calculator — full landed-cost estimate for an imported car.
// Pure client-side math (no API): CIF = price + shipping + insurance;
// customs = CIF × duty%; VAT = (CIF + customs) × vat%; total = everything.
// `?focus=shipping|customs` highlights the section the user came for.
import { Feather } from "@/components/icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { sectionAccent } from "@/lib/sectionTheme";

/** Car import is the CAR world, so its accent is the CAR token — bound, never
 *  written as a literal. #E53935 was Material Design's default red: a sixth
 *  family the app never chose, sitting ΔE ≈ 19 from the logo. Owner ruling
 *  2026-08-02: colours track the identity of the app as a whole. */
const RED = sectionAccent("car");
const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"] as const;

function num(v: string): number {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function ImportCalculatorScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === "web" ? 12 : 0);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";
  const { focus } = useLocalSearchParams<{ focus?: string }>();

  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("EGP");
  const [price, setPrice] = useState("");
  const [shipping, setShipping] = useState("");
  const [insurance, setInsurance] = useState("");
  const [portFees, setPortFees] = useState("");
  const [broker, setBroker] = useState("");
  const [registration, setRegistration] = useState("");
  const [other, setOther] = useState("");
  const [customsRate, setCustomsRate] = useState("40");
  const [vatRate, setVatRate] = useState("14");

  const result = useMemo(() => {
    const cif = num(price) + num(shipping) + num(insurance);
    const customs = (cif * num(customsRate)) / 100;
    const vat = ((cif + customs) * num(vatRate)) / 100;
    const fees = num(portFees) + num(broker) + num(registration) + num(other);
    return { cif, customs, vat, fees, total: cif + customs + vat + fees };
  }, [price, shipping, insurance, portFees, broker, registration, other, customsRate, vatRate]);

  const reset = () => {
    setPrice("");
    setShipping("");
    setInsurance("");
    setPortFees("");
    setBroker("");
    setRegistration("");
    setOther("");
    setCustomsRate("40");
    setVatRate("14");
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.foreground,
      borderColor: colors.border,
      backgroundColor: colors.card,
      textAlign,
    },
  ];

  const Field = ({
    labelKey,
    phKey,
    value,
    onChange,
    testID,
    highlighted,
  }: {
    labelKey: string;
    phKey: string;
    value: string;
    onChange: (v: string) => void;
    testID: string;
    highlighted?: boolean;
  }) => (
    <View style={styles.fieldCol}>
      <AppText
        style={[
          styles.label,
          { color: highlighted ? RED : colors.foreground, textAlign },
        ]}
      >
        {t(labelKey as never)}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={t(phKey as never)}
        placeholderTextColor={colors.mutedForeground}
        style={inputStyle}
        testID={testID}
      />
    </View>
  );

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
        testID="import-calc-header"
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
          {t("importCalc.title")}
        </AppText>
        <Pressable
          onPress={reset}
          style={styles.iconBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("importCalc.reset")}
          testID="import-calc-reset"
        >
          <Feather name="rotate-ccw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText style={[styles.sub, { color: colors.mutedForeground, textAlign }]}>
          {t("importCalc.subtitle")}
        </AppText>

        {/* Currency — one compact horizontal row (never a dumped list). */}
        <AppText style={[styles.secTitle, { color: colors.foreground, textAlign }]}>
          {t("importCalc.currencyLabel")}
        </AppText>
        <View style={[styles.currencyRow, { flexDirection: rowDir }]}>
          {CURRENCIES.map((code) => {
            const active = currency === code;
            return (
              <Pressable
                key={code}
                onPress={() => setCurrency(code)}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: active ? RED : colors.card,
                    borderColor: active ? RED : colors.border,
                  },
                ]}
                testID={`import-calc-currency-${code}`}
              >
                <AppText
                  style={[
                    styles.currencyText,
                    { color: active ? "#FFFFFF" : colors.foreground },
                  ]}
                >
                  {code}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Amounts */}
        <AppText style={[styles.secTitle, { color: colors.foreground, textAlign }]}>
          {t("importCalc.secAmounts")}
        </AppText>
        <Field
          labelKey="importCalc.price"
          phKey="importCalc.pricePh"
          value={price}
          onChange={setPrice}
          testID="import-calc-price"
        />
        <Field
          labelKey="importCalc.shipping"
          phKey="importCalc.shippingPh"
          value={shipping}
          onChange={setShipping}
          testID="import-calc-shipping"
          highlighted={focus === "shipping"}
        />
        <Field
          labelKey="importCalc.insurance"
          phKey="importCalc.insurancePh"
          value={insurance}
          onChange={setInsurance}
          testID="import-calc-insurance"
        />
        <Field
          labelKey="importCalc.portFees"
          phKey="importCalc.portFeesPh"
          value={portFees}
          onChange={setPortFees}
          testID="import-calc-port"
        />
        <Field
          labelKey="importCalc.broker"
          phKey="importCalc.brokerPh"
          value={broker}
          onChange={setBroker}
          testID="import-calc-broker"
        />
        <Field
          labelKey="importCalc.registration"
          phKey="importCalc.registrationPh"
          value={registration}
          onChange={setRegistration}
          testID="import-calc-registration"
        />
        <Field
          labelKey="importCalc.other"
          phKey="importCalc.otherPh"
          value={other}
          onChange={setOther}
          testID="import-calc-other"
        />

        {/* Rates */}
        <AppText style={[styles.secTitle, { color: colors.foreground, textAlign }]}>
          {t("importCalc.secRates")}
        </AppText>
        <View style={[styles.ratesRow, { flexDirection: rowDir }]}>
          <View style={styles.rateCol}>
            <AppText
              style={[
                styles.label,
                { color: focus === "customs" ? RED : colors.foreground, textAlign },
              ]}
            >
              {t("importCalc.customsRate")}
            </AppText>
            <TextInput
              value={customsRate}
              onChangeText={setCustomsRate}
              keyboardType="numeric"
              placeholderTextColor={colors.mutedForeground}
              style={inputStyle}
              testID="import-calc-customs-rate"
            />
          </View>
          <View style={styles.rateCol}>
            <AppText style={[styles.label, { color: colors.foreground, textAlign }]}>
              {t("importCalc.vatRate")}
            </AppText>
            <TextInput
              value={vatRate}
              onChangeText={setVatRate}
              keyboardType="numeric"
              placeholderTextColor={colors.mutedForeground}
              style={inputStyle}
              testID="import-calc-vat-rate"
            />
          </View>
        </View>

        {/* Breakdown */}
        <View
          style={[
            styles.resultCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          testID="import-calc-result"
        >
          <AppText style={[styles.resultTitle, { color: colors.foreground, textAlign }]}>
            {t("importCalc.resultTitle")}
          </AppText>
          {(
            [
              ["importCalc.cif", result.cif],
              ["importCalc.customsDuty", result.customs],
              ["importCalc.vat", result.vat],
              ["importCalc.fees", result.fees],
            ] as const
          ).map(([key, value]) => (
            <View key={key} style={[styles.resultRow, { flexDirection: rowDir }]}>
              <AppText
                style={[styles.resultLabel, { color: colors.mutedForeground, textAlign }]}
              >
                {t(key as never)}
              </AppText>
              <AppText style={[styles.resultValue, { color: colors.foreground }]}>
                {fmt(value)} {currency}
              </AppText>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border, flexDirection: rowDir }]}>
            <AppText style={[styles.totalLabel, { color: colors.foreground, textAlign }]}>
              {t("importCalc.total")}
            </AppText>
            <AppText style={styles.totalValue} testID="import-calc-total">
              {fmt(result.total)} {currency}
            </AppText>
          </View>
        </View>

        <AppText style={[styles.note, { color: colors.mutedForeground, textAlign }]}>
          {t("importCalc.note")}
        </AppText>
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
    marginBottom: 4,
  },
  secTitle: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  currencyRow: { gap: 8, flexWrap: "wrap" },
  currencyChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  currencyText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  fieldCol: { marginBottom: 10 },
  label: {
    fontSize: 13,
    fontFamily: "Cairo_600SemiBold",
    marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  ratesRow: { gap: 10 },
  rateCol: { flex: 1 },
  resultCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
    marginBottom: 2,
  },
  resultRow: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  resultLabel: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  resultValue: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  totalRow: {
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
    gap: 8,
  },
  totalLabel: { flex: 1, fontSize: 14.5, fontFamily: "Cairo_700Bold" },
  totalValue: { fontSize: 17, fontFamily: "Inter_700Bold", color: RED },
  note: {
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    marginTop: 12,
  },
});
