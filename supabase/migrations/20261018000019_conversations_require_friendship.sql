-- Restrict who can open a conversation, and make the coaching link server-only.
--
-- Context:
--   "Participants can create conversations" (20240314000001) only checks that
--   the caller is one of the two participants. The friends-only rule lived in
--   the API (DiscussionServerService.createConversation): through PostgREST any
--   user could open a conversation with any player and message them, bypassing
--   the friendship requirement (unsolicited messages / harassment).
--   coaching_sessions.conversation_id was also writable by both participants
--   (enforce_coaching_session_write does not guard it), so a session could be
--   pointed at an unrelated conversation.
--
-- Fix:
--   1. INSERT on conversations requires an accepted friendship between the two
--      participants. Coaching conversations (coach and student are not
--      necessarily friends) are created with the service role.
--   2. A BEFORE UPDATE trigger forbids interactive callers from changing
--      coaching_sessions.conversation_id (service_role is unaffected).

CREATE OR REPLACE FUNCTION public.are_friends(p_player_a uuid, p_player_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (
        (f.sender_id = p_player_a AND f.receiver_id = p_player_b)
        OR (f.sender_id = p_player_b AND f.receiver_id = p_player_a)
      )
  );
$$;

COMMENT ON FUNCTION public.are_friends(uuid, uuid) IS
  'True when the two players have an accepted friendship (either direction).';

REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (participant_1, participant_2)
    AND public.are_friends(participant_1, participant_2)
  );

CREATE OR REPLACE FUNCTION public.protect_coaching_session_conversation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon')
     AND NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'coaching_sessions: conversation_id is written by the server only'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_coaching_session_conversation() IS
  'coaching_sessions.conversation_id is linked by the server (service role) only.';

REVOKE EXECUTE ON FUNCTION public.protect_coaching_session_conversation()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_coaching_session_conversation ON public.coaching_sessions;
CREATE TRIGGER trg_protect_coaching_session_conversation
  BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.protect_coaching_session_conversation();
