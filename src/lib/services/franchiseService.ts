/**
 * Public franchise pages: listing (`list_franchises` RPC, franchises and IGDB
 * collections together) and detail (franchise first, then a collection with
 * the same slug).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchRelatedGameCards } from "@/lib/services/gameDetailMetadata";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { FranchiseDetail, FranchiseKind, FranchisesApiResponse } from "@/types/franchise";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

const MAX_FRANCHISE_GAMES = 200;

interface ListRow {
  kind: FranchiseKind;
  id: string;
  slug: string;
  name: string;
  game_count: number;
  cover_image_url: string | null;
  total_count: number;
}

export async function listFranchises(
  supabase: Client,
  options: { search: string; page: number; limit: number }
): Promise<FranchisesApiResponse> {
  const { data, error } = await supabase.rpc("list_franchises", {
    p_search: options.search.trim() || null,
    p_limit: options.limit,
    p_offset: (options.page - 1) * options.limit,
  });
  if (error) throw new Error(`list_franchises: ${error.message}`);
  const rows = (data ?? []) as ListRow[];
  const totalCount = Number(rows[0]?.total_count ?? 0);
  return {
    franchises: rows.map((row) => ({
      kind: row.kind,
      id: row.id,
      slug: row.slug,
      name: row.name,
      gameCount: Number(row.game_count),
      coverImage: row.cover_image_url,
    })),
    pagination: {
      currentPage: options.page,
      totalPages: Math.ceil(totalCount / options.limit),
      totalCount,
      limit: options.limit,
    },
  };
}

interface EntryRow {
  id: string;
  slug: string;
  name: string | null;
}

const SOURCES: Array<{ kind: FranchiseKind; table: string; linkTable: string; fk: string }> = [
  { kind: "franchise", table: "franchises", linkTable: "game_franchises", fk: "franchise_id" },
  { kind: "series", table: "series", linkTable: "game_series", fk: "series_id" },
];

async function findEntry(supabase: Client, slug: string) {
  for (const source of SOURCES) {
    const { data, error } = await untypedTable(supabase, source.table)
      .select("id, slug, name")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`${source.table}: ${error.message}`);
    const row = data as EntryRow | null;
    if (row?.name) return { source, row };
  }
  return null;
}

async function franchiseDescription(supabase: Client, franchiseId: string, locale: string) {
  const { data } = await untypedTable(supabase, "franchise_translations")
    .select("language_code, description")
    .eq("franchise_id", franchiseId);
  const rows = (data ?? []) as Array<{ language_code: string; description: string | null }>;
  const pick = rows.find((row) => row.language_code === locale) ?? rows.find((row) => row.description);
  return pick?.description?.trim() || null;
}

/** Franchise (or IGDB collection) page data, or null when the slug is unknown or has no visible game. */
export async function getFranchiseDetail(
  supabase: Client,
  slug: string,
  locale: string
): Promise<FranchiseDetail | null> {
  const entry = await findEntry(supabase, slug);
  if (!entry) return null;

  const { data, error } = await untypedTable(supabase, entry.source.linkTable)
    .select("game_id")
    .eq(entry.source.fk, entry.row.id)
    .limit(MAX_FRANCHISE_GAMES);
  if (error) throw new Error(`${entry.source.linkTable}: ${error.message}`);
  const gameIds = ((data ?? []) as Array<{ game_id: string }>).map((row) => row.game_id);

  const [cards, description, coverImage] = await Promise.all([
    fetchRelatedGameCards(supabase, gameIds, locale, { excludeAdult: true }),
    entry.source.kind === "franchise" ? franchiseDescription(supabase, entry.row.id, locale) : null,
    mostPopularCover(supabase, gameIds),
  ]);
  const games = [...cards.values()].sort((a, b) =>
    (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999")
  );
  if (games.length === 0) return null;

  return {
    kind: entry.source.kind,
    id: entry.row.id,
    slug: entry.row.slug,
    name: entry.row.name as string,
    description,
    coverImage,
    games,
  };
}

/** Same visual as the listing: cover of the most popular non-adult game. */
async function mostPopularCover(supabase: Client, gameIds: string[]): Promise<string | null> {
  if (gameIds.length === 0) return null;
  const { data } = await untypedTable(supabase, "games")
    .select("cover_image_url")
    .in("id", gameIds)
    .eq("is_adult", false)
    .not("cover_image_url", "is", null)
    .order("hybrid_popularity_score", { ascending: false, nullsFirst: false })
    .limit(1);
  return ((data ?? []) as Array<{ cover_image_url: string | null }>)[0]?.cover_image_url ?? null;
}
