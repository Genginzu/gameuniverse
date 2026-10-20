-- Generic, serverless-safe rate limiter backed by Postgres.
--
-- Context:
--   Apart from the IGDB import limiter (20261018000004), no route was rate
--   limited: reviews, comments, posts, messages, reports, uploads, friend
--   requests, invitations, predictions and anonymous search could be spammed.
--   An in-memory counter does not work on Vercel (every lambda is a fresh
--   process), so the window lives in the database.
--
-- Design:
--   consume_rate_limit(key, limit, window) atomically counts the hits of `key`
--   in the trailing window and records a new hit only when under the limit.
--   A transaction-scoped advisory lock on the key serialises concurrent calls,
--   so a burst cannot slip past the limit. Keys look like
--   "<action>:user:<uuid>" or "<action>:ip:<address>".
--   Server-only: the table has RLS with no client policy and the function is
--   granted to service_role only (default privileges since 20261018000017).
--   A daily pg_cron job purges hits older than one day.

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rate_limit_events IS
  'One row per accepted request, per rate-limit key. Written by consume_rate_limit(); service role only.';
COMMENT ON COLUMN public.rate_limit_events.key IS
  'Rate-limit bucket, e.g. "review:user:<uuid>" or "search:ip:<address>".';

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_key_created
  ON public.rate_limit_events (key, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limit_events FROM anon, authenticated;
GRANT ALL ON public.rate_limit_events TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
  v_oldest timestamptz;
BEGIN
  IF p_key IS NULL OR p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'consume_rate_limit: invalid arguments' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_key, 0));

  SELECT count(*), min(created_at) INTO v_count, v_oldest
  FROM public.rate_limit_events
  WHERE key = p_key
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF v_count >= p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'retry_after', GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (v_oldest + make_interval(secs => p_window_seconds) - now())))::integer
      )
    );
  END IF;

  INSERT INTO public.rate_limit_events (key) VALUES (p_key);
  RETURN jsonb_build_object('allowed', true, 'retry_after', 0);
END;
$$;

COMMENT ON FUNCTION public.consume_rate_limit(text, integer, integer) IS
  'Atomically checks and records a hit for a rate-limit key. Returns {allowed, retry_after}. Service role only.';

REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

-- Daily purge of hits older than one day (longest window used is 1 hour).
-- cron.schedule(name, ...) upserts by job name, so this is idempotent; guarded
-- when pg_cron is absent (same pattern as 20260604000001).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'purge-rate-limit-events',
      '17 3 * * *',
      $cron$DELETE FROM public.rate_limit_events WHERE created_at < now() - interval '1 day';$cron$
    );
  END IF;
END $$;
