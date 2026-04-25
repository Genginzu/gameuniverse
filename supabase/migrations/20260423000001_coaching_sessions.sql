-- Migration: Coaching sessions table
-- Objective: Create the coaching_sessions table to track bookings between
--   coaches and students, including scheduling, status, and payment info.

-- =============================================================================
-- 1. Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id),
  pricing_id UUID REFERENCES public.coach_pricing(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','confirmed','in_progress','completed','cancelled','disputed')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','released','refunded')),
  payment_amount NUMERIC(10,2),
  platform_fee NUMERIC(10,2),
  coach_payout NUMERIC(10,2),
  cancelled_by UUID REFERENCES public.profiles(id),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  refund_amount NUMERIC(10,2),
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.coaching_sessions IS
  'Coaching session bookings between coaches and students, with scheduling, status tracking, and payment details.';

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id
  ON public.coaching_sessions (coach_id);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_student_id
  ON public.coaching_sessions (student_id);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_game_id
  ON public.coaching_sessions (game_id);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status
  ON public.coaching_sessions (status);

-- =============================================================================
-- 3. Row Level Security
-- =============================================================================

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: coach or student can see their own sessions
CREATE POLICY "coaching_sessions_select" ON public.coaching_sessions
  FOR SELECT USING (
    student_id = auth.uid()
    OR coach_id IN (
      SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()
    )
  );

-- INSERT: authenticated users can create sessions as student
CREATE POLICY "coaching_sessions_insert" ON public.coaching_sessions
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

-- UPDATE: coach or student of the session
CREATE POLICY "coaching_sessions_update" ON public.coaching_sessions
  FOR UPDATE USING (
    student_id = auth.uid()
    OR coach_id IN (
      SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()
    )
  );
