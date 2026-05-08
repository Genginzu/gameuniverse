/**
 * IGDB API types — ported from src/types/igdb.ts to Deno.
 *
 * Kept in sync manually with the Next.js-side definitions.
 * If you change a type here, mirror the change in src/types/igdb.ts.
 */

export interface IGDBAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  expires_at: number;
}

export interface IGDBLanguageSupport {
  language: {
    id: number;
    name: string;
    native_name: string;
    locale: string;
  };
  language_support_type: {
    id: number;
    name: string;
  };
}

export interface IGDBAgeRating {
  id: number;
  organization: number;
  rating_category: number;
  synopsis?: string;
  rating_content_descriptions?: number[];
  content_descriptions?: Array<{
    category: number;
    description: string;
  }>;
  rating_cover_url?: string;
  category?: number;
  rating?: number;
}

export const IGDB_RATING_CATEGORIES: Record<number, string> = {
  1: "ESRB",
  2: "PEGI",
  3: "CERO",
  4: "USK",
  5: "GRAC",
  6: "CLASS_IND",
  7: "ACB",
};

export const IGDB_ALL_RATINGS: Record<
  number,
  { code: string; name: string; age: number | null; system: string }
> = {
  1: { code: "RP", name: "Rating Pending", age: null, system: "ESRB" },
  2: { code: "EC", name: "Early Childhood", age: 3, system: "ESRB" },
  3: { code: "E", name: "Everyone", age: 6, system: "ESRB" },
  4: { code: "E10", name: "Everyone 10+", age: 10, system: "ESRB" },
  5: { code: "T", name: "Teen", age: 13, system: "ESRB" },
  6: { code: "M", name: "Mature 17+", age: 17, system: "ESRB" },
  7: { code: "AO", name: "Adults Only 18+", age: 18, system: "ESRB" },
  8: { code: "3", name: "PEGI 3", age: 3, system: "PEGI" },
  9: { code: "7", name: "PEGI 7", age: 7, system: "PEGI" },
  10: { code: "12", name: "PEGI 12", age: 12, system: "PEGI" },
  11: { code: "16", name: "PEGI 16", age: 16, system: "PEGI" },
  12: { code: "18", name: "PEGI 18", age: 18, system: "PEGI" },
  13: { code: "A", name: "CERO A", age: 0, system: "CERO" },
  14: { code: "B", name: "CERO B", age: 12, system: "CERO" },
  15: { code: "C", name: "CERO C", age: 15, system: "CERO" },
  16: { code: "D", name: "CERO D", age: 17, system: "CERO" },
  17: { code: "Z", name: "CERO Z", age: 18, system: "CERO" },
  18: { code: "0", name: "USK 0", age: 0, system: "USK" },
  19: { code: "6", name: "USK 6", age: 6, system: "USK" },
  20: { code: "12", name: "USK 12", age: 12, system: "USK" },
  21: { code: "16", name: "USK 16", age: 16, system: "USK" },
  22: { code: "18", name: "USK 18", age: 18, system: "USK" },
  23: { code: "ALL", name: "GRAC All", age: 0, system: "GRAC" },
  24: { code: "12", name: "GRAC 12", age: 12, system: "GRAC" },
  25: { code: "15", name: "GRAC 15", age: 15, system: "GRAC" },
  26: { code: "18", name: "GRAC 18", age: 18, system: "GRAC" },
  27: { code: "TEST", name: "GRAC Testing", age: null, system: "GRAC" },
  28: { code: "L", name: "CLASS_IND L", age: 0, system: "CLASS_IND" },
  29: { code: "10", name: "CLASS_IND 10", age: 10, system: "CLASS_IND" },
  30: { code: "12", name: "CLASS_IND 12", age: 12, system: "CLASS_IND" },
  31: { code: "14", name: "CLASS_IND 14", age: 14, system: "CLASS_IND" },
  32: { code: "16", name: "CLASS_IND 16", age: 16, system: "CLASS_IND" },
  33: { code: "18", name: "CLASS_IND 18", age: 18, system: "CLASS_IND" },
  34: { code: "G", name: "ACB G", age: 0, system: "ACB" },
  35: { code: "PG", name: "ACB PG", age: 0, system: "ACB" },
  36: { code: "M", name: "ACB M", age: 15, system: "ACB" },
  37: { code: "MA15", name: "ACB MA 15+", age: 15, system: "ACB" },
  38: { code: "R18", name: "ACB R 18+", age: 18, system: "ACB" },
  39: { code: "RC", name: "ACB RC", age: null, system: "ACB" },
};

export interface IGDBGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
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
  age_ratings?: IGDBAgeRating[];
  game_type?: number;
  dlcs?: number[];
  expansions?: number[];
  bundles?: number[];
  similar_games?: number[];
  platforms?: Array<{ id: number; name: string }>;
  videos?: Array<{ video_id: string; name?: string }>;
}

export interface IGDBTimeToBeat {
  game_id: number;
  hastily: number | null;
  normally: number | null;
  completely: number | null;
  count: number;
}

export interface IGDBGameVersion {
  id: number;
  name: string;
  slug: string;
  version_title: string | null;
  summary?: string;
  cover?: { image_id: string };
}

export interface IGDBDlcExtension {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  game_type?: number;
  first_release_date?: number;
  cover?: { image_id: string };
}

export type IGDBImageSize =
  | "cover_small"
  | "cover_big"
  | "screenshot_big"
  | "1080p"
  | "720p";

export type DlcExtensionCategory =
  | "dlc"
  | "expansion"
  | "bundle"
  | "episode"
  | "season"
  | "pack"
  | "mod"
  | "remake"
  | "remaster"
  | "expanded_game"
  | "port"
  | "fork"
  | "update";

/**
 * Webhook event types and entity names — kept in sync with src/types/webhooks.ts.
 */
export type WebhookEventType = "create" | "update" | "delete";

export const IGDB_ENTITY_TYPES = [
  "games",
  "characters",
  "popularity_primitives",
] as const;

export type WebhookEventStatus =
  | "received"
  | "processing"
  | "processed"
  | "failed"
  | "ignored";
