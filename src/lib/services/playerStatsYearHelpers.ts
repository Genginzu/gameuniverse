import type { TopGame } from "@/types/player-stats";
import { computeTotalPlayTime, type LibraryEntryWithGenres } from "./playerStatsService";
import { logger } from "@/lib/logger";
import type { createRouteHandlerClient } from "@/lib/supabase-server";

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

/** Shape of a library row returned by queryYearLibrary / extractGenreEntries */
interface LibraryRow {
  play_time_hours: number | null;
  added_at?: string | null;
  game_id?: string;
  games?: {
    id?: string;
    cover_image_url?: string | null;
    game_genres?: Array<{
      genres?: {
        genre_translations?: Array<{ language_code: string | null; name: string }>;
      };
    }>;
    game_translations?: Array<{ title: string; language_code: string | null }>;
  };
}

/**
 * Récupère les années distinctes ayant des entrées dans la bibliothèque du joueur.
 * Retourne un tableau trié par année décroissante.
 */
export async function queryAvailableYears(
  supabase: SupabaseClient,
  playerId: string
): Promise<number[]> {
  const { data, error } = await supabase
    .from("user_library")
    .select("added_at")
    .eq("user_id", playerId);

  if (error) {
    logger.error("Error fetching available years", { error });
    return [];
  }

  if (!data || data.length === 0) return [];

  const years = new Set<number>();
  for (const entry of data as { added_at: string }[]) {
    if (entry.added_at) {
      years.add(new Date(entry.added_at).getFullYear());
    }
  }

  return [...years].sort((a, b) => b - a);
}

/**
 * Récupère les entrées de bibliothèque d'un joueur pour une année donnée,
 * avec les infos du jeu (titre traduit, cover image).
 */
export async function queryYearLibrary(
  supabase: SupabaseClient,
  playerId: string,
  year: number,
  _locale: string
) {
  const startOfYear = `${year}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${year + 1}-01-01T00:00:00.000Z`;

  const { data, error } = await supabase
    .from("user_library")
    .select(
      `
      play_time_hours,
      added_at,
      game_id,
      games!inner(
        id,
        cover_image_url,
        game_genres(
          genres!inner(
            genre_translations!inner(name, language_code)
          )
        ),
        game_translations!left(title, language_code)
      )
    `
    )
    .eq("user_id", playerId)
    .gte("added_at", startOfYear)
    .lt("added_at", startOfNextYear);

  if (error) {
    logger.error("Error fetching year library", { error });
    return [];
  }

  return data ?? [];
}

/**
 * Compte les reviews d'un joueur pour une année donnée.
 */
export async function queryYearReviewCount(
  supabase: SupabaseClient,
  playerId: string,
  year: number
): Promise<number> {
  const startOfYear = `${year}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${year + 1}-01-01T00:00:00.000Z`;

  const { data, error } = await supabase
    .from("game_reviews")
    .select("id")
    .eq("user_id", playerId)
    .gte("created_at", startOfYear)
    .lt("created_at", startOfNextYear);

  if (error) {
    logger.error("Error fetching year review count", { error });
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Extrait le jeu le plus joué d'un ensemble d'entrées de bibliothèque annuelles.
 */
export function extractTopGame(libraryData: LibraryRow[], locale: string): TopGame | null {
  if (libraryData.length === 0) return null;

  let topEntry: { id: string; title: string; coverImage: string | null; playTime: number } | null =
    null;

  for (const entry of libraryData) {
    const playTime = entry.play_time_hours ?? 0;
    if (playTime <= 0) continue;

    const gameId = entry.games?.id ?? entry.game_id;
    const translations = entry.games?.game_translations ?? [];
    const translated = translations.find(
      (t: { language_code: string | null; title: string }) => t.language_code === locale
    );
    const title = translated?.title ?? "Unknown";
    const coverImage = entry.games?.cover_image_url ?? null;

    if (!topEntry || playTime > topEntry.playTime) {
      topEntry = { id: gameId ?? "", title, coverImage, playTime };
    }
  }

  return topEntry
    ? {
        id: topEntry.id,
        title: topEntry.title,
        coverImage: topEntry.coverImage,
        playTime: Math.round(topEntry.playTime * 10) / 10,
      }
    : null;
}

/**
 * Transforme les données brutes de bibliothèque annuelle en LibraryEntryWithGenres
 * pour réutiliser computeFavoriteGenre.
 */
export function extractGenreEntries(
  libraryData: LibraryRow[],
  locale: string
): LibraryEntryWithGenres[] {
  return libraryData.map((entry) => {
    const genres: string[] = [];
    const gameGenres = entry.games?.game_genres ?? [];

    for (const gg of gameGenres) {
      const translations = gg.genres?.genre_translations ?? [];
      const translated = translations.find(
        (t: { language_code: string | null; name: string }) => t.language_code === locale
      );
      if (translated) {
        genres.push(translated.name);
      }
    }

    return {
      playTimeHours: entry.play_time_hours ?? 0,
      genres,
    };
  });
}

/**
 * Calcule le temps de jeu total et le nombre de jeux à partir des données de bibliothèque.
 */
export function extractYearPlayStats(libraryData: LibraryRow[]): {
  totalPlayTime: number;
  gamesAdded: number;
} {
  const playTimes = libraryData.map((e) => e.play_time_hours ?? 0);
  return {
    totalPlayTime: computeTotalPlayTime(playTimes),
    gamesAdded: libraryData.length,
  };
}
