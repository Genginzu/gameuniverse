-- Migration: Backlog manager
-- Adds prioritization + drag-and-drop ordering to user_library and a
-- transactional reorder RPC used by the backlog manager UI.

-- priority: user-defined importance. 3 = high, 2 = medium, 1 = low, 0 = none.
-- backlog_position: manual drag-and-drop order (ascending = played first).
ALTER TABLE user_library
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0
    CHECK (priority >= 0 AND priority <= 3),
  ADD COLUMN IF NOT EXISTS backlog_position INTEGER;

COMMENT ON COLUMN user_library.priority IS
  'User-defined backlog importance: 0 none, 1 low, 2 medium, 3 high.';
COMMENT ON COLUMN user_library.backlog_position IS
  'Manual drag-and-drop order within the backlog (ascending = play sooner). NULL = unordered.';

-- Extend the status vocabulary with an explicit "backlog" state, in addition
-- to the existing owned / playing / completed / wishlist values.
COMMENT ON COLUMN user_library.status IS
  'owned, playing, completed, wishlist, backlog';

-- Composite index to serve the backlog listing query efficiently:
-- filter by user, order by position then priority.
CREATE INDEX IF NOT EXISTS idx_user_library_backlog
  ON user_library (user_id, backlog_position, priority DESC);

-- Transactional reorder: assigns backlog_position = array index for the
-- provided ordered list of game ids, scoped to the authenticated user.
-- Only rows belonging to the caller are touched (defense in depth on top of RLS).
CREATE OR REPLACE FUNCTION reorder_backlog(user_uuid UUID, ordered_game_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game_uuid UUID;
  idx INTEGER := 0;
BEGIN
  FOREACH game_uuid IN ARRAY ordered_game_ids
  LOOP
    UPDATE user_library
      SET backlog_position = idx
      WHERE user_id = user_uuid AND game_id = game_uuid;
    idx := idx + 1;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION reorder_backlog(UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reorder_backlog(UUID, UUID[]) TO authenticated, service_role;
