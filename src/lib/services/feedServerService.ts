import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { FeedEvent, FeedEventType, FeedResponse } from "@/types/feed";

/** Page size for subscribed feed pagination */
const FEED_PAGE_SIZE = 20;

/**
 * Raw shape returned by the `get_subscribed_feed` RPC function.
 * The function returns a single JSONB object.
 */
interface RpcFeedResult {
  events: Array<{
    id: string;
    type: string;
    date: string;
    data: Record<string, unknown>;
  }>;
  totalCount: number;
}

/** Empty response used as fallback when the RPC function is unavailable. */
function emptyResponse(page: number): FeedResponse {
  return {
    events: [],
    pagination: {
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
    },
  };
}

/**
 * Service serveur pour le fil d'actualité du propriétaire.
 * Appelle la fonction RPC Supabase `get_subscribed_feed` et transforme
 * le résultat JSONB en `FeedResponse`.
 *
 * Gère gracieusement le cas PGRST205 / 42883 (fonction non trouvée)
 * en retournant une liste vide — pattern existant du projet.
 */
export class FeedServerService {
  /**
   * Récupère le fil d'actualité paginé d'un joueur (agrège reviews, posts
   * et playtime de tous les joueurs suivis : abonnements explicites + amis).
   *
   * @param viewerId UUID du propriétaire (spectateur du fil)
   * @param locale   Code langue pour les traductions (ex: "fr", "en")
   * @param page     Numéro de page (1-indexed, défaut 1)
   */
  static async fetchSubscribedFeed(
    viewerId: string,
    locale: string,
    page: number = 1
  ): Promise<FeedResponse> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_subscribed_feed" as any, {
      viewer_uuid: viewerId,
      locale_code: locale,
      page_number: page,
      page_size: FEED_PAGE_SIZE,
    });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42883") {
        logger.warn("get_subscribed_feed function not found - migration not applied yet");
        return emptyResponse(page);
      }
      throw error;
    }

    const result = data as unknown as RpcFeedResult | null;

    if (!result) {
      return emptyResponse(page);
    }

    return transformRpcResult(result, page);
  }
}

function transformRpcResult(result: RpcFeedResult, page: number): FeedResponse {
  const totalCount = result.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / FEED_PAGE_SIZE);

  const events: FeedEvent[] = (result.events ?? []).map((raw) => ({
    id: String(raw.id),
    type: raw.type as FeedEventType,
    date: raw.date,
    data: raw.data as unknown as FeedEvent["data"],
  }));

  return {
    events,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
}
