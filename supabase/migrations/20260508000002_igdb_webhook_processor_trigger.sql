-- ===========================================================================
-- IGDB Webhook Processor — Cleanup of legacy custom trigger
-- ===========================================================================
-- An earlier version of this migration tried to install a Postgres trigger
-- that called pg_net.http_post(...) using the service role key stored in
-- app.settings.* GUCs. That approach is incompatible with Supabase managed
-- because we don't have the superuser rights to set per-database GUCs:
--
--     ERROR: 42501: permission denied to set parameter "app.settings.processor_url"
--
-- The processor is now triggered via the Supabase Database Webhooks UI
-- (Database → Webhooks → Create), which natively supports invoking an
-- Edge Function on table INSERT/UPDATE without requiring custom GUCs.
-- See docs/igdb/webhooks.md for the configuration steps.
--
-- This migration is idempotent: it just drops the legacy objects if they
-- exist, so any environment that had run the previous version of this
-- migration ends up clean.
-- ===========================================================================

DROP TRIGGER IF EXISTS on_igdb_webhook_event_received ON public.igdb_webhook_events;
DROP FUNCTION IF EXISTS public.trigger_igdb_processor();
