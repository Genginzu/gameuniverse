import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { GamingSession } from "@/types/gaming-session";

// game_sessions is not yet in the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const PAGE_SIZE = 20;

/** Raw row shape returned by Supabase when joining games + game_translations. */
interface SessionRow {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  created_at: string;
  games: {
    slug: string;
    cover_image_url: string | null;
    game_translations: { title: string; language_code: string }[];
  } | null;
}

function pickTitle(
  translations: { title: string; language_code: string }[],
  locale: string
): string {
  const loc = translations.find((t) => t.language_code === locale);
  if (loc) return loc.title;
  const first = translations.find((t) => t.title);
  return first?.title ?? "Untitled";
}

function transformRow(row: SessionRow, locale: string): GamingSession {
  return {
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    gameSlug: row.games?.slug ?? "",
    gameName: pickTitle(row.games?.game_translations ?? [], locale),
    coverImage: row.games?.cover_image_url ?? null,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
  };
}

const SELECT = `
  id, user_id, game_id, started_at, ended_at, duration_minutes, created_at,
  games (
    slug,
    cover_image_url,
    game_translations ( title, language_code )
  )
`;

/** Server-side service for gaming sessions (issue #2). */
export class GameSessionsServerService {
  /** Fetch paginated sessions for a player, sorted by created_at DESC. */
  static async fetchSessions(
    playerId: string,
    page: number = 1,
    locale: string = "fr"
  ): Promise<{ sessions: GamingSession[]; totalCount: number }> {
    const supabase = await createRouteHandlerClient();
    const offset = (page - 1) * PAGE_SIZE;

    const { count, error: countError } = await supabase
      .from("game_sessions" as UntypedFrom)
      .select("id", { count: "exact", head: true })
      .eq("user_id", playerId);

    if (countError) {
      logger.error("Failed to count game sessions", { error: countError.message, playerId });
      throw new Error(countError.message ?? "Failed to count game sessions");
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) return { sessions: [], totalCount: 0 };

    const { data, error } = await supabase
      .from("game_sessions" as UntypedFrom)
      .select(SELECT)
      .eq("user_id", playerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logger.error("Failed to fetch game sessions", { error: error.message, playerId });
      throw new Error(error.message ?? "Failed to fetch game sessions");
    }

    const sessions = ((data ?? []) as unknown as SessionRow[]).map((r) => transformRow(r, locale));
    return { sessions, totalCount };
  }

  /**
   * Create a gaming session. `date` is a YYYY-MM-DD string; we anchor started_at
   * at 12:00 UTC of that day and compute ended_at from durationMinutes so the
   * existing `ended_at > started_at` CHECK is always satisfied. Also auto-adds
   * the game to the player's library (status = 'playing') if absent.
   */
  static async createSession(
    playerId: string,
    input: { gameId: string; date: string; durationMinutes: number },
    locale: string = "fr"
  ): Promise<GamingSession> {
    const supabase = await createRouteHandlerClient();

    const started = new Date(`${input.date}T12:00:00.000Z`);
    const ended = new Date(started.getTime() + input.durationMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from("game_sessions" as UntypedFrom)
      .insert({
        user_id: playerId,
        game_id: input.gameId,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
      })
      .select(SELECT)
      .single();

    if (error || !data) {
      logger.error("Failed to create gaming session", {
        error: error?.message,
        playerId,
        gameId: input.gameId,
      });
      throw new Error(error?.message ?? "Failed to create gaming session");
    }

    await this.ensureInLibrary(playerId, input.gameId);

    return transformRow(data as unknown as SessionRow, locale);
  }

  /** Delete a session by id (caller must have verified ownership). */
  static async deleteSession(sessionId: string): Promise<void> {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase
      .from("game_sessions" as UntypedFrom)
      .delete()
      .eq("id", sessionId);

    if (error) {
      logger.error("Failed to delete gaming session", { error: error.message, sessionId });
      throw new Error(error.message ?? "Failed to delete gaming session");
    }
  }

  /** Return { id, userId } for a session, or null. Used for ownership check. */
  static async getSession(sessionId: string): Promise<{ id: string; userId: string } | null> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("game_sessions" as UntypedFrom)
      .select("id, user_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as unknown as { id: string; user_id: string };
    return { id: row.id, userId: row.user_id };
  }

  /** Best-effort: insert into user_library with status 'playing' if not already present. */
  private static async ensureInLibrary(playerId: string, gameId: string): Promise<void> {
    try {
      const supabase = await createRouteHandlerClient();

      const { data: existing } = await supabase
        .from("user_library")
        .select("id")
        .eq("user_id", playerId)
        .eq("game_id", gameId)
        .maybeSingle();

      if (existing) return;

      const { error: insertError } = await supabase.from("user_library").insert({
        user_id: playerId,
        game_id: gameId,
        status: "playing",
      });

      if (insertError) {
        logger.error("Failed to auto-add game to library after session", {
          error: insertError.message,
          playerId,
          gameId,
        });
      }
    } catch (err) {
      logger.error("ensureInLibrary threw", {
        error: err instanceof Error ? err.message : String(err),
        playerId,
        gameId,
      });
    }
  }
}
