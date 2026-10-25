-- Fix: "permission denied for function compute_trending_score" on game updates.
--
-- compute_trending_score() was created (20261022000002) after the default
-- privileges were revoked (20261018000017), so no client role can execute it.
-- It is called by the SECURITY INVOKER trigger update_hybrid_popularity() on
-- public.games: any game update made with a user session (admin edits, admin
-- IGDB sync via /api/games/[slug]/sync) fails inside the trigger.
--
-- The function is a pure computation over its arguments (no table access), so
-- granting EXECUTE exposes no data. compute_hybrid_popularity(), used by the
-- same trigger, predates the revoke and is already executable.

GRANT EXECUTE ON FUNCTION public.compute_trending_score(
  DOUBLE PRECISION, DOUBLE PRECISION, DATE, BOOLEAN
) TO authenticated, service_role;
