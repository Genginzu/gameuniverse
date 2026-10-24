-- =============================================================================
-- Coaching session lifecycle: refund_pending + paid start guard
-- =============================================================================
-- 1. payment_status gains 'refund_pending': a paid session cancelled with a
--    refund owed is claimed atomically into cancelled + refund_pending before
--    Stripe is called, then moved to refunded. A failed Stripe call leaves a
--    visible, retryable state instead of a silent cancelled + paid row, and a
--    concurrent charge.refunded webhook settles the same row exactly once.
-- 2. enforce_coaching_session_write: a coach can only start (confirmed ->
--    in_progress) a session whose payment_status is 'paid'. Previously only the
--    UI hid the button, so an unpaid session could be started then completed.
-- No new object: existing grants are unchanged.
-- =============================================================================

ALTER TABLE public.coaching_sessions
  DROP CONSTRAINT IF EXISTS coaching_sessions_payment_status_check;

ALTER TABLE public.coaching_sessions
  ADD CONSTRAINT coaching_sessions_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'refund_pending', 'refunded', 'released'));

COMMENT ON COLUMN public.coaching_sessions.payment_status IS
  'pending -> paid -> (refund_pending ->) refunded | released. Server-only (service role).';

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
        ('confirmed', 'cancelled'),
        ('in_progress', 'completed')
      ))
      OR (v_is_coach AND OLD.status = 'confirmed' AND NEW.status = 'in_progress'
          AND OLD.payment_status = 'paid')
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
  'come from the coach tier, payment columns are server-only, status follows the state machine '
  '(start requires a paid session).';

REVOKE EXECUTE ON FUNCTION public.enforce_coaching_session_write() FROM PUBLIC, anon, authenticated;
