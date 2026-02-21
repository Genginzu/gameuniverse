/**
 * Hybrid Search Types
 * Types for the hybrid search system combining Supabase and IGDB results
 */

export interface HybridSearchRequest {
  query: string;
  locale?: string;
  localLimit?: number;
  igdbLimit?: number;
}

export interface HybridSearchResponse {
  results: SearchResultItem[];
  localCount: number;
  igdbCount: number;
  hasMore: boolean;
  /** Warnings from partial failures (e.g. IGDB unavailable) */
  warnings?: string[];
}

export interface SearchResultItem {
  id: string;
  igdbId?: number;
  slug: string;
  title: string;
  coverUrl?: string;
  developer?: string;
  releaseYear?: number;
  source: "local" | "igdb";
}
