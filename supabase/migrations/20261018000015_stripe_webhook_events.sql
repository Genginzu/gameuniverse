-- Idempotency ledger for Stripe webhooks.
--
-- Context:
--   /api/webhooks/stripe processed every delivery: Stripe retries and replays
--   (same event id) re-applied payment / refund status changes, and a failed
--   DB write was swallowed with a 200 so Stripe never retried it.
--
-- Fix:
--   The webhook claims each event id here before processing, skips ids it has
--   already handled, and releases the claim when processing fails so the Stripe
--   retry is applied. Server-only table: RLS enabled with no client policy.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Stripe event ids already processed by /api/webhooks/stripe (idempotency). Service role only.';
COMMENT ON COLUMN public.stripe_webhook_events.id IS 'Stripe event id (evt_...).';
COMMENT ON COLUMN public.stripe_webhook_events.type IS 'Stripe event type, for audit.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;
