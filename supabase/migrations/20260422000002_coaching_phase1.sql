-- Migration: Coaching system phase 1 — core tables
-- Objective: Create the foundational tables for the coaching feature:
--   coach_profiles, coach_games, and coach_pricing.
-- Coaches are players who offer paid game-specific coaching sessions.

-- =============================================================================
-- 1. Tables
-- =============================================================================

-- 1a. coach_profiles
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  experience TEXT,
  languages TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  cancellation_policy JSONB DEFAULT '{"free_until_hours": 24, "partial_refund_percentage": 50, "no_refund_after_hours": 2}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.coach_profiles IS
  'Player coaching profiles. Each player can have at most one coach profile.';

-- 1b. coach_games
CREATE TABLE IF NOT EXISTS public.coach_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  rank_level TEXT,
  hours_experience INTEGER DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coach_id, game_id)
);

COMMENT ON TABLE public.coach_games IS
  'Games a coach offers sessions for, with rank and specialties per game.';

-- 1c. coach_pricing
CREATE TABLE IF NOT EXISTS public.coach_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_game_id UUID NOT NULL REFERENCES public.coach_games(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('single', 'pack_5', 'pack_10', 'monthly')),
  price_amount NUMERIC(10,2) NOT NULL CHECK (price_amount > 0),
  price_currency TEXT DEFAULT 'EUR',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coach_game_id, session_type)
);

COMMENT ON TABLE public.coach_pricing IS
  'Pricing tiers for coaching sessions, linked to a specific coach-game pair.';

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_coach_profiles_player_id
  ON public.coach_profiles (player_id);

CREATE INDEX IF NOT EXISTS idx_coach_games_coach_id
  ON public.coach_games (coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_games_game_id
  ON public.coach_games (game_id);

CREATE INDEX IF NOT EXISTS idx_coach_pricing_coach_game_id
  ON public.coach_pricing (coach_game_id);

-- =============================================================================
-- 3. Row Level Security
-- =============================================================================

-- 3a. coach_profiles
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coach profiles are viewable by everyone"
  ON public.coach_profiles FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can insert their own coach profile"
  ON public.coach_profiles FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update their own coach profile"
  ON public.coach_profiles FOR UPDATE
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can delete their own coach profile"
  ON public.coach_profiles FOR DELETE
  USING (player_id = auth.uid());

-- 3b. coach_games
ALTER TABLE public.coach_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach games are viewable when coach is active"
  ON public.coach_games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_id AND cp.is_active = TRUE
    )
  );

CREATE POLICY "Coach owners can insert their games"
  ON public.coach_games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_id AND cp.player_id = auth.uid()
    )
  );

CREATE POLICY "Coach owners can update their games"
  ON public.coach_games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_id AND cp.player_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_id AND cp.player_id = auth.uid()
    )
  );

CREATE POLICY "Coach owners can delete their games"
  ON public.coach_games FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_id AND cp.player_id = auth.uid()
    )
  );

-- 3c. coach_pricing
ALTER TABLE public.coach_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach pricing is viewable by everyone"
  ON public.coach_pricing FOR SELECT
  USING (TRUE);

CREATE POLICY "Coach owners can insert pricing"
  ON public.coach_pricing FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_games cg
      JOIN public.coach_profiles cp ON cp.id = cg.coach_id
      WHERE cg.id = coach_game_id AND cp.player_id = auth.uid()
    )
  );

CREATE POLICY "Coach owners can update pricing"
  ON public.coach_pricing FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_games cg
      JOIN public.coach_profiles cp ON cp.id = cg.coach_id
      WHERE cg.id = coach_game_id AND cp.player_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coach_games cg
      JOIN public.coach_profiles cp ON cp.id = cg.coach_id
      WHERE cg.id = coach_game_id AND cp.player_id = auth.uid()
    )
  );

CREATE POLICY "Coach owners can delete pricing"
  ON public.coach_pricing FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_games cg
      JOIN public.coach_profiles cp ON cp.id = cg.coach_id
      WHERE cg.id = coach_game_id AND cp.player_id = auth.uid()
    )
  );
