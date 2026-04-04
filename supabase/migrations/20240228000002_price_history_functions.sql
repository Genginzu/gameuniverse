-- Migration: Fonctions SQL de récupération d'historique de prix
-- Création des fonctions get_price_history et get_price_history_stats
-- pour alimenter le graphique d'évolution des prix côté client.

-- ============================================================================
-- Fonction : get_price_history
-- Retourne les snapshots de prix d'un jeu avec jointure sur stores,
-- triés par recorded_at ASC. Période par défaut : 12 derniers mois.
-- Filtres optionnels par magasin (nom) et plateforme.
-- ============================================================================

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
AS $$
DECLARE
  effective_start TIMESTAMP;
  effective_end TIMESTAMP;
BEGIN
  -- Période par défaut : 12 derniers mois
  effective_end := COALESCE(end_date, NOW());
  effective_start := COALESCE(start_date, effective_end - INTERVAL '12 months');

  RETURN QUERY
  SELECT
    gph.id,
    gph.game_id,
    gph.store_id,
    s.name::TEXT AS store_name,
    s.logo_url::TEXT AS store_logo_url,
    gph.price,
    gph.currency,
    gph.platform,
    gph.recorded_at
  FROM game_price_history gph
  JOIN stores s ON s.id = gph.store_id
  WHERE gph.game_id = game_uuid
    AND gph.recorded_at >= effective_start
    AND gph.recorded_at <= effective_end
    AND (store_filter IS NULL OR s.name = store_filter)
    AND (platform_filter IS NULL OR gph.platform = platform_filter)
  ORDER BY gph.recorded_at ASC;
END;
$$;
COMMENT ON FUNCTION public.get_price_history(UUID, TIMESTAMP, TIMESTAMP, TEXT, TEXT)
  IS 'Retourne l''historique de prix d''un jeu avec jointure sur stores. Période par défaut : 12 derniers mois. Filtres optionnels par magasin et plateforme.';
-- ============================================================================
-- Fonction : get_price_history_stats
-- Retourne les statistiques agrégées (min, max, moyenne, devise, total)
-- de l'historique de prix d'un jeu.
-- ============================================================================

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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    MIN(gph.price)::DECIMAL(10,2) AS min_price,
    MAX(gph.price)::DECIMAL(10,2) AS max_price,
    ROUND(AVG(gph.price), 2)::DECIMAL(10,2) AS avg_price,
    MODE() WITHIN GROUP (ORDER BY gph.currency)::VARCHAR(3) AS currency,
    COUNT(*)::INTEGER AS total_snapshots
  FROM game_price_history gph
  WHERE gph.game_id = game_uuid;
END;
$$;
COMMENT ON FUNCTION public.get_price_history_stats(UUID)
  IS 'Retourne les statistiques agrégées de l''historique de prix d''un jeu : prix min, max, moyen, devise majoritaire et nombre total de snapshots.';
-- ============================================================================
-- Permissions : accès en exécution pour les rôles anon et authenticated
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_price_history(UUID, TIMESTAMP, TIMESTAMP, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_price_history(UUID, TIMESTAMP, TIMESTAMP, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_price_history_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_price_history_stats(UUID) TO authenticated;
