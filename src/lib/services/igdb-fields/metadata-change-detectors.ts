/**
 * Admin form vs DB detectors of the IGDB metadata fields (client-safe).
 */

import type { CurrentGameData, TrackedFieldChangeDetector } from "@/types/admin-games";
import { normalizeNumber, normalizeString } from "./change-detectors";

function sameIdSet<T>(current: readonly T[], submitted: readonly T[], key: keyof T): boolean {
  if (current.length !== submitted.length) return false;
  const currentIds = new Set(current.map((row) => String(row[key])));
  return submitted.every((row) => currentIds.has(String(row[key])));
}

const MULTIPLAYER_FLAGS = [
  "campaign_coop",
  "drop_in",
  "lan_coop",
  "offline_coop",
  "online_coop",
  "splitscreen",
  "splitscreen_online",
] as const;

const MULTIPLAYER_NUMBERS = [
  "igdb_platform_id",
  "offline_coop_max",
  "offline_max",
  "online_coop_max",
  "online_max",
] as const;

/** Order-insensitive comparison of multiplayer rows (flags default to false). */
function multiplayerSignature(rows: ReadonlyArray<Record<string, unknown>>): string {
  return rows
    .map((row) =>
      [
        ...MULTIPLAYER_FLAGS.map((key) => String(Boolean(row[key]))),
        ...MULTIPLAYER_NUMBERS.map((key) => normalizeString(normalizeNumber(row[key]))),
      ].join(",")
    )
    .sort()
    .join("|");
}

const idSetDetector =
  <K extends keyof CurrentGameData>(field: K, key: string): TrackedFieldChangeDetector =>
  (current, submitted) =>
    !sameIdSet(
      (current[field] ?? []) as Array<Record<string, unknown>>,
      ((submitted as Record<string, unknown>)[field] ?? []) as Array<Record<string, unknown>>,
      key
    );

export const detectThemesChange = idSetDetector("themes", "theme_id");
export const detectGameModesChange = idSetDetector("game_modes", "game_mode_id");
export const detectPlayerPerspectivesChange = idSetDetector(
  "player_perspectives",
  "player_perspective_id"
);
export const detectGameEnginesChange = idSetDetector("game_engines", "game_engine_id");
export const detectKeywordsChange = idSetDetector("keywords", "keyword_id");

/** Franchises and series are one tracked field. */
export const detectFranchisesChange: TrackedFieldChangeDetector = (current, submitted) =>
  idSetDetector("franchises", "franchise_id")(current, submitted) ||
  idSetDetector("series", "series_id")(current, submitted);

export const detectWebsitesChange: TrackedFieldChangeDetector = (current, submitted) => {
  const signature = (rows: ReadonlyArray<{ url: string; type_id?: number | null }>) =>
    rows
      .map((row) => `${row.url}#${normalizeString(row.type_id)}`)
      .sort()
      .join("|");
  return signature(current.websites ?? []) !== signature(submitted.websites ?? []);
};

export const detectMultiplayerModesChange: TrackedFieldChangeDetector = (current, submitted) =>
  multiplayerSignature(current.multiplayer_modes ?? []) !==
  multiplayerSignature(submitted.multiplayer_modes ?? []);

export const detectIgdbRatingChange: TrackedFieldChangeDetector = (current, submitted) =>
  normalizeNumber(current.igdb_total_rating) !== normalizeNumber(submitted.igdb_total_rating) ||
  normalizeNumber(current.igdb_total_rating_count) !==
    normalizeNumber(submitted.igdb_total_rating_count);
