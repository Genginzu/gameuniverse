-- Esport predictions: virtual bets on pro tournament matches via PandaScore
-- Players wager GU Coins on match outcomes

CREATE TABLE IF NOT EXISTS esport_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id integer NOT NULL, -- PandaScore match ID
  match_name text NOT NULL,
  game text NOT NULL,
  predicted_winner_id integer NOT NULL, -- PandaScore team/player ID
  predicted_winner_name text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  payout integer DEFAULT 0,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE esport_predictions IS 'Virtual bets on pro esport matches using GU Coins';
COMMENT ON COLUMN esport_predictions.match_id IS 'PandaScore match ID';
COMMENT ON COLUMN esport_predictions.predicted_winner_id IS 'PandaScore team or player ID';

CREATE INDEX IF NOT EXISTS idx_esport_predictions_player ON esport_predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_esport_predictions_match ON esport_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_esport_predictions_status ON esport_predictions(status);

-- RLS
ALTER TABLE esport_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own predictions"
  ON esport_predictions FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Players can insert their own predictions"
  ON esport_predictions FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Leaderboard view
CREATE OR REPLACE VIEW esport_prediction_leaderboard AS
SELECT
  player_id,
  COUNT(*) AS total_predictions,
  COUNT(*) FILTER (WHERE status = 'won') AS correct_predictions,
  COALESCE(SUM(payout) - SUM(amount), 0) AS total_profit,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'won')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0) * 100, 1
  ) AS accuracy_rate
FROM esport_predictions
GROUP BY player_id;
