import { createServerClient } from "@/lib/supabase-server";
import type {
  EnrichedStats,
  FavoriteGenre,
  MostActiveMonth,
  YearInReview,
} from "@/types/player-stats";
import {
  fetchFavoriteGenreFromDB,
  fetchReviewStats,
  fetchTotalPlayTime,
  isStatsPrivate,
} from "./playerStatsDbHelpers";
import {
  extractGenreEntries,
  extractTopGame,
  extractYearPlayStats,
  queryAvailableYears,
  queryYearLibrary,
  queryYearReviewCount,
} from "./playerStatsYearHelpers";

// Re-export formatPlayTime from client-safe utility so existing imports keep working
export { formatPlayTime } from "@/lib/utils/formatPlayTime";

// Interface pour les fonctions pures testables sans DB
export interface LibraryEntryWithGenres {
  playTimeHours: number;
  genres: string[];
}

/**
 * Calcule le genre favori à partir d'entrées de bibliothèque.
 * Fonction pure — pas d'accès DB — testable en property-based.
 *
 * Le temps de jeu d'un jeu ayant N genres est réparti équitablement (temps / N).
 * En cas d'égalité, le genre alphabétiquement premier est sélectionné.
 */
export function computeFavoriteGenre(entries: LibraryEntryWithGenres[]): FavoriteGenre | null {
  const genrePlayTime = new Map<string, number>();

  for (const entry of entries) {
    if (entry.playTimeHours <= 0 || entry.genres.length === 0) continue;

    const weightedTime = entry.playTimeHours / entry.genres.length;
    for (const genre of entry.genres) {
      genrePlayTime.set(genre, (genrePlayTime.get(genre) ?? 0) + weightedTime);
    }
  }

  if (genrePlayTime.size === 0) return null;

  let bestGenre = "";
  let bestTime = -1;

  for (const [genre, time] of genrePlayTime) {
    if (time > bestTime || (time === bestTime && genre < bestGenre)) {
      bestGenre = genre;
      bestTime = time;
    }
  }

  return {
    name: bestGenre,
    playTime: Math.round(bestTime * 10) / 10,
  };
}

/**
 * Calcule le temps de jeu total. Retourne la somme arrondie à 1 décimale.
 * Fonction pure — testable en property-based.
 */
export function computeTotalPlayTime(playTimes: number[]): number {
  if (playTimes.length === 0) return 0;
  const total = playTimes.reduce((sum, t) => sum + t, 0);
  return Math.round(total * 10) / 10;
}

/**
 * Calcule le nombre de reviews et la note moyenne.
 * Fonction pure — testable en property-based.
 */
export function computeReviewStats(ratings: number[]): {
  reviewCount: number;
  averageRating: number | null;
} {
  if (ratings.length === 0) {
    return { reviewCount: 0, averageRating: null };
  }

  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return {
    reviewCount: ratings.length,
    averageRating: Math.round(average * 10) / 10,
  };
}

// Interface pour computeMostActiveMonth — testable en property-based
export interface LibraryEntryWithDate {
  addedAt: string; // ISO date string
}

/**
 * Calcule le mois le plus actif à partir d'entrées de bibliothèque.
 * Fonction pure — pas d'accès DB — testable en property-based.
 *
 * Compte les entrées par mois (1-12) et retourne le mois avec le plus d'entrées.
 * En cas d'égalité, retourne le mois le plus tôt dans l'année.
 */
export function computeMostActiveMonth(entries: LibraryEntryWithDate[]): MostActiveMonth | null {
  if (entries.length === 0) return null;

  const monthCounts = new Map<number, number>();

  for (const entry of entries) {
    const month = new Date(entry.addedAt).getMonth() + 1; // 1-12
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }

  if (monthCounts.size === 0) return null;

  let bestMonth = 0;
  let bestCount = 0;

  for (const [month, count] of monthCounts) {
    if (count > bestCount || (count === bestCount && month < bestMonth)) {
      bestMonth = month;
      bestCount = count;
    }
  }

  return { month: bestMonth, gamesAdded: bestCount };
}

/**
 * Filtre les entrées de bibliothèque par année (basé sur le champ `addedAt`).
 * Fonction pure — pas d'accès DB — testable en property-based.
 */
export interface LibraryEntryForYear {
  addedAt: string;
  playTimeHours: number;
}

export function filterEntriesByYear(
  entries: LibraryEntryForYear[],
  year: number
): LibraryEntryForYear[] {
  return entries.filter((e) => new Date(e.addedAt).getFullYear() === year);
}

/**
 * Service de calcul des statistiques enrichies d'un joueur.
 * Méthodes statiques + Supabase, suit le pattern existant de PlayerService.
 */
export class PlayerStatsService {
  /**
   * Récupère les statistiques enrichies d'un joueur.
   * Retourne null si le profil est privé et que le visiteur n'est pas le propriétaire.
   */
  static async fetchEnrichedStats(
    playerId: string,
    locale: string,
    visitorId?: string | null
  ): Promise<EnrichedStats | null> {
    const supabase = await createServerClient();

    const isOwnProfile = visitorId === playerId;
    if (!isOwnProfile) {
      if (await isStatsPrivate(supabase, playerId)) return null;
    }

    const [totalPlayTime, favoriteGenre, reviewStats] = await Promise.all([
      fetchTotalPlayTime(supabase, playerId),
      fetchFavoriteGenreFromDB(supabase, playerId, locale),
      fetchReviewStats(supabase, playerId),
    ]);

    return {
      totalPlayTime,
      favoriteGenre,
      reviewCount: reviewStats.reviewCount,
      averageReviewRating: reviewStats.averageRating,
    };
  }

  /** Récupère les années disponibles pour un joueur (triées décroissant). */
  static async fetchAvailableYears(playerId: string): Promise<number[]> {
    const supabase = await createServerClient();
    return queryAvailableYears(supabase, playerId);
  }

  /**
   * Récupère le résumé annuel d'un joueur pour une année donnée.
   * Retourne null si le profil est privé et que le visiteur n'est pas le propriétaire.
   * Lance une erreur si l'année est dans le futur (Req 5.4).
   */
  static async fetchYearInReview(
    playerId: string,
    year: number,
    locale: string,
    visitorId?: string | null
  ): Promise<YearInReview | null> {
    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
      throw new Error("L'année demandée est dans le futur");
    }

    const supabase = await createServerClient();

    const isOwnProfile = visitorId === playerId;
    if (!isOwnProfile) {
      if (await isStatsPrivate(supabase, playerId)) return null;
    }

    const [yearLibrary, reviewCount, availableYears] = await Promise.all([
      queryYearLibrary(supabase, playerId, year, locale),
      queryYearReviewCount(supabase, playerId, year),
      queryAvailableYears(supabase, playerId),
    ]);

    const { totalPlayTime, gamesAdded } = extractYearPlayStats(yearLibrary);
    const favoriteGenre = computeFavoriteGenre(extractGenreEntries(yearLibrary, locale));
    const topGame = extractTopGame(yearLibrary, locale);
    const dateEntries = yearLibrary.map((e: { added_at: string }) => ({ addedAt: e.added_at }));
    const mostActiveMonth = computeMostActiveMonth(dateEntries);

    return {
      year,
      totalPlayTime,
      gamesAdded,
      favoriteGenre,
      topGame,
      reviewCount,
      mostActiveMonth,
      availableYears,
    };
  }
}
