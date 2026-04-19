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

export interface FetchGamesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
  | "similar_games";

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
