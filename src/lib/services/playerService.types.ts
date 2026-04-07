import type { FetchOptions } from "./baseService";

export interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  preferred_locale: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LibraryEntryGame {
  id: string;
  slug: string;
  cover_image_url: string | null;
  game_translations: Array<{
    title: string;
    language_code: string;
  }> | null;
}

export interface LibraryEntry {
  id: string;
  game_id: string;
  status: string;
  play_time_hours: number | null;
  play_time_hastily: number | null;
  play_time_normally: number | null;
  play_time_completely: number | null;
  rating: number | null;
  added_at: string;
  games: LibraryEntryGame | null;
}

export interface PlayerFetchOptions extends FetchOptions {
  gameCountRange?: string;
}
