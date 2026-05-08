-- ===========================================================================
-- IGDB Webhook Processor Trigger
-- ===========================================================================
-- Automatically invokes the `igdb-processor` Edge Function whenever a new
-- webhook event is inserted (status='received') or its status is reset to
-- 'received' (e.g. an admin retries a failed event).
--
-- Architecture (replaces the previous Vercel route):
--   IGDB → POST /functions/v1/igdb-webhook  (validates + inserts event)
--                ↓ INSERT igdb_webhook_events (status='received')
--                ↓ this trigger
--          POST /functions/v1/igdb-processor  (handles the actual work)
--
-- Configuration:
--   The processor URL and the service role key are read from app.settings.*
--   GUC parameters. Set them on the database with:
--
--     ALTER DATABASE postgres SET app.settings.processor_url
--       = 'https://<project-ref>.supabase.co/functions/v1/igdb-processor';
--     ALTER DATABASE postgres SET app.settings.service_role_key
--       = 'eyJh...';   -- service_role JWT
--
--   These can also be set per-session for testing. Without them the trigger
--   logs a warning and lets the row pass — events stay in the table and can
--   be processed manually via the admin UI.
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_igdb_processor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  fn_url TEXT;
  service_key TEXT;
BEGIN
  -- Only fire when the row enters the "received" state
  IF NEW.status IS DISTINCT FROM 'received' THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, only fire when status actually transitions to received
  IF TG_OP = 'UPDATE' AND OLD.status = 'received' THEN
    RETURN NEW;
  END IF;

  fn_url := current_setting('app.settings.processor_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  IF fn_url IS NULL OR fn_url = '' OR service_key IS NULL OR service_key = '' THEN
    RAISE WARNING 'IGDB processor URL or service key not configured (app.settings.processor_url / app.settings.service_role_key). Event %s will not be processed automatically.', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('eventId', NEW.id)
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_igdb_processor IS
  'Invokes the igdb-processor Edge Function whenever an igdb_webhook_events row enters the "received" state. URL and service role key are read from app.settings.* GUCs.';

DROP TRIGGER IF EXISTS on_igdb_webhook_event_received ON public.igdb_webhook_events;

CREATE TRIGGER on_igdb_webhook_event_received
  AFTER INSERT OR UPDATE OF status ON public.igdb_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_igdb_processor();

COMMENT ON TRIGGER on_igdb_webhook_event_received ON public.igdb_webhook_events IS
  'Fires trigger_igdb_processor on every INSERT and on UPDATE where status transitions back to "received".';
