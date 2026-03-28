/**
 * Raw CSV row types for IGDB game dump tables.
 * These represent the flat structure of CSV rows before assembly into IGDBGame.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RawGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  cover?: number;
  game_type?: number;
  category?: number;
  aggregated_rating?: number;
  total_rating_count?: number;
  aggregated_rating_count?: number;
  hypes?: number;
  follows?: number;
  screenshots?: number[];
  artworks?: number[];
  genres?: number[];
  platforms?: number[];
  videos?: number[];
  age_ratings?: number[];
  language_supports?: number[];
  involved_companies?: number[];
  dlcs?: number[];
  expansions?: number[];
  bundles?: number[];
  [key: string]: unknown;
}

export interface RawCover {
  id: number;
  image_id: string;
  game?: number;
  [k: string]: unknown;
}
export interface RawScreenshot {
  id: number;
  image_id: string;
  [k: string]: unknown;
}
export interface RawArtwork {
  id: number;
  image_id: string;
  [k: string]: unknown;
}
export interface RawGenre {
  id: number;
  name: string;
  slug: string;
  [k: string]: unknown;
}
export interface RawPlatform {
  id: number;
  name: string;
  [k: string]: unknown;
}
export interface RawVideo {
  id: number;
  video_id: string;
  name?: string;
  [k: string]: unknown;
}

export interface RawAgeRating {
  id: number;
  organization?: number;
  rating_category?: number;
  synopsis?: string;
  content_descriptions?: number[];
  [k: string]: unknown;
}

export interface RawInvolvedCompany {
  id: number;
  game?: number;
  company?: number;
  developer?: boolean | number;
  publisher?: boolean | number;
  [k: string]: unknown;
}

export interface RawCompany {
  id: number;
  name: string;
  slug: string;
  [k: string]: unknown;
}

export interface RawLanguageSupport {
  id: number;
  game?: number;
  language?: number;
  language_support_type?: number;
  [k: string]: unknown;
}

export interface RawLanguage {
  id: number;
  name: string;
  native_name?: string;
  locale?: string;
  [k: string]: unknown;
}

export interface RawLanguageSupportType {
  id: number;
  name: string;
  [k: string]: unknown;
}
