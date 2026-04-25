-- Fix functions with mutable search_path (Security Advisor warning 0011)
-- Recreate all 13 functions with SET search_path = ''

-- 1. get_character_favorite_count
CREATE OR REPLACE FUNCTION public.get_character_favorite_count(character_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.character_favorites
    WHERE character_id = character_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. is_character_favorited
CREATE OR REPLACE FUNCTION public.is_character_favorited(user_uuid UUID, character_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.character_favorites
    WHERE user_id = user_uuid AND character_id = character_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. compute_session_duration
CREATE OR REPLACE FUNCTION public.compute_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER / 60;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 4. update_conversation_updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. record_price_history
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    BEGIN
      INSERT INTO public.game_price_history (game_id, store_id, price, currency, platform, recorded_at)
      VALUES (NEW.game_id, NEW.store_id, NEW.price, NEW.currency, NEW.platform, NOW());
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'record_price_history: échec INSERT snapshot pour game_id=%, store_id=% : %', NEW.game_id, NEW.store_id, SQLERRM;
    END;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.price IS DISTINCT FROM NEW.price THEN
    BEGIN
      INSERT INTO public.game_price_history (game_id, store_id, price, currency, platform, recorded_at)
      VALUES (NEW.game_id, NEW.store_id, NEW.price, NEW.currency, NEW.platform, NOW());
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'record_price_history: échec UPDATE snapshot pour game_id=%, store_id=% : %', NEW.game_id, NEW.store_id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 6. get_price_history
CREATE OR REPLACE FUNCTION public.get_price_history(
  game_uuid UUID,
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL,
  store_filter TEXT DEFAULT NULL,
  platform_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  game_id UUID,
  store_id UUID,
  store_name TEXT,
  store_logo_url TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3),
  platform VARCHAR(50),
  recorded_at TIMESTAMP
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  effective_start TIMESTAMP;
  effective_end TIMESTAMP;
BEGIN
  effective_end := COALESCE(end_date, NOW());
  effective_start := COALESCE(start_date, effective_end - INTERVAL '12 months');
  RETURN QUERY
  SELECT
    gph.id, gph.game_id, gph.store_id,
    s.name::TEXT AS store_name, s.logo_url::TEXT AS store_logo_url,
    gph.price, gph.currency, gph.platform, gph.recorded_at
  FROM public.game_price_history gph
  JOIN public.stores s ON s.id = gph.store_id
  WHERE gph.game_id = game_uuid
    AND gph.recorded_at >= effective_start
    AND gph.recorded_at <= effective_end
    AND (store_filter IS NULL OR s.name = store_filter)
    AND (platform_filter IS NULL OR gph.platform = platform_filter)
  ORDER BY gph.recorded_at ASC;
END;
$$;

-- 7. get_price_history_stats
CREATE OR REPLACE FUNCTION public.get_price_history_stats(game_uuid UUID)
RETURNS TABLE (
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  avg_price DECIMAL(10,2),
  currency VARCHAR(3),
  total_snapshots INTEGER
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    MIN(gph.price)::DECIMAL(10,2),
    MAX(gph.price)::DECIMAL(10,2),
    ROUND(AVG(gph.price), 2)::DECIMAL(10,2),
    MODE() WITHIN GROUP (ORDER BY gph.currency)::VARCHAR(3),
    COUNT(*)::INTEGER
  FROM public.game_price_history gph
  WHERE gph.game_id = game_uuid;
END;
$$;

-- 8. compute_hybrid_popularity (SQL function, IMMUTABLE)
CREATE OR REPLACE FUNCTION public.compute_hybrid_popularity(
  p_igdb_visits DOUBLE PRECISION,
  p_igdb_want DOUBLE PRECISION,
  p_igdb_playing DOUBLE PRECISION,
  p_view_count INTEGER,
  p_popularity_score INTEGER,
  p_last_activity_at TIMESTAMPTZ
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    0.45 * LEAST(1.0, LN(1 + COALESCE(p_igdb_visits, 0)) / LN(1 + 1e6))
  + 0.15 * LEAST(1.0, LN(1 + COALESCE(p_igdb_want, 0)) / LN(1 + 1e4))
  + 0.10 * LEAST(1.0, LN(1 + COALESCE(p_igdb_playing, 0)) / LN(1 + 1e4))
  + 0.15 * LEAST(1.0, LN(1 + COALESCE(p_view_count, 0)) / LN(1 + 1e4))
  + 0.10 * LEAST(1.0, LN(1 + COALESCE(p_popularity_score, 0)) / LN(1 + 1e3))
  + 0.05 * GREATEST(0.0, 1.0 - EXTRACT(EPOCH FROM (NOW() - COALESCE(p_last_activity_at, NOW()))) / (180.0 * 86400.0));
$$;

-- 9. update_hybrid_popularity
CREATE OR REPLACE FUNCTION public.update_hybrid_popularity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.hybrid_popularity_score := public.compute_hybrid_popularity(
    NEW.igdb_pop_visits, NEW.igdb_pop_want_to_play, NEW.igdb_pop_playing,
    NEW.view_count, NEW.popularity_score, NEW.last_activity_at
  );
  RETURN NEW;
END;
$$;

-- 10. get_user_library_stats (latest version with completed fix)
CREATE OR REPLACE FUNCTION public.get_user_library_stats(user_uuid UUID)
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
  FROM public.user_library ul
  WHERE ul.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. is_game_in_user_library
CREATE OR REPLACE FUNCTION public.is_game_in_user_library(user_uuid UUID, game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_library
    WHERE user_id = user_uuid AND game_id = game_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 12. get_user_games_count
CREATE OR REPLACE FUNCTION public.get_user_games_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.user_library
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 13. update_coach_average_rating
CREATE OR REPLACE FUNCTION public.update_coach_average_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE public.coach_profiles
  SET average_rating = (
    SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
    FROM public.coaching_reviews
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM public.coaching_reviews
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';
