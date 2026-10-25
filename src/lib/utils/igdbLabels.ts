/**
 * Translated label of an IGDB reference value (theme, game mode, perspective,
 * website type), keyed by IGDB id under `igdbMetadata.<group>`; falls back to
 * the IGDB English name for values added to IGDB later.
 */

export type IgdbLabelGroup = "themes" | "gameModes" | "playerPerspectives" | "websiteTypes";

interface LabelTranslator {
  (key: string): string;
  has: (key: string) => boolean;
}

export function igdbLabel(
  t: LabelTranslator,
  group: IgdbLabelGroup,
  igdbId: number | null,
  fallback: string
): string {
  const key = `${group}.${igdbId}`;
  return igdbId !== null && t.has(key) ? t(key) : fallback;
}
