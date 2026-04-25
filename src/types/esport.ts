export interface EsportTeam {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  game: string;
  created_at: string;
  updated_at: string;
}

export interface EsportPlayer {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  image_url: string | null;
  role: string | null;
  team_id: string | null;
  game: string;
  created_at: string;
  updated_at: string;
}

export interface EsportTournament {
  id: string;
  pandascore_id: number | null;
  name: string;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  prizepool: string | null;
  tier: string | null;
  league_name: string | null;
  league_image_url: string | null;
  serie_name: string | null;
  game: string;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EsportMatch {
  id: string;
  pandascore_id: number | null;
  name: string;
  status: string;
  match_type: string;
  number_of_games: number;
  begin_at: string | null;
  end_at: string | null;
  tournament_id: string | null;
  opponent1_id: string | null;
  opponent1_score: number | null;
  opponent2_id: string | null;
  opponent2_score: number | null;
  winner_id: string | null;
  game: string;
  created_at: string;
  updated_at: string;
}

export interface EsportPlayerWithTeam extends EsportPlayer {
  team_name: string | null;
}

export interface EsportMatchWithDetails extends EsportMatch {
  tournament_name: string | null;
  opponent1_name: string | null;
  opponent2_name: string | null;
}

export type AdminEsportTab = "teams" | "players" | "tournaments" | "matches";
