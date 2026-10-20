-- Atomic progress increment for pandascore_sync_jobs.
--
-- The pandascore-full-sync Edge Function used to read total_synced /
-- total_errors, add the chunk delta in application code and write the
-- sum back. Two overlapping invocations on the same job (self-reschedule
-- racing the watchdog cron) could both read the same totals and one
-- delta was lost.
--
-- increment_pandascore_job_progress performs the increment inside a
-- single UPDATE, so concurrent calls serialise on the row lock and every
-- delta is kept. The cursor and the error ledger are replaced with the
-- caller's latest snapshot, and last_chunk_at is stamped for the
-- watchdog.
--
-- Only the service role (Edge Functions) may call it. The default
-- privileges from 20260911000001 grant EXECUTE on new functions to anon
-- and authenticated, so they are revoked explicitly. RLS on the table is
-- unchanged (read-only policy; writes bypass RLS via service role).

CREATE OR REPLACE FUNCTION public.increment_pandascore_job_progress(
  p_job_id uuid,
  p_synced_delta integer,
  p_errors_delta integer,
  p_cursor jsonb,
  p_error_details jsonb
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.pandascore_sync_jobs
  SET total_synced = total_synced + COALESCE(p_synced_delta, 0),
      total_errors = total_errors + COALESCE(p_errors_delta, 0),
      cursor = COALESCE(p_cursor, cursor),
      error_details = COALESCE(p_error_details, error_details),
      last_chunk_at = now()
  WHERE id = p_job_id;
$$;

COMMENT ON FUNCTION public.increment_pandascore_job_progress(uuid, integer, integer, jsonb, jsonb) IS
  'Atomically adds synced/error deltas to a pandascore_sync_jobs row and '
  'replaces its cursor and error_details snapshot. Called by the '
  'pandascore-full-sync Edge Function after every few pages.';

REVOKE ALL ON FUNCTION public.increment_pandascore_job_progress(uuid, integer, integer, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_pandascore_job_progress(uuid, integer, integer, jsonb, jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';
