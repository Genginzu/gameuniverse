-- Persistent background library-sync jobs with observable progress.
--
-- Each row tracks one user-triggered (or cron-triggered) library
-- synchronization for a single platform. The row is created with
-- status='pending', flipped to 'running' while the sync executes inside a
-- Next.js `after()` callback, then finalized to 'succeeded' or 'failed'.
--
-- The frontend polls the latest row per platform so the progress bar
-- survives page navigation: leaving and returning simply re-reads the
-- running (or finished) job from this table.
--
-- A partial UNIQUE index guarantees at most one active (pending/running)
-- job per (user, platform), preventing duplicate concurrent syncs.

CREATE TABLE IF NOT EXISTS public.player_library_sync_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  -- Coarse-grained step used to render a human-readable progress label.
  phase            TEXT NOT NULL DEFAULT 'starting'
                   CHECK (phase IN ('starting', 'fetching', 'resolving', 'importing', 'saving', 'done', 'failed')),
  total            INTEGER NOT NULL DEFAULT 0,
  processed        INTEGER NOT NULL DEFAULT 0,
  matched          INTEGER NOT NULL DEFAULT 0,
  imported         INTEGER NOT NULL DEFAULT 0,
  unmatched        INTEGER NOT NULL DEFAULT 0,
  private_profile  BOOLEAN NOT NULL DEFAULT false,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.player_library_sync_jobs IS
  'Background library-sync jobs. Progress is polled by the Connections UI so it survives navigation.';
COMMENT ON COLUMN public.player_library_sync_jobs.phase IS
  'Coarse step: starting → fetching → resolving → importing → saving → done (or failed).';
COMMENT ON COLUMN public.player_library_sync_jobs.processed IS
  'Games handled so far (upserted during the saving phase); used with total for the progress bar.';

-- Latest-job-per-platform lookups (the UI reads the most recent row).
CREATE INDEX IF NOT EXISTS idx_player_library_sync_jobs_user_platform
  ON public.player_library_sync_jobs (user_id, platform, created_at DESC);

-- At most one active job per (user, platform).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_player_library_sync_jobs_active
  ON public.player_library_sync_jobs (user_id, platform)
  WHERE status IN ('pending', 'running');

ALTER TABLE public.player_library_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Users may read their own jobs. Writes are performed server-side with the
-- service role (RLS bypass) and always scoped to the authenticated user id.
CREATE POLICY "player_library_sync_jobs_select_own"
  ON public.player_library_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);
