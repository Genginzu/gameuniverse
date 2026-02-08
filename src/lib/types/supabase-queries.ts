/**
 * Shared Supabase Query Result Types
 *
 * Centralized type definitions for Supabase query results used across API routes.
 * These types represent the shape of data returned from Supabase queries with joins.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

// ============================================================================
// Game-related types
// ============================================================================

/**
 * Game translation row from game_translations table
 */
export interface GameTranslationRow {
  title: string;
  description: string | null;
  language_code?: string;
}

/**
 * Genre translation row from genre_translations table
 */
export interface GenreTranslationRow {
  name: string;
  language_code?: string;
}

/**
 * Genre with translations (joined query result)
 */
export interface GenreWithTranslations {
  id?: string;
  slug?: string;
  genre_translations: GenreTranslationRow[] | null;
}

/**
 * Game-genre relationship row from game_genres table
 */
export interface GameGenreRow {
  game_id?: string;
  genre_id?: string;
  genres: GenreWithTranslations | null;
}

/**
 * Company row from companies table
 */
export interface CompanyRow {
  name: string;
  slug?: string;
}

/**
 * Game-company relationship row from game_companies table
 */
export interface GameCompanyRow {
  game_id?: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: CompanyRow | null;
}

/**
 * Game price row from game_prices table
 */
export interface GamePriceRow {
  price: number;
  currency: string;
  is_available: boolean;
}

/**
 * Rating row from ratings table
 */
export interface RatingRow {
  display_name: string;
  minimum_age: number;
}

/**
 * Game-rating relationship row from game_ratings table
 */
export interface GameRatingRow {
  is_primary: boolean;
  ratings: RatingRow | null;
}

/**
 * Game artwork row from game_artwork table
 */
export interface GameArtworkRow {
  url: string;
  artwork_type: string;
  is_featured: boolean;
}

/**
 * Base game row from games table
 */
export interface GameRow {
  id: string;
  slug: string;
  igdb_id?: number | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  release_date: string | null;
  metascore: number | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Game row with all joined relations (for list queries)
 */
export interface GameRowWithRelations extends GameRow {
  game_translations: GameTranslationRow[] | null;
  game_genres: GameGenreRow[] | null;
  game_companies: GameCompanyRow[] | null;
}

/**
 * Game row with extended relations (for library queries)
 */
export interface GameRowWithExtendedRelations extends GameRowWithRelations {
  game_prices: GamePriceRow[] | null;
  game_ratings: GameRatingRow[] | null;
  game_artwork: GameArtworkRow[] | null;
}

// ============================================================================
// Character-related types
// ============================================================================

/**
 * Character translation row from character_translations table
 */
export interface CharacterTranslationRow {
  character_id?: string;
  language_code?: string;
  name: string;
  role: string | null;
  description: string | null;
  biography?: string | null;
  weapons?: string | null;
}

/**
 * Game reference for character-game relationship
 */
export interface CharacterGameRef {
  id: string;
  slug: string;
  game_translations: GameTranslationRow[] | null;
}

/**
 * Character-game relationship row from character_games table
 */
export interface CharacterGameRow {
  character_id?: string;
  game_id?: string;
  is_primary: boolean;
  games: CharacterGameRef | null;
}

/**
 * Base character row from characters table
 */
export interface CharacterRow {
  id: string;
  slug: string;
  main_image: string | null;
  background_image?: string | null;
  background_color: string | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Character row with all joined relations
 */
export interface CharacterRowWithRelations extends CharacterRow {
  character_translations: CharacterTranslationRow[] | null;
  character_games: CharacterGameRow[] | null;
}

// ============================================================================
// Profile-related types
// ============================================================================

/**
 * Profile row from profiles table
 */
export interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  preferred_locale: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Library entry row from user_library table
 */
export interface LibraryEntryRow {
  id: string;
  user_id: string;
  game_id: string;
  status: string;
  play_time_hours: number | null;
  rating: number | null;
  notes?: string | null;
  added_at: string;
}

/**
 * Library entry with game details (joined query result)
 */
export interface LibraryEntryWithGame extends LibraryEntryRow {
  games: GameRowWithExtendedRelations | null;
}

// ============================================================================
// Player-related types (for completeness)
// ============================================================================

/**
 * Player profile row (alias for ProfileRow with additional fields)
 */
export interface PlayerRow extends ProfileRow {
  games_count?: number;
}

// ============================================================================
// Utility types for API responses
// ============================================================================

/**
 * Generic paginated query result
 */
export interface PaginatedQueryResult<T> {
  data: T[];
  count: number | null;
}

/**
 * Supabase error shape
 */
export interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}
