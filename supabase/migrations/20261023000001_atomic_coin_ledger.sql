-- Route every GU Coin movement through one atomic, idempotent ledger function.
--
-- Context (src/lib/services/coinService.ts, esportPredictionService.ts):
--   - creditCoins / debitCoins / grantCoins read player_wallets.balance, computed
--     balance_after in JS, then inserted: concurrent movements wrote a wrong
--     balance_after, and a debit raced its own balance check.
--   - None of them opened the wallet: a payout or admin grant for a player with
--     no wallet skipped the signup bonus; a negative grant on a missing wallet
--     produced a wallet at 0 and a ledger entry at -X.
--   - award_activity_reward also computed balance_after without opening the
--     wallet; place_esport_prediction locked the wallet row instead of the
--     per-player advisory lock, so it raced award_activity_reward.
--   - Settlement claimed a prediction, then credited it in a second request: a
--     failed credit left the prediction won and unpaid.
--
-- Fix:
--   - coin_transactions.ledger_key: the identity of an entry in the world
--     (prediction_bet:<id>, prediction_win:<id>, admin_grant:<nonce>,
--     signup_bonus:<player>), unique when set. No backfill.
--   - post_coin_entry(): the single write path. Under the advisory lock
--     coins:<player> it opens the wallet (signup bonus), ignores a known ledger
--     key, refuses an overdraft, and inserts with a consistent balance_after.
--   - ensure_player_wallet, award_activity_reward and place_esport_prediction
--     now delegate to it; settle_esport_match() settles and pays a whole match
--     in one transaction.
--   - All functions are SECURITY INVOKER (service_role already owns the
--     privileges they need) with an empty search_path, EXECUTE to service_role
--     only.

-- ============================================================================
-- 1. Ledger key
-- ============================================================================

ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS ledger_key text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_coin_transactions_ledger_key
  ON public.coin_transactions (ledger_key)
  WHERE ledger_key IS NOT NULL;

COMMENT ON COLUMN public.coin_transactions.ledger_key IS
  'Identity of the movement in the world (e.g. prediction_win:<id>, admin_grant:<nonce>). A second post with the same key is a no-op.';

-- ============================================================================
-- 2. Wallet opening (caller must hold the coins:<player> advisory lock)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.open_coin_wallet(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  c_signup_bonus CONSTANT integer := 500;
BEGIN
  IF EXISTS (SELECT 1 FROM public.player_wallets w WHERE w.player_id = p_player_id)
     OR EXISTS (
       SELECT 1 FROM public.coin_transactions t
       WHERE t.player_id = p_player_id AND t.type = 'signup_bonus'
     ) THEN
    RETURN;
  END IF;

  INSERT INTO public.coin_transactions
    (player_id, amount, type, description, balance_after, ledger_key)
  VALUES
    (p_player_id, c_signup_bonus, 'signup_bonus', 'Bonus d''inscription', c_signup_bonus,
     'signup_bonus:' || p_player_id::text);
END;
$$;

COMMENT ON FUNCTION public.open_coin_wallet(uuid) IS
  'Opens a wallet with the 500-coin signup bonus once. Internal: expects the coins:<player> advisory lock.';

DROP FUNCTION IF EXISTS public.ensure_player_wallet(uuid, integer);

CREATE OR REPLACE FUNCTION public.ensure_player_wallet(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('coins:' || p_player_id::text, 0));
  PERFORM public.open_coin_wallet(p_player_id);
END;
$$;

COMMENT ON FUNCTION public.ensure_player_wallet(uuid) IS
  'Creates the wallet with the signup bonus exactly once (advisory lock per player).';

-- ============================================================================
-- 3. The single ledger write path
-- ============================================================================

CREATE OR REPLACE FUNCTION public.post_coin_entry(
  p_player_id uuid,
  p_amount integer,
  p_type text,
  p_ledger_key text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_activity_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_balance integer;
  v_entry public.coin_transactions;
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Ledger entry amount must be non-zero' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('coins:' || p_player_id::text, 0));

  IF p_ledger_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coin_transactions t WHERE t.ledger_key = p_ledger_key
  ) THEN
    RETURN jsonb_build_object('posted', false, 'reason', 'duplicate');
  END IF;

  PERFORM public.open_coin_wallet(p_player_id);

  SELECT w.balance INTO v_balance
  FROM public.player_wallets w
  WHERE w.player_id = p_player_id;

  v_balance := COALESCE(v_balance, 0);

  IF v_balance + p_amount < 0 THEN
    RETURN jsonb_build_object('posted', false, 'reason', 'insufficient_balance');
  END IF;

  INSERT INTO public.coin_transactions
    (player_id, amount, type, activity_type, reference_id, description, balance_after, ledger_key)
  VALUES
    (p_player_id, p_amount, p_type, p_activity_type, p_reference_id, p_description,
     v_balance + p_amount, p_ledger_key)
  RETURNING * INTO v_entry;

  RETURN jsonb_build_object('posted', true, 'transaction', to_jsonb(v_entry));
END;
$$;

COMMENT ON FUNCTION public.post_coin_entry(uuid, integer, text, text, text, text, uuid) IS
  'Single write path of the GU Coin ledger: opens the wallet, ignores a known ledger key, refuses an overdraft, and records a consistent balance_after, all under the coins:<player> advisory lock.';

-- ============================================================================
-- 4. Activity rewards: same checks, insert through the ledger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_activity_reward(
  p_player_id uuid,
  p_activity_type text,
  p_reference_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_config public.coin_reward_config;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('coins:' || p_player_id::text, 0));

  SELECT * INTO v_config FROM public.coin_reward_config c WHERE c.activity_type = p_activity_type;
  IF NOT FOUND OR NOT v_config.enabled OR v_config.amount <= 0 THEN
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

  PERFORM public.post_coin_entry(
    p_player_id => p_player_id,
    p_amount => v_config.amount,
    p_type => 'activity_reward',
    p_activity_type => p_activity_type,
    p_reference_id => p_reference_id
  );

  RETURN jsonb_build_object('rewarded', true, 'amount', v_config.amount);
END;
$$;

-- ============================================================================
-- 5. Predictions: stake and settlement through the ledger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.place_esport_prediction(
  p_player_id uuid,
  p_match_id integer,
  p_match_name text,
  p_game text,
  p_predicted_winner_id integer,
  p_predicted_winner_name text,
  p_amount integer
)
RETURNS public.esport_predictions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_stake jsonb;
  v_prediction public.esport_predictions;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Prediction amount must be positive' USING ERRCODE = '22023';
  END IF;

  v_stake := public.post_coin_entry(
    p_player_id => p_player_id,
    p_amount => -p_amount,
    p_type => 'prediction_bet',
    p_ledger_key => 'prediction_bet:' || v_id::text,
    p_description => 'Pronostic: ' || p_match_name,
    p_reference_id => v_id
  );

  IF NOT (v_stake ->> 'posted')::boolean THEN
    RAISE EXCEPTION 'Insufficient balance' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.esport_predictions (
    id, player_id, match_id, match_name, game,
    predicted_winner_id, predicted_winner_name, amount
  ) VALUES (
    v_id, p_player_id, p_match_id, p_match_name, p_game,
    p_predicted_winner_id, p_predicted_winner_name, p_amount
  )
  RETURNING * INTO v_prediction;

  RETURN v_prediction;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_esport_match(p_match_id integer, p_winner_id integer)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_prediction public.esport_predictions;
  v_settled integer := 0;
BEGIN
  -- Lock the pending rows in a stable order so concurrent settlements of the
  -- same match queue up instead of deadlocking; the loser finds nothing pending.
  FOR v_prediction IN
    UPDATE public.esport_predictions p
    SET status = CASE WHEN p.predicted_winner_id = p_winner_id THEN 'won' ELSE 'lost' END,
        payout = CASE WHEN p.predicted_winner_id = p_winner_id THEN p.amount * 2 ELSE 0 END,
        resolved_at = now()
    WHERE p.id IN (
      SELECT q.id FROM public.esport_predictions q
      WHERE q.match_id = p_match_id AND q.status = 'pending'
      ORDER BY q.id
      FOR UPDATE
    )
    RETURNING p.*
  LOOP
    IF v_prediction.status = 'won' THEN
      PERFORM public.post_coin_entry(
        p_player_id => v_prediction.player_id,
        p_amount => v_prediction.payout,
        p_type => 'prediction_win',
        p_ledger_key => 'prediction_win:' || v_prediction.id::text,
        p_description => 'Gain pronostic: ' || v_prediction.match_name,
        p_reference_id => v_prediction.id
      );
    END IF;
    v_settled := v_settled + 1;
  END LOOP;

  RETURN v_settled;
END;
$$;

COMMENT ON FUNCTION public.settle_esport_match(integer, integer) IS
  'Settles every pending prediction of a finished match and pays each won one (2x stake) in one transaction. Re-running it is a no-op.';

-- ============================================================================
-- 6. Privileges: service_role only
-- ============================================================================

REVOKE ALL ON FUNCTION public.open_coin_wallet(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_player_wallet(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.post_coin_entry(uuid, integer, text, text, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_activity_reward(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_esport_prediction(uuid, integer, text, text, integer, text, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_esport_match(integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.open_coin_wallet(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_player_wallet(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.post_coin_entry(uuid, integer, text, text, text, text, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.award_activity_reward(uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_esport_prediction(uuid, integer, text, text, integer, text, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_esport_match(integer, integer) TO service_role;
