-- Migration: Add enriched notification types (friends, review votes, achievements)
-- Issue #86: Extend notifications to cover friend requests/acceptance, review votes,
-- and achievement unlocks. post_mention already exists from a prior migration.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'post_comment', 'discussion_message', 'post_created', 'post_mention',
    'coaching_requested', 'coaching_confirmed', 'coaching_declined',
    'coaching_started', 'coaching_completed', 'coaching_cancelled', 'coaching_paid',
    'friend_request', 'friend_accepted', 'review_vote', 'achievement_unlocked'
  ));

COMMENT ON COLUMN public.notifications.type IS
  'Type de notification (post_comment, discussion_message, post_created, post_mention, coaching_*, friend_request, friend_accepted, review_vote, achievement_unlocked)';
