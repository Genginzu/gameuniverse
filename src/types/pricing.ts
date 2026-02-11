/**
 * Custom TypeScript interfaces for the game pricing system.
 * These types extend the base database types with enriched data and function responses.
 */

import type { Database, Json } from "../lib/database.types";

// Base database types
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type GamePrice = Database["public"]["Tables"]["game_prices"]["Row"];
export type StoreInsert = Database["public"]["Tables"]["stores"]["Insert"];
export type GamePriceInsert = Database["public"]["Tables"]["game_prices"]["Insert"];
export type StoreUpdate = Database["public"]["Tables"]["stores"]["Update"];
export type GamePriceUpdate = Database["public"]["Tables"]["game_prices"]["Update"];

/**
 * Enriched game price with populated store information.
 * Used when displaying prices with full store details.
 */
export interface EnrichedGamePrice extends GamePrice {
  /** Populated store information */
  store: Store;
}

/**
 * Response type for the get_game_prices database function.
 * Includes flattened store information for efficient queries.
 */
export interface GamePriceResponse {
  id: string;
  game_id: string;
  store_id: string;
  price: number;
  currency: string;
  platform: string;
  store_url: string | null;
  is_available: boolean;
  last_updated: string;
  created_at: string;
  /** Store name from joined query */
  store_name: string;
  /** Store website URL from joined query */
  store_website_url: string | null;
  /** Store logo URL from joined query */
  store_logo_url: string | null;
}

/**
 * Response type for the get_best_price database function.
 * Returns the single best price for a game with store information.
 */
export interface BestPriceResponse extends GamePriceResponse {
  // Inherits all fields from GamePriceResponse
}

/**
 * Response type for the compare_game_prices database function.
 * Provides comprehensive price comparison data for a game.
 */
export interface GamePriceComparison {
  game_id: string;
  currency: string;
  /** Lowest price found across all stores */
  best_price: number;
  /** Highest price found across all stores */
  worst_price: number;
  /** Average price across all stores */
  average_price: number;
  /** Difference between highest and lowest price */
  price_range: number;
  /** Number of stores with prices for this game */
  total_stores: number;
  /** Detailed store information with prices */
  stores_with_prices: Json;
}

/**
 * Detailed price comparison with individual store prices.
 * Used for displaying comprehensive price comparison tables.
 */
export interface DetailedPriceComparison {
  game_id: string;
  /** All available prices for the game */
  prices: GamePriceResponse[];
  /** The best (lowest) price option */
  best_price?: GamePriceResponse;
  /** Price statistics */
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  /** Number of stores offering the game */
  store_count: number;
}

/**
 * Store statistics response from get_store_stats function.
 * Provides analytics data for a specific store.
 */
export interface StoreStats {
  store_id: string;
  store_name: string;
  /** Total number of games available in this store */
  total_games: number;
  /** Lowest price in the store */
  lowest_price: number;
  /** Highest price in the store */
  highest_price: number;
  /** Average price across all games in the store */
  average_price: number;
  /** Timestamp of the most recent price update */
  last_price_update: string;
}

/**
 * Price filter options for querying game prices.
 * Used with get_game_prices function.
 */
export interface PriceFilters {
  /** Filter by specific store */
  store_filter?: string;
  /** Filter by specific platform */
  platform_filter?: string;
  /** Only include available prices */
  available_only?: boolean;
}

/**
 * Store creation/update payload with validation.
 * Used for store management operations.
 */
export interface StorePayload {
  name: string;
  website_url?: string;
  logo_url?: string;
  is_active?: boolean;
}

/**
 * Game price creation payload.
 * Used when adding new prices to the system.
 */
export interface GamePricePayload {
  game_id: string;
  store_id: string;
  price: number;
  currency?: string;
  platform: string;
  store_url?: string;
  is_available?: boolean;
}

/**
 * Response from store validation function.
 * Used to validate store data before creation/update.
 */
export interface StoreValidationResponse {
  is_valid: boolean;
  error_message: string | null;
}

/**
 * Response from store creation function.
 * Includes success status and created store ID.
 */
export interface StoreCreationResponse {
  success: boolean;
  message: string;
  store_id?: string;
}

/**
 * Response from store update function.
 * Indicates success/failure of update operation.
 */
export interface StoreUpdateResponse {
  success: boolean;
  message: string;
}

// Json type is already exported via supabase.ts barrel export
