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

export interface EsportLiveMatch {
  id: number;
  name: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ id: number | null; name: string; imageUrl: string | null; score: number }>;
  streams: Array<{ language: string; main: boolean; rawUrl: string }>;
}

export interface EsportResultMatch {
  id: number;
  name: string;
  status: string;
  beginAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  tournament: string;
  opponents: Array<{ name: string; imageUrl: string | null; score: number }>;
  winnerId: number | null;
}

export interface EsportCalendarTournament {
  id: number;
  name: string;
  slug: string;
  beginAt: string | null;
  endAt: string | null;
  game: string;
  gameSlug: string;
  league: string;
  leagueImageUrl: string | null;
  serie: string;
  prizepool: string | null;
  tier: string;
  status: "upcoming" | "running";
}
