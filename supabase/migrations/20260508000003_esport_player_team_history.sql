-- Player team history.
--
-- esport_players.team_id only tracks the *current* team. To show a player's
-- past teams on the public profile and compute stats correctly across team
-- changes, we need a dedicated history table.
--
-- Each row is a "membership period" with an open-ended `ended_at` while the
-- player is still on that team, set by the sync when a transfer is detected.

CREATE TABLE IF NOT EXISTS public.esport_player_team_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.esport_players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.esport_teams(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A player can only have one open membership per team at a time.
  CONSTRAINT esport_player_team_history_unique_open
    UNIQUE (player_id, team_id, started_at)
);

COMMENT ON TABLE public.esport_player_team_history IS
  'Past and current team memberships for esport players. Maintained by the PandaScore sync when current_team changes.';
COMMENT ON COLUMN public.esport_player_team_history.ended_at IS
  'NULL means the player is still on that team; set when a transfer is detected.';

-- Most queries are by player → keep them sorted by start date.
CREATE INDEX IF NOT EXISTS idx_eptt_player_started
  ON public.esport_player_team_history (player_id, started_at DESC);

-- Quick lookup of the currently active membership for a player.
CREATE INDEX IF NOT EXISTS idx_eptt_player_active
  ON public.esport_player_team_history (player_id)
  WHERE ended_at IS NULL;

-- Useful when computing stats: matches between dates intersected with
-- team membership periods.
CREATE INDEX IF NOT EXISTS idx_eptt_team_period
  ON public.esport_player_team_history (team_id, started_at, ended_at);

-- updated_at trigger reusing the existing helper from migration 06.
CREATE TRIGGER trg_esport_player_team_history_updated_at
  BEFORE UPDATE ON public.esport_player_team_history
  FOR EACH ROW EXECUTE FUNCTION public.esport_updated_at();

-- Public read, admin-only write (managed by the service role / sync).
ALTER TABLE public.esport_player_team_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esport_player_team_history_read"
  ON public.esport_player_team_history
  FOR SELECT
  USING (true);
