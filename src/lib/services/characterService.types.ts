import type { CharacterSummary } from "@/types/character";
import type { FetchOptions } from "./baseService";

// Type definitions for Supabase query results
export interface CharacterTranslationRow {
  language_code: string;
  name: string;
  role: string | null;
  description: string | null;
  biography?: string | null;
  weapons?: string | null;
}

export interface GameTranslationRow {
  title: string;
}

export interface PlatformTranslationRow {
  name: string;
  abbreviation: string | null;
  language_code: string;
}

export interface PlatformRow {
  id: string;
  slug: string;
  icon_url: string | null;
  platform_translations: PlatformTranslationRow[];
}

export interface GamePlatformRow {
  platforms: PlatformRow | null;
}

export interface GameRow {
  id: string;
  slug: string;
  cover_image_url: string | null;
  background_image_url: string | null;
  release_date: string | null;
  game_translations: GameTranslationRow[];
  game_platforms?: GamePlatformRow[];
}

export interface CharacterGameRow {
  is_primary: boolean;
  games: GameRow | null;
}

export interface CharacterMediaRow {
  id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  is_featured: boolean | null;
  display_order: number | null;
}

export interface RelatedCharacterRow {
  id: string;
  slug: string;
  main_image: string | null;
  character_translations: CharacterTranslationRow[];
}

export interface CharacterRelationshipRow {
  id: string;
  relationship_type: string;
  description: string | null;
  related_character: RelatedCharacterRow | null;
}

export interface CharacterListRow {
  id: string;
  slug: string;
  main_image: string | null;
  background_color: string | null;
  created_at: string;
  character_translations: CharacterTranslationRow[];
  character_games: CharacterGameRow[];
}

export interface CharacterDetailsRow extends CharacterListRow {
  background_image: string | null;
  updated_at: string;
  character_media: CharacterMediaRow[];
  character_relationships: CharacterRelationshipRow[];
}

export interface CharacterFetchOptions extends FetchOptions {
  games?: string[];
  roles?: string[];
}

export interface CharactersResponse {
  characters: CharacterSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
