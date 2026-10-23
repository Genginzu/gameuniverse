/** Minimum query length before the search overlay shows results. */
export const SEARCH_OVERLAY_MIN_QUERY_LENGTH = 2;

export type SearchOverlayContentState = "results" | "loading" | "recent" | "hint";

interface SearchOverlayStateInput {
  /** `isOpen` of `useGlobalSearch`: true as soon as the query is long enough. */
  hasResults: boolean;
  /** `null` until the first fetch for the current query has returned. */
  results: unknown;
  isLoading: boolean;
  query: string;
  recentCount: number;
}

export interface SearchOverlayState {
  showResults: boolean;
  hasFetchedResults: boolean;
  isSearching: boolean;
  contentState: SearchOverlayContentState;
}

/**
 * Derives what the search overlay body shows. `hasResults` flips to true
 * before the fetch ends, so `results === null` means "still searching"
 * (spinner) while a non-null list, even empty, is rendered as results.
 * `contentState` drives the container styling: filled for lists and loading,
 * bare for the centered hint so no empty panel is left on screen.
 */
export function getSearchOverlayState({
  hasResults,
  results,
  isLoading,
  query,
  recentCount,
}: SearchOverlayStateInput): SearchOverlayState {
  const longEnough = query.trim().length >= SEARCH_OVERLAY_MIN_QUERY_LENGTH;
  const showResults = hasResults && longEnough;
  const hasFetchedResults = results !== null;
  const isSearching = !hasFetchedResults && isLoading && longEnough;
  const contentState: SearchOverlayContentState =
    showResults && hasFetchedResults
      ? "results"
      : isSearching
        ? "loading"
        : recentCount > 0
          ? "recent"
          : "hint";
  return { showResults, hasFetchedResults, isSearching, contentState };
}
