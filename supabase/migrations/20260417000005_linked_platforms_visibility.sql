-- Migration: per-platform visibility toggle on player_linked_platforms.
-- Default is public (true) to preserve current behaviour: existing rows are already exposed via the
-- "linked_platforms_select FOR SELECT USING (true)" policy.

ALTER TABLE player_linked_platforms
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN player_linked_platforms.is_public IS
  'When false, the row is hidden from other users (owner still sees it).';

-- Replace the wide-open SELECT policy with one that honours is_public.
DROP POLICY IF EXISTS "linked_platforms_select" ON player_linked_platforms;

CREATE POLICY "linked_platforms_select" ON player_linked_platforms
  FOR SELECT
  USING (is_public = true OR auth.uid() = player_id);
