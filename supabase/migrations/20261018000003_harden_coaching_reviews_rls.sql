-- Migration: Harden coaching_reviews RLS (insert + update)
-- Objective (issue #377):
--   1. A review can be inserted ONLY for a 'completed' session where the
--      caller is the student, and coach_id must match that session's coach.
--      Enforced in the DB via a policy with EXISTS on coaching_sessions, so a
--      direct PostgREST insert cannot bypass the API checks.
--   2. One review per session — already guaranteed by UNIQUE(session_id) on
--      the table since creation; a defensive guard is kept below and the
--      current state is asserted (no dedup needed, see note).
--   3. A student may edit only their own rating / comment; a coach may change
--      ONLY coach_response / coach_responded_at. Enforced by split UPDATE
--      policies (with WITH CHECK) plus a BEFORE UPDATE trigger that rejects
--      any other column change for non-student, non-service callers.
--   4. coach_profiles aggregates (average_rating, total_reviews) stay correct
--      after INSERT / UPDATE / DELETE — the trigger function is recreated to
--      return COALESCE(NEW, OLD) and run SECURITY DEFINER so a student's insert
--      can update the coach's profile row despite coach_profiles RLS.
--
-- Notes:
--   - UNIQUE(session_id) has existed since 20260424000002_coaching_reviews.sql,
--     so no duplicate rows can exist to migrate. The guard below is a safety
--     net that fails loudly rather than silently dropping data.
--   - Both trigger functions are SECURITY DEFINER with an explicit search_path
--     (public for the guard, '' for the fully-qualified aggregate), per the
--     project rule that no SECURITY DEFINER function has a mutable search_path.

-- =============================================================================
-- 0. Safety net: assert there are no duplicate reviews per session
-- =============================================================================
-- Fails the migration with a clear message instead of silently losing data if
-- a duplicate somehow exists (it cannot, given the pre-existing UNIQUE).
DO $$
DECLARE
  v_dupes integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coaching_reviews'
  ) THEN
    SELECT COUNT(*) INTO v_dupes
    FROM (
      SELECT session_id
      FROM public.coaching_reviews
      GROUP BY session_id
      HAVING COUNT(*) > 1
    ) d;

    IF v_dupes > 0 THEN
      RAISE EXCEPTION
        'coaching_reviews has % session(s) with duplicate reviews; resolve manually before applying this migration',
        v_dupes;
    END IF;
  END IF;
END;
$$;

-- Ensure the one-review-per-session constraint exists (idempotent reinforcement).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coaching_reviews'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coaching_reviews_session_id_key'
      AND conrelid = 'public.coaching_reviews'::regclass
  ) THEN
    ALTER TABLE public.coaching_reviews
      ADD CONSTRAINT coaching_reviews_session_id_key UNIQUE (session_id);
  END IF;
END;
$$;

-- =============================================================================
-- 1. INSERT policy — completed session, caller is the student, coach matches
-- =============================================================================
DROP POLICY IF EXISTS "Students can create reviews" ON public.coaching_reviews;

CREATE POLICY "Students can create reviews for completed sessions"
  ON public.coaching_reviews FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.coaching_sessions cs
      WHERE cs.id = session_id
        AND cs.student_id = auth.uid()
        AND cs.coach_id = coaching_reviews.coach_id
        AND cs.status = 'completed'
    )
  );

-- =============================================================================
-- 2. UPDATE policies — split student vs coach
-- =============================================================================
-- Remove the old permissive coach policy (USING only, no WITH CHECK, no
-- column restriction).
DROP POLICY IF EXISTS "Coaches can respond to their reviews" ON public.coaching_reviews;
DROP POLICY IF EXISTS "Students can update their own reviews" ON public.coaching_reviews;

-- 2a. Student: may update their own review. The trigger (section 3) limits the
--     columns they may change to rating / comment.
CREATE POLICY "Students can update their own reviews"
  ON public.coaching_reviews FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- 2b. Coach: may update reviews that belong to their coach profile. The trigger
--     limits the columns they may change to coach_response / coach_responded_at.
CREATE POLICY "Coaches can respond to their reviews"
  ON public.coaching_reviews FOR UPDATE
  USING (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM public.coach_profiles WHERE player_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. BEFORE UPDATE trigger — column-level enforcement
-- =============================================================================
-- Only applies to interactive callers (auth.role() in 'authenticated' / 'anon');
-- service_role and other internal roles bypass (webhooks, background jobs, SQL),
-- mirroring public.protect_profile_suspension (20261002000001).
--   - student (student_id = auth.uid()): may change rating + comment only.
--   - coach   (owns coach_id)          : may change coach_response +
--     coach_responded_at only.
--   - anyone else: rejected (RLS already blocks; defence in depth).
-- Identity columns (id, session_id, coach_id, student_id, created_at) are
-- immutable through UPDATE for every interactive caller.
-- SECURITY DEFINER so it can read coach_profiles regardless of that table's RLS.
CREATE OR REPLACE FUNCTION public.enforce_coaching_review_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_student boolean := v_uid IS NOT NULL AND OLD.student_id = v_uid;
  v_is_coach boolean := v_uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coach_profiles cp
    WHERE cp.id = OLD.coach_id AND cp.player_id = v_uid
  );
BEGIN
  -- Internal roles (service_role, supabase_admin, direct SQL) bypass the guard.
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Identity columns are immutable on UPDATE for every interactive caller.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.session_id IS DISTINCT FROM OLD.session_id
     OR NEW.coach_id IS DISTINCT FROM OLD.coach_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'coaching_reviews: identity columns are immutable'
      USING ERRCODE = '42501';
  END IF;

  IF v_is_student THEN
    -- Student may change rating / comment only.
    IF NEW.coach_response IS DISTINCT FROM OLD.coach_response
       OR NEW.coach_responded_at IS DISTINCT FROM OLD.coach_responded_at THEN
      RAISE EXCEPTION 'coaching_reviews: students cannot change coach response fields'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF v_is_coach THEN
    -- Coach may change coach_response / coach_responded_at only.
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.comment IS DISTINCT FROM OLD.comment THEN
      RAISE EXCEPTION 'coaching_reviews: coaches can only set coach_response, not rating or comment'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- Neither student nor coach of this review: reject.
  RAISE EXCEPTION 'coaching_reviews: not authorized to update this review'
    USING ERRCODE = '42501';
END;
$$;

COMMENT ON FUNCTION public.enforce_coaching_review_update() IS
  'BEFORE UPDATE guard on coaching_reviews: students may edit rating/comment, coaches only coach_response, identity columns immutable; internal roles bypass.';

DROP TRIGGER IF EXISTS trg_enforce_coaching_review_update ON public.coaching_reviews;

CREATE TRIGGER trg_enforce_coaching_review_update
  BEFORE UPDATE ON public.coaching_reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coaching_review_update();

-- =============================================================================
-- 4. Aggregate trigger — correct on INSERT / UPDATE / DELETE
-- =============================================================================
-- Recreated to return COALESCE(NEW, OLD) (NEW is NULL on DELETE) and keep the
-- SET search_path = '' hardening. Behaviour is unchanged for INSERT/UPDATE; the
-- DELETE path already recomputed via COALESCE(NEW.coach_id, OLD.coach_id).
CREATE OR REPLACE FUNCTION public.update_coach_average_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.update_coach_average_rating() IS
  'Recomputes coach_profiles.average_rating and total_reviews after any coaching_reviews INSERT/UPDATE/DELETE.';

-- The AFTER INSERT OR UPDATE OR DELETE trigger from 20260424000002 remains and
-- continues to call the recreated function; no trigger re-creation needed.
