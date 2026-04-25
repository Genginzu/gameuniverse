-- Migration: Add coaching notification types
-- Allows notifications for coaching session lifecycle events.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'post_comment', 'discussion_message', 'post_created', 'post_mention',
    'coaching_requested', 'coaching_confirmed', 'coaching_declined',
    'coaching_started', 'coaching_completed', 'coaching_cancelled', 'coaching_paid'
  ));

COMMENT ON COLUMN public.notifications.type IS
  'Type de notification (post_comment, discussion_message, post_created, post_mention, coaching_*)';
