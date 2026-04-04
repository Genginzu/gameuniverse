-- Migration: player_xp table
-- Objective: Create the player_xp table to store the total XP accumulated
-- by each player. XP is awarded when achievements are unlocked and feeds
-- the level system (level = floor(0.3 × √(xp_total)) + 1).
-- Requirements: 4.5

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.player_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT player_xp_user_unique UNIQUE (user_id)
);
-- 2. Index on user_id for fast lookups by player
CREATE INDEX IF NOT EXISTS idx_player_xp_user_id
  ON public.player_xp(user_id);
-- 3. Enable RLS
ALTER TABLE public.player_xp ENABLE ROW LEVEL SECURITY;
-- 4. RLS policy: public read (anyone can see XP/level)
CREATE POLICY player_xp_select_all
  ON public.player_xp
  FOR SELECT
  USING (true);
-- 5. RLS policy: owner insert (only the player can create their own XP row)
CREATE POLICY player_xp_insert_own
  ON public.player_xp
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- 6. RLS policy: owner update (only the player can update their own XP)
CREATE POLICY player_xp_update_own
  ON public.player_xp
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- 7. Documentation
COMMENT ON TABLE public.player_xp IS 'Stores the total XP accumulated by each player, used to compute their level';
COMMENT ON COLUMN public.player_xp.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.player_xp.user_id IS 'FK to auth.users — the player (unique, one row per player)';
COMMENT ON COLUMN public.player_xp.xp_total IS 'Total XP accumulated by the player (default 0)';
COMMENT ON COLUMN public.player_xp.updated_at IS 'Timestamp of the last XP update';
