-- Local esport tables: teams, players, tournaments, matches
-- Stores PandaScore data locally for admin management and offline access.

-- Teams
CREATE TABLE IF NOT EXISTS public.esport_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandascore_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  acronym TEXT,
  image_url TEXT,
  location TEXT,
  game TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.esport_teams IS 'Local copy of esport teams (sourced from PandaScore)';
COMMENT ON COLUMN public.esport_teams.pandascore_id IS 'PandaScore team ID for sync';

CREATE INDEX IF NOT EXISTS idx_esport_teams_pandascore_id ON public.esport_teams (pandascore_id) WHERE pandascore_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esport_teams_game ON public.esport_teams (game) WHERE game IS NOT NULL;

-- Players
CREATE TABLE IF NOT EXISTS public.esport_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandascore_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  nationality TEXT,
  image_url TEXT,
  role TEXT,
  team_id UUID REFERENCES public.esport_teams(id) ON DELETE SET NULL,
  game TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.esport_players IS 'Local copy of esport players (sourced from PandaScore)';

CREATE INDEX IF NOT EXISTS idx_esport_players_pandascore_id ON public.esport_players (pandascore_id) WHERE pandascore_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esport_players_team_id ON public.esport_players (team_id) WHERE team_id IS NOT NULL;

-- Tournaments
CREATE TABLE IF NOT EXISTS public.esport_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandascore_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  begin_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  prizepool TEXT,
  tier TEXT,
  league_name TEXT,
  league_image_url TEXT,
  serie_name TEXT,
  game TEXT,
  winner_id UUID REFERENCES public.esport_teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.esport_tournaments IS 'Local copy of esport tournaments (sourced from PandaScore)';

CREATE INDEX IF NOT EXISTS idx_esport_tournaments_pandascore_id ON public.esport_tournaments (pandascore_id) WHERE pandascore_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esport_tournaments_game ON public.esport_tournaments (game) WHERE game IS NOT NULL;

-- Matches (results)
CREATE TABLE IF NOT EXISTS public.esport_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandascore_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  match_type TEXT,
  number_of_games INTEGER,
  begin_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  tournament_id UUID REFERENCES public.esport_tournaments(id) ON DELETE SET NULL,
  opponent1_id UUID REFERENCES public.esport_teams(id) ON DELETE SET NULL,
  opponent1_score INTEGER,
  opponent2_id UUID REFERENCES public.esport_teams(id) ON DELETE SET NULL,
  opponent2_score INTEGER,
  winner_id UUID REFERENCES public.esport_teams(id) ON DELETE SET NULL,
  game TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.esport_matches IS 'Local copy of esport matches/results (sourced from PandaScore)';

CREATE INDEX IF NOT EXISTS idx_esport_matches_pandascore_id ON public.esport_matches (pandascore_id) WHERE pandascore_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esport_matches_tournament_id ON public.esport_matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_esport_matches_status ON public.esport_matches (status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.esport_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_esport_teams_updated_at BEFORE UPDATE ON public.esport_teams FOR EACH ROW EXECUTE FUNCTION public.esport_updated_at();
CREATE TRIGGER trg_esport_players_updated_at BEFORE UPDATE ON public.esport_players FOR EACH ROW EXECUTE FUNCTION public.esport_updated_at();
CREATE TRIGGER trg_esport_tournaments_updated_at BEFORE UPDATE ON public.esport_tournaments FOR EACH ROW EXECUTE FUNCTION public.esport_updated_at();
CREATE TRIGGER trg_esport_matches_updated_at BEFORE UPDATE ON public.esport_matches FOR EACH ROW EXECUTE FUNCTION public.esport_updated_at();

-- RLS (admin-only write, public read)
ALTER TABLE public.esport_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esport_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esport_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esport_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esport_teams_read" ON public.esport_teams FOR SELECT USING (true);
CREATE POLICY "esport_players_read" ON public.esport_players FOR SELECT USING (true);
CREATE POLICY "esport_tournaments_read" ON public.esport_tournaments FOR SELECT USING (true);
CREATE POLICY "esport_matches_read" ON public.esport_matches FOR SELECT USING (true);
