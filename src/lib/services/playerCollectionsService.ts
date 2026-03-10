import type {
  CollectionSortOption,
  PlayerCollectionsQueryParams,
  PlayerCollectionsResponse,
  PlayerCollectionsStatsData,
} from "@/types/playerCollection";
import type { CollectionSummary } from "@/types/collection";

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

/**
 * Build the API URL for fetching player collections.
 * Only includes query params whose value is not undefined.
 */
export function buildCollectionsUrl(
  playerId: string,
  params: PlayerCollectionsQueryParams
): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.sort !== undefined) {
    searchParams.set("sort", params.sort);
  }
  if (params.locale !== undefined) {
    searchParams.set("locale", params.locale);
  }

  const query = searchParams.toString();
  return `/api/players/${playerId}/collections${query ? `?${query}` : ""}`;
}

/**
 * Compute pagination metadata from total count, current page and page size.
 */
export function computeCollectionsPagination(
  totalCount: number,
  page: number,
  pageSize: number
): {
  currentPage: number;
  totalPages: number;
  totalCollections: number;
  hasNextPage: boolean;
} {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNextPage = page < totalPages;

  return {
    currentPage: page,
    totalPages,
    totalCollections: totalCount,
    hasNextPage,
  };
}

/**
 * Compute aggregated stats for a list of collections.
 * - totalCollections: number of collections
 * - totalGames: sum of all gamesCount
 * - largestCollection: name of the collection with the highest gamesCount (null if empty)
 */
export function computeCollectionsStats(
  collections: CollectionSummary[]
): PlayerCollectionsStatsData {
  if (collections.length === 0) {
    return { totalCollections: 0, totalGames: 0, largestCollection: null };
  }

  let totalGames = 0;
  let largestName: string | null = null;
  let largestCount = -1;

  for (const c of collections) {
    totalGames += c.gamesCount;
    if (c.gamesCount > largestCount) {
      largestCount = c.gamesCount;
      largestName = c.name;
    }
  }

  return {
    totalCollections: collections.length,
    totalGames,
    largestCollection: largestName,
  };
}

/**
 * Filter collections by visibility.
 * If isOwner is true, return all collections.
 * Otherwise, return only public collections (isPublic === true).
 */
export function filterCollectionsByVisibility(
  collections: CollectionSummary[],
  isOwner: boolean
): CollectionSummary[] {
  if (isOwner) return collections;
  return collections.filter((c) => c.isPublic === true);
}

/**
 * Sort a list of collections by the given sort option.
 * Returns a new array (does not mutate the input).
 */
export function sortCollections(
  collections: CollectionSummary[],
  sortOption: CollectionSortOption
): CollectionSummary[] {
  const copy = [...collections];

  switch (sortOption) {
    case "updated_at_desc":
      return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "games_count_desc":
      return copy.sort((a, b) => b.gamesCount - a.gamesCount);
    default:
      return copy;
  }
}

// ---------------------------------------------------------------------------
// Client service class
// ---------------------------------------------------------------------------

/**
 * Service client pour récupérer les collections d'un joueur.
 * Communique avec GET /api/players/{playerId}/collections.
 */
export class PlayerCollectionsService {
  /**
   * Récupère les collections d'un joueur avec pagination et tri optionnel.
   * @param playerId - UUID du joueur
   * @param params - Paramètres de requête (page, sort, locale)
   * @returns La réponse avec collections, stats et pagination
   * @throws Error avec message descriptif si l'appel échoue
   */
  static async fetchCollections(
    playerId: string,
    params: PlayerCollectionsQueryParams = {}
  ): Promise<PlayerCollectionsResponse> {
    const url = buildCollectionsUrl(playerId, params);

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.error || `Failed to fetch collections (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }
}
