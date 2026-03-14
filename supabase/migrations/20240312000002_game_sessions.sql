-- Migration: game_sessions table
-- Objective: Create the game_sessions table to store play sessions for the
-- player stats dashboard feature (Requirements 12.1, 12.5).
-- Each row represents a single gaming session with start/end timestamps.
-- duration_minutes is auto-computed via a trigger (BEFORE INSERT OR UPDATE).

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT game_sessions_valid_range CHECK (ended_at > started_at)
);

-- 2. Trigger function to compute duration_minutes from started_at / ended_at
CREATE OR REPLACE FUNCTION public.compute_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER / 60;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_session_duration
  BEFORE INSERT OR UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_session_duration();

-- 3. Index on user_id for fast lookups by player
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id
  ON public.game_sessions(user_id);

-- 4. Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy: public read (anyone can see a player's sessions)
CREATE POLICY game_sessions_select_all
  ON public.game_sessions
  FOR SELECT
  USING (true);

-- 6. RLS policy: owner insert
CREATE POLICY game_sessions_insert_own
  ON public.game_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS policy: owner update
CREATE POLICY game_sessions_update_own
  ON public.game_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS policy: owner delete
CREATE POLICY game_sessions_delete_own
  ON public.game_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Documentation
COMMENT ON TABLE public.game_sessions IS 'Stores individual gaming sessions with start/end timestamps and computed duration';
COMMENT ON COLUMN public.game_sessions.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.game_sessions.user_id IS 'FK to auth.users — the player who played the session';
COMMENT ON COLUMN public.game_sessions.game_id IS 'FK to games — the game that was played';
COMMENT ON COLUMN public.game_sessions.started_at IS 'Timestamp when the session started';
COMMENT ON COLUMN public.game_sessions.ended_at IS 'Timestamp when the session ended (must be after started_at)';
COMMENT ON COLUMN public.game_sessions.duration_minutes IS 'Duration in minutes, auto-computed from ended_at - started_at via trigger';
