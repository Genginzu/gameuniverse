-- Migration: Fix completed games count in library stats
-- Le compteur de jeux terminés ne prenait en compte que status = 'completed',
-- mais la plupart des jeux restent en status 'owned' même avec du temps de jeu.
-- On considère désormais qu'un jeu avec du temps de jeu > 0 est aussi "terminé".

CREATE OR REPLACE FUNCTION get_user_library_stats(user_uuid UUID)
RETURNS TABLE (
  total_games INTEGER,
  owned_games INTEGER,
  completed_games INTEGER,
  total_play_time INTEGER,
  average_rating DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_games,
    COUNT(*) FILTER (WHERE ul.status = 'owned')::INTEGER as owned_games,
    COUNT(*) FILTER (
      WHERE ul.status = 'completed'
         OR COALESCE(ul.play_time_hours, 0) > 0
    )::INTEGER as completed_games,
    COALESCE(SUM(ul.play_time_hours), 0)::INTEGER as total_play_time,
    ROUND(AVG(ul.rating), 2) as average_rating
  FROM user_library ul
  WHERE ul.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
