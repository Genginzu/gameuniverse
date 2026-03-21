// Types pour l'administration des personnages

import type { UseFormReturn } from "react-hook-form";
import type { AdminCharacterFormData } from "@/lib/validations/admin-character-form";

export interface AdminCharacter {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  mainImage: string | null;
  primaryGame: string;
  updatedAt: string;
}

export interface FetchCharactersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Props communes à tous les onglets du formulaire personnage */
export interface CharacterFormTabProps {
  form: UseFormReturn<AdminCharacterFormData>;
  t: (key: string) => string;
}

export type CharacterTabId =
  | "general"
  | "images"
  | "translations"
  | "roles"
  | "games"
  | "relationships"
  | "screenshots"
  | "artwork"
  | "videos";

export interface CharacterTab {
  id: CharacterTabId;
  icon: React.ReactNode;
  labelKey: string;
}

/** Payload envoyé à l'API pour création/modification */
export interface CharacterPayload {
  character: {
    slug: string;
    main_image: string | null;
    background_image: string | null;
    background_color: string | null;
  };
  translations: Array<{
    language_code: string;
    name: string;
    role: string | null;
    description: string | null;
    biography: string | null;
    weapons: string | null;
  }>;
  games: Array<{
    game_id: string;
    is_primary: boolean;
  }>;
  relationships: Array<{
    related_character_id: string;
    relationship_type: string;
    description: string | null;
  }>;
  media: Array<{
    type: "screenshot" | "artwork" | "video";
    url: string;
    thumbnail_url: string | null;
    title: string | null;
    description: string | null;
    alt_text: string | null;
    is_featured: boolean;
    display_order: number;
  }>;
  /** IDs des rôles assignés au personnage (table character_character_roles) */
  role_ids: string[];
}

/** Réponse API pour la liste des personnages */
export interface CharacterListResponse {
  characters: AdminCharacter[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;
