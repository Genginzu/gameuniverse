/** Sections of the trending page, in display order. */
export const TRENDING_SECTION_KEYS = [
  "trendingNow",
  "mostViewed",
  "mostPopular",
  "bestRated",
  "recentlyAdded",
] as const;

/**
 * Card grid of a trending section, shared by the page and its skeleton.
 * Column counts (2, 3, 4, 6) all divide TRENDING_SECTION_SIZE (12): every row is full.
 */
export const TRENDING_GRID =
  "grid grid-cols-2 gap-4 min-[475px]:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-6";
