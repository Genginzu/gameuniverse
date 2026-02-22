import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { CollectionSummary, CollectionDetail, CollectionItem } from "@/types/collection";

// Tables not yet in generated Supabase types (migration applied but types not regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/** Raw row from the collections list query */
interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  cover_image_url: string | null;
  game_collection_items: Array<{
    game_id: string;
    games: { cover_image_url: string | null } | null;
  }>;
}

/** Raw row from the collection detail query */
export interface CollectionDetailRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  game_collection_items: Array<{
    id: string;
    game_id: string;
    position: number;
    note: string | null;
    added_at: string;
    games: {
      id: string;
      slug: string;
      cover_image_url: string | null;
      game_translations: Array<{ title: string; language_code: string }>;
      game_genres: Array<{
        genres: {
          genre_translations: Array<{ name: string; language_code: string }>;
        };
      }>;
    } | null;
  }>;
}

function transformCollectionRow(row: CollectionRow): CollectionSummary {
  const items = row.game_collection_items || [];
  const coverImages = items
    .map((item) => item.games?.cover_image_url)
    .filter((url): url is string => url !== null)
    .slice(0, 4);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isPublic: row.is_public,
    gamesCount: items.length,
    updatedAt: row.updated_at,
    coverImages,
    coverImageUrl: row.cover_image_url,
  };
}

function transformDetailItem(
  item: CollectionDetailRow["game_collection_items"][number],
  locale: string
): CollectionItem | null {
  const game = item.games;
  if (!game) return null;

  const translation =
    game.game_translations?.find((t) => t.language_code === locale) || game.game_translations?.[0];

  const genres = (game.game_genres || [])
    .map((gg) => {
      const genreTranslation =
        gg.genres?.genre_translations?.find((t) => t.language_code === locale) ||
        gg.genres?.genre_translations?.[0];
      return genreTranslation ? { name: genreTranslation.name } : null;
    })
    .filter((g): g is { name: string } => g !== null);

  return {
    id: item.id,
    gameId: item.game_id,
    slug: game.slug,
    title: translation?.title || "Unknown",
    coverImage: game.cover_image_url,
    genres,
    note: item.note,
    position: item.position,
    addedAt: item.added_at,
  };
}

/**
 * Liste les collections d'un joueur avec filtrage par visibilité.
 * Le propriétaire voit toutes ses collections ; les autres ne voient que les publiques.
 */
export async function fetchCollections(
  playerId: string,
  currentUserId?: string,
  _locale?: string
): Promise<CollectionSummary[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("game_collections" as UntypedFrom)
    .select(
      `
      id, name, slug, description, is_public, updated_at, cover_image_url,
      game_collection_items(
        game_id,
        games(cover_image_url)
      )
    `
    )
    .eq("user_id", playerId)
    .order("updated_at", { ascending: false });

  if (currentUserId !== playerId) {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "PGRST205") {
      logger.warn("game_collections table not found - migration not applied yet");
      return [];
    }
    throw error;
  }

  return ((data ?? []) as unknown as CollectionRow[]).map(transformCollectionRow);
}

/**
 * Récupère le détail d'une collection avec ses jeux ordonnés par position.
 * Retourne null si la collection n'existe pas ou est privée pour un non-propriétaire.
 */
export async function fetchCollectionDetail(
  playerId: string,
  slug: string,
  currentUserId?: string,
  locale: string = "fr"
): Promise<CollectionDetail | null> {
  const supabase = await createServerClient();

  let query = supabase
    .from("game_collections" as UntypedFrom)
    .select(
      `
      id, user_id, name, slug, description, is_public, cover_image_url, created_at, updated_at,
      game_collection_items(
        id, game_id, position, note, added_at,
        games(
          id, slug, cover_image_url,
          game_translations(title, language_code),
          game_genres(genres(genre_translations(name, language_code)))
        )
      )
    `
    )
    .eq("user_id", playerId)
    .eq("slug", slug);

  if (currentUserId !== playerId) {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116" || error.code === "PGRST205") return null;
    throw error;
  }
  if (!data) return null;

  const row = data as unknown as CollectionDetailRow;

  // Fetch owner profile separately (no FK from game_collections to profiles)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", row.user_id)
    .single();

  const items = (row.game_collection_items || [])
    .map((item) => transformDetailItem(item, locale))
    .filter((item): item is CollectionItem => item !== null)
    .sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    isPublic: row.is_public,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    owner: {
      id: profile?.id || row.user_id,
      fullName: profile?.username || null,
      avatarUrl: profile?.avatar_url || null,
    },
    items,
  };
}
