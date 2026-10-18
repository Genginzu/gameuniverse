import type { CurrentGameData, TrackedFieldChangeDetector } from "@/types/admin-games";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

export function normalizeString(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  return Number(value);
}

function sameRowsBy<T>(
  current: readonly T[],
  submitted: readonly T[],
  sortKey: keyof T,
  compareKeys: readonly (keyof T)[]
): boolean {
  if (current.length !== submitted.length) return false;
  const bySortKey = (x: T, y: T) => String(x[sortKey]).localeCompare(String(y[sortKey]));
  const sortedCurrent = [...current].sort(bySortKey);
  const sortedSubmitted = [...submitted].sort(bySortKey);
  return sortedCurrent.every((row, index) =>
    compareKeys.every(
      (key) => normalizeString(row[key]) === normalizeString(sortedSubmitted[index][key])
    )
  );
}

function sameIdSet<T>(current: readonly T[], submitted: readonly T[], key: keyof T): boolean {
  if (current.length !== submitted.length) return false;
  const currentIds = new Set(current.map((row) => row[key]));
  return submitted.every((row) => currentIds.has(row[key]));
}

function scalarStringChanged(
  pick: (data: CurrentGameData | AdminGameFormData) => unknown
): TrackedFieldChangeDetector {
  return (current, submitted) =>
    normalizeString(pick(current)) !== normalizeString(pick(submitted));
}

export const detectCoverImageChange = scalarStringChanged((data) => data.cover_image_url);

export const detectBackgroundImageChange = scalarStringChanged((data) => data.background_image_url);

export const detectReleaseDateChange = scalarStringChanged((data) => data.release_date);

export const detectMetascoreChange: TrackedFieldChangeDetector = (current, submitted) =>
  normalizeNumber(current.metascore) !== normalizeNumber(submitted.metascore);

export const detectPlaytimeChange: TrackedFieldChangeDetector = (current, submitted) =>
  normalizeNumber(current.playtime_hastily) !== normalizeNumber(submitted.playtime_hastily) ||
  normalizeNumber(current.playtime_normally) !== normalizeNumber(submitted.playtime_normally) ||
  normalizeNumber(current.playtime_completely) !== normalizeNumber(submitted.playtime_completely);

export const detectTranslationsChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameRowsBy(current.translations ?? [], submitted.translations ?? [], "language_code", [
    "language_code",
    "title",
    "description",
  ]);

export const detectGenresChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameIdSet(current.genres ?? [], submitted.genres ?? [], "genre_id");

export const detectCompaniesChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameRowsBy(current.companies ?? [], submitted.companies ?? [], "company_id", [
    "company_id",
    "role",
    "is_primary",
  ]);

export const detectPlatformsChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameIdSet(current.game_platforms ?? [], submitted.game_platforms ?? [], "platform_id");

export const detectScreenshotsChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameIdSet(current.screenshots ?? [], submitted.screenshots ?? [], "url");

export const detectArtworksChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameIdSet(current.artwork ?? [], submitted.artwork ?? [], "url");

export const detectVideosChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameRowsBy(current.videos ?? [], submitted.videos ?? [], "url", ["url", "title"]);

export const detectVersionsChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameRowsBy(current.versions ?? [], submitted.versions ?? [], "version_title", [
    "version_title",
    "description",
  ]);

export const detectLanguagesChange: TrackedFieldChangeDetector = (current, submitted) =>
  !sameRowsBy(current.languages ?? [], submitted.languages ?? [], "language_code", [
    "language_code",
    "has_audio",
    "has_subtitles",
    "has_interface",
  ]);

type AgeRatingRow = { rating_id: string; is_primary: boolean; content_descriptors?: string[] };

function sortedDescriptorKey(row: AgeRatingRow): string {
  return [...(row.content_descriptors ?? [])].sort().join("|");
}

export const detectAgeRatingsChange: TrackedFieldChangeDetector = (current, submitted) => {
  const toComparable = (rows: readonly AgeRatingRow[]) =>
    rows.map((row) => ({
      rating_id: row.rating_id,
      is_primary: row.is_primary,
      descriptors: sortedDescriptorKey(row),
    }));
  return !sameRowsBy(
    toComparable(current.age_ratings ?? []),
    toComparable(submitted.age_ratings ?? []),
    "rating_id",
    ["rating_id", "is_primary", "descriptors"]
  );
};
