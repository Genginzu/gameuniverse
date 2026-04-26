// PandaScore API response types
// Docs: https://developers.pandascore.co/reference

export interface PandaScoreVideogame {
  id: number;
  name: string;
  slug: string;
}

export interface PandaScoreTournament {
  id: number;
  name: string;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  serie_id: number;
  league_id: number;
  league: PandaScoreLeague;
  serie: PandaScoreSerie;
  videogame: PandaScoreVideogame;
  prizepool: string | null;
  tier: "s" | "a" | "b" | "c" | "d" | "unranked";
  winner_id: number | null;
  winner_type: "Team" | "Player" | null;
}

export interface PandaScoreLeague {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  url: string | null;
}

export interface PandaScoreSerie {
  id: number;
  name: string | null;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  full_name: string;
  year: number | null;
}

export interface PandaScoreTeam {
  id: number;
  name: string;
  slug: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  current_videogame: PandaScoreVideogame | null;
}

export interface PandaScorePlayer {
  id: number;
  name: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  image_url: string | null;
  role: string | null;
  current_team: PandaScoreTeam | null;
  current_videogame: PandaScoreVideogame | null;
}

export interface PandaScoreOpponent {
  type: "Team" | "Player";
  opponent: PandaScoreTeam | PandaScorePlayer;
}

export interface PandaScoreMatch {
  id: number;
  name: string;
  slug: string;
  status: "not_started" | "running" | "finished" | "canceled" | "postponed";
  match_type: "best_of" | "custom" | "first_to" | "ow_best_of";
  number_of_games: number;
  begin_at: string | null;
  end_at: string | null;
  tournament_id: number;
  tournament: PandaScoreTournament;
  opponents: PandaScoreOpponent[];
  winner_id: number | null;
  winner_type: "Team" | "Player" | null;
  videogame: PandaScoreVideogame;
  league: PandaScoreLeague;
  serie: PandaScoreSerie;
  results: PandaScoreMatchResult[];
  streams_list: PandaScoreStream[];
}

export interface PandaScoreMatchResult {
  team_id: number;
  score: number;
}

export interface PandaScoreStream {
  language: string;
  main: boolean;
  raw_url: string;
}

/** Query params shared across list endpoints */
export interface PandaScoreListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  "filter[videogame_id]"?: number;
  "filter[videogame_title]"?: string;
  [key: string]: string | number | boolean | undefined;
}
