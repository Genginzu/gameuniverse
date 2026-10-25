// Types pour l'administration des jeux

import type { UseFormReturn } from "react-hook-form";
import type { AdminGameFormData } from "@/lib/validations/admin-game-form";

export interface AdminGame {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseDate: string | null;
  updatedAt: string;
}

export interface AdminGenre {
  id: string;
  slug: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface Rating {
  id: string;
  code: string;
  display_name: string;
  minimum_age: number | null;
  color_hex: string | null;
  icon_url: string | null;
  system: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface ContentDescriptor {
  id: string;
  code: string;
  rating_system_id: string | null;
  name: string;
  description: string | null;
}

/** Props communes à tous les onglets du formulaire */
export interface GameFormTabProps {
  form: UseFormReturn<AdminGameFormData>;
  t: (key: string) => string;
  /** When provided, indicates whether a field still has original IGDB data */
  isIgdbField?: (fieldName: TrackableField) => boolean;
  /** Game ID — needed for AI translation in the translations tab */
  gameId?: string;
}

export type TabId =
  | "design"
  | "general"
  | "images"
  | "translations"
  | "genres"
  | "classification"
  | "links"
  | "companies"
  | "game_platforms"
  | "age_ratings"
  | "versions"
  | "languages"
  | "pricing"
  | "videos"
  | "music"
  | "similar_games"
  | "sync";

export interface Tab {
  id: TabId;
  icon: React.ReactNode;
  labelKey: string;
}

/** Catégories de champs synchronisables depuis IGDB */
export type TrackableField =
  | "translations"
  | "cover_image"
  | "background_image"
  | "release_date"
  | "metascore"
  | "genres"
  | "companies"
  | "platforms"
  | "screenshots"
  | "artworks"
  | "age_ratings"
  | "versions"
  | "languages"
  | "playtime"
  | "popularity"
  | "videos"
  | "similar_games"
  | "themes"
  | "game_modes"
  | "player_perspectives"
  | "multiplayer_modes"
  | "franchises"
  | "keywords"
  | "game_engines"
  | "websites"
  | "igdb_rating";

export type BulkFieldAlias =
  | "cover"
  | "background"
  | "playtime"
  | "metascore"
  | "releaseDate"
  | "popularity"
  | "themes"
  | "gameModes"
  | "playerPerspectives"
  | "multiplayerModes"
  | "franchises"
  | "keywords"
  | "gameEngines"
  | "websites"
  | "igdbRating";

export interface CurrentGameData {
  cover_image_url?: string | null;
  background_image_url?: string | null;
  release_date?: string | null;
  metascore?: number | null;
  playtime_hastily?: number | null;
  playtime_normally?: number | null;
  playtime_completely?: number | null;
  translations?: Array<{ language_code: string; title?: string; description?: string }>;
  genres?: Array<{ genre_id: string }>;
  companies?: Array<{ company_id: string; role: string; is_primary: boolean }>;
  screenshots?: Array<{ url: string }>;
  artwork?: Array<{ url: string }>;
  age_ratings?: Array<{ rating_id: string; is_primary: boolean; content_descriptors?: string[] }>;
  versions?: Array<{ version_title: string; description?: string | null }>;
  languages?: Array<{
    language_code: string;
    has_audio: boolean;
    has_subtitles: boolean;
    has_interface: boolean;
  }>;
  game_platforms?: Array<{ platform_id: string }>;
  videos?: Array<{ url: string; title?: string | null }>;
  themes?: Array<{ theme_id: string }>;
  game_modes?: Array<{ game_mode_id: string }>;
  player_perspectives?: Array<{ player_perspective_id: string }>;
  franchises?: Array<{ franchise_id: string }>;
  series?: Array<{ series_id: string }>;
  game_engines?: Array<{ game_engine_id: string }>;
  keywords?: Array<{ keyword_id: string }>;
  websites?: Array<{ url: string; type_id: number | null }>;
  multiplayer_modes?: Array<Record<string, unknown>>;
  igdb_total_rating?: number | null;
  igdb_total_rating_count?: number | null;
}

export type TrackedFieldChangeDetector = (
  current: CurrentGameData,
  submitted: AdminGameFormData
) => boolean;

export interface TrackedFieldBulkImport {
  alias: BulkFieldAlias;
  missingColumn: string;
}

export interface TrackedFieldDescriptor {
  labelKey: string;
  webhookPayloadKeys: readonly string[];
  bulkImport: TrackedFieldBulkImport | null;
  detect: TrackedFieldChangeDetector | null;
}

/** Entrée de suivi d'un champ modifié manuellement */
export interface GameFieldOverride {
  id: string;
  gameId: string;
  fieldName: TrackableField;
  modifiedBy: string | null;
  modifiedAt: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export interface AdminStore {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

export interface AdminCurrency {
  code: string;
  name: string;
  symbol: string;
}
