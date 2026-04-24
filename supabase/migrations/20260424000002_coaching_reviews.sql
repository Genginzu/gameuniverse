-- Coaching reviews: students rate coaches after completed sessions

CREATE TABLE IF NOT EXISTS public.coaching_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  coach_response text,
  coach_responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id)
);

COMMENT ON TABLE public.coaching_reviews IS 'Reviews left by students after completed coaching sessions';

CREATE INDEX IF NOT EXISTS idx_coaching_reviews_coach_id ON public.coaching_reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_reviews_student_id ON public.coaching_reviews(student_id);

ALTER TABLE public.coaching_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.coaching_reviews FOR SELECT USING (true);

-- Student can create a review for their own session
CREATE POLICY "Students can create reviews"
  ON public.coaching_reviews FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Coach can update only coach_response on their own reviews
CREATE POLICY "Coaches can respond to their reviews"
  ON public.coaching_reviews FOR UPDATE
  USING (coach_id IN (SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()));

-- Function to auto-update average_rating on coach_profiles
CREATE OR REPLACE FUNCTION public.update_coach_average_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE public.coach_profiles
  SET average_rating = (
    SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
    FROM public.coaching_reviews
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM public.coaching_reviews
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_coach_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.coaching_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_coach_average_rating();
