import { createServerClient } from "@/lib/supabase-server";
import type { CommonGame, CommonGamesResult } from "@/types/player";
import { logger } from "@/lib/logger";

const DEFAULT_PAGE_SIZE = 12;

/** Raw row returned by the get_common_games RPC function */
interface CommonGameRow {
  game_id: string;
  slug: string;
  cover_image_url: string | null;
  title: string;
  genre_names: string[];
  total_count: number;
}

/**
 * Service de comparaison de bibliothèques entre deux joueurs.
 * Appelle la fonction SQL get_common_games via Supabase RPC
 * et transforme les résultats en types applicatifs.
 */
export class LibraryComparisonService {
  /**
   * Récupère les jeux en commun entre deux joueurs.
   * Délègue le calcul d'intersection à la base de données
   * pour éviter de charger les bibliothèques complètes côté serveur.
   */
  static async getCommonGames(
    currentUserId: string,
    targetPlayerId: string,
    locale: string,
    page: number
  ): Promise<CommonGamesResult> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_common_games" as any, {
      current_user_id: currentUserId,
      target_player_id: targetPlayerId,
      game_locale: locale,
      page_number: page,
      page_size: DEFAULT_PAGE_SIZE,
    });

    if (error) {
      logger.error("Error fetching common games", { error });
      throw new Error(`Failed to fetch common games: ${error.message}`);
    }

    const rows = (data ?? []) as CommonGameRow[];
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const commonGames = rows.map((row) => LibraryComparisonService.transformCommonGameRow(row));
    const pagination = LibraryComparisonService.computePagination(
      totalCount,
      page,
      DEFAULT_PAGE_SIZE
    );

    return {
      commonGamesCount: totalCount,
      commonGames,
      pagination,
    };
  }

  /**
   * Calcule les métadonnées de pagination à partir du total et de la page courante.
   * Fonction pure, sans dépendance Supabase — facilement testable en property-based.
   */
  static computePagination(
    totalCount: number,
    page: number,
    pageSize: number
  ): CommonGamesResult["pagination"] {
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;

    return {
      currentPage: page,
      totalPages,
      hasNextPage,
    };
  }

  /**
   * Transforme une ligne brute SQL en objet CommonGame applicatif.
   * Fonction pure, sans dépendance Supabase — facilement testable en property-based.
   */
  static transformCommonGameRow(row: CommonGameRow): CommonGame {
    return {
      gameId: row.game_id,
      slug: row.slug,
      title: row.title,
      coverImage: row.cover_image_url,
      genres: row.genre_names ?? [],
    };
  }
}
