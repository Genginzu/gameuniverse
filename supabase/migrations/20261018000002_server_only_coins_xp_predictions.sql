-- Migration: server-only write model for GU Coins, player XP and esport predictions
-- Issue: #372 — RLS trop permissives sur coins, XP et prédictions
--
-- Problem (previous state):
--   * coin_transactions had INSERT policy "Service can insert transactions"
--     WITH CHECK (true) and NO `TO` role, so it applied to EVERY role. An
--     authenticated client could insert a positive transaction for itself via
--     PostgREST; the wallet trigger then credited the balance (minting coins).
--   * player_xp exposed player_xp_insert_own / player_xp_update_own, letting a
--     client set its own XP and therefore its level.
--   * esport_predictions exposed "Players can insert their own predictions",
--     letting a client store a bet without the server-side coin debit.
--
-- Write model after this migration (server-only writes):
--   * coin_transactions, player_xp and esport_predictions are WRITTEN only by
--     the service_role (server code using supabase-admin.ts, which bypasses
--     RLS) and by admins. Clients keep SELECT on their own rows.
--   * Placing a prediction debits coins AND inserts the prediction atomically
--     through place_esport_prediction() (SECURITY DEFINER, EXECUTE granted to
--     service_role only), so a failure can never leave one without the other.
--
-- The SECURITY DEFINER wallet trigger (update_wallet_on_transaction) keeps
-- working: it runs as its owner regardless of the caller's role, so removing
-- the permissive client INSERT policy does not affect server-side credits.

-- ============================================================================
-- 1. coin_transactions — remove the wide-open client INSERT policy
-- ============================================================================

-- The policy applied to all roles (no TO clause) and let clients mint coins.
-- service_role bypasses RLS, so no explicit INSERT policy is needed for the
-- server; we still add an explicit service_role ALL policy for clarity/audit.
DROP POLICY IF EXISTS "Service can insert transactions" ON public.coin_transactions;

CREATE POLICY "Service role full access coin_transactions"
  ON public.coin_transactions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.coin_transactions IS
  'Ledger of all GU Coin movements. WRITE is server-only: only the service_role (supabase-admin.ts) or admins (is_admin()) may INSERT. Clients may SELECT their own rows only. Inserting here mints/burns coins via the update_wallet_on_transaction trigger, so client writes are forbidden by design (issue #372).';

-- ============================================================================
-- 2. player_xp — read-only for clients, written only server-side
-- ============================================================================

DROP POLICY IF EXISTS player_xp_insert_own ON public.player_xp;
DROP POLICY IF EXISTS player_xp_update_own ON public.player_xp;

-- SELECT stays public (player_xp_select_all is kept untouched).
CREATE POLICY "Service role full access player_xp"
  ON public.player_xp FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.player_xp IS
  'Total XP per player (feeds the level system). WRITE is server-only: only the service_role (supabase-admin.ts) or admins may INSERT/UPDATE; XP is awarded exclusively by server flows (achievement engine, admin grant). Clients have public SELECT but may NOT write (issue #372).';

-- ============================================================================
-- 3. esport_predictions — no direct client INSERT; created via the function
-- ============================================================================

DROP POLICY IF EXISTS "Players can insert their own predictions" ON public.esport_predictions;

-- SELECT stays scoped to the owner ("Players can view their own predictions").
CREATE POLICY "Service role full access esport_predictions"
  ON public.esport_predictions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.esport_predictions IS
  'Virtual bets on pro esport matches. WRITE is server-only: predictions are created exclusively through place_esport_prediction(), which debits coins and inserts the bet atomically. Clients may SELECT their own rows only; direct client INSERT/UPDATE is forbidden (issue #372).';

-- ============================================================================
-- 4. Atomic prediction placement (debit + insert in one transaction)
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_prediction public.esport_predictions;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Prediction amount must be positive' USING ERRCODE = '22023';
  END IF;

  -- Lock the wallet row so concurrent bets cannot overspend the balance.
  SELECT balance INTO v_balance
  FROM public.player_wallets
  WHERE player_id = p_player_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance' USING ERRCODE = 'P0001';
  END IF;

  -- Debit coins: the AFTER INSERT trigger updates the wallet balance.
  INSERT INTO public.coin_transactions (
    player_id, amount, type, reference_id, description, balance_after
  ) VALUES (
    p_player_id,
    -p_amount,
    'prediction_bet',
    NULL,
    'Pronostic: ' || p_match_name,
    v_balance - p_amount
  );

  -- Insert the prediction in the same transaction.
  INSERT INTO public.esport_predictions (
    player_id, match_id, match_name, game,
    predicted_winner_id, predicted_winner_name, amount
  ) VALUES (
    p_player_id, p_match_id, p_match_name, p_game,
    p_predicted_winner_id, p_predicted_winner_name, p_amount
  )
  RETURNING * INTO v_prediction;

  RETURN v_prediction;
END;
$$;

COMMENT ON FUNCTION public.place_esport_prediction(
  uuid, integer, text, text, integer, text, integer
) IS
  'Atomically debits GU Coins and inserts an esport prediction (issue #372). SECURITY DEFINER with a pinned search_path; EXECUTE is granted to service_role only, so it is callable only from trusted server code (supabase-admin.ts).';

-- Lock down execution: only the service role may call this function.
REVOKE ALL ON FUNCTION public.place_esport_prediction(
  uuid, integer, text, text, integer, text, integer
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_esport_prediction(
  uuid, integer, text, text, integer, text, integer
) FROM authenticated;
REVOKE ALL ON FUNCTION public.place_esport_prediction(
  uuid, integer, text, text, integer, text, integer
) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_esport_prediction(
  uuid, integer, text, text, integer, text, integer
) TO service_role;

-- ============================================================================
-- 5. Audit query — detect coin_transactions NOT produced by a known server flow
-- ============================================================================
--
-- Run this read-only query (as a privileged role) to surface rows that may be
-- the result of past abuse via the old permissive INSERT policy. Legitimate
-- rows always carry one of the known transaction types and, for activity
-- rewards, a known activity_type. Anything outside these buckets is suspicious.
--
--   SELECT ct.id, ct.player_id, ct.amount, ct.type, ct.activity_type,
--          ct.description, ct.created_at
--   FROM public.coin_transactions ct
--   WHERE ct.type NOT IN (
--           'signup_bonus', 'activity_reward', 'achievement_reward',
--           'prediction_bet', 'prediction_win', 'purchase', 'admin_grant'
--         )
--      OR (ct.type = 'activity_reward' AND ct.activity_type IS NULL)
--      OR (ct.type = 'activity_reward' AND ct.activity_type NOT IN (
--            'review', 'library_add', 'library_status_change', 'playtime_log',
--            'collection_add', 'game_rating', 'character_favorite',
--            'character_vote', 'post_create', 'post_comment',
--            'discussion_message', 'friend_add'
--          ))
--      -- Positive credits a client could have self-minted, outside admin grants:
--      OR (ct.type = 'admin_grant' AND ct.description NOT LIKE '[Admin %')
--   ORDER BY ct.created_at DESC;
