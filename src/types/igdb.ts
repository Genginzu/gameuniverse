/**
 * IGDB API Types
 * Types for interacting with the Internet Game Database API
 */

export interface IGDBAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  expires_at: number; // Calculated timestamp for expiration
}

export interface IGDBLanguageSupport {
  language: {
    id: number;
    name: string;
    native_name: string;
    locale: string; // ISO code like 'en-US', 'fr-FR'
  };
  language_support_type: {
    id: number;
    name: string; // 'Audio', 'Subtitles', 'Interface'
  };
}

export interface IGDBGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number; // Unix timestamp
  cover?: { image_id: string };
  screenshots?: Array<{ image_id: string }>;
  artworks?: Array<{ image_id: string }>;
  genres?: Array<{ id: number; name: string; slug: string }>;
  involved_companies?: Array<{
    company: { id: number; name: string; slug: string };
    developer: boolean;
    publisher: boolean;
  }>;
  aggregated_rating?: number;
  language_supports?: IGDBLanguageSupport[];
}

export interface IGDBSearchResult {
  id: number;
  name: string;
  slug: string;
  cover_url?: string;
  release_year?: number;
  developer?: string;
}

export type IGDBImageSize =
  | "cover_small" // 90x128
  | "cover_big" // 264x374
  | "screenshot_big" // 889x500
  | "1080p" // 1920x1080
  | "720p"; // 1280x720
