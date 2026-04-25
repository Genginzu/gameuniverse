-- Migration: Allow 'post_created' as a notifications.type value
-- Objective: Enable notifications to subscribers/friends when a followed player
-- creates a new post (see issue #75). The previous CHECK constraint only
-- accepted 'post_comment' and 'discussion_message'.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('post_comment', 'discussion_message', 'post_created'));

COMMENT ON COLUMN public.notifications.type IS
  'Type de notification (post_comment, discussion_message, post_created)';
