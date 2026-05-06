import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

export interface CalendarTournament {
  id: number;
  name: string;
  slug: string;
  beginAt: string | null;
  endAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  leagueImageUrl: string | null;
  serie: string;
  prizepool: string | null;
  tier: string;
  status: "upcoming" | "running";
}

/** Fetch upcoming + running tournaments from local DB */
export async function getCalendarTournaments(filters?: {
  game?: string;
}): Promise<CalendarTournament[]> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    let query = supabase
      .from("esport_tournaments" as UntypedFrom)
      .select("*")
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("begin_at", { ascending: true })
      .limit(100);

    if (filters?.game) {
      query = query.eq("game", filters.game);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((t: Record<string, unknown>) => {
      const beginAt = t.begin_at as string | null;
      const status: "upcoming" | "running" =
        beginAt && new Date(beginAt) <= new Date() ? "running" : "upcoming";

      return {
        id: (t.pandascore_id ?? t.id) as number,
        name: t.name as string,
        slug: t.slug as string,
        beginAt: beginAt,
        endAt: t.end_at as string | null,
        game: t.game as string,
        gameSlug: (t.game as string).toLowerCase().replace(/\s+/g, "-"),
        league: (t.league_name as string) ?? "",
        leagueImageUrl: (t.league_image_url as string) ?? null,
        serie: (t.serie_name as string) ?? "",
        prizepool: (t.prizepool as string) ?? null,
        tier: (t.tier as string) ?? "unranked",
        status,
      };
    });
  } catch (error) {
    logger.error("Failed to fetch calendar tournaments from DB", { error });
    throw error;
  }
}

/** Get the list of videogame names present in the current calendar */
export async function getCalendarGames(): Promise<string[]> {
  const tournaments = await getCalendarTournaments();
  const games = [...new Set(tournaments.map((t) => t.game))];
  return games.sort();
}
