import { GameDetails } from "@/types/game";

/**
 * Result of an import or sync operation
 */
export interface ImportResult {
  success: boolean;
  game?: GameDetails;
  error?: string;
}

/**
 * Data structure for inserting a new game into Supabase
 */
export interface GameInsertData {
  slug: string;
  igdb_id: number;
  release_date: string | null;
  metascore: number | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  label_color: string | null;
  text_color: string | null;
  last_synced_at: string;
  playtime_hastily: number | null;
  playtime_normally: number | null;
  playtime_completely: number | null;
  playtime_updated_at: string | null;
}

/**
 * Related entities extracted from IGDB data
 */
export interface RelatedEntities {
  genreIds: string[];
  developerIds: string[];
  publisherIds: string[];
}
