-- Guard private messages and conversations against tampering.
--
-- Context:
--   "Recipients can mark messages as read" (20240314000001) is an UPDATE policy
--   without WITH CHECK or column restriction: through PostgREST the recipient
--   could rewrite content, sender_id or conversation_id of a message they
--   received, forging what the other person said. The conversations UPDATE
--   policy let a participant replace the other participant. created_at was
--   client-controlled on insert, so message ordering could be spoofed.
--
-- Fix:
--   1. conversations UPDATE gets a WITH CHECK mirroring USING.
--   2. BEFORE INSERT/UPDATE triggers for interactive callers only
--      (service_role and SECURITY DEFINER internals are unaffected):
--        - messages: created_at is set by the server on insert; on update only
--          read_at may change;
--        - conversations: participant_1 / participant_2 / created_at are
--          immutable (updated_at stays writable by the new-message trigger).

DROP POLICY IF EXISTS "Participants can update their conversations" ON public.conversations;
CREATE POLICY "Participants can update their conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() IN (participant_1, participant_2))
  WITH CHECK (auth.uid() IN (participant_1, participant_2));

CREATE OR REPLACE FUNCTION public.enforce_message_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.read_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'messages: only read_at can be updated' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_message_write() IS
  'Server-side created_at on insert; only read_at is updatable by interactive callers.';

DROP TRIGGER IF EXISTS trg_enforce_message_write ON public.messages;
CREATE TRIGGER trg_enforce_message_write
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_write();

CREATE OR REPLACE FUNCTION public.enforce_conversation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.participant_1 IS DISTINCT FROM OLD.participant_1
     OR NEW.participant_2 IS DISTINCT FROM OLD.participant_2
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'conversations: participants are immutable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_conversation_update() IS
  'Participants and created_at of a conversation are immutable for interactive callers.';

DROP TRIGGER IF EXISTS trg_enforce_conversation_update ON public.conversations;
CREATE TRIGGER trg_enforce_conversation_update
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_conversation_update();
