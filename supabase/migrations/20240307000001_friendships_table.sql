-- Migration: Create friendships table
-- Objective: Add a friendships table to store friend requests and confirmed
-- friendships between players. Includes constraints, indexes, and RLS policies.

-- =============================================================================
-- 1. Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- A player cannot send a friend request to themselves
  CONSTRAINT friendships_no_self_friend CHECK (sender_id != receiver_id),

  -- Only one request per ordered pair (sender → receiver)
  CONSTRAINT friendships_unique_pair UNIQUE (sender_id, receiver_id)
);

-- Documentation
COMMENT ON TABLE public.friendships IS
  'Stores friend requests and confirmed friendships between players.';
COMMENT ON COLUMN public.friendships.id IS
  'Unique identifier for the friendship row.';
COMMENT ON COLUMN public.friendships.sender_id IS
  'Player who initiated the friend request.';
COMMENT ON COLUMN public.friendships.receiver_id IS
  'Player who received the friend request.';
COMMENT ON COLUMN public.friendships.status IS
  'Current status: pending, accepted, or declined.';
COMMENT ON COLUMN public.friendships.created_at IS
  'Timestamp when the request was created.';
COMMENT ON COLUMN public.friendships.updated_at IS
  'Timestamp of the last status change.';

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_friendships_receiver_status
  ON public.friendships(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_sender_status
  ON public.friendships(sender_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_status_updated
  ON public.friendships(status, updated_at DESC);

-- =============================================================================
-- 3. Row Level Security
-- =============================================================================

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 3a. Anyone can read accepted friendships (public friend lists)
CREATE POLICY "Accepted friendships are viewable by everyone"
  ON public.friendships FOR SELECT
  USING (status = 'accepted');

-- 3b. Pending requests are visible only to the sender or receiver
CREATE POLICY "Pending requests viewable by involved players"
  ON public.friendships FOR SELECT
  USING (status = 'pending' AND (sender_id = auth.uid() OR receiver_id = auth.uid()));

-- 3c. Authenticated users can send friend requests (as sender)
CREATE POLICY "Authenticated users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- 3d. Only the receiver can update a pending request (accept / decline)
CREATE POLICY "Receiver can update pending requests"
  ON public.friendships FOR UPDATE
  USING (receiver_id = auth.uid() AND status = 'pending');

-- 3e. Either player can delete a friendship (cancel request or remove friend)
CREATE POLICY "Involved players can delete friendships"
  ON public.friendships FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
