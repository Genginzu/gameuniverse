-- Migration: Create player_subscriptions table
-- Objective: Enable unilateral subscriptions between players (Twitter-style follow)
-- so users can opt into a personal activity feed. Independent from friendships:
-- subscriptions have no acceptance flow and can coexist with a friendship.

-- =============================================================================
-- 1. Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.player_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT player_subscriptions_no_self CHECK (subscriber_id <> target_id),
  CONSTRAINT player_subscriptions_unique_pair UNIQUE (subscriber_id, target_id)
);
-- Documentation
COMMENT ON TABLE public.player_subscriptions IS
  'Stores unilateral subscriptions (follows) between players for the personal feed.';
COMMENT ON COLUMN public.player_subscriptions.id IS
  'Unique identifier for the subscription row.';
COMMENT ON COLUMN public.player_subscriptions.subscriber_id IS
  'Player who initiated the subscription (follower).';
COMMENT ON COLUMN public.player_subscriptions.target_id IS
  'Player being subscribed to (followed).';
COMMENT ON COLUMN public.player_subscriptions.created_at IS
  'Timestamp when the subscription was created.';
-- =============================================================================
-- 2. Indexes
-- =============================================================================

-- Feed query: read all targets for a given subscriber
CREATE INDEX IF NOT EXISTS idx_player_subscriptions_subscriber_created_desc
  ON public.player_subscriptions (subscriber_id, created_at DESC);
-- Profile "subscribers" count/list: read all subscribers for a given target
CREATE INDEX IF NOT EXISTS idx_player_subscriptions_target_created_desc
  ON public.player_subscriptions (target_id, created_at DESC);
-- =============================================================================
-- 3. Row Level Security
-- =============================================================================

ALTER TABLE public.player_subscriptions ENABLE ROW LEVEL SECURITY;
-- 3a. Subscription lists are public (like follower counts on Twitter).
CREATE POLICY "Subscriptions are viewable by everyone"
  ON public.player_subscriptions FOR SELECT
  USING (true);
-- 3b. Authenticated users can only create subscriptions on their own behalf.
CREATE POLICY "Users can subscribe on their own behalf"
  ON public.player_subscriptions FOR INSERT
  WITH CHECK (subscriber_id = auth.uid());
-- 3c. Only the subscriber can unsubscribe.
CREATE POLICY "Subscribers can unsubscribe"
  ON public.player_subscriptions FOR DELETE
  USING (subscriber_id = auth.uid());
