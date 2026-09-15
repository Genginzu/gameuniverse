import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { estimateGameHours, computeRemainingHours } from "@/lib/services/backlog";
import { logger } from "@/lib/logger";
import type { BacklogGame, BacklogPriority } from "@/types/backlog";

// Statuses excluded from the backlog: a completed game is no longer "to play".
const EXCLUDED_STATUSES = ["completed"];

interface GameTranslationRow {
  title: string;
  language_code: string;
}

interface GenreTranslationRow {
  name: string;
  language_code: string;
}

interface GenreRow {
  id: string;
  slug: string;
  genre_translations: GenreTranslationRow[] | null;
}

interface GameGenreRow {
  genres: GenreRow | null;
}

interface CompanyRow {
  name: string;
}

interface GameCompanyRow {
  role: string;
  is_primary: boolean;
  companies: CompanyRow | null;
}

interface PlatformTranslationRow {
  name: string;
  language_code: string;
}

interface PlatformRow {
  id: string;
  platform_translations: PlatformTranslationRow[] | null;
}

interface GamePlatformRow {
  platforms: PlatformRow | null;
}

interface BacklogGameRow {
  id: string;
  slug: string;
  metascore: number | null;
  cover_image_url: string | null;
  background_color: string | null;
  playtime_hastily: number | null;
  playtime_normally: number | null;
  playtime_completely: number | null;
  game_translations: GameTranslationRow[] | null;
  game_genres: GameGenreRow[] | null;
  game_companies: GameCompanyRow[] | null;
  game_platforms: GamePlatformRow[] | null;
}

interface BacklogEntryRow {
  id: string;
  game_id: string;
  status: string;
  added_at: string;
  play_time_hours: number | null;
  priority: number | null;
  backlog_position: number | null;
  games: BacklogGameRow | null;
}

function normalizePriority(value: number | null): BacklogPriority {
  if (value === 1 || value === 2 || value === 3) return value;
  return 0;
}

function transformEntry(
  entry: BacklogEntryRow,
  playedHoursByGame: Map<string, number>
): BacklogGame | null {
  const game = entry.games;
  if (!game) return null;

  const translation =
    game.game_translations?.find((t) => t.language_code === "fr") || game.game_translations?.[0];

  const genres =
    game.game_genres?.map((gg) => {
      const genre = gg.genres;
      const genreTranslation =
        genre?.genre_translations?.find((gt) => gt.language_code === "fr") ||
        genre?.genre_translations?.[0];
      return {
        id: genre?.id,
        name: genreTranslation?.name || "Unknown Genre",
      };
    }) || [];

  const companies = game.game_companies || [];
  const developer =
    companies.find((c) => c.role === "developer" && c.is_primary) ||
    companies.find((c) => c.role === "developer");

  const platforms =
    game.game_platforms
      ?.map((gp) => {
        const platform = gp.platforms;
        if (!platform) return null;
        const platformTranslation =
          platform.platform_translations?.find((pt) => pt.language_code === "fr") ||
          platform.platform_translations?.[0];
        return { id: platform.id, name: platformTranslation?.name || "Unknown" };
      })
      .filter((p): p is { id: string; name: string } => p !== null) || [];

  const estimatedHours = estimateGameHours({
    hastily: game.playtime_hastily,
    normally: game.playtime_normally,
    completely: game.playtime_completely,
  });

  return {
    id: game.id,
    slug: game.slug,
    title: translation?.title || "Untitled Game",
    coverImage: game.cover_image_url ?? undefined,
    backgroundColor: game.background_color ?? undefined,
    genres,
    platforms,
    developer: developer?.companies?.name || "Unknown Developer",
    metascore: game.metascore ?? undefined,
    status: entry.status,
    addedAt: entry.added_at,
    priority: normalizePriority(entry.priority),
    backlogPosition: entry.backlog_position,
    playTimeHours: entry.play_time_hours ?? 0,
    estimatedHours,
    remainingHours: computeRemainingHours(estimatedHours, playedHoursByGame.get(game.id) ?? 0),
  };
}

/**
 * Sorts the backlog: manually ordered games first (ascending position),
 * then unordered games by priority (desc) and recency (added_at desc).
 */
function sortBacklog(a: BacklogGame, b: BacklogGame): number {
  const aPos = a.backlogPosition;
  const bPos = b.backlogPosition;

  if (aPos !== null && bPos !== null) {
    if (aPos !== bPos) return aPos - bPos;
  } else if (aPos !== null) {
    return -1;
  } else if (bPos !== null) {
    return 1;
  }

  if (a.priority !== b.priority) return b.priority - a.priority;
  return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
}

// GET /api/library/backlog - Non-completed library games, ordered for the backlog manager.
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await untypedTable(supabase, "user_library")
      .select(
        `
        id,
        game_id,
        status,
        added_at,
        play_time_hours,
        priority,
        backlog_position,
        games (
          id,
          slug,
          metascore,
          cover_image_url,
          background_color,
          playtime_hastily,
          playtime_normally,
          playtime_completely,
          game_translations (
            title,
            language_code
          ),
          game_genres (
            genres (
              id,
              slug,
              genre_translations (
                name,
                language_code
              )
            )
          ),
          game_companies (
            role,
            is_primary,
            companies (
              name
            )
          ),
          game_platforms (
            platforms (
              id,
              platform_translations (
                name,
                language_code
              )
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .not("status", "in", `(${EXCLUDED_STATUSES.join(",")})`);

    if (error) {
      // PGRST205 = table not found, 42703 = column not found (migration not applied yet)
      if (error.code === "PGRST205" || error.code === "42703") {
        logger.warn("backlog columns/table not found - migration not applied yet");
        return NextResponse.json({ games: [] });
      }
      logger.error("Error fetching backlog", { error });
      return NextResponse.json({ error: "Failed to fetch backlog" }, { status: 500 });
    }

    const entries = (data as unknown as BacklogEntryRow[]) ?? [];

    // Aggregate the player's logged sessions per game (minutes → hours) so we
    // can show real remaining time (estimate − time already played).
    const playedHoursByGame = await fetchPlayedHoursByGame(supabase, user.id);

    const games = entries
      .map((entry) => transformEntry(entry, playedHoursByGame))
      .filter((g): g is BacklogGame => g !== null)
      .sort(sortBacklog);

    return NextResponse.json({ games });
  } catch (error) {
    logger.error("Error in backlog API", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface SessionDurationRow {
  game_id: string;
  duration_minutes: number | null;
}

/**
 * Sums `game_sessions.duration_minutes` per game for a user and returns a
 * map of gameId → hours played. Degrades to an empty map when the table is
 * missing or the query fails (remaining time then equals the full estimate).
 */
async function fetchPlayedHoursByGame(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  const { data, error } = await untypedTable(supabase, "game_sessions")
    .select("game_id, duration_minutes")
    .eq("user_id", userId);

  if (error || !data) {
    return map;
  }

  for (const row of data as unknown as SessionDurationRow[]) {
    if (!row.game_id) continue;
    const minutes = row.duration_minutes ?? 0;
    map.set(row.game_id, (map.get(row.game_id) ?? 0) + minutes / 60);
  }

  return map;
}
