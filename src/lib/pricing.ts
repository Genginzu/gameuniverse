/**
 * Utility functions for game pricing operations
 * These functions interact with the database pricing functions
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type {
  GamePriceResponse,
  BestPriceResponse,
  GamePriceComparison,
  Store,
  StoreCreationResponse,
  PriceFilters,
  StorePayload,
} from "@/types/pricing";

// Create a Supabase client for database operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
);

/**
 * Get all prices for a game with optional filters
 */
export async function getGamePrices(
  gameId: string,
  filters?: PriceFilters
): Promise<GamePriceResponse[]> {
  const { data, error } = await supabase.rpc("get_game_prices", {
    game_uuid: gameId,
    store_filter: filters?.store_filter || undefined,
    platform_filter: filters?.platform_filter || undefined,
  });

  if (error) {
    throw new Error(`Failed to get game prices: ${error.message}`);
  }

  return data || [];
}

/**
 * Get the best price for a game
 */
export async function getBestPrice(gameId: string): Promise<BestPriceResponse | null> {
  const { data, error } = await supabase.rpc("get_best_price", {
    game_uuid: gameId,
  });

  if (error) {
    throw new Error(`Failed to get best price: ${error.message}`);
  }

  return data?.[0] || null;
}

/**
 * Compare prices for a game across all stores
 */
export async function compareGamePrices(gameId: string): Promise<GamePriceComparison | null> {
  const { data, error } = await supabase.rpc("compare_game_prices", {
    game_uuid: gameId,
  });

  if (error) {
    throw new Error(`Failed to compare game prices: ${error.message}`);
  }

  return data?.[0] || null;
}

/**
 * Get all active stores
 */
export async function getActiveStores(): Promise<Store[]> {
  const { data, error } = await supabase.rpc("get_active_stores");

  if (error) {
    throw new Error(`Failed to get active stores: ${error.message}`);
  }

  return data || [];
}

/**
 * Search stores by name or URL
 */
export async function searchStores(searchTerm: string): Promise<Store[]> {
  const { data, error } = await supabase.rpc("search_stores", {
    search_term: searchTerm,
  });

  if (error) {
    throw new Error(`Failed to search stores: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new store
 */
export async function createStore(storeData: StorePayload): Promise<StoreCreationResponse> {
  const { data, error } = await supabase.rpc("create_store", {
    store_name: storeData.name,
    website_url: storeData.website_url || undefined,
    logo_url: storeData.logo_url || undefined,
  });

  if (error) {
    throw new Error(`Failed to create store: ${error.message}`);
  }

  const result = data?.[0];
  return {
    success: result?.success || false,
    store_id: result?.store_id || undefined,
    message: result?.message || "Unknown error",
  };
}
/**
 * Get store statistics
 */
export async function getStoreStats(storeId: string) {
  const { data, error } = await supabase.rpc("get_store_stats", {
    store_uuid: storeId,
  });

  if (error) {
    throw new Error(`Failed to get store stats: ${error.message}`);
  }

  return data?.[0] || null;
}

/**
 * Update an existing store
 */
export async function updateStore(storeId: string, updates: Partial<StorePayload>) {
  const { data, error } = await supabase.rpc("update_store", {
    store_id: storeId,
    store_name: updates.name || undefined,
    website_url: updates.website_url || undefined,
    logo_url: updates.logo_url || undefined,
    is_active: updates.is_active ?? undefined,
  });

  if (error) {
    throw new Error(`Failed to update store: ${error.message}`);
  }

  const result = data?.[0];
  return {
    success: result?.success || false,
    message: result?.message || "Unknown error",
  };
}

/**
 * Validate store data before creation/update
 */
export async function validateStoreData(storeData: StorePayload) {
  const { data, error } = await supabase.rpc("validate_store_data", {
    store_name: storeData.name,
    website_url: storeData.website_url || undefined,
    logo_url: storeData.logo_url || undefined,
  });

  if (error) {
    throw new Error(`Failed to validate store data: ${error.message}`);
  }

  return data?.[0] || { is_valid: false, error_message: "Unknown error" };
}

/**
 * Create a detailed price comparison for a game
 * This combines multiple database calls to provide comprehensive comparison data
 */
export async function createDetailedPriceComparison(gameId: string) {
  const [prices, comparison] = await Promise.all([
    getGamePrices(gameId),
    compareGamePrices(gameId),
  ]);

  if (!prices.length) {
    return null;
  }

  const bestPrice = prices.reduce((best, current) => (current.price < best.price ? current : best));

  return {
    game_id: gameId,
    prices,
    best_price: bestPrice,
    price_range: {
      min: comparison?.best_price || bestPrice.price,
      max: comparison?.worst_price || bestPrice.price,
      currency: bestPrice.currency,
    },
    store_count: prices.length,
  };
}
