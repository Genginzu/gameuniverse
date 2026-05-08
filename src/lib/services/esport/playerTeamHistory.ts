import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

/**
 * Reconcile the team history table when a player's current team changes.
 *
 * The PandaScore sync only stores the *current* team on `esport_players.team_id`.
 * To preserve history (past teams) for the public profile and stats, we keep
 * a separate `esport_player_team_history` table where each row is a membership
 * period (`started_at`, `ended_at`).
 *
 * Convention:
 * - `ended_at IS NULL` → the player is still on that team.
 * - When `current_team` changes, we close the open period (`ended_at = now()`)
 *   and open a new one for the new team.
 *
 * This function is safe to call from both the full sync (where many players
 * are upserted) and the incremental sync (one player at a time).
 *
 * @param players Array of `{ playerLocalId, newTeamLocalId }` resolved against
 *                `esport_players.id` and `esport_teams.id` (UUIDs). Players
 *                that aren't in the DB yet are ignored upstream.
 */
export async function reconcilePlayerTeamHistory(
  players: Array<{ playerLocalId: string; newTeamLocalId: string | null }>
): Promise<{ opened: number; closed: number; errors: number }> {
  if (players.length === 0) return { opened: 0, closed: 0, errors: 0 };

  const supabase = getSupabaseAdmin();
  const playerIds = players.map((p) => p.playerLocalId);

  // 1. Read all current memberships (ended_at IS NULL) for the affected players
  //    in one round trip. Map: playerId → { id, team_id }.
  const { data: openMemberships, error: readError } = await supabase
    .from("esport_player_team_history" as UntypedFrom)
    .select("id, player_id, team_id")
    .in("player_id", playerIds)
    .is("ended_at", null);

  if (readError) {
    logger.error("Failed to read open player team memberships", { error: readError });
    return { opened: 0, closed: 0, errors: players.length };
  }

  type Membership = { id: string; player_id: string; team_id: string };
  const openByPlayer = new Map<string, Membership>();
  for (const row of (openMemberships as Membership[] | null) ?? []) {
    openByPlayer.set(row.player_id, row);
  }

  const now = new Date().toISOString();
  const toClose: string[] = []; // membership ids
  const toOpen: Array<{ player_id: string; team_id: string; started_at: string }> = [];

  for (const { playerLocalId, newTeamLocalId } of players) {
    const open = openByPlayer.get(playerLocalId);

    if (!open && newTeamLocalId) {
      // First known team for this player → open a new period.
      toOpen.push({ player_id: playerLocalId, team_id: newTeamLocalId, started_at: now });
      continue;
    }

    if (open && newTeamLocalId === null) {
      // Player left their team without joining a new one (free agent).
      toClose.push(open.id);
      continue;
    }

    if (open && newTeamLocalId && open.team_id !== newTeamLocalId) {
      // Team change: close the old period and open a new one.
      toClose.push(open.id);
      toOpen.push({ player_id: playerLocalId, team_id: newTeamLocalId, started_at: now });
    }
    // else: same team, nothing to do.
  }

  let errors = 0;

  if (toClose.length > 0) {
    const { error: closeError } = await supabase
      .from("esport_player_team_history" as UntypedFrom)
      .update({ ended_at: now })
      .in("id", toClose);
    if (closeError) {
      logger.error("Failed to close player memberships", { error: closeError, count: toClose.length });
      errors += toClose.length;
    }
  }

  if (toOpen.length > 0) {
    const { error: openError } = await supabase
      .from("esport_player_team_history" as UntypedFrom)
      .insert(toOpen);
    if (openError) {
      logger.error("Failed to open player memberships", { error: openError, count: toOpen.length });
      errors += toOpen.length;
    }
  }

  return { opened: toOpen.length, closed: toClose.length, errors };
}
