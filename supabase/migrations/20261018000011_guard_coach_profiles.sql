-- Server-only trust, rating and Stripe fields on coach_profiles.
--
-- Context:
--   "Users can update their own coach profile" (20260422000002) only checks
--   player_id = auth.uid(). Through PostgREST a coach could set is_verified,
--   average_rating / total_* counters, lift their own suspension, flip
--   stripe_onboarding_complete or replace stripe_account_id with another
--   account. cancellation_policy was free JSON, so values like a 500 % refund
--   or a negative window broke the refund maths.
--
-- Fix:
--   A BEFORE INSERT OR UPDATE trigger for direct client writes. It is SECURITY
--   INVOKER and checks current_user, not auth.role(): the rating aggregate
--   trigger (update_coach_average_rating, SECURITY DEFINER) updates
--   coach_profiles while the student's JWT is still set, and must keep working.
--     - INSERT: protected columns are reset to their defaults.
--     - UPDATE: protected and identity columns are immutable; a suspended coach
--       cannot reactivate the profile.
--     - cancellation_policy must be hours in [0, 720], percentage in [0, 100],
--       no_refund_after_hours <= free_until_hours.
--   Admin actions, the Stripe webhook and Stripe onboarding write with the
--   service role.

CREATE OR REPLACE FUNCTION public.is_valid_cancellation_policy(p_policy jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT jsonb_typeof(p_policy) = 'object'
    AND jsonb_typeof(p_policy -> 'free_until_hours') = 'number'
    AND jsonb_typeof(p_policy -> 'partial_refund_percentage') = 'number'
    AND jsonb_typeof(p_policy -> 'no_refund_after_hours') = 'number'
    AND (p_policy ->> 'free_until_hours')::numeric BETWEEN 0 AND 720
    AND (p_policy ->> 'partial_refund_percentage')::numeric BETWEEN 0 AND 100
    AND (p_policy ->> 'no_refund_after_hours')::numeric BETWEEN 0 AND 720
    AND (p_policy ->> 'no_refund_after_hours')::numeric
        <= (p_policy ->> 'free_until_hours')::numeric;
$$;

COMMENT ON FUNCTION public.is_valid_cancellation_policy(jsonb) IS
  'Validates a coach cancellation policy: hours in [0,720], percentage in [0,100], no_refund <= free_until.';

CREATE OR REPLACE FUNCTION public.enforce_coach_profile_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.cancellation_policy IS NOT NULL
     AND NOT public.is_valid_cancellation_policy(NEW.cancellation_policy) THEN
    RAISE EXCEPTION 'coach_profiles: invalid cancellation_policy' USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
    NEW.verified_at := NULL;
    NEW.average_rating := 0;
    NEW.total_reviews := 0;
    NEW.total_sessions := 0;
    NEW.is_suspended := false;
    NEW.suspended_at := NULL;
    NEW.suspended_reason := NULL;
    NEW.stripe_account_id := NULL;
    NEW.stripe_onboarding_complete := false;
    NEW.created_at := now();
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.player_id IS DISTINCT FROM OLD.player_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.average_rating IS DISTINCT FROM OLD.average_rating
     OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews
     OR NEW.total_sessions IS DISTINCT FROM OLD.total_sessions
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
     OR NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id
     OR NEW.stripe_onboarding_complete IS DISTINCT FROM OLD.stripe_onboarding_complete THEN
    RAISE EXCEPTION 'coach_profiles: verification, rating, suspension and Stripe fields are server-only'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.is_suspended AND NEW.is_active AND NOT COALESCE(OLD.is_active, false) THEN
    RAISE EXCEPTION 'coach_profiles: a suspended coach cannot reactivate the profile'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_coach_profile_write() IS
  'Direct client writes to coach_profiles cannot touch verification, rating, suspension or Stripe '
  'fields, and must carry a valid cancellation_policy.';

DROP TRIGGER IF EXISTS trg_enforce_coach_profile_write ON public.coach_profiles;
CREATE TRIGGER trg_enforce_coach_profile_write
  BEFORE INSERT OR UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coach_profile_write();
