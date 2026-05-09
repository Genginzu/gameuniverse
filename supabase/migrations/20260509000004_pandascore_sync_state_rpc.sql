-- RPC wrappers for the pandascore_sync_state lock so the Edge Function
-- doesn't have to introspect individual columns through PostgREST.
--
-- Background: when the `incremental_running_since` column was added to
-- pandascore_sync_state, the PostgREST schema cache on Supabase managed
-- failed to refresh even after `NOTIFY pgrst, 'reload schema'` and a
-- `COMMENT ON COLUMN`. The Edge Function kept getting `42703 column ...
-- does not exist` for hours from PostgREST while plain SQL worked fine.
--
-- These RPCs are stable contracts: the Edge code calls them by name,
-- PostgREST exposes them as POST /rpc/<name>, and any future column
-- change inside the function body is invisible to PostgREST. Bonus: the
-- conditional UPDATE + the SELECT on miss become a single round-trip.

-- pandascore_acquire_lock(stale_after interval) -> table
--   acquired      bool
--   since         timestamptz   -- last_incremental_at when acquired
--   held_since    timestamptz   -- existing holder's start when not acquired
--
-- Atomic conditional take: if the row is free (lock null) OR stale
-- (older than stale_after), set incremental_running_since=now() and
-- return acquired=true. Otherwise return acquired=false with the holder
-- timestamp.
CREATE OR REPLACE FUNCTION public.pandascore_acquire_lock(
  stale_after interval DEFAULT '10 minutes'
)
RETURNS TABLE (
  acquired boolean,
  since timestamptz,
  held_since timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev timestamptz;
  prev_last timestamptz;
  cutoff timestamptz := now() - stale_after;
BEGIN
  -- SELECT FOR UPDATE serialises concurrent acquireLock calls so two
  -- callers can't both observe a stale lock and both take it.
  SELECT s.incremental_running_since, s.last_incremental_at
    INTO prev, prev_last
  FROM public.pandascore_sync_state s
  WHERE s.id = 1
  FOR UPDATE;

  IF prev IS NULL OR prev < cutoff THEN
    UPDATE public.pandascore_sync_state
    SET incremental_running_since = now(),
        updated_at = now()
    WHERE id = 1;

    RETURN QUERY SELECT true, prev_last, NULL::timestamptz;
  ELSE
    RETURN QUERY SELECT false, NULL::timestamptz, prev;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.pandascore_acquire_lock(interval) IS
  'Atomically acquires the incremental sync lock on pandascore_sync_state. '
  'Returns acquired=true with the last_incremental_at cursor when taken, '
  'or acquired=false with the existing holder timestamp.';


-- pandascore_release_lock(advance_cursor_to timestamptz)
--
-- Clears the lock and optionally bumps last_incremental_at. Pass NULL
-- to release without advancing (e.g. on failure so the next run retries
-- the same delta).
CREATE OR REPLACE FUNCTION public.pandascore_release_lock(
  advance_cursor_to timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF advance_cursor_to IS NULL THEN
    UPDATE public.pandascore_sync_state
    SET incremental_running_since = NULL,
        updated_at = now()
    WHERE id = 1;
  ELSE
    UPDATE public.pandascore_sync_state
    SET incremental_running_since = NULL,
        last_incremental_at = advance_cursor_to,
        updated_at = now()
    WHERE id = 1;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.pandascore_release_lock(timestamptz) IS
  'Releases the incremental sync lock. Pass advance_cursor_to to bump '
  'last_incremental_at on success, or NULL on failure to keep retrying '
  'the same delta on the next run.';


-- Service role needs to call these from Edge Functions. PostgREST will
-- expose them at POST /rpc/pandascore_acquire_lock and /rpc/pandascore_release_lock.
GRANT EXECUTE ON FUNCTION public.pandascore_acquire_lock(interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.pandascore_release_lock(timestamptz) TO service_role;

-- Force PostgREST to pick up the new RPC names. (Less brittle than the
-- column-add NOTIFY, since RPC discovery uses pg_proc which has its own
-- invalidation path.)
NOTIFY pgrst, 'reload schema';
