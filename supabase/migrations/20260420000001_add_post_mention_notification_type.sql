-- Migration: Add 'post_mention' notification type
-- Allows notifications when a player is mentioned via @username in a post.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('post_comment', 'discussion_message', 'post_created', 'post_mention'));

COMMENT ON COLUMN public.notifications.type IS
  'Type de notification (post_comment, discussion_message, post_created, post_mention)';