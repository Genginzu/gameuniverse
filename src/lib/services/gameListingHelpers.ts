import type { GameRowWithRelations } from "@/types/supabase-queries";

/** Pagination metadata returned alongside game listings */
interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  offset: number;
}

/** Filters echoed back in the API response */
interface GamesFilters {
  search: string;
  genres: string[];
  platforms: string[];
  locale: string;
  inLibrary: boolean;
}

/** Build an empty-results response (used when filters yield zero matches) */
export function buildEmptyGamesResponse(
  page: number,
  limit: number,
  offset: number,
  filters: GamesFilters
) {
  return {
    games: [],
    pagination: {
      currentPage: page,
      totalPages: 0,
      totalCount: 0,
      limit,
      hasNextPage: false,
      hasPreviousPage: false,
      offset,
    },
    filters,
  };
}

/** Transform raw Supabase rows into the public API shape */
export function transformGames(rows: GameRowWithRelations[], locale: string, fields: string[]) {
  return rows.map((game) => {
    const translations = game.game_translations ?? [];
    const translation =
      translations.find((t) => t.language_code === locale) || translations[0] || null;

    const gameGenres =
      game.game_genres?.map((gg) => {
        const genreTranslations = gg.genres?.genre_translations ?? [];
        const gt =
          genreTranslations.find((t) => t.language_code === locale) || genreTranslations[0] || null;
        return { name: gt?.name || "Unknown" };
      }) || [];

    const developer =
      game.game_companies?.find((gc) => gc.role === "developer" && gc.is_primary)?.companies
        ?.name ||
      game.game_companies?.find((gc) => gc.role === "developer")?.companies?.name ||
      "Unknown";

    const publisher =
      game.game_companies?.find((gc) => gc.role === "publisher" && gc.is_primary)?.companies
        ?.name ||
      game.game_companies?.find((gc) => gc.role === "publisher")?.companies?.name ||
      "Unknown";

    return {
      id: game.id,
      slug: game.slug,
      igdbId: game.igdb_id,
      title: translation?.title || "Untitled",
      description: fields.includes("description") ? translation?.description : undefined,
      coverImage: game.cover_image_url,
      backgroundImage: game.background_image_url,
      backgroundColor: game.background_color,
      releaseDate: game.release_date,
      releaseYear: game.release_date ? new Date(game.release_date).getFullYear() : null,
      genres: gameGenres,
      developer,
      publisher,
      metascore: game.metascore,
      createdAt: game.created_at,
    };
  });
}

/** Build pagination metadata from a total count */
export function buildPaginationMeta(
  totalCount: number,
  page: number,
  limit: number,
  offset: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    offset,
  };
}
