-- Make GU Coin signup bonus and activity rewards atomic and de-duplicated.
--
-- Context (src/lib/services/coinService.ts):
--   - getWallet() granted the 500-coin signup bonus whenever no wallet row was
--     found, with no lock: N parallel GET /api/players/me/wallet on a new
--     account credited the bonus N times.
--   - rewardActivity() read the cooldown / daily-cap counts, then inserted in a
--     separate statement: parallel requests all passed the checks. reference_id
--     was stored but never checked, so remove / re-add (library, favorites,
--     friendships) paid again each time; friend_add had no cap at all.
--
-- Fix: two service_role-only functions serialised per player with an advisory
-- lock (the same key for both, so balance_after is consistent):
--   - ensure_player_wallet(): grants the signup bonus once, only to a player
--     with no wallet and no previous bonus;
--   - award_activity_reward(): re-checks enabled / duplicate reference /
--     cooldown / daily cap inside the lock, then inserts the reward.
-- friend_add gets a daily cap (rewards are now keyed by the friend's id).

CREATE OR REPLACE FUNCTION public.ensure_player_wallet(p_player_id uuid, p_signup_bonus integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('coins:' || p_player_id::text, 0));

  IF EXISTS (SELECT 1 FROM public.player_wallets w WHERE w.player_id = p_player_id)
     OR EXISTS (
       SELECT 1 FROM public.coin_transactions t
       WHERE t.player_id = p_player_id AND t.type = 'signup_bonus'
     ) THEN
    RETURN;
  END IF;

  INSERT INTO public.coin_transactions (player_id, amount, type, description, balance_after)
  VALUES (p_player_id, p_signup_bonus, 'signup_bonus', 'Bonus d''inscription', p_signup_bonus);
END;
$$;

COMMENT ON FUNCTION public.ensure_player_wallet(uuid, integer) IS
  'Creates the wallet with the signup bonus exactly once (advisory lock per player).';

CREATE OR REPLACE FUNCTION public.award_activity_reward(
  p_player_id uuid,
  p_activity_type text,
  p_reference_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_config public.coin_reward_config;
  v_balance integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('coins:' || p_player_id::text, 0));

  SELECT * INTO v_config FROM public.coin_reward_config c WHERE c.activity_type = p_activity_type;
  IF NOT FOUND OR NOT v_config.enabled THEN
    RETURN jsonb_build_object('rewarded', false, 'amount', 0, 'reason', 'disabled');
  END IF;

  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coin_transactions t
    WHERE t.player_id = p_player_id
      AND t.activity_type = p_activity_type
      AND t.reference_id = p_reference_id
  ) THEN
    RETURN jsonb_build_object('rewarded', false, 'amount', 0, 'reason', 'duplicate');
  END IF;

  IF v_config.cooldown_seconds IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coin_transactions t
    WHERE t.player_id = p_player_id
      AND t.activity_type = p_activity_type
      AND t.created_at >= now() - make_interval(secs => v_config.cooldown_seconds)
  ) THEN
    RETURN jsonb_build_object('rewarded', false, 'amount', 0, 'reason', 'cooldown');
  END IF;

  IF v_config.daily_cap IS NOT NULL AND (
    SELECT count(*) FROM public.coin_transactions t
    WHERE t.player_id = p_player_id
      AND t.activity_type = p_activity_type
      AND t.created_at >= date_trunc('day', now())
  ) >= v_config.daily_cap THEN
    RETURN jsonb_build_object('rewarded', false, 'amount', 0, 'reason', 'daily_cap');
  END IF;

  SELECT w.balance INTO v_balance FROM public.player_wallets w WHERE w.player_id = p_player_id;

  INSERT INTO public.coin_transactions
    (player_id, amount, type, activity_type, reference_id, balance_after)
  VALUES
    (p_player_id, v_config.amount, 'activity_reward', p_activity_type, p_reference_id,
     COALESCE(v_balance, 0) + v_config.amount);

  RETURN jsonb_build_object('rewarded', true, 'amount', v_config.amount);
END;
$$;

COMMENT ON FUNCTION public.award_activity_reward(uuid, text, uuid) IS
  'Credits an activity reward once per (activity, reference) within cooldown / daily cap, atomically.';

REVOKE EXECUTE ON FUNCTION public.ensure_player_wallet(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_activity_reward(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_player_wallet(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_activity_reward(uuid, text, uuid) TO service_role;

UPDATE public.coin_reward_config
SET daily_cap = 10
WHERE activity_type = 'friend_add' AND daily_cap IS NULL;
