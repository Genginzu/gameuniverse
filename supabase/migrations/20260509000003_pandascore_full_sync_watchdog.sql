-- Watchdog cron for stuck pandascore-full-sync jobs.
--
-- The Edge Function self-reschedules at the end of each chunk via
-- EdgeRuntime.waitUntil(fetch(self)). On Supabase managed this is the
-- documented way to keep a background promise alive past the response,
-- but in practice it can get cancelled (CPU limits, edge runtime
-- restarts, network issues). This pg_cron job runs every minute and
-- POSTs the Edge Function for any job that's been `pending` for more
-- than 90 seconds, ensuring no full sync ever stalls.
--
-- 90s threshold: a healthy chunk takes 30-60s including the time to
-- write the cursor. After 90s with no progression, something's wrong.
--
-- Configure via the Supabase Dashboard (Database → Cron) rather than
-- here — the SQL below is the reference for what to set up.
--
-- Schedule: '* * * * *' (every minute)
-- Body:
--   SELECT net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/pandascore-full-sync',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <service-role-key>'
--     ),
--     body := jsonb_build_object('jobId', j.id)
--   )
--   FROM public.pandascore_sync_jobs j
--   WHERE j.status = 'pending'
--     AND (j.last_chunk_at IS NULL OR j.last_chunk_at < now() - interval '90 seconds')
--   LIMIT 1;
--
-- (LIMIT 1 because only one full-sync job can be active at a time per
-- our admin route's 409 guard.)

-- This migration is intentionally a no-op. The cron is configured via
-- the Dashboard UI, same pattern as the IGDB processor Database Webhook
-- and the pandascore-incremental cron (avoids `permission denied to set
-- parameter "app.settings.*"` on Supabase managed).

-- Also: tighten the existing partial index so we can quickly find
-- stalled jobs without scanning the table. The expression part can
-- only use immutable functions, so we keep it on the boolean status.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_pandascore_sync_jobs_pending_chunk'
  ) THEN
    CREATE INDEX idx_pandascore_sync_jobs_pending_chunk
      ON public.pandascore_sync_jobs (last_chunk_at)
      WHERE status = 'pending';
  END IF;
END $$;
