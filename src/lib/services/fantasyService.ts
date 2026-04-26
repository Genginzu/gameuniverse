import { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";

export interface FantasyTeam {
  id: string;
  playerId: string;
  leagueId: string;
  name: string;
  budgetRemaining: number;
  totalPoints: number;
  players: FantasyTeamPlayer[];
}

export interface FantasyTeamPlayer {
  id: string;
  proPlayerId: number;
  proPlayerName: string;
  purchasePrice: number;
}

export interface FantasyLeaderboardEntry {
  teamId: string;
  teamName: string;
  playerId: string;
  totalPoints: number;
}

export async function createTeam(
  playerId: string,
  leagueId: string,
  name: string
): Promise<FantasyTeam> {
  const supabase = await createRouteHandlerClient();

  // Get league budget cap
  const { data: league } = await untypedTable(supabase, "fantasy_leagues")
    .select("budget_cap")
    .eq("id", leagueId)
    .single();

  const { data, error } = await untypedTable(supabase, "fantasy_teams")
    .insert({
      player_id: playerId,
      league_id: leagueId,
      name,
      budget_remaining: (league as any)?.budget_cap ?? 10000,
    })
    .select()
    .single();

  if (error) {
    logger.error("Failed to create fantasy team", { error });
    throw new Error("Failed to create fantasy team");
  }

  return { ...mapTeam(data), players: [] };
}

export async function addPlayer(
  teamId: string,
  proPlayerId: number,
  proPlayerName: string,
  price: number
): Promise<void> {
  const supabase = await createRouteHandlerClient();

  // Check budget
  const { data: team } = await untypedTable(supabase, "fantasy_teams")
    .select("budget_remaining")
    .eq("id", teamId)
    .single();

  if (!team || (team as any).budget_remaining < price) {
    throw new Error("Insufficient budget");
  }

  const { error } = await untypedTable(supabase, "fantasy_team_players").insert({
    team_id: teamId,
    pro_player_id: proPlayerId,
    pro_player_name: proPlayerName,
    purchase_price: price,
  });

  if (error) {
    logger.error("Failed to add player to fantasy team", { error });
    throw new Error("Failed to add player");
  }

  await untypedTable(supabase, "fantasy_teams")
    .update({ budget_remaining: (team as any).budget_remaining - price })
    .eq("id", teamId);
}

export async function removePlayer(teamId: string, teamPlayerId: string): Promise<void> {
  const supabase = await createRouteHandlerClient();

  const { data: tp } = await untypedTable(supabase, "fantasy_team_players")
    .select("purchase_price")
    .eq("id", teamPlayerId)
    .eq("team_id", teamId)
    .single();

  if (!tp) throw new Error("Player not found in team");

  await untypedTable(supabase, "fantasy_team_players").delete().eq("id", teamPlayerId);

  const { data: team } = await untypedTable(supabase, "fantasy_teams")
    .select("budget_remaining")
    .eq("id", teamId)
    .single();

  if (team) {
    await untypedTable(supabase, "fantasy_teams")
      .update({ budget_remaining: (team as any).budget_remaining + (tp as any).purchase_price })
      .eq("id", teamId);
  }
}

export async function getMyTeam(playerId: string, leagueId: string): Promise<FantasyTeam | null> {
  const supabase = await createRouteHandlerClient();

  const { data: team } = await untypedTable(supabase, "fantasy_teams")
    .select("*")
    .eq("player_id", playerId)
    .eq("league_id", leagueId)
    .single();

  if (!team) return null;

  const { data: players } = await untypedTable(supabase, "fantasy_team_players")
    .select("*")
    .eq("team_id", (team as any).id);

  return {
    ...mapTeam(team),
    players: ((players ?? []) as any[]).map(mapTeamPlayer),
  };
}

export async function getLeaderboard(leagueId: string): Promise<FantasyLeaderboardEntry[]> {
  const supabase = await createRouteHandlerClient();

  const { data, error } = await untypedTable(supabase, "fantasy_teams")
    .select("id, name, player_id, total_points")
    .eq("league_id", leagueId)
    .order("total_points", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch fantasy leaderboard", { error });
    return [];
  }

  return ((data ?? []) as any[]).map((row: Record<string, unknown>) => ({
    teamId: row.id as string,
    teamName: row.name as string,
    playerId: row.player_id as string,
    totalPoints: row.total_points as number,
  }));
}

function mapTeam(row: Record<string, unknown>): Omit<FantasyTeam, "players"> {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    leagueId: row.league_id as string,
    name: row.name as string,
    budgetRemaining: row.budget_remaining as number,
    totalPoints: row.total_points as number,
  };
}

function mapTeamPlayer(row: Record<string, unknown>): FantasyTeamPlayer {
  return {
    id: row.id as string,
    proPlayerId: row.pro_player_id as number,
    proPlayerName: row.pro_player_name as string,
    purchasePrice: row.purchase_price as number,
  };
}
