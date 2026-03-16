-- Migration: Player Discussions — conversations & messages
-- Objective: Create the conversations and messages tables for private messaging
-- between players. Includes constraints (canonical participant ordering, uniqueness),
-- indexes for performance, RLS policies for access control, and a trigger to keep
-- conversations.updated_at in sync with new messages.

-- =============================================================================
-- 1. Table: conversations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Canonical ordering: participant_1 < participant_2
  CONSTRAINT conversations_ordered_participants CHECK (participant_1 < participant_2),
  -- No duplicate conversations between the same pair
  CONSTRAINT conversations_unique_pair UNIQUE (participant_1, participant_2),
  -- No self-conversation
  CONSTRAINT conversations_no_self CHECK (participant_1 != participant_2)
);

COMMENT ON TABLE public.conversations IS
  'Private conversations between two players (1-to-1 messaging).';
COMMENT ON COLUMN public.conversations.id IS
  'Unique identifier for the conversation.';
COMMENT ON COLUMN public.conversations.participant_1 IS
  'First participant (UUID < participant_2 for canonical ordering).';
COMMENT ON COLUMN public.conversations.participant_2 IS
  'Second participant (UUID > participant_1 for canonical ordering).';
COMMENT ON COLUMN public.conversations.created_at IS
  'Timestamp when the conversation was created.';
COMMENT ON COLUMN public.conversations.updated_at IS
  'Timestamp of the last message in this conversation.';

-- =============================================================================
-- 2. Table: messages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,

  -- Message content must be between 1 and 2000 characters
  CONSTRAINT messages_content_length CHECK (
    char_length(content) >= 1 AND char_length(content) <= 2000
  )
);

COMMENT ON TABLE public.messages IS
  'Messages exchanged within a conversation between two players.';
COMMENT ON COLUMN public.messages.id IS
  'Unique identifier for the message.';
COMMENT ON COLUMN public.messages.conversation_id IS
  'Reference to the parent conversation.';
COMMENT ON COLUMN public.messages.sender_id IS
  'Player who sent the message.';
COMMENT ON COLUMN public.messages.content IS
  'Text content of the message (1–2000 characters).';
COMMENT ON COLUMN public.messages.created_at IS
  'Timestamp when the message was sent.';
COMMENT ON COLUMN public.messages.read_at IS
  'Timestamp when the recipient read the message (NULL = unread).';

-- =============================================================================
-- 3. Indexes
-- =============================================================================

-- Chronological message loading per conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at);

-- Efficient unread message counting per conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read
  ON public.messages(conversation_id, read_at);

-- Fast lookup of conversations by participant
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1
  ON public.conversations(participant_1);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_2
  ON public.conversations(participant_2);

-- =============================================================================
-- 4. Row Level Security — conversations
-- =============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view their own conversations
CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() IN (participant_1, participant_2));

-- Participants can create conversations they belong to
CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant_1, participant_2));

-- Participants can update their conversations (updated_at)
CREATE POLICY "Participants can update their conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() IN (participant_1, participant_2));

-- =============================================================================
-- 5. Row Level Security — messages
-- =============================================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in conversations they participate in
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

-- Users can send messages in conversations they participate in
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

-- Recipients can mark messages as read (update read_at only)
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages FOR UPDATE
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

-- =============================================================================
-- 6. Trigger: update conversations.updated_at on new message
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_conversation_updated_at() IS
  'Automatically updates conversations.updated_at when a new message is inserted.';

CREATE TRIGGER trg_update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();
