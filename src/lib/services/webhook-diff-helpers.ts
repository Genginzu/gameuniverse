/**
 * Helper functions for computing webhook diff between IGDB payload and local DB.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { untypedTable } from "@/lib/utils/untypedTable";

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

/** Build a cover URL from an IGDB image_id */
export function igdbCoverUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

/** Build a 1080p URL from an IGDB image_id */
export function igdb1080pUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg`;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Format a unix timestamp (seconds) to YYYY-MM-DD */
export function unixToDate(ts: number): string {
  return new Date(ts * 1000).toISOString().split("T")[0];
}

/** Normalize a local date column to YYYY-MM-DD */
export function normalizeDate(d: string): string {
  return d.length > 10 ? d.split("T")[0] : d;
}

/** Sort an array of strings for stable comparison */
export function sorted(arr: string[]): string[] {
  return [...arr].sort();
}

// ---------------------------------------------------------------------------
// Relational data fetchers
// ---------------------------------------------------------------------------

export async function fetchLocalGenres(
  supabase: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("game_genres")
    .select("genre_id, genres(slug)")
    .eq("game_id", gameId);
  return (data ?? []).map((r) => {
    const genre = r.genres as unknown as { slug: string } | null;
    return genre?.slug ?? (r.genre_id as string);
  });
}

export async function fetchLocalPlatforms(
  supabase: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("game_platforms")
    .select("platform_id, platforms(igdb_id, slug)")
    .eq("game_id", gameId);
  return (data ?? []).map((r) => {
    const platform = r.platforms as unknown as { slug: string } | null;
    return platform?.slug ?? (r.platform_id as string);
  });
}

export async function fetchLocalCompanies(
  supabase: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("game_companies")
    .select("company_id, role, companies(slug)")
    .eq("game_id", gameId);
  return (data ?? []).map((r) => {
    const company = r.companies as unknown as { slug: string } | null;
    return `${company?.slug ?? r.company_id}:${r.role}`;
  });
}

export async function fetchLocalScreenshots(
  supabase: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("game_screenshots")
    .select("url")
    .eq("game_id", gameId)
    .order("display_order");
  return (data ?? []).map((r) => r.url as string);
}

export async function fetchLocalArtworks(
  supabase: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("game_artwork")
    .select("url")
    .eq("game_id", gameId)
    .order("display_order");
  return (data ?? []).map((r) => r.url as string);
}

export async function fetchLocalVideos(
  supabase: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("game_videos")
    .select("youtube_id, title")
    .eq("game_id", gameId)
    .order("display_order");
  return (data ?? []).map((r) => `${r.youtube_id}:${r.title ?? ""}`);
}

export async function fetchLocalSimilarGamesCount(
  supabase: SupabaseClient,
  gameId: string
): Promise<number> {
  const { count } = await untypedTable(supabase, "game_similar_games")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId);
  return count ?? 0;
}
