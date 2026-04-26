-- Fantasy esport: compose a virtual team of pro players and earn points based on real performances

CREATE TABLE IF NOT EXISTS fantasy_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  game text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  budget_cap integer NOT NULL DEFAULT 10000,
  max_players integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE fantasy_leagues IS 'Fantasy esport leagues';

CREATE TABLE IF NOT EXISTS fantasy_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  league_id uuid NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  name text NOT NULL,
  budget_remaining integer NOT NULL DEFAULT 10000,
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, league_id)
);

COMMENT ON TABLE fantasy_teams IS 'Player fantasy teams within a league';

CREATE TABLE IF NOT EXISTS fantasy_team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  pro_player_id integer NOT NULL, -- PandaScore player ID
  pro_player_name text NOT NULL,
  purchase_price integer NOT NULL CHECK (purchase_price > 0),
  added_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE fantasy_team_players IS 'Pro players drafted into fantasy teams';

CREATE TABLE IF NOT EXISTS fantasy_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  match_day date NOT NULL,
  points integer NOT NULL DEFAULT 0,
  breakdown jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE fantasy_scores IS 'Daily score entries for fantasy teams';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_player ON fantasy_teams(player_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_league ON fantasy_teams(league_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_team_players_team ON fantasy_team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_scores_team ON fantasy_scores(team_id);

-- RLS
ALTER TABLE fantasy_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active leagues" ON fantasy_leagues FOR SELECT USING (status = 'active');
CREATE POLICY "Players can view their own teams" ON fantasy_teams FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can insert their own teams" ON fantasy_teams FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can view their team players" ON fantasy_team_players FOR SELECT
  USING (EXISTS (SELECT 1 FROM fantasy_teams WHERE id = team_id AND player_id = auth.uid()));
CREATE POLICY "Players can manage their team players" ON fantasy_team_players FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM fantasy_teams WHERE id = team_id AND player_id = auth.uid()));
CREATE POLICY "Players can delete their team players" ON fantasy_team_players FOR DELETE
  USING (EXISTS (SELECT 1 FROM fantasy_teams WHERE id = team_id AND player_id = auth.uid()));
CREATE POLICY "Players can view their scores" ON fantasy_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM fantasy_teams WHERE id = team_id AND player_id = auth.uid()));
