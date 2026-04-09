import { PlayerStats, PlayerLibraryGame } from "@/types/player";

/**
 * Calcule les statistiques à partir de la bibliothèque d'un joueur
 */
export function calculatePlayerStats(library: PlayerLibraryGame[]): PlayerStats {
  const totalGames = library.length;
  const ownedGames = library.filter(
    (g) => g.status === "owned" || g.status === "completed" || g.status === "playing"
  ).length;
  const completedGames = library.filter((g) => g.status === "completed").length;
  const totalPlayTime = library.reduce((sum, g) => sum + (g.playTimeHours || 0), 0);

  const gamesWithRatings = library.filter((g) => g.rating !== null);
  const averageRating =
    gamesWithRatings.length > 0
      ? gamesWithRatings.reduce((sum, g) => sum + (g.rating || 0), 0) / gamesWithRatings.length
      : null;

  return {
    totalGames,
    ownedGames,
    completedGames,
    totalPlayTime,
    averageRating,
  };
}
