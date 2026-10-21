/**
 * Server-side queries feeding the logged-out landing (`GET /api/home`):
 * real platform counts, popular characters and recent public reviews.
 * Every query runs with the anonymous route client so RLS stays the perimeter.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { pickTranslation, pickTranslationWithName } from "@/lib/utils/pickTranslation";
import { enrichReviewsWithVotes, fetchVoteCountsMap } from "@/lib/utils/reviewVoteQueries";
import { toReviewExcerptHtml } from "@/lib/utils/reviewExcerpt";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { CharacterSummary } from "@/types/character";
import type { HomeReviewPreview, HomeStats } from "@/types/home";
import type { Review, VoteType } from "@/types/review";
import type { CharacterRowWithRelations } from "@/types/supabase-queries";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

const STAT_TABLES = {
  games: "games",
  characters: "characters",
  players: "profiles",
  reviews: "game_reviews",
} as const satisfies Record<keyof HomeStats, string>;

interface ReviewPreviewRow {
  id: string;
  user_id: string | null;
  game_id: string;
  rating: number;
  content: string;
  positive_points: string[] | null;
  negative_points: string[] | null;
  created_at: string;
  updated_at: string;
  games: {
    slug: string;
    game_translations: { language_code: string; title: string }[] | null;
  } | null;
}

interface ProfilePreviewRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

async function countRows(supabase: AnySupabaseClient, table: string): Promise<number | null> {
  const { count, error } = await untypedTable(supabase, table).select("id", {
    count: "exact",
    head: true,
  });
  return error || typeof count !== "number" ? null : count;
}

/** Returns `null` as soon as one count is unavailable: no partial or fake numbers. */
export async function fetchHomeStats(supabase: AnySupabaseClient): Promise<HomeStats | null> {
  const [games, characters, players, reviews] = await Promise.all([
    countRows(supabase, STAT_TABLES.games),
    countRows(supabase, STAT_TABLES.characters),
    countRows(supabase, STAT_TABLES.players),
    countRows(supabase, STAT_TABLES.reviews),
  ]);
  if (games === null || characters === null || players === null || reviews === null) return null;

  return { games, characters, players, reviews };
}

export function toCharacterSummary(
  character: CharacterRowWithRelations,
  locale: string
): CharacterSummary | null {
  const translation = pickTranslationWithName(character.character_translations, locale);
  if (!translation?.name?.trim()) return null;

  const games = character.character_games ?? [];
  const primary = games.find((relation) => relation.is_primary) ?? games[0];
  const gameTitles = primary?.games?.game_translations ?? [];
  const gameTitle = gameTitles.find((title) => title.language_code === locale) ?? gameTitles[0];

  return {
    id: character.id,
    slug: character.slug,
    name: translation.name,
    role: translation.role ?? undefined,
    mainImage: character.main_image ?? undefined,
    primaryGame: gameTitle?.title ?? undefined,
    gamesCount: games.length,
  };
}

/** Most viewed characters that have an image, for the characters preview. */
export async function fetchPopularCharacters(
  supabase: AnySupabaseClient,
  locale: string,
  limit = 4
): Promise<CharacterSummary[]> {
  const { data, error } = await untypedTable(supabase, "characters")
    .select(
      `id, slug, main_image, background_color, created_at,
       character_translations(language_code, name, role, description),
       character_games(is_primary, games(id, slug, game_translations(title)))`
    )
    .eq("character_games.games.game_translations.language_code", locale)
    .not("main_image", "is", null)
    .order("view_count", { ascending: false })
    .limit(limit * 2);

  if (error || !data) return [];

  return (data as unknown as CharacterRowWithRelations[])
    .map((character) => toCharacterSummary(character, locale))
    .filter((character): character is CharacterSummary => character !== null)
    .slice(0, limit);
}

async function fetchProfiles(
  supabase: AnySupabaseClient,
  userIds: string[]
): Promise<Map<string, ProfilePreviewRow>> {
  const profiles = new Map<string, ProfilePreviewRow>();
  if (userIds.length === 0) return profiles;

  const { data } = await untypedTable(supabase, "profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  for (const row of (data ?? []) as unknown as ProfilePreviewRow[]) profiles.set(row.id, row);
  return profiles;
}

function toReview(row: ReviewPreviewRow, profiles: Map<string, ProfilePreviewRow>): Review {
  const profile = row.user_id ? profiles.get(row.user_id) : undefined;
  return {
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    rating: row.rating,
    content: `<p>${toReviewExcerptHtml(row.content)}</p>`,
    positivePoints: row.positive_points ?? [],
    negativePoints: row.negative_points ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    playerName: profile?.username ?? null,
    playerAvatar: profile?.avatar_url ?? null,
  };
}

/** Latest public reviews with author, game and vote counts, for the reviews preview. */
export async function fetchRecentReviews(
  supabase: AnySupabaseClient,
  locale: string,
  limit = 2
): Promise<HomeReviewPreview[]> {
  const { data, error } = await untypedTable(supabase, "game_reviews")
    .select(
      `id, user_id, game_id, rating, content, positive_points, negative_points,
       created_at, updated_at, games(slug, game_translations(language_code, title))`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as unknown as ReviewPreviewRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => !!id))];
  const [profiles, voteCounts] = await Promise.all([
    fetchProfiles(supabase, userIds),
    fetchVoteCountsMap(
      supabase,
      rows.map((row) => row.id)
    ),
  ]);

  const reviews = enrichReviewsWithVotes(
    rows.map((row) => toReview(row, profiles)),
    voteCounts,
    new Map<string, VoteType>()
  );

  return reviews.map((review, index) => {
    const game = rows[index].games;
    return {
      ...review,
      gameTitle: pickTranslation(game?.game_translations, locale)?.title ?? null,
      gameSlug: game?.slug ?? null,
    };
  });
}
