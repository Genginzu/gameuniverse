-- GU Coins: virtual currency system with wallets, transactions, and reward config.

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.player_wallets (
  player_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned integer NOT NULL DEFAULT 0,
  total_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.player_wallets IS 'GU Coins wallet per player';
COMMENT ON COLUMN public.player_wallets.balance IS 'Current coin balance (never negative)';
COMMENT ON COLUMN public.player_wallets.total_earned IS 'Lifetime coins earned';
COMMENT ON COLUMN public.player_wallets.total_spent IS 'Lifetime coins spent';

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN (
    'signup_bonus', 'activity_reward', 'achievement_reward',
    'prediction_bet', 'prediction_win', 'purchase', 'admin_grant'
  )),
  activity_type text CHECK (activity_type IS NULL OR activity_type IN (
    'review', 'library_add', 'library_status_change', 'playtime_log',
    'collection_add', 'game_rating', 'character_favorite', 'character_vote',
    'post_create', 'post_comment', 'discussion_message', 'friend_add'
  )),
  reference_id uuid,
  description text,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.coin_transactions IS 'Ledger of all GU Coin movements';
COMMENT ON COLUMN public.coin_transactions.amount IS 'Positive for credit, negative for debit';
COMMENT ON COLUMN public.coin_transactions.balance_after IS 'Wallet balance after this transaction';

CREATE TABLE IF NOT EXISTS public.coin_reward_config (
  activity_type text PRIMARY KEY,
  amount integer NOT NULL,
  cooldown_seconds integer,
  daily_cap integer,
  enabled boolean NOT NULL DEFAULT true
);

COMMENT ON TABLE public.coin_reward_config IS 'Admin-configurable reward amounts per activity';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_coin_transactions_player_created
  ON public.coin_transactions (player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_player_activity_created
  ON public.coin_transactions (player_id, activity_type, created_at DESC)
  WHERE activity_type IS NOT NULL;

-- ============================================================================
-- Trigger: auto-update wallet on transaction insert
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_wallet_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.player_wallets (player_id, balance, total_earned, total_spent)
  VALUES (
    NEW.player_id,
    GREATEST(0, NEW.amount),
    CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END
  )
  ON CONFLICT (player_id) DO UPDATE SET
    balance = public.player_wallets.balance + NEW.amount,
    total_earned = public.player_wallets.total_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
    total_spent = public.player_wallets.total_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_wallet_on_transaction
  AFTER INSERT ON public.coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_on_transaction();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.player_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_reward_config ENABLE ROW LEVEL SECURITY;

-- player_wallets: owner can read own, everyone can read balance (public profile), admin full
CREATE POLICY "Users can view own wallet"
  ON public.player_wallets FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Anyone can view wallet balance"
  ON public.player_wallets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage wallets"
  ON public.player_wallets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- coin_transactions: owner can read own, admin full
CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Admins can manage transactions"
  ON public.coin_transactions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Service role needs to insert transactions (fire-and-forget from API routes)
CREATE POLICY "Service can insert transactions"
  ON public.coin_transactions FOR INSERT
  WITH CHECK (true);

-- coin_reward_config: everyone can read, admin can update
CREATE POLICY "Anyone can read reward config"
  ON public.coin_reward_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage reward config"
  ON public.coin_reward_config FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- Seed: default reward config
-- ============================================================================

INSERT INTO public.coin_reward_config (activity_type, amount, cooldown_seconds, daily_cap) VALUES
  ('review',                50,   NULL, 5),
  ('library_add',           10,   NULL, 20),
  ('library_status_change',  5,   NULL, NULL),
  ('playtime_log',           2,   3600, 20),
  ('collection_add',         5,   NULL, 20),
  ('game_rating',           10,   NULL, 10),
  ('character_favorite',     5,   NULL, 10),
  ('character_vote',         2,   NULL, 20),
  ('post_create',           15,   NULL, 5),
  ('post_comment',           5,    300, 20),
  ('discussion_message',     2,     60, 50),
  ('friend_add',            10,   NULL, NULL)
ON CONFLICT (activity_type) DO NOTHING;
