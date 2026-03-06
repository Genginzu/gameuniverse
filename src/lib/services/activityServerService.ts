import { createServerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import type { ActivityEvent, ActivityEventType, ActivityResponse } from "@/types/activity";

/** Page size for activity feed pagination */
const ACTIVITY_PAGE_SIZE = 20;

/**
 * Raw shape returned by the `get_player_activity` RPC function.
 * The function returns a single JSONB object.
 */
interface RpcActivityResult {
  events: Array<{
    id: string;
    type: string;
    date: string;
    data: Record<string, unknown>;
  }>;
  totalCount: number;
}

/** Empty response used as fallback when the RPC function is unavailable. */
function emptyResponse(page: number): ActivityResponse {
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
 * Service serveur pour l'activité d'un joueur.
 * Appelle la fonction RPC Supabase `get_player_activity` et transforme
 * le résultat JSONB en `ActivityResponse`.
 *
 * Gère gracieusement le cas PGRST205 / 42883 (fonction non trouvée)
 * en retournant une liste vide — pattern existant du projet.
 */
export class ActivityServerService {
  /**
   * Récupère l'activité paginée d'un joueur.
   *
   * @param playerId  UUID du joueur
   * @param locale    Code langue pour les traductions (ex: "fr", "en")
   * @param type      Filtre optionnel par type d'événement
   * @param page      Numéro de page (1-indexed, défaut 1)
   */
  static async fetchPlayerActivity(
    playerId: string,
    locale: string,
    type?: ActivityEventType,
    page: number = 1
  ): Promise<ActivityResponse> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_player_activity" as any, {
      player_uuid: playerId,
      locale_code: locale,
      event_type: type ?? null,
      page_number: page,
      page_size: ACTIVITY_PAGE_SIZE,
    });

    if (error) {
      // PGRST205 = table/function not found, 42883 = function does not exist
      if (error.code === "PGRST205" || error.code === "42883") {
        logger.warn("get_player_activity function not found - migration not applied yet");
        return emptyResponse(page);
      }
      throw error;
    }

    // The RPC returns a single JSONB object (not an array)
    const result = data as unknown as RpcActivityResult | null;

    if (!result) {
      return emptyResponse(page);
    }

    return transformRpcResult(result, page);
  }
}

/**
 * Transforme le résultat brut de la fonction RPC en `ActivityResponse`
 * avec les informations de pagination calculées.
 */
function transformRpcResult(result: RpcActivityResult, page: number): ActivityResponse {
  const totalCount = result.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / ACTIVITY_PAGE_SIZE);

  const events: ActivityEvent[] = (result.events ?? []).map((raw) => ({
    id: String(raw.id),
    type: raw.type as ActivityEventType,
    date: raw.date,
    data: raw.data as unknown as ActivityEvent["data"],
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
