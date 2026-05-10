import type {
  GlobalSearchCoachItem,
  GlobalSearchProPlayerItem,
  GlobalSearchRequest,
  GlobalSearchResponse,
  GlobalSearchResult,
  GlobalSearchTeamItem,
} from "@/types/global-search";
import { CharacterService } from "./characterService";
import { HybridSearchService } from "./hybridSearchService";
import { PlayerService } from "./playerService";
import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_LIMIT = 5;

// Supabase typed client returns `never` for our custom tables since the
// generated types don't yet cover esport_* and coach_profiles. Cast to a
// loose any-typed builder for these queries; the row shapes are validated
// manually via the *Row interfaces below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

// ============================================================================
// Database row shapes (manual mapping)
// ============================================================================

interface TeamRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  game: string | null;
}

interface ProPlayerRow {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  image_url: string | null;
  role: string | null;
  game: string | null;
  esport_teams: { name: string | null } | { name: string | null }[] | null;
}

interface CoachRow {
  id: string;
  is_verified: boolean;
  average_rating: number | string | null;
  total_reviews: number | null;
  profiles:
    | { username: string | null; avatar_url: string | null }
    | { username: string | null; avatar_url: string | null }[]
    | null;
}

// ============================================================================
// Mappers (DB row → public search item)
// ============================================================================

function mapTeam(row: TeamRow): GlobalSearchTeamItem | null {
  if (row.pandascore_id === null) return null;
  return {
    id: row.pandascore_id,
    name: row.name,
    slug: row.slug,
    acronym: row.acronym ?? undefined,
    imageUrl: row.image_url ?? undefined,
    location: row.location ?? undefined,
    game: row.game ?? undefined,
  };
}

function mapProPlayer(row: ProPlayerRow): GlobalSearchProPlayerItem | null {
  if (row.pandascore_id === null) return null;
  // Supabase returns the joined relation either as an object or an array
  // depending on the FK direction. Normalize to a single object.
  const teamRel = Array.isArray(row.esport_teams) ? row.esport_teams[0] : row.esport_teams;
  return {
    id: row.pandascore_id,
    name: row.name,
    slug: row.slug,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    nationality: row.nationality ?? undefined,
    imageUrl: row.image_url ?? undefined,
    role: row.role ?? undefined,
    game: row.game ?? undefined,
    teamName: teamRel?.name ?? undefined,
  };
}

function mapCoach(row: CoachRow): GlobalSearchCoachItem | null {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  // A coach without a username can't be linked to /coaching/[username] → drop.
  if (!profile?.username) return null;
  return {
    id: row.id,
    username: profile.username,
    avatarUrl: profile.avatar_url ?? undefined,
    averageRating: row.average_rating !== null ? Number(row.average_rating) : 0,
    totalReviews: row.total_reviews ?? 0,
    isVerified: row.is_verified,
  };
}

/**
 * Orchestrates parallel search across games, characters, players, esport
 * teams, esport pro players, and coaches. Reuses existing services when
 * available and queries Supabase directly for the new entities (since they
 * don't currently expose a search-specific listing API).
 */
export class GlobalSearchService {
  /**
   * Executes a global search across all entity types in parallel.
   * If one source fails, results from other sources are still returned.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.5 + F0-07d (esport teams/pro players, coaches)
   */
  static async search(request: GlobalSearchRequest): Promise<GlobalSearchResult> {
    const {
      query,
      locale = "fr",
      gamesLimit,
      charactersLimit = DEFAULT_LIMIT,
      playersLimit = DEFAULT_LIMIT,
      teamsLimit = DEFAULT_LIMIT,
      proPlayersLimit = DEFAULT_LIMIT,
      coachesLimit = DEFAULT_LIMIT,
    } = request;

    const [
      gamesResult,
      charactersResult,
      playersResult,
      teamsResult,
      proPlayersResult,
      coachesResult,
    ] = await Promise.allSettled([
      this.searchGames(query, locale, gamesLimit),
      this.searchCharacters(query, locale, charactersLimit),
      this.searchPlayers(query, playersLimit),
      this.searchTeams(query, teamsLimit),
      this.searchProPlayers(query, proPlayersLimit),
      this.searchCoaches(query, coachesLimit),
    ]);

    const errors: string[] = [];

    const games =
      gamesResult.status === "fulfilled"
        ? gamesResult.value
        : {
            local: [] as GlobalSearchResult["games"]["local"],
            igdb: [] as GlobalSearchResult["games"]["igdb"],
          };

    if (gamesResult.status === "rejected") {
      const message = `Games search failed: ${String(gamesResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const characters = charactersResult.status === "fulfilled" ? charactersResult.value : [];

    if (charactersResult.status === "rejected") {
      const message = `Characters search failed: ${String(charactersResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const players = playersResult.status === "fulfilled" ? playersResult.value : [];

    if (playersResult.status === "rejected") {
      const message = `Players search failed: ${String(playersResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const teams = teamsResult.status === "fulfilled" ? teamsResult.value : [];

    if (teamsResult.status === "rejected") {
      const message = `Teams search failed: ${String(teamsResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const proPlayers = proPlayersResult.status === "fulfilled" ? proPlayersResult.value : [];

    if (proPlayersResult.status === "rejected") {
      const message = `Pro players search failed: ${String(proPlayersResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    const coaches = coachesResult.status === "fulfilled" ? coachesResult.value : [];

    if (coachesResult.status === "rejected") {
      const message = `Coaches search failed: ${String(coachesResult.reason)}`;
      logger.error(message);
      errors.push(message);
    }

    // Correlate: if games matched, also fetch characters linked to those games
    const enrichedCharacters = await this.enrichCharactersWithGameCorrelation(
      characters,
      games.local,
      locale,
      charactersLimit
    );

    return {
      games,
      characters: enrichedCharacters,
      players,
      teams,
      proPlayers,
      coaches,
      errors,
    };
  }

  /**
   * Transforms raw GlobalSearchResult into the API-ready GlobalSearchResponse.
   * Maps each entity type to its display-oriented format and computes counts.
   *
   * Requirements: 6.1, 6.2, 6.3, 8.2, 8.3
   */
  static toGlobalSearchResponse(result: GlobalSearchResult): GlobalSearchResponse {
    const localGames = result.games.local.map((game) => ({
      id: game.id,
      igdbId: game.igdbId,
      slug: game.slug,
      title: game.title,
      coverUrl: game.coverImage,
      developer: game.developer || undefined,
      releaseYear: game.releaseYear,
      source: "local" as const,
    }));

    const igdbGames = result.games.igdb.map((game) => ({
      id: String(game.id),
      igdbId: game.id,
      slug: game.slug,
      title: game.name,
      coverUrl: game.cover_url,
      developer: game.developer,
      releaseYear: game.release_year,
      source: "igdb" as const,
    }));

    // Sort by release year descending (newest first), games without year go last
    const games = [...localGames, ...igdbGames].sort((a, b) => {
      if (!a.releaseYear && !b.releaseYear) return 0;
      if (!a.releaseYear) return 1;
      if (!b.releaseYear) return -1;
      return b.releaseYear - a.releaseYear;
    });

    const characters = result.characters.map((character) => ({
      id: character.id,
      slug: character.slug,
      name: character.name,
      mainImage: character.mainImage,
      role: character.role,
      primaryGame: character.primaryGame,
    }));

    const players = result.players.map((player) => ({
      id: player.id,
      username: player.fullName ?? player.id,
      avatarUrl: player.avatarUrl ?? undefined,
    }));

    // teams, proPlayers, coaches are already in their public shape
    const teams = result.teams;
    const proPlayers = result.proPlayers;
    const coaches = result.coaches;

    return {
      games,
      characters,
      players,
      teams,
      proPlayers,
      coaches,
      counts: {
        games: games.length,
        characters: characters.length,
        players: players.length,
        teams: teams.length,
        proPlayers: proPlayers.length,
        coaches: coaches.length,
      },
    };
  }

  /**
   * Searches games via HybridSearchService (local Supabase + IGDB).
   * Returns all matching games from both local DB and IGDB.
   */
  private static async searchGames(
    query: string,
    locale: string,
    limit?: number
  ): Promise<GlobalSearchResult["games"]> {
    // No limit = fetch all matching games (10000 local, 499 IGDB max)
    const effectiveLimit = limit ?? 10000;

    const result = await HybridSearchService.search({
      query,
      locale,
      localLimit: effectiveLimit,
      igdbLimit: 499,
    });

    return {
      local: result.localGames,
      igdb: result.igdbGames,
    };
  }

  /**
   * Searches characters via CharacterService.
   */
  private static async searchCharacters(
    query: string,
    locale: string,
    limit: number
  ): Promise<GlobalSearchResult["characters"]> {
    const result = await CharacterService.fetchCharacters({
      search: query,
      locale,
      limit,
      page: 1,
    });

    return result.characters;
  }

  /**
   * Searches players via PlayerService.
   */
  private static async searchPlayers(
    query: string,
    limit: number
  ): Promise<GlobalSearchResult["players"]> {
    const result = await PlayerService.fetchPlayersFromDB({
      search: query,
      limit,
      page: 1,
    });

    return result.players;
  }

  /**
   * Searches esport teams in `public.esport_teams` by name (ILIKE).
   * Filters out teams without a `pandascore_id` since they can't link to
   * `/esport/teams/[id]`.
   *
   * Requirement: F0-07d.
   */
  private static async searchTeams(
    query: string,
    limit: number
  ): Promise<GlobalSearchTeamItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as UntypedFrom)
      .from("esport_teams")
      .select("id, pandascore_id, name, slug, acronym, image_url, location, game")
      .ilike("name", `%${trimmed}%`)
      .order("name", { ascending: true })
      .limit(Math.max(1, limit));

    if (error) throw error;

    return ((data as TeamRow[] | null) ?? [])
      .map(mapTeam)
      .filter((t): t is GlobalSearchTeamItem => t !== null);
  }

  /**
   * Searches esport pro players in `public.esport_players` by name (ILIKE).
   * Joins `esport_teams` to attach the current team's name. Filters out
   * players without a `pandascore_id` since they can't link to
   * `/esport/players/[id]`.
   *
   * Requirement: F0-07d.
   */
  private static async searchProPlayers(
    query: string,
    limit: number
  ): Promise<GlobalSearchProPlayerItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as UntypedFrom)
      .from("esport_players")
      .select(
        "id, pandascore_id, name, slug, first_name, last_name, nationality, image_url, role, game, esport_teams(name)"
      )
      .ilike("name", `%${trimmed}%`)
      .order("name", { ascending: true })
      .limit(Math.max(1, limit));

    if (error) throw error;

    return ((data as ProPlayerRow[] | null) ?? [])
      .map(mapProPlayer)
      .filter((p): p is GlobalSearchProPlayerItem => p !== null);
  }

  /**
   * Searches active coaches by their public username (joined from `profiles`).
   * Strategy: first resolve matching `profiles.username` ILIKE → list of
   * `player_id`s, then fetch `coach_profiles` rows where `is_active = true`
   * and `player_id IN (...)`. Inactive coaches are excluded.
   *
   * Requirement: F0-07d.
   */
  private static async searchCoaches(
    query: string,
    limit: number
  ): Promise<GlobalSearchCoachItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const supabase = getSupabaseAdmin();

    // Step 1: profile usernames matching the query
    const { data: profileMatches, error: profileError } = await (supabase as UntypedFrom)
      .from("profiles")
      .select("id")
      .ilike("username", `%${trimmed}%`)
      .limit(Math.max(1, limit) * 4); // fetch a few extra to compensate for inactive filter

    if (profileError) throw profileError;
    const playerIds = ((profileMatches as { id: string }[] | null) ?? []).map((p) => p.id);
    if (playerIds.length === 0) return [];

    // Step 2: corresponding active coach profiles, with their public profile data
    const { data, error } = await (supabase as UntypedFrom)
      .from("coach_profiles")
      .select(
        "id, is_verified, average_rating, total_reviews, profiles!coach_profiles_player_id_fkey(username, avatar_url)"
      )
      .eq("is_active", true)
      .in("player_id", playerIds)
      .order("average_rating", { ascending: false, nullsFirst: false })
      .limit(Math.max(1, limit));

    if (error) throw error;

    return ((data as CoachRow[] | null) ?? [])
      .map(mapCoach)
      .filter((c): c is GlobalSearchCoachItem => c !== null);
  }

  /**
   * Enriches character results with characters linked to matched local games.
   * Deduplicates by character ID, keeping name-matched characters first.
   */
  private static async enrichCharactersWithGameCorrelation(
    nameMatchedCharacters: GlobalSearchResult["characters"],
    localGames: GlobalSearchResult["games"]["local"],
    locale: string,
    limit: number
  ): Promise<GlobalSearchResult["characters"]> {
    if (localGames.length === 0) return nameMatchedCharacters;

    const gameIds = localGames.map((g) => g.id);

    try {
      // Fetch a larger batch because fetchCharactersFromDB post-filters by game ID
      const result = await CharacterService.fetchCharactersFromDB({
        games: gameIds,
        locale,
        limit: 50,
        page: 1,
      });

      // Deduplicate: name-matched characters take priority
      const existingIds = new Set(nameMatchedCharacters.map((c) => c.id));
      const gameCorrelated = result.characters.filter((c) => !existingIds.has(c.id));

      return [...nameMatchedCharacters, ...gameCorrelated].slice(0, limit);
    } catch (error) {
      logger.error("Game-character correlation failed", { error });
      return nameMatchedCharacters;
    }
  }
}
