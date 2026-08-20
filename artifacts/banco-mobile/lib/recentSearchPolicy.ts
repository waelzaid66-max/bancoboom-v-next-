type RecentSearchVisibilityInput = {
  draftQuery: string;
  showSuggestions: boolean;
  searchEngaged: boolean;
  recentQueries: readonly string[];
};

export default function shouldShowRecentSearches({
  draftQuery,
  showSuggestions,
  searchEngaged,
  recentQueries,
}: RecentSearchVisibilityInput): boolean {
  return (
    searchEngaged &&
    recentQueries.length > 0 &&
    draftQuery.trim().length === 0 &&
    !showSuggestions
  );
}
