import { Feather } from "@/components/icons";
import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

type RecentSearchChipsProps = {
  queries: readonly string[];
  onSelect: (query: string) => void;
};

const MAX_VISIBLE_RECENTS = 5;

export default function RecentSearchChips({
  queries,
  onSelect,
}: RecentSearchChipsProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const visibleQueries = queries
    .map((query) => query.trim())
    .filter((query) => query.length > 0)
    .slice(0, MAX_VISIBLE_RECENTS);

  if (visibleQueries.length === 0) return null;

  return (
    <View style={styles.container} testID="recent-search-chrome">
      <View
        style={[
          styles.titleRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Feather name="clock" size={14} color={colors.mutedForeground} />
        <AppText style={[styles.title, { color: colors.mutedForeground }]}>
          {t("search.recent")}
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {visibleQueries.map((query, index) => (
          <Pressable
            key={`${query.toLowerCase()}-${index}`}
            onPress={() => onSelect(query)}
            accessibilityRole="button"
            accessibilityLabel={query}
            testID={`recent-search-chip-${index}`}
            style={[
              styles.chip,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <AppText
              numberOfLines={1}
              style={[styles.chipText, { color: colors.foreground }]}
            >
              {query}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 6,
  },
  titleRow: {
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  content: {
    gap: 8,
    paddingEnd: 8,
  },
  chip: {
    maxWidth: 220,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
