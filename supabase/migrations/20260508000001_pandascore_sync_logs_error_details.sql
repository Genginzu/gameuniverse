-- Adds a structured `error_details` column to pandascore_sync_logs to store the
-- list of per-item failures (fetch, upsert, delete) instead of just an
-- aggregate counter. Surfaces errors in the admin sync history dialog so
-- transient PandaScore 5xx, rate limits, or Supabase upsert errors can be
-- diagnosed without diving into Vercel logs.

ALTER TABLE public.pandascore_sync_logs
  ADD COLUMN IF NOT EXISTS error_details JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.pandascore_sync_logs.error_details IS
  'List of per-item errors captured during the sync: { type, id, phase, error }. Capped at 50 entries.';
