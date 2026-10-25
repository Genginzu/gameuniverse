/**
 * Options of the IGDB metadata filters of the games listing: every theme,
 * game mode and perspective, plus the names of the requested engine and
 * franchise (or series) slugs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { untypedTable } from "@/lib/utils/untypedTable";
import type { GameMetadataFilterOptions, MetadataFilterOption } from "@/types/game-metadata";

const MAX_RESOLVED_SLUGS = 20;

interface ReferenceRow {
  igdb_id: number | null;
  slug: string | null;
  name: string | null;
}

function toOptions(rows: ReferenceRow[]): MetadataFilterOption[] {
  return rows
    .filter((row) => row.slug && row.name)
    .map((row) => ({ slug: row.slug as string, igdbId: row.igdb_id, name: row.name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function referenceRows(
  supabase: SupabaseClient,
  table: string,
  slugs?: string[]
): Promise<MetadataFilterOption[]> {
  if (slugs && slugs.length === 0) return [];
  let query = untypedTable(supabase, table).select("igdb_id, slug, name");
  if (slugs) query = query.in("slug", slugs.slice(0, MAX_RESOLVED_SLUGS));
  const { data, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return toOptions((data ?? []) as ReferenceRow[]);
}

export async function fetchMetadataFilterOptions(
  supabase: SupabaseClient,
  requested: { engines: string[]; franchises: string[] }
): Promise<GameMetadataFilterOptions> {
  const [themes, gameModes, perspectives, engines, franchises, series] = await Promise.all([
    referenceRows(supabase, "themes"),
    referenceRows(supabase, "game_modes"),
    referenceRows(supabase, "player_perspectives"),
    referenceRows(supabase, "game_engines", requested.engines),
    referenceRows(supabase, "franchises", requested.franchises),
    referenceRows(supabase, "series", requested.franchises),
  ]);
  const franchiseSlugs = new Set(franchises.map((option) => option.slug));
  return {
    themes,
    gameModes,
    perspectives,
    engines,
    franchises: [...franchises, ...series.filter((option) => !franchiseSlugs.has(option.slug))],
  };
}
