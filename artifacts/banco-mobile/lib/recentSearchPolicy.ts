type RecentSearchVisibilityInput = {
  draftQuery: string;
  showSuggestions: boolean;
  searchEngaged: boolean;
  recentQueries: readonly string[];
  viewState: string;
};

export default function shouldShowRecentSearches({
  draftQuery,
  showSuggestions,
  searchEngaged,
  recentQueries,
  viewState,
}: RecentSearchVisibilityInput): boolean {
  return (
    viewState === "discover" &&
    searchEngaged &&
    recentQueries.length > 0 &&
    draftQuery.trim().length === 0 &&
    !showSuggestions
  );
}
