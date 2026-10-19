-- Integrity guards on self-reported data reachable through PostgREST.
--
-- Context:
--   - player_achievements_insert_own (20240312000001) lets a user insert any
--     achievement_key for themselves (forged badges, shown on profiles/feeds).
--   - game_price_history accepts INSERT from any authenticated user
--     (20240228000001): fake historical / lowest prices.
--   - game_sessions only checks ended_at > started_at: one row can claim
--     200k+ hours, which AchievementEngine turns into playtime achievements,
--     XP and level (server-written from forged source rows).
--   - review_votes RLS allows voting on one's own review (the API blocks it).
--   - content_reports / coaching_disputes INSERT let the reporter forge the
--     moderation fields (status, resolved_by, admin_notes, action_taken) and
--     bypass the report rate limit; disputes could target anyone.
--   - match_comments: the author can rewrite reactions (forged counts) and no
--     one else can react (UPDATE is author-only).
--
-- Fix:
--   1. Drop the client INSERT policies on player_achievements, game_price_history
--      and content_reports (the server writes them with the service role).
--   2. game_sessions guard: ≤ 24h per session, ≤ 24h per player per day, no
--      session starting in the future.
--   3. review_votes: restrictive policy against self-votes.
--   4. coaching_disputes: client inserts start "open", without moderation
--      fields, and must concern a session the reporter took part in.
--   5. match_comments: reactions only change through
--      toggle_match_comment_reaction(), which adds / removes auth.uid() only.

-- =============================================================================
-- 1. Server-written tables
-- =============================================================================

DROP POLICY IF EXISTS player_achievements_insert_own ON public.player_achievements;
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON public.game_price_history;
DROP POLICY IF EXISTS "Users can create reports" ON public.content_reports;

-- =============================================================================
-- 2. game_sessions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_game_session()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_day_minutes integer;
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.ended_at - NEW.started_at > interval '24 hours' THEN
    RAISE EXCEPTION 'game_sessions: a session cannot exceed 24 hours' USING ERRCODE = '22023';
  END IF;

  IF NEW.started_at > now() + interval '2 days' THEN
    RAISE EXCEPTION 'game_sessions: session starts in the future' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(SUM(s.duration_minutes), 0) INTO v_day_minutes
  FROM public.game_sessions s
  WHERE s.user_id = NEW.user_id
    AND s.started_at::date = NEW.started_at::date
    AND s.id IS DISTINCT FROM NEW.id;

  IF v_day_minutes + NEW.duration_minutes > 24 * 60 THEN
    RAISE EXCEPTION 'game_sessions: more than 24 hours logged for this day' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_game_session() IS
  'Caps self-reported sessions: 24h per session and per day, no future start (runs after duration).';

REVOKE EXECUTE ON FUNCTION public.guard_game_session() FROM PUBLIC, anon, authenticated;

-- Named after trg_compute_session_duration so duration_minutes is already set.
DROP TRIGGER IF EXISTS trg_guard_game_session ON public.game_sessions;
CREATE TRIGGER trg_guard_game_session
  BEFORE INSERT OR UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.guard_game_session();

-- =============================================================================
-- 3. review_votes
-- =============================================================================

DROP POLICY IF EXISTS "Users cannot vote on their own reviews" ON public.review_votes;
CREATE POLICY "Users cannot vote on their own reviews"
  ON public.review_votes AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.game_reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users cannot move a vote onto their own review" ON public.review_votes;
CREATE POLICY "Users cannot move a vote onto their own review"
  ON public.review_votes AS RESTRICTIVE FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.game_reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. coaching_disputes
-- =============================================================================

DROP POLICY IF EXISTS "Users can create disputes" ON public.coaching_disputes;
CREATE POLICY "Users can create disputes"
  ON public.coaching_disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND reported_id <> auth.uid()
    AND status = 'open'
    AND admin_notes IS NULL
    AND resolved_by IS NULL
    AND resolved_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.coaching_sessions cs
      JOIN public.coach_profiles cp ON cp.id = cs.coach_id
      WHERE cs.id = session_id
        AND (
          (cs.student_id = auth.uid() AND cp.player_id = reported_id)
          OR (cp.player_id = auth.uid() AND cs.student_id = reported_id)
        )
    )
  );

-- =============================================================================
-- 5. match_comments reactions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_match_comment_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- current_user (not auth.role()) so toggle_match_comment_reaction, which runs
  -- as its owner, can still write reactions.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.reactions := '{}'::jsonb;
    NEW.created_at := now();
    RETURN NEW;
  END IF;

  IF NEW.reactions IS DISTINCT FROM OLD.reactions
     OR NEW.player_id IS DISTINCT FROM OLD.player_id
     OR NEW.match_id IS DISTINCT FROM OLD.match_id
     OR NEW.match_source IS DISTINCT FROM OLD.match_source
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'match_comments: only content can be edited' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_match_comment_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_match_comment_write ON public.match_comments;
CREATE TRIGGER trg_guard_match_comment_write
  BEFORE INSERT OR UPDATE ON public.match_comments
  FOR EACH ROW EXECUTE FUNCTION public.guard_match_comment_write();

CREATE OR REPLACE FUNCTION public.toggle_match_comment_reaction(p_comment_id uuid, p_emoji text)
RETURNS public.match_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.match_comments;
  v_reactions jsonb;
  v_users jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_emoji IS NULL OR char_length(p_emoji) NOT BETWEEN 1 AND 16 THEN
    RAISE EXCEPTION 'invalid emoji' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row FROM public.match_comments WHERE id = p_comment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'comment not found' USING ERRCODE = 'P0002';
  END IF;

  v_reactions := COALESCE(v_row.reactions, '{}'::jsonb);
  v_users := COALESCE(v_reactions -> p_emoji, '[]'::jsonb);

  IF v_users ? v_uid::text THEN
    v_users := v_users - v_uid::text;
  ELSE
    IF NOT v_reactions ? p_emoji
       AND (SELECT count(*) FROM jsonb_object_keys(v_reactions)) >= 20 THEN
      RAISE EXCEPTION 'too many distinct reactions' USING ERRCODE = '22023';
    END IF;
    v_users := v_users || to_jsonb(v_uid::text);
  END IF;

  IF jsonb_array_length(v_users) = 0 THEN
    v_reactions := v_reactions - p_emoji;
  ELSE
    v_reactions := jsonb_set(v_reactions, ARRAY[p_emoji], v_users);
  END IF;

  UPDATE public.match_comments SET reactions = v_reactions
  WHERE id = p_comment_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.toggle_match_comment_reaction(uuid, text) IS
  'Adds or removes the caller (auth.uid()) from one emoji reaction of a match comment.';

REVOKE EXECUTE ON FUNCTION public.toggle_match_comment_reaction(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_match_comment_reaction(uuid, text) TO authenticated, service_role;
