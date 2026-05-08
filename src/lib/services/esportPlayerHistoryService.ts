import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TtlCache } from "./esport/ttlCache";
import { resolvePlayerLocalId } from "./esport/resolvePlayer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

const cache = new TtlCache(5 * 60 * 1000);

export interface PlayerTeamMembership {
  /** Membership row UUID (stable React key). */
  id: string;
  /** Public team ID (PandaScore numeric) for linking, or null when missing. */
  teamId: number | null;
  teamName: string;
  teamImageUrl: string | null;
  startedAt: string;
  /** NULL when this is the current team. */
  endedAt: string | null;
  isCurrent: boolean;
}

interface MembershipRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  esport_teams: {
    name: string | null;
    image_url: string | null;
    pandascore_id: number | null;
  } | null;
}

/**
 * Full team-membership history for a given player, most recent first.
 * The current team (if any) appears first with `isCurrent = true`.
 *
 * @param pandascoreId Player's PandaScore numeric ID.
 */
export async function getPlayerTeamHistory(
  pandascoreId: number
): Promise<PlayerTeamMembership[]> {
  const cacheKey = `esport-player-team-history:${pandascoreId}`;
  const cached = cache.get<PlayerTeamMembership[]>(cacheKey);
  if (cached) return cached;

  try {
    const playerLocalId = await resolvePlayerLocalId(pandascoreId);
    if (!playerLocalId) {
      cache.set(cacheKey, []);
      return [];
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("esport_player_team_history" as UntypedFrom)
      .select("id, started_at, ended_at, esport_teams(name, image_url, pandascore_id)")
      .eq("player_id", playerLocalId)
      .order("started_at", { ascending: false });

    if (error) throw error;

    const rows = (data as MembershipRow[] | null) ?? [];
    const memberships: PlayerTeamMembership[] = rows.map((row) => ({
      id: row.id,
      teamId: row.esport_teams?.pandascore_id ?? null,
      teamName: row.esport_teams?.name ?? "",
      teamImageUrl: row.esport_teams?.image_url ?? null,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      isCurrent: row.ended_at === null,
    }));

    cache.set(cacheKey, memberships);
    return memberships;
  } catch (error) {
    logger.error("Failed to fetch player team history", { error, pandascoreId });
    throw error;
  }
}

// Re-export the stats helper so callers have a single import path for all
// player-history-related queries.
export { getPlayerStats, type PlayerStats } from "./esport/playerStats";
