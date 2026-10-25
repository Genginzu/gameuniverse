const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Compact release label for game cards: `MM/YYYY`, or `YYYY` alone.
 *
 * The date string is parsed directly (no `Date`) to avoid timezone shifts.
 * IGDB stores year-only release dates as December 31st: showing `12/YYYY`
 * would invent a month, so those fall back to the year.
 */
export function formatReleaseMonthYear(
  releaseDate: string | null | undefined,
  releaseYear?: number | null
): string | null {
  const match = releaseDate ? ISO_DATE_PATTERN.exec(releaseDate) : null;

  if (!match) return releaseYear ? String(releaseYear) : null;

  const [, year, month, day] = match;
  if (year === "1970" && month === "01" && day === "01") return null;
  if (month === "12" && day === "31") return year;

  return `${month}/${year}`;
}
