-- Migration: player_goals table
-- Objective: Create the player_goals table to store personal goals for the
-- player stats dashboard feature (Requirements 13.1, 13.2).
-- Each row represents a personal goal set by a player with a type, target value,
-- current progress, and optional deadline. Only the owner can CRUD their goals.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.player_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR(30) NOT NULL
    CHECK (goal_type IN (
      'games_to_complete', 'play_time_hours',
      'reviews_to_write', 'collections_to_create'
    )),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline DATE
);

-- 2. Index on user_id for fast lookups by player
CREATE INDEX IF NOT EXISTS idx_player_goals_user_id
  ON public.player_goals(user_id);

-- 3. Enable RLS
ALTER TABLE public.player_goals ENABLE ROW LEVEL SECURITY;

-- 4. RLS policy: owner select (only the owner can see their own goals)
CREATE POLICY player_goals_select_own
  ON public.player_goals
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS policy: owner insert
CREATE POLICY player_goals_insert_own
  ON public.player_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS policy: owner update
CREATE POLICY player_goals_update_own
  ON public.player_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS policy: owner delete
CREATE POLICY player_goals_delete_own
  ON public.player_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Documentation
COMMENT ON TABLE public.player_goals IS 'Stores personal goals set by players (e.g. games to complete, play time targets)';
COMMENT ON COLUMN public.player_goals.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.player_goals.user_id IS 'FK to auth.users — the player who set the goal';
COMMENT ON COLUMN public.player_goals.goal_type IS 'Type of goal: games_to_complete, play_time_hours, reviews_to_write, or collections_to_create';
COMMENT ON COLUMN public.player_goals.target_value IS 'Target value to reach (must be > 0)';
COMMENT ON COLUMN public.player_goals.current_value IS 'Current progress value (defaults to 0)';
COMMENT ON COLUMN public.player_goals.created_at IS 'Timestamp when the goal was created';
COMMENT ON COLUMN public.player_goals.deadline IS 'Optional deadline date for the goal (nullable)';
