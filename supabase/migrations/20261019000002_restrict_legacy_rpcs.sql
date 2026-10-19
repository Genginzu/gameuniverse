-- Lock down legacy SECURITY DEFINER RPCs still callable by anon/authenticated.
--
-- Context:
--   20260911000001 granted EXECUTE on every function to anon and authenticated.
--   20261018000013 revoked the internal ones it knew about; these were missed:
--     - update_store / create_store: no admin check, so anyone could repoint a
--       store's website_url / logo_url (phishing "buy" links) or create stores.
--     - cleanup_orphaned_*: maintenance DELETE / UPDATE over catalog tables.
--     - refresh_translation_stats_cross_lang: dynamic SQL over caller-chosen
--       tables (RLS bypass oracle, cache tampering, full scans). Dead code.
--     - get_missing_translations: admin-only heavy query.
--     - increment_game_view_count / increment_character_view_count: unlimited
--       popularity inflation, bypassing the API route.
--   Library RPCs (get_common_games, get_user_library_stats,
--   is_game_in_user_library, get_user_games_count) are SECURITY DEFINER and
--   trust a caller-supplied user id, so they bypass the stats_private policies
--   of 20261018000014 and leak private libraries.
--   esport_prediction_leaderboard runs as its owner and lists stats_private
--   players' prediction totals.
--
-- Fix:
--   1. Revoke the admin / maintenance / counter RPCs from clients (the app now
--      calls the ones it needs with the service role).
--   2. Library RPCs become SECURITY INVOKER: user_library RLS applies.
--   3. The leaderboard hides stats_private players.

-- =============================================================================
-- 1. Server-only RPCs
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.update_store(uuid, text, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_store(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_orphaned_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_orphaned_rating_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_orphaned_prices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_translation_stats_cross_lang(text, text, text, text[], text[])
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_missing_translations(text, text[], text[], integer, integer, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_game_view_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_character_view_count(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_store(uuid, text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_store(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_data() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_rating_data() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_prices() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_translation_stats_cross_lang(text, text, text, text[], text[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_missing_translations(text, text[], text[], integer, integer, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_game_view_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_character_view_count(uuid) TO service_role;

-- =============================================================================
-- 2. Library RPCs respect user_library RLS (stats_private)
-- =============================================================================

ALTER FUNCTION public.get_common_games(uuid, uuid, text, integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.get_user_library_stats(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_game_in_user_library(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_user_games_count(uuid) SECURITY INVOKER;

-- =============================================================================
-- 3. Leaderboard hides private profiles
-- =============================================================================

CREATE OR REPLACE VIEW public.esport_prediction_leaderboard AS
SELECT
  player_id,
  COUNT(*) AS total_predictions,
  COUNT(*) FILTER (WHERE status = 'won') AS correct_predictions,
  COALESCE(SUM(payout) - SUM(amount), 0) AS total_profit,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'won')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0) * 100, 1
  ) AS accuracy_rate
FROM public.esport_predictions
WHERE NOT public.is_stats_private(player_id)
GROUP BY player_id;

COMMENT ON VIEW public.esport_prediction_leaderboard IS
  'Prediction leaderboard (owner rights over esport_predictions); stats_private players are excluded.';
