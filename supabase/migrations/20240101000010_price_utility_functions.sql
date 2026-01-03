-- Migration 010: Fonctions utilitaires pour les prix
-- Création des fonctions de récupération et comparaison de prix

-- Fonction pour récupérer les prix d'un jeu avec filtres optionnels
CREATE OR REPLACE FUNCTION public.get_game_prices(
  game_uuid UUID,
  store_filter TEXT DEFAULT NULL,
  platform_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  game_id UUID,
  store_id UUID,
  store_name TEXT,
  store_website_url TEXT,
  store_logo_url TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3),
  platform VARCHAR(50),
  store_url TEXT,
  is_available BOOLEAN,
  last_updated TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.game_id,
    gp.store_id,
    s.name as store_name,
    s.website_url as store_website_url,
    s.logo_url as store_logo_url,
    gp.price,
    gp.currency,
    gp.platform,
    gp.store_url,
    gp.is_available,
    gp.last_updated,
    gp.created_at
  FROM game_prices gp
  JOIN stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
    AND (store_filter IS NULL OR s.name ILIKE '%' || store_filter || '%')
    AND (platform_filter IS NULL OR gp.platform ILIKE '%' || platform_filter || '%')
  ORDER BY gp.price ASC, s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer le meilleur prix d'un jeu
CREATE OR REPLACE FUNCTION public.get_best_price(game_uuid UUID)
RETURNS TABLE (
  id UUID,
  game_id UUID,
  store_id UUID,
  store_name TEXT,
  store_website_url TEXT,
  store_logo_url TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3),
  platform VARCHAR(50),
  store_url TEXT,
  is_available BOOLEAN,
  last_updated TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.game_id,
    gp.store_id,
    s.name as store_name,
    s.website_url as store_website_url,
    s.logo_url as store_logo_url,
    gp.price,
    gp.currency,
    gp.platform,
    gp.store_url,
    gp.is_available,
    gp.last_updated,
    gp.created_at
  FROM game_prices gp
  JOIN stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
  ORDER BY gp.price ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour comparer les prix d'un jeu
CREATE OR REPLACE FUNCTION public.compare_game_prices(game_uuid UUID)
RETURNS TABLE (
  game_id UUID,
  total_stores INTEGER,
  best_price DECIMAL(10,2),
  worst_price DECIMAL(10,2),
  average_price DECIMAL(10,2),
  currency VARCHAR(3),
  price_range DECIMAL(10,2),
  stores_with_prices JSON
) AS $$
DECLARE
  price_data JSON;
BEGIN
  -- Construire les données des magasins avec prix
  SELECT json_agg(
    json_build_object(
      'store_id', gp.store_id,
      'store_name', s.name,
      'store_website_url', s.website_url,
      'store_logo_url', s.logo_url,
      'price', gp.price,
      'currency', gp.currency,
      'platform', gp.platform,
      'store_url', gp.store_url,
      'last_updated', gp.last_updated
    ) ORDER BY gp.price ASC
  ) INTO price_data
  FROM game_prices gp
  JOIN stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE;

  -- Retourner les statistiques de comparaison
  RETURN QUERY
  SELECT 
    game_uuid as game_id,
    COUNT(*)::INTEGER as total_stores,
    MIN(gp.price) as best_price,
    MAX(gp.price) as worst_price,
    AVG(gp.price)::DECIMAL(10,2) as average_price,
    (SELECT gp2.currency FROM game_prices gp2 WHERE gp2.game_id = game_uuid AND gp2.is_available = TRUE LIMIT 1) as currency,
    (MAX(gp.price) - MIN(gp.price)) as price_range,
    price_data as stores_with_prices
  FROM game_prices gp
  JOIN stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
  GROUP BY game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON FUNCTION public.get_game_prices(UUID, TEXT, TEXT) IS 'Récupère tous les prix disponibles pour un jeu avec filtres optionnels par magasin et plateforme';
COMMENT ON FUNCTION public.get_best_price(UUID) IS 'Récupère le meilleur prix disponible pour un jeu';
COMMENT ON FUNCTION public.compare_game_prices(UUID) IS 'Compare tous les prix disponibles pour un jeu et retourne des statistiques';

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION public.get_game_prices(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_price(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compare_game_prices(UUID) TO anon, authenticated;

-- ========================================
-- FONCTIONS DE GESTION DES MAGASINS
-- ========================================

-- Fonction pour récupérer tous les magasins actifs
CREATE OR REPLACE FUNCTION public.get_active_stores()
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.website_url,
    s.logo_url,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM stores s
  WHERE s.is_active = TRUE
  ORDER BY s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rechercher des magasins par nom
CREATE OR REPLACE FUNCTION public.search_stores(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.website_url,
    s.logo_url,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM stores s
  WHERE s.name ILIKE '%' || search_term || '%'
    OR s.website_url ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE WHEN s.name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider les données d'un magasin
CREATE OR REPLACE FUNCTION public.validate_store_data(
  store_name TEXT,
  website_url TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  name_exists BOOLEAN;
BEGIN
  -- Vérifier si le nom est vide
  IF store_name IS NULL OR LENGTH(TRIM(store_name)) = 0 THEN
    RETURN QUERY SELECT FALSE, 'Le nom du magasin ne peut pas être vide';
    RETURN;
  END IF;

  -- Vérifier l'unicité du nom
  SELECT EXISTS(
    SELECT 1 FROM stores s WHERE s.name = store_name
  ) INTO name_exists;

  IF name_exists THEN
    RETURN QUERY SELECT FALSE, 'Un magasin avec ce nom existe déjà';
    RETURN;
  END IF;

  -- Vérifier le format de l'URL du site web
  IF website_url IS NOT NULL AND website_url !~ '^https?://' THEN
    RETURN QUERY SELECT FALSE, 'L''URL du site web doit commencer par http:// ou https://';
    RETURN;
  END IF;

  -- Vérifier le format de l'URL du logo
  IF logo_url IS NOT NULL AND logo_url !~ '^https?://' THEN
    RETURN QUERY SELECT FALSE, 'L''URL du logo doit commencer par http:// ou https://';
    RETURN;
  END IF;

  -- Toutes les validations sont passées
  RETURN QUERY SELECT TRUE, 'Données valides'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un nouveau magasin avec validation
CREATE OR REPLACE FUNCTION public.create_store(
  store_name TEXT,
  website_url TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  store_id UUID,
  message TEXT
) AS $$
DECLARE
  validation_result RECORD;
  new_store_id UUID;
BEGIN
  -- Valider les données
  SELECT * INTO validation_result 
  FROM public.validate_store_data(store_name, website_url, logo_url);

  IF NOT validation_result.is_valid THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, validation_result.error_message;
    RETURN;
  END IF;

  -- Créer le magasin
  INSERT INTO stores (name, website_url, logo_url, is_active)
  VALUES (store_name, website_url, logo_url, TRUE)
  RETURNING id INTO new_store_id;

  RETURN QUERY SELECT TRUE, new_store_id, 'Magasin créé avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour un magasin
CREATE OR REPLACE FUNCTION public.update_store(
  store_id UUID,
  store_name TEXT DEFAULT NULL,
  website_url TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  store_exists BOOLEAN;
  name_conflict BOOLEAN;
BEGIN
  -- Vérifier si le magasin existe
  SELECT EXISTS(
    SELECT 1 FROM stores s WHERE s.id = store_id
  ) INTO store_exists;

  IF NOT store_exists THEN
    RETURN QUERY SELECT FALSE, 'Magasin non trouvé'::TEXT;
    RETURN;
  END IF;

  -- Vérifier l'unicité du nom si un nouveau nom est fourni
  IF store_name IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM stores s WHERE s.name = store_name AND s.id != store_id
    ) INTO name_conflict;

    IF name_conflict THEN
      RETURN QUERY SELECT FALSE, 'Un autre magasin avec ce nom existe déjà'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Mettre à jour le magasin
  UPDATE stores s SET
    name = COALESCE(store_name, s.name),
    website_url = COALESCE(website_url, s.website_url),
    logo_url = COALESCE(logo_url, s.logo_url),
    is_active = COALESCE(is_active, s.is_active),
    updated_at = NOW()
  WHERE s.id = store_id;

  RETURN QUERY SELECT TRUE, 'Magasin mis à jour avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'un magasin
CREATE OR REPLACE FUNCTION public.get_store_stats(store_uuid UUID)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  total_games INTEGER,
  average_price DECIMAL(10,2),
  lowest_price DECIMAL(10,2),
  highest_price DECIMAL(10,2),
  last_price_update TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    COUNT(gp.id)::INTEGER as total_games,
    AVG(gp.price)::DECIMAL(10,2) as average_price,
    MIN(gp.price) as lowest_price,
    MAX(gp.price) as highest_price,
    MAX(gp.last_updated) as last_price_update
  FROM stores s
  LEFT JOIN game_prices gp ON s.id = gp.store_id AND gp.is_available = TRUE
  WHERE s.id = store_uuid
  GROUP BY s.id, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON FUNCTION public.get_active_stores() IS 'Récupère tous les magasins actifs';
COMMENT ON FUNCTION public.search_stores(TEXT) IS 'Recherche des magasins par nom ou URL';
COMMENT ON FUNCTION public.validate_store_data(TEXT, TEXT, TEXT) IS 'Valide les données d''un magasin avant création/modification';
COMMENT ON FUNCTION public.create_store(TEXT, TEXT, TEXT) IS 'Crée un nouveau magasin avec validation';
COMMENT ON FUNCTION public.update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) IS 'Met à jour un magasin existant';
COMMENT ON FUNCTION public.get_store_stats(UUID) IS 'Récupère les statistiques d''un magasin';

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION public.get_active_stores() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_stores(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_store_data(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_store(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_stats(UUID) TO anon, authenticated;