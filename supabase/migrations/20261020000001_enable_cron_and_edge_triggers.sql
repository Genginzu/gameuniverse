-- Enable pg_cron + pg_net and wire every scheduled / event-driven job that
-- earlier migrations skipped because pg_cron was absent in production.
--
--   1. Re-schedule the pure-SQL purge jobs (20260604000001, 20261018000018).
--   2. Schedule the PandaScore Edge Functions (incremental every 5 min,
--      full-sync watchdog every minute).
--   3. Fire igdb-processor on INSERT/UPDATE of igdb_webhook_events.
--
-- Edge Function calls read the project URL and service-role key from Supabase
-- Vault (secrets `project_url` and `service_role_key`), created out of band:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-jwt>', 'service_role_key');
-- This avoids app.settings.* GUCs (not settable on Supabase managed) and keeps
-- the key out of the repository. Without the secrets the calls are skipped.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Helper: POST a JSON body to an Edge Function with the service-role bearer.
-- Server-only (no client grant): SECURITY DEFINER so pg_cron and the trigger
-- can read vault.decrypted_secrets.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invoke_edge_function(p_function text, p_body jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'invoke_edge_function(%): vault secrets project_url/service_role_key missing', p_function;
    RETURN NULL;
  END IF;

  RETURN net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/' || p_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := p_body,
    timeout_milliseconds := 10000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_edge_function(text, jsonb) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.invoke_edge_function(text, jsonb) IS
  'Server-only: POSTs to a Supabase Edge Function using the service-role key stored in Vault (project_url, service_role_key).';

-- ---------------------------------------------------------------------------
-- igdb-processor trigger (replaces the dashboard Database Webhook).
-- The processor ignores events whose status is not "received".
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_igdb_processor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'received' THEN
    PERFORM public.invoke_edge_function(
      'igdb-processor',
      jsonb_build_object('record', jsonb_build_object('id', NEW.id))
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_igdb_processor() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS igdb_webhook_event_to_processor ON public.igdb_webhook_events;
CREATE TRIGGER igdb_webhook_event_to_processor
  AFTER INSERT OR UPDATE ON public.igdb_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_igdb_processor();

-- ---------------------------------------------------------------------------
-- Scheduled jobs. cron.schedule(name, ...) upserts by name: idempotent.
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'cleanup-igdb-webhook-events',
  '0 3 * * *',
  $cron$SELECT public.cleanup_old_igdb_webhook_events();$cron$
);

SELECT cron.schedule(
  'purge-rate-limit-events',
  '17 3 * * *',
  $cron$DELETE FROM public.rate_limit_events WHERE created_at < now() - interval '1 day';$cron$
);

SELECT cron.schedule(
  'pandascore-incremental-5min',
  '*/5 * * * *',
  $cron$SELECT public.invoke_edge_function('pandascore-incremental', '{}'::jsonb);$cron$
);

SELECT cron.schedule(
  'pandascore-full-sync-watchdog-1min',
  '* * * * *',
  $cron$
    SELECT public.invoke_edge_function('pandascore-full-sync', jsonb_build_object('jobId', j.id))
    FROM public.pandascore_sync_jobs j
    WHERE j.status = 'pending'
      AND (j.last_chunk_at IS NULL OR j.last_chunk_at < now() - interval '30 seconds')
    LIMIT 1;
  $cron$
);

-- Keep cron history bounded.
SELECT cron.schedule(
  'purge-cron-job-run-details',
  '30 3 * * *',
  $cron$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days';$cron$
);
