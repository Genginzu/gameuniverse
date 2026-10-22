/**
 * Public read of the admin-picked home showcase (`home_showcase_items`),
 * resolved into the shapes the landing previews render.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { transformGames } from "@/lib/services/gameListingHelpers";
import { toCharacterSummary } from "@/lib/services/homeLandingService";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { CharacterSummary } from "@/types/character";
import type { GameSummary } from "@/types/game";
import { SHOWCASE_LIMITS, type HomeShowcaseGame, type ShowcaseLibraryStatus } from "@/types/home";
import type { CharacterRowWithRelations, GameRowWithRelations } from "@/types/supabase-queries";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any>;

/** Game columns needed by `transformGames` for the home cards. */
export const HOME_GAME_SELECT = `
  id, slug, igdb_id, cover_image_url, background_image_url, background_color,
  release_date, metascore, created_at,
  game_translations(language_code, title, description),
  game_genres(genres(genre_translations(language_code, name))),
  game_companies(role, is_primary, companies(name))
`;

const CHARACTER_SELECT = `
  id, slug, main_image, background_color, created_at,
  character_translations(language_code, name, role, description),
  character_games(is_primary, games(id, slug, game_translations(language_code, title)))
`;

interface GameShowcaseRow {
  library_status: ShowcaseLibraryStatus | null;
  games: GameRowWithRelations | null;
}

interface CharacterShowcaseRow {
  characters: CharacterRowWithRelations | null;
}

export async function fetchShowcaseGames(
  supabase: AnySupabaseClient,
  locale: string
): Promise<HomeShowcaseGame[]> {
  const { data, error } = await untypedTable(supabase, "home_showcase_items")
    .select(`library_status, games(${HOME_GAME_SELECT})`)
    .eq("kind", "game")
    .order("display_order", { ascending: true })
    .limit(SHOWCASE_LIMITS.game);

  if (error || !data) return [];

  const rows = (data as unknown as GameShowcaseRow[]).filter((row) => row.games !== null);
  const games = transformGames(
    rows.map((row) => row.games as GameRowWithRelations),
    locale,
    []
  ) as unknown as GameSummary[];

  return games.map((game, index) => ({ game, status: rows[index].library_status ?? "owned" }));
}

export async function fetchShowcaseCharacters(
  supabase: AnySupabaseClient,
  locale: string
): Promise<CharacterSummary[]> {
  const { data, error } = await untypedTable(supabase, "home_showcase_items")
    .select(`characters(${CHARACTER_SELECT})`)
    .eq("kind", "character")
    .order("display_order", { ascending: true })
    .limit(SHOWCASE_LIMITS.character);

  if (error || !data) return [];

  return (data as unknown as CharacterShowcaseRow[])
    .map((row) => (row.characters ? toCharacterSummary(row.characters, locale) : null))
    .filter((character): character is CharacterSummary => character !== null);
}
