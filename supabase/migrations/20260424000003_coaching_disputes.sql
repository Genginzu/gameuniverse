-- Coaching disputes / reports for admin moderation

CREATE TABLE IF NOT EXISTS public.coaching_disputes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('no_show','inappropriate','fraud','quality','other')),
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.coaching_disputes IS 'Reports and disputes filed by users about coaching sessions';

CREATE INDEX IF NOT EXISTS idx_coaching_disputes_status ON public.coaching_disputes(status);
CREATE INDEX IF NOT EXISTS idx_coaching_disputes_reporter ON public.coaching_disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_coaching_disputes_reported ON public.coaching_disputes(reported_id);

ALTER TABLE public.coaching_disputes ENABLE ROW LEVEL SECURITY;

-- Users can see their own disputes
CREATE POLICY "Users can view their own disputes"
  ON public.coaching_disputes FOR SELECT
  USING (reporter_id = auth.uid() OR reported_id = auth.uid());

-- Authenticated users can create disputes
CREATE POLICY "Users can create disputes"
  ON public.coaching_disputes FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Add is_suspended to coach_profiles
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

COMMENT ON COLUMN public.coach_profiles.is_suspended IS 'Whether the coach is suspended by admin';
