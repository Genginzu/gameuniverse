-- Migration: character_comment coin activity type
-- Objective: character comments used to pay the post_comment activity, sharing
-- its cooldown and daily cap with comments on player posts. They now get their
-- own coin activity type, configured like post_comment.
-- No new object is created: existing grants on coin_transactions and
-- coin_reward_config are unchanged (server-only writes via award_activity_reward).

ALTER TABLE public.coin_transactions
  DROP CONSTRAINT IF EXISTS coin_transactions_activity_type_check;

ALTER TABLE public.coin_transactions
  ADD CONSTRAINT coin_transactions_activity_type_check
  CHECK (activity_type IS NULL OR activity_type IN (
    'review', 'library_add', 'library_status_change', 'playtime_log',
    'collection_add', 'game_rating', 'character_favorite', 'character_vote',
    'post_create', 'post_comment', 'character_comment', 'discussion_message',
    'friend_add'
  ));

COMMENT ON COLUMN public.coin_transactions.activity_type IS
  'Coin activity type paid by an activity reward (NULL for non-activity transactions)';

INSERT INTO public.coin_reward_config (activity_type, amount, cooldown_seconds, daily_cap)
VALUES ('character_comment', 5, 300, 20)
ON CONFLICT (activity_type) DO NOTHING;
