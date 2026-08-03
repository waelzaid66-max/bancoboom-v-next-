/**
 * The presence indicator — one component, so the inbox and the chat can never
 * disagree about what a state looks like.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * There is no red dot for "away" and no grey dot for "unknown". A marketplace
 * runs on people replying to each other, and a permanent red mark next to
 * someone's name reads as a verdict on them rather than as information. Only
 * the two states worth acting on get a mark: a green dot when the other side
 * is there now, and a hollow ring when they were there recently enough that
 * waiting makes sense. Everything else renders nothing at all — the absence of
 * a mark is the honest way to say "we are not telling you anything", and it
 * keeps `unknown` visually identical to opted-out, which is what makes the
 * opt-out worth having.
 *
 * The server decides the state; this file only draws it. It never sees a
 * timestamp, so it cannot leak one by accident.
 */
import React from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

/** Mirrors the API enum. Anything else renders nothing. */
export type Presence = "online" | "recently" | "away" | "unknown";

/** Green is the one colour outside the brand family the app allows, and only
 *  here: presence is a universally read signal, and a red "online" would mean
 *  the opposite of what every user already expects. */
const LIVE = "#22C55E";

export function PresenceDot({
  presence,
  size = 9,
}: {
  presence: Presence | null | undefined;
  size?: number;
}) {
  const colors = useColors();
  if (presence !== "online" && presence !== "recently") return null;

  const live = presence === "online";
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: live ? LIVE : "transparent",
          borderColor: live ? LIVE : colors.mutedForeground,
        },
      ]}
      testID={`presence-dot-${presence}`}
    />
  );
}

/**
 * The same state as words, for the chat header where there is room to say it.
 *
 * Returns null for away and unknown for the same reason the dot does: the two
 * must stay indistinguishable, or the opt-out stops being an opt-out.
 */
export function PresenceLabel({ presence }: { presence: Presence | null | undefined }) {
  const { t } = useI18n();
  const colors = useColors();
  if (presence !== "online" && presence !== "recently") return null;

  return (
    <AppText
      style={[
        styles.label,
        { color: presence === "online" ? LIVE : colors.mutedForeground },
      ]}
      numberOfLines={1}
      testID={`presence-label-${presence}`}
    >
      {t(`chat.presence.${presence}` as never)}
    </AppText>
  );
}

const styles = StyleSheet.create({
  dot: { borderWidth: 1.5 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
