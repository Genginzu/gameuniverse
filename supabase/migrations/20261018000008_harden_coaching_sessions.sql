-- Harden coaching_sessions writes (booking price, status machine, payment fields).
--
-- Context:
--   coaching_sessions_update (20260423000001) only checked that the caller was
--   the student or the coach, with no WITH CHECK and no column guard. Through
--   PostgREST (public anon key + user JWT) a student could:
--     * set payment_status = 'paid' without paying, or status = 'completed'
--       to unlock a coaching review;
--     * move scheduled_at into the future after the session, then cancel to
--       get a 100 % Stripe refund, or raise payment_amount before cancelling;
--     * re-point coach_id / student_id.
--   coaching_sessions_insert let the student choose any pricing_id (including
--   a cheap tier of another coach), status, payment_status and amounts, so the
--   checkout charged whatever price the student picked.
--
-- Fix:
--   1. UPDATE policy gets a WITH CHECK mirroring USING.
--   2. A BEFORE INSERT OR UPDATE trigger, for interactive callers only
--      (auth.role() in 'authenticated' / 'anon'; service_role bypasses, like
--      protect_profile_suspension in 20261002000001):
--        INSERT: pricing_id is required and must be an active tier of this
--          coach for this game; duration_minutes and payment_amount are copied
--          from that tier (price snapshot at booking time); self-booking and
--          past dates are rejected; status / payment fields are forced to their
--          initial values.
--        UPDATE: identity, schedule and payment columns are immutable; status
--          may only follow the API state machine for the caller's role;
--          cancellation fields may only be set while cancelling, with
--          cancelled_by = caller. Payment fields are written by the server with
--          the service role (checkout, verify, refund, Stripe webhook).

-- =============================================================================
-- 1. UPDATE policy with WITH CHECK
-- =============================================================================

DROP POLICY IF EXISTS "coaching_sessions_update" ON public.coaching_sessions;
CREATE POLICY "coaching_sessions_update" ON public.coaching_sessions
  FOR UPDATE
  USING (
    student_id = auth.uid()
    OR coach_id IN (
      SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    OR coach_id IN (
      SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()
    )
  );

-- =============================================================================
-- 2. Column / state-machine guard
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_coaching_session_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_coach_player_id uuid;
  v_price numeric(10,2);
  v_duration integer;
  v_is_coach boolean;
  v_is_student boolean;
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  SELECT cp.player_id INTO v_coach_player_id
  FROM public.coach_profiles cp
  WHERE cp.id = NEW.coach_id;

  IF TG_OP = 'INSERT' THEN
    IF v_coach_player_id IS NULL THEN
      RAISE EXCEPTION 'coaching_sessions: unknown coach' USING ERRCODE = '23503';
    END IF;

    IF v_coach_player_id = v_uid THEN
      RAISE EXCEPTION 'coaching_sessions: coaches cannot book themselves'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.scheduled_at <= now() THEN
      RAISE EXCEPTION 'coaching_sessions: scheduled_at must be in the future'
        USING ERRCODE = '22023';
    END IF;

    SELECT p.price_amount, p.duration_minutes INTO v_price, v_duration
    FROM public.coach_pricing p
    JOIN public.coach_games g ON g.id = p.coach_game_id
    WHERE p.id = NEW.pricing_id
      AND g.coach_id = NEW.coach_id
      AND g.game_id = NEW.game_id
      AND COALESCE(p.is_active, true)
      AND COALESCE(g.is_active, true);

    IF v_price IS NULL THEN
      RAISE EXCEPTION 'coaching_sessions: pricing_id is not an active tier of this coach for this game'
        USING ERRCODE = '42501';
    END IF;

    NEW.duration_minutes := v_duration;
    NEW.payment_amount := v_price;
    NEW.status := 'requested';
    NEW.payment_status := 'pending';
    NEW.platform_fee := NULL;
    NEW.coach_payout := NULL;
    NEW.refund_amount := NULL;
    NEW.cancelled_by := NULL;
    NEW.cancelled_at := NULL;
    NEW.cancellation_reason := NULL;
    NEW.conversation_id := NULL;
    NEW.created_at := now();
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.coach_id IS DISTINCT FROM OLD.coach_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.game_id IS DISTINCT FROM OLD.game_id
     OR NEW.pricing_id IS DISTINCT FROM OLD.pricing_id
     OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'coaching_sessions: identity and schedule columns are immutable'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
     OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
     OR NEW.coach_payout IS DISTINCT FROM OLD.coach_payout
     OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount THEN
    RAISE EXCEPTION 'coaching_sessions: payment columns are written by the server only'
      USING ERRCODE = '42501';
  END IF;

  v_is_student := v_uid IS NOT NULL AND OLD.student_id = v_uid;
  v_is_coach := v_uid IS NOT NULL AND v_coach_player_id = v_uid;

  IF NOT (v_is_student OR v_is_coach) THEN
    RAISE EXCEPTION 'coaching_sessions: not a participant' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (v_is_coach AND (OLD.status, NEW.status) IN (
        ('requested', 'confirmed'),
        ('requested', 'cancelled'),
        ('confirmed', 'in_progress'),
        ('confirmed', 'cancelled'),
        ('in_progress', 'completed')
      ))
      OR (v_is_student AND (OLD.status, NEW.status) IN (
        ('requested', 'cancelled'),
        ('confirmed', 'cancelled')
      ))
    ) THEN
      RAISE EXCEPTION 'coaching_sessions: transition % -> % not allowed', OLD.status, NEW.status
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by
     OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN
    IF NOT (OLD.status <> 'cancelled' AND NEW.status = 'cancelled' AND NEW.cancelled_by = v_uid) THEN
      RAISE EXCEPTION 'coaching_sessions: cancellation fields can only be set while cancelling'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_coaching_session_write() IS
  'BEFORE INSERT/UPDATE guard on coaching_sessions for interactive callers: price and duration '
  'come from the coach tier, payment columns are server-only, status follows the state machine.';

DROP TRIGGER IF EXISTS trg_enforce_coaching_session_write ON public.coaching_sessions;
CREATE TRIGGER trg_enforce_coaching_session_write
  BEFORE INSERT OR UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coaching_session_write();

REVOKE EXECUTE ON FUNCTION public.enforce_coaching_session_write() FROM PUBLIC, anon, authenticated;
