-- Migration: store affiliation (#342)
-- Adds per-store affiliate configuration and an affiliate click log.
-- Network secrets (API keys) stay in environment variables, never in DB.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_tag TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url_template TEXT;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_affiliate_network_check;
ALTER TABLE public.stores ADD CONSTRAINT stores_affiliate_network_check
  CHECK (
    affiliate_network IS NULL
    OR affiliate_network IN ('amazon', 'impact', 'partnerize', 'awin', 'cj', 'custom')
  );

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_affiliate_url_template_check;
ALTER TABLE public.stores ADD CONSTRAINT stores_affiliate_url_template_check
  CHECK (
    affiliate_url_template IS NULL
    OR affiliate_url_template ~ '^\?'
    OR (affiliate_url_template ~ '^https://' AND affiliate_url_template LIKE '%{url}%')
  );

COMMENT ON COLUMN public.stores.affiliate_enabled IS 'When false, store links are rendered untouched (no affiliation, no redirect)';
COMMENT ON COLUMN public.stores.affiliate_network IS 'Affiliate network: amazon, impact, partnerize, awin, cj, custom';
COMMENT ON COLUMN public.stores.affiliate_tag IS 'Public affiliate identifier (tag / site id). Falls back to the network env variable when NULL';
COMMENT ON COLUMN public.stores.affiliate_url_template IS 'Either "?param={tag}" (query mode) or "https://...{url}..." (wrap mode, {url} is URL-encoded)';

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_store_created
  ON public.affiliate_clicks(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_game
  ON public.affiliate_clicks(game_id);

-- RLS enabled without any policy: only the service role (bypasses RLS) can read/write.
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.affiliate_clicks FROM anon, authenticated;

COMMENT ON TABLE public.affiliate_clicks IS 'Outbound affiliate clicks logged by /api/go (service role only)';
COMMENT ON COLUMN public.affiliate_clicks.player_id IS 'Authenticated player who clicked, NULL for anonymous visitors';
COMMENT ON COLUMN public.affiliate_clicks.referrer IS 'HTTP Referer of the click (truncated)';
