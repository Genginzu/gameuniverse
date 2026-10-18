export const LIBRARY_PAGE_SIZE = 20;

/** Builds the SWR key (API URL) for the library games listing. */
export function buildLibraryGamesKey(
  locale: string,
  page: number,
  search: string,
  genres: string[],
  publishers: string[]
): string {
  const params = new URLSearchParams({
    locale,
    page: page.toString(),
    limit: String(LIBRARY_PAGE_SIZE),
    inLibrary: "true",
  });

  if (search.trim()) params.append("search", search.trim());
  if (genres.length > 0) params.append("genres", genres.join(","));
  if (publishers.length > 0) params.append("publishers", publishers.join(","));

  return `/api/games?${params.toString()}`;
}
