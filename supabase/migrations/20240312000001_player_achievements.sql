-- Migration: player_achievements table
-- Objective: Create the player_achievements table to store unlocked achievements
-- for the player stats dashboard feature (Requirements 11.2, 11.5).
-- Each row represents a single achievement unlocked by a player.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
-- 2. Index on user_id for fast lookups by player
CREATE INDEX IF NOT EXISTS idx_player_achievements_user_id
  ON public.player_achievements(user_id);
-- 3. Enable RLS
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
-- 4. RLS policy: public read (anyone can see achievements)
CREATE POLICY player_achievements_select_all
  ON public.player_achievements
  FOR SELECT
  USING (true);
-- 5. RLS policy: owner insert (only the player can unlock their own achievements)
CREATE POLICY player_achievements_insert_own
  ON public.player_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- 6. Documentation
COMMENT ON TABLE public.player_achievements IS 'Stores unlocked achievements/badges for each player';
COMMENT ON COLUMN public.player_achievements.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.player_achievements.user_id IS 'FK to auth.users — the player who unlocked the achievement';
COMMENT ON COLUMN public.player_achievements.achievement_key IS 'Unique key identifying the achievement (e.g. first_game, library_10)';
COMMENT ON COLUMN public.player_achievements.unlocked_at IS 'Timestamp when the achievement was unlocked';
