-- GDPR right to erasure: account deletion with a 30-day grace period (issue #378).
--
--   1. profiles.deletion_requested_at / deletion_scheduled_for: set by the
--      service role when a user asks for deletion, cleared on cancel. Frozen
--      for interactive callers.
--   2. Author / party columns of content that outlives the account become
--      nullable with ON DELETE SET NULL. A NULL author = "Deleted user".
--   3. public.purge_account_data(uuid): server-only, atomic purge. Every piece
--      of user-generated content is kept and anonymised (author set to NULL);
--      personal data is deleted with auth.users. Rule documented in
--      docs/features/players/account-deletion.md.

-- ---------------------------------------------------------------------------
-- 1. Deletion state on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for timestamptz;

COMMENT ON COLUMN public.profiles.deletion_requested_at IS
  'When the user requested account deletion (GDPR). Non-null = account deactivated, hidden from public pages. Service role only.';
COMMENT ON COLUMN public.profiles.deletion_scheduled_for IS
  'When the purge job permanently deletes the account (request + 30 days). Service role only.';

CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled_for
  ON public.profiles (deletion_scheduled_for)
  WHERE deletion_scheduled_for IS NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_profile_deletion_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.deletion_requested_at := NULL;
    NEW.deletion_scheduled_for := NULL;
  ELSIF NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at
     OR NEW.deletion_scheduled_for IS DISTINCT FROM OLD.deletion_scheduled_for THEN
    RAISE EXCEPTION 'Account deletion fields are written by the server only'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_deletion_state() IS
  'Keeps profiles.deletion_requested_at / deletion_scheduled_for server-only for authenticated/anon callers.';

REVOKE EXECUTE ON FUNCTION public.protect_profile_deletion_state() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_deletion_state ON public.profiles;
CREATE TRIGGER trg_protect_profile_deletion_state
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_deletion_state();

-- ---------------------------------------------------------------------------
-- 2. Columns that must outlive the account: nullable + ON DELETE SET NULL
-- ---------------------------------------------------------------------------
-- Constraint names keep the <table>_<column>_fkey convention used by the
-- PostgREST embeds (e.g. profiles!group_posts_author_id_fkey).
DO $$
DECLARE
  v_target record;
  v_constraint text;
BEGIN
  FOR v_target IN
    SELECT * FROM (VALUES
      ('player_posts', 'player_id', 'public.profiles'),
      ('post_comments', 'player_id', 'public.profiles'),
      ('game_reviews', 'user_id', 'auth.users'),
      ('review_votes', 'user_id', 'auth.users'),
      ('character_comments', 'user_id', 'auth.users'),
      ('group_posts', 'author_id', 'public.profiles'),
      ('community_posts', 'author_id', 'public.profiles'),
      ('match_comments', 'player_id', 'public.profiles'),
      ('conversations', 'participant_1', 'public.profiles'),
      ('conversations', 'participant_2', 'public.profiles'),
      ('messages', 'sender_id', 'public.profiles'),
      ('coaching_sessions', 'student_id', 'public.profiles'),
      ('coaching_sessions', 'coach_id', 'public.coach_profiles'),
      ('coaching_sessions', 'cancelled_by', 'public.profiles'),
      ('coaching_reviews', 'student_id', 'public.profiles'),
      ('coaching_disputes', 'resolved_by', 'public.profiles')
    ) AS t(tbl, col, ref)
  LOOP
    FOR v_constraint IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f'
        AND c.conrelid = format('public.%I', v_target.tbl)::regclass
        AND a.attname = v_target.col
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', v_target.tbl, v_constraint);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', v_target.tbl, v_target.col);
    EXECUTE format(
      'ALTER TABLE public.%1$I ADD CONSTRAINT %2$I FOREIGN KEY (%3$I) REFERENCES %4$s(id) ON DELETE SET NULL',
      v_target.tbl, v_target.tbl || '_' || v_target.col || '_fkey', v_target.col, v_target.ref
    );
  END LOOP;
END;
$$;

COMMENT ON COLUMN public.player_posts.player_id IS 'Author. NULL = author account deleted (post anonymised).';
COMMENT ON COLUMN public.post_comments.player_id IS 'Author. NULL = author account deleted (comment anonymised).';
COMMENT ON COLUMN public.game_reviews.user_id IS 'Author. NULL = author account deleted (review anonymised).';
COMMENT ON COLUMN public.review_votes.user_id IS 'Voter. NULL = voter account deleted (vote kept, anonymised).';
COMMENT ON COLUMN public.character_comments.user_id IS 'Author. NULL = author account deleted (comment anonymised).';
COMMENT ON COLUMN public.group_posts.author_id IS 'Author. NULL = author account deleted (post anonymised).';
COMMENT ON COLUMN public.community_posts.author_id IS 'Author. NULL = author account deleted (post anonymised).';
COMMENT ON COLUMN public.match_comments.player_id IS 'Author. NULL = author account deleted (comment anonymised).';
COMMENT ON COLUMN public.messages.sender_id IS 'Sender. NULL = sender account deleted (message anonymised).';
COMMENT ON COLUMN public.conversations.participant_1 IS 'NULL = participant account deleted; the conversation is read-only.';
COMMENT ON COLUMN public.conversations.participant_2 IS 'NULL = participant account deleted; the conversation is read-only.';
COMMENT ON COLUMN public.coaching_sessions.student_id IS
  'Student. NULL = account deleted; paid/released/refunded sessions are kept as accounting records.';
COMMENT ON COLUMN public.coaching_sessions.coach_id IS
  'Coach profile. NULL = coach account deleted; paid/released/refunded sessions are kept as accounting records.';
COMMENT ON COLUMN public.coaching_reviews.student_id IS 'Reviewer. NULL = account deleted (review anonymised).';

-- ---------------------------------------------------------------------------
-- 3. Atomic purge
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER: deleting auth.users needs the owner's rights. The whole
-- purge runs in one transaction under the caller's service_role JWT, so the
-- interactive-caller guards on content / memberships / coaching rows are
-- bypassed. Content is anonymised explicitly (not only through SET NULL) so
-- the counts can be reported.
CREATE OR REPLACE FUNCTION public.purge_account_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kept_images text[] := '{}';
  v_content integer := 0;
  v_rows integer;
  v_sessions integer := 0;
  v_groups integer := 0;
  v_communities integer := 0;
  v_coach_ids uuid[];
  v_parent record;
  v_new_owner uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_user_id AND p.deletion_requested_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'purge_account_data: no pending deletion for %', p_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Public content: kept, author removed ("Deleted user").
  SELECT COALESCE(array_agg(pp.image_url) FILTER (WHERE pp.image_url IS NOT NULL), '{}')
    INTO v_kept_images
    FROM public.player_posts pp WHERE pp.player_id = p_user_id;

  UPDATE public.player_posts SET player_id = NULL WHERE player_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.post_comments SET player_id = NULL WHERE player_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.game_reviews SET user_id = NULL WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.review_votes SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.character_comments SET user_id = NULL WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.group_posts SET author_id = NULL WHERE author_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.community_posts SET author_id = NULL WHERE author_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.match_comments SET player_id = NULL WHERE player_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.coaching_reviews SET student_id = NULL WHERE student_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;

  -- Private conversations: kept read-only for the other participant. When the
  -- other side is already deleted, nobody can read it any more: drop it.
  DELETE FROM public.conversations
   WHERE (participant_1 = p_user_id AND participant_2 IS NULL)
      OR (participant_2 = p_user_id AND participant_1 IS NULL);
  -- Unread messages from a deleted account would never be markable as read.
  UPDATE public.messages
     SET sender_id = NULL, read_at = COALESCE(read_at, now())
   WHERE sender_id = p_user_id;
  UPDATE public.conversations SET participant_1 = NULL WHERE participant_1 = p_user_id;
  UPDATE public.conversations SET participant_2 = NULL WHERE participant_2 = p_user_id;

  -- Reactions are a JSONB map {emoji: [userId, ...]} with no FK.
  UPDATE public.match_comments mc
     SET reactions = (
       SELECT COALESCE(jsonb_object_agg(r.key, r.value - p_user_id::text), '{}'::jsonb)
         FROM jsonb_each(mc.reactions) r
        WHERE r.value <> jsonb_build_array(p_user_id::text)
     )
   WHERE EXISTS (
     SELECT 1 FROM jsonb_each(mc.reactions) r
      WHERE jsonb_typeof(r.value) = 'array' AND r.value ? p_user_id::text
   );

  -- Accounting records (sessions that moved money): kept without the party.
  SELECT COALESCE(array_agg(cp.id), '{}') INTO v_coach_ids
    FROM public.coach_profiles cp WHERE cp.player_id = p_user_id;

  UPDATE public.coaching_sessions cs
     SET student_id = CASE WHEN cs.student_id = p_user_id THEN NULL ELSE cs.student_id END,
         coach_id = CASE WHEN cs.coach_id = ANY (v_coach_ids) THEN NULL ELSE cs.coach_id END,
         cancelled_by = CASE WHEN cs.cancelled_by = p_user_id THEN NULL ELSE cs.cancelled_by END,
         cancellation_reason = NULL
   WHERE cs.payment_status IN ('paid', 'released', 'refunded')
     AND (cs.student_id = p_user_id OR cs.coach_id = ANY (v_coach_ids));
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  UPDATE public.coaching_sessions SET cancelled_by = NULL WHERE cancelled_by = p_user_id;
  UPDATE public.coaching_disputes SET resolved_by = NULL WHERE resolved_by = p_user_id;

  -- Groups the user owns: handed to the oldest moderator, else the oldest member.
  FOR v_parent IN SELECT g.id, g.image_url FROM public.groups g WHERE g.owner_id = p_user_id LOOP
    SELECT gm.player_id INTO v_new_owner
      FROM public.group_members gm
     WHERE gm.group_id = v_parent.id AND gm.player_id <> p_user_id
     ORDER BY (gm.role IN ('moderator', 'admin')) DESC, gm.joined_at, gm.id
     LIMIT 1;

    IF v_new_owner IS NOT NULL THEN
      DELETE FROM public.group_members WHERE group_id = v_parent.id AND player_id = p_user_id;
      UPDATE public.groups SET owner_id = v_new_owner WHERE id = v_parent.id;
      UPDATE public.group_members SET role = 'owner'
       WHERE group_id = v_parent.id AND player_id = v_new_owner;
      v_groups := v_groups + 1;
      IF v_parent.image_url IS NOT NULL THEN
        v_kept_images := v_kept_images || v_parent.image_url;
      END IF;
    END IF;
  END LOOP;

  FOR v_parent IN SELECT c.id, c.image_url FROM public.communities c WHERE c.owner_id = p_user_id LOOP
    SELECT cm.player_id INTO v_new_owner
      FROM public.community_members cm
     WHERE cm.community_id = v_parent.id AND cm.player_id <> p_user_id
     ORDER BY (cm.role = 'moderator') DESC, cm.joined_at, cm.id
     LIMIT 1;

    IF v_new_owner IS NOT NULL THEN
      DELETE FROM public.community_members WHERE community_id = v_parent.id AND player_id = p_user_id;
      UPDATE public.communities SET owner_id = v_new_owner WHERE id = v_parent.id;
      UPDATE public.community_members SET role = 'owner'
       WHERE community_id = v_parent.id AND player_id = v_new_owner;
      v_communities := v_communities + 1;
      IF v_parent.image_url IS NOT NULL THEN
        v_kept_images := v_kept_images || v_parent.image_url;
      END IF;
    END IF;
  END LOOP;

  -- Cascades the profile and every personal row (library, sessions, wishlist,
  -- notifications, linked platforms, follows, friendships, wallet...).
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'anonymisedContent', v_content,
    'retainedCoachingSessions', v_sessions,
    'transferredGroups', v_groups,
    'transferredCommunities', v_communities,
    'keptImageUrls', to_jsonb(v_kept_images)
  );
END;
$$;

COMMENT ON FUNCTION public.purge_account_data(uuid) IS
  'Server-only GDPR purge of an account with a pending deletion: anonymises all user-generated content, keeps accounting records, transfers owned groups/communities, then deletes auth.users.';

REVOKE ALL ON FUNCTION public.purge_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_account_data(uuid) TO service_role;
