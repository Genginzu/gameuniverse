import type {
  BulkFieldAlias,
  CurrentGameData,
  TrackableField,
  TrackedFieldDescriptor,
} from "@/types/admin-games";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";
import {
  detectAgeRatingsChange,
  detectArtworksChange,
  detectBackgroundImageChange,
  detectCompaniesChange,
  detectCoverImageChange,
  detectGenresChange,
  detectLanguagesChange,
  detectMetascoreChange,
  detectPlatformsChange,
  detectPlaytimeChange,
  detectReleaseDateChange,
  detectScreenshotsChange,
  detectTranslationsChange,
  detectVersionsChange,
  detectVideosChange,
} from "./change-detectors";
import {
  detectFranchisesChange,
  detectGameEnginesChange,
  detectGameModesChange,
  detectIgdbRatingChange,
  detectKeywordsChange,
  detectMultiplayerModesChange,
  detectPlayerPerspectivesChange,
  detectThemesChange,
  detectWebsitesChange,
} from "./metadata-change-detectors";

export const TRACKED_FIELD_REGISTRY: Readonly<Record<TrackableField, TrackedFieldDescriptor>> = {
  translations: {
    labelKey: "translations",
    webhookPayloadKeys: ["name", "summary", "storyline"],
    bulkImport: null,
    detect: detectTranslationsChange,
  },
  cover_image: {
    labelKey: "coverImage",
    webhookPayloadKeys: ["cover"],
    bulkImport: { alias: "cover", missingColumn: "cover_image_url" },
    detect: detectCoverImageChange,
  },
  background_image: {
    labelKey: "backgroundImage",
    webhookPayloadKeys: ["artworks", "screenshots"],
    bulkImport: { alias: "background", missingColumn: "background_image_url" },
    detect: detectBackgroundImageChange,
  },
  release_date: {
    labelKey: "releaseDate",
    webhookPayloadKeys: ["first_release_date"],
    bulkImport: { alias: "releaseDate", missingColumn: "release_date" },
    detect: detectReleaseDateChange,
  },
  metascore: {
    labelKey: "metascore",
    webhookPayloadKeys: ["aggregated_rating"],
    bulkImport: { alias: "metascore", missingColumn: "metascore" },
    detect: detectMetascoreChange,
  },
  genres: {
    labelKey: "genres",
    webhookPayloadKeys: ["genres"],
    bulkImport: null,
    detect: detectGenresChange,
  },
  companies: {
    labelKey: "companies",
    webhookPayloadKeys: ["involved_companies"],
    bulkImport: null,
    detect: detectCompaniesChange,
  },
  platforms: {
    labelKey: "gamePlatforms",
    webhookPayloadKeys: ["platforms"],
    bulkImport: null,
    detect: detectPlatformsChange,
  },
  screenshots: {
    labelKey: "screenshots",
    webhookPayloadKeys: ["screenshots"],
    bulkImport: null,
    detect: detectScreenshotsChange,
  },
  artworks: {
    labelKey: "artwork",
    webhookPayloadKeys: ["artworks"],
    bulkImport: null,
    detect: detectArtworksChange,
  },
  age_ratings: {
    labelKey: "ageRatings",
    webhookPayloadKeys: ["age_ratings"],
    bulkImport: null,
    detect: detectAgeRatingsChange,
  },
  versions: {
    labelKey: "versions",
    webhookPayloadKeys: [],
    bulkImport: null,
    detect: detectVersionsChange,
  },
  languages: {
    labelKey: "gameLanguages",
    webhookPayloadKeys: [],
    bulkImport: null,
    detect: detectLanguagesChange,
  },
  playtime: {
    labelKey: "playtime",
    webhookPayloadKeys: [],
    bulkImport: { alias: "playtime", missingColumn: "playtime_normally" },
    detect: detectPlaytimeChange,
  },
  popularity: {
    labelKey: "popularity",
    webhookPayloadKeys: [],
    bulkImport: { alias: "popularity", missingColumn: "igdb_pop_updated_at" },
    detect: null,
  },
  videos: {
    labelKey: "videos",
    webhookPayloadKeys: ["videos"],
    bulkImport: null,
    detect: detectVideosChange,
  },
  similar_games: {
    labelKey: "similarGames",
    webhookPayloadKeys: ["similar_games"],
    bulkImport: null,
    detect: null,
  },
  themes: {
    labelKey: "themes",
    webhookPayloadKeys: ["themes"],
    bulkImport: { alias: "themes", missingColumn: "igdb_themes_synced_at" },
    detect: detectThemesChange,
  },
  game_modes: {
    labelKey: "gameModes",
    webhookPayloadKeys: ["game_modes"],
    bulkImport: { alias: "gameModes", missingColumn: "igdb_game_modes_synced_at" },
    detect: detectGameModesChange,
  },
  player_perspectives: {
    labelKey: "playerPerspectives",
    webhookPayloadKeys: ["player_perspectives"],
    bulkImport: { alias: "playerPerspectives", missingColumn: "igdb_player_perspectives_synced_at" },
    detect: detectPlayerPerspectivesChange,
  },
  multiplayer_modes: {
    labelKey: "multiplayerModes",
    webhookPayloadKeys: ["multiplayer_modes"],
    bulkImport: { alias: "multiplayerModes", missingColumn: "igdb_multiplayer_modes_synced_at" },
    detect: detectMultiplayerModesChange,
  },
  // Franchises and IGDB collections (series).
  franchises: {
    labelKey: "franchises",
    webhookPayloadKeys: ["franchise", "franchises", "collections"],
    bulkImport: { alias: "franchises", missingColumn: "igdb_franchises_synced_at" },
    detect: detectFranchisesChange,
  },
  keywords: {
    labelKey: "keywords",
    webhookPayloadKeys: ["keywords"],
    bulkImport: { alias: "keywords", missingColumn: "igdb_keywords_synced_at" },
    detect: detectKeywordsChange,
  },
  game_engines: {
    labelKey: "gameEngines",
    webhookPayloadKeys: ["game_engines"],
    bulkImport: { alias: "gameEngines", missingColumn: "igdb_game_engines_synced_at" },
    detect: detectGameEnginesChange,
  },
  websites: {
    labelKey: "websites",
    webhookPayloadKeys: ["websites"],
    bulkImport: { alias: "websites", missingColumn: "igdb_websites_synced_at" },
    detect: detectWebsitesChange,
  },
  // Stored only (not displayed yet).
  igdb_rating: {
    labelKey: "igdbRating",
    webhookPayloadKeys: ["total_rating", "total_rating_count"],
    bulkImport: { alias: "igdbRating", missingColumn: "igdb_rating_synced_at" },
    detect: detectIgdbRatingChange,
  },
};

export const TRACKABLE_FIELDS = Object.keys(TRACKED_FIELD_REGISTRY) as readonly TrackableField[];

export function isTrackableField(value: unknown): value is TrackableField {
  return (
    typeof value === "string" && Object.prototype.hasOwnProperty.call(TRACKED_FIELD_REGISTRY, value)
  );
}

export function trackedFieldLabelKey(field: TrackableField): string {
  return TRACKED_FIELD_REGISTRY[field].labelKey;
}

export function detectChangedFields(
  current: CurrentGameData,
  submitted: AdminGameFormData
): TrackableField[] {
  return TRACKABLE_FIELDS.filter((field) => {
    const detect = TRACKED_FIELD_REGISTRY[field].detect;
    return detect !== null && detect(current, submitted);
  });
}

export const WEBHOOK_TRACKED_PAYLOAD_KEYS: readonly string[] = [
  ...new Set(TRACKABLE_FIELDS.flatMap((field) => TRACKED_FIELD_REGISTRY[field].webhookPayloadKeys)),
];

const BULK_ENTRIES = TRACKABLE_FIELDS.flatMap((field) => {
  const bulkImport = TRACKED_FIELD_REGISTRY[field].bulkImport;
  return bulkImport ? [{ field, ...bulkImport }] : [];
});

export const BULK_FIELD_TO_OVERRIDE = Object.fromEntries(
  BULK_ENTRIES.map((entry) => [entry.alias, entry.field])
) as Readonly<Record<BulkFieldAlias, TrackableField>>;

export const BULK_IMPORTABLE_COLUMNS = Object.fromEntries(
  BULK_ENTRIES.map((entry) => [entry.alias, entry.missingColumn])
) as Readonly<Record<BulkFieldAlias, string>>;

export function isBulkFieldAlias(value: unknown): value is BulkFieldAlias {
  return (
    typeof value === "string" && Object.prototype.hasOwnProperty.call(BULK_FIELD_TO_OVERRIDE, value)
  );
}
