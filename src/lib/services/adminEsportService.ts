import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  EsportTeam,
  EsportPlayer,
  EsportPlayerWithTeam,
  EsportTournament,
  EsportMatch,
  EsportMatchWithDetails,
} from "@/types/esport";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

function paginate(page: number, limit: number): [number, number] {
  const from = (page - 1) * limit;
  return [from, from + limit - 1];
}

// ─── Teams ───────────────────────────────────────────────────────────

export async function getTeams(page: number, limit: number, search?: string) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("esport_teams" as UntypedFrom)
    .select("*", { count: "exact" });
  if (search) query = query.ilike("name", `%${search}%`);

  const [from, to] = paginate(page, limit);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { teams: (data ?? []) as EsportTeam[], total: count ?? 0 };
}

export async function getTeamById(id: string): Promise<EsportTeam | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_teams" as UntypedFrom)
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116") return null;
  if (error) throw error;
  return data as EsportTeam;
}

export async function upsertTeam(teamData: Partial<EsportTeam>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_teams" as UntypedFrom)
    .upsert(teamData)
    .select()
    .single();
  if (error) throw error;
  return data as EsportTeam;
}

export async function deleteTeam(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("esport_teams" as UntypedFrom)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── Players ─────────────────────────────────────────────────────────

export async function getPlayers(page: number, limit: number, search?: string) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("esport_players" as UntypedFrom)
    .select("*, esport_teams(name)", { count: "exact" });
  if (search) query = query.ilike("name", `%${search}%`);

  const [from, to] = paginate(page, limit);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const players = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...row,
    team_name: (row.esport_teams as { name: string } | null)?.name ?? null,
    esport_teams: undefined,
  })) as unknown as EsportPlayerWithTeam[];

  return { players, total: count ?? 0 };
}

export async function getPlayerById(id: string): Promise<EsportPlayer | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_players" as UntypedFrom)
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116") return null;
  if (error) throw error;
  return data as EsportPlayer;
}

export async function upsertPlayer(playerData: Partial<EsportPlayer>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_players" as UntypedFrom)
    .upsert(playerData)
    .select()
    .single();
  if (error) throw error;
  return data as EsportPlayer;
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("esport_players" as UntypedFrom)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── Tournaments ─────────────────────────────────────────────────────

export async function getTournaments(page: number, limit: number, search?: string) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("esport_tournaments" as UntypedFrom)
    .select("*", { count: "exact" });
  if (search) query = query.ilike("name", `%${search}%`);

  const [from, to] = paginate(page, limit);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { tournaments: (data ?? []) as EsportTournament[], total: count ?? 0 };
}

export async function getTournamentById(id: string): Promise<EsportTournament | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_tournaments" as UntypedFrom)
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116") return null;
  if (error) throw error;
  return data as EsportTournament;
}

export async function upsertTournament(tournamentData: Partial<EsportTournament>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_tournaments" as UntypedFrom)
    .upsert(tournamentData)
    .select()
    .single();
  if (error) throw error;
  return data as EsportTournament;
}

export async function deleteTournament(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("esport_tournaments" as UntypedFrom)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── Matches ─────────────────────────────────────────────────────────

const MATCH_SELECT =
  "*, esport_tournaments(name), opponent1:esport_teams!opponent1_id(name), opponent2:esport_teams!opponent2_id(name)";

export async function getMatches(
  page: number,
  limit: number,
  search?: string,
  tournamentId?: string
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("esport_matches" as UntypedFrom)
    .select(MATCH_SELECT, { count: "exact" });
  if (search) query = query.ilike("name", `%${search}%`);
  if (tournamentId) query = query.eq("tournament_id", tournamentId);

  const [from, to] = paginate(page, limit);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const matches = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...row,
    tournament_name: (row.esport_tournaments as { name: string } | null)?.name ?? null,
    opponent1_name: (row.opponent1 as { name: string } | null)?.name ?? null,
    opponent2_name: (row.opponent2 as { name: string } | null)?.name ?? null,
    esport_tournaments: undefined,
    opponent1: undefined,
    opponent2: undefined,
  })) as unknown as EsportMatchWithDetails[];

  return { matches, total: count ?? 0 };
}

export async function getMatchById(id: string): Promise<EsportMatch | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_matches" as UntypedFrom)
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116") return null;
  if (error) throw error;
  return data as EsportMatch;
}

export async function upsertMatch(matchData: Partial<EsportMatch>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("esport_matches" as UntypedFrom)
    .upsert(matchData)
    .select()
    .single();
  if (error) throw error;
  return data as EsportMatch;
}

export async function deleteMatch(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("esport_matches" as UntypedFrom)
    .delete()
    .eq("id", id);
  if (error) throw error;
}
