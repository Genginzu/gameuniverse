-- Timed account suspensions for the content moderation flow (issue #172).
-- A suspended user cannot create or edit posts, post comments or reviews until
-- profiles.suspended_until has passed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

COMMENT ON COLUMN public.profiles.suspended_until IS
  'End of the suspension; the account is suspended while is_suspended AND (suspended_until IS NULL OR suspended_until > now())';

-- Single source of truth for "is this account currently suspended?".
-- SECURITY DEFINER so RLS policies can call it regardless of profiles RLS.
CREATE OR REPLACE FUNCTION public.is_user_suspended(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_suspended AND (p.suspended_until IS NULL OR p.suspended_until > now())
      FROM public.profiles p
      WHERE p.id = uid
    ),
    false
  );
$$;

COMMENT ON FUNCTION public.is_user_suspended(uuid) IS
  'True when the account is currently suspended by moderation';

-- Restrictive policies are AND-ed with the existing permissive ones, so they
-- only add the "not suspended" requirement. service_role bypasses RLS.
DROP POLICY IF EXISTS "Suspended users cannot create posts" ON public.player_posts;
CREATE POLICY "Suspended users cannot create posts"
  ON public.player_posts AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT public.is_user_suspended(auth.uid()));

DROP POLICY IF EXISTS "Suspended users cannot edit posts" ON public.player_posts;
CREATE POLICY "Suspended users cannot edit posts"
  ON public.player_posts AS RESTRICTIVE FOR UPDATE
  USING (NOT public.is_user_suspended(auth.uid()));

DROP POLICY IF EXISTS "Suspended users cannot create comments" ON public.post_comments;
CREATE POLICY "Suspended users cannot create comments"
  ON public.post_comments AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT public.is_user_suspended(auth.uid()));

DROP POLICY IF EXISTS "Suspended users cannot edit comments" ON public.post_comments;
CREATE POLICY "Suspended users cannot edit comments"
  ON public.post_comments AS RESTRICTIVE FOR UPDATE
  USING (NOT public.is_user_suspended(auth.uid()));

DROP POLICY IF EXISTS "Suspended users cannot create reviews" ON public.game_reviews;
CREATE POLICY "Suspended users cannot create reviews"
  ON public.game_reviews AS RESTRICTIVE FOR INSERT
  WITH CHECK (NOT public.is_user_suspended(auth.uid()));

DROP POLICY IF EXISTS "Suspended users cannot edit reviews" ON public.game_reviews;
CREATE POLICY "Suspended users cannot edit reviews"
  ON public.game_reviews AS RESTRICTIVE FOR UPDATE
  USING (NOT public.is_user_suspended(auth.uid()));

-- Users may update their own profile row: prevent them from lifting their own
-- suspension. Only service_role (moderation) or direct SQL may change these.
CREATE OR REPLACE FUNCTION public.protect_profile_suspension()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon') AND (
    NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
    OR NEW.suspended_until IS DISTINCT FROM OLD.suspended_until
    OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
  ) THEN
    RAISE EXCEPTION 'Suspension fields can only be changed by moderation'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_suspension ON public.profiles;
CREATE TRIGGER trg_protect_profile_suspension
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_suspension();
