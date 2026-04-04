-- Migration: Fix Function Type Mismatches
-- Corriger les erreurs de types dans les fonctions

-- ========================================
-- SUPPRESSION DES FONCTIONS EXISTANTES
-- ========================================

DROP FUNCTION IF EXISTS public.get_game_prices(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_best_price(UUID);
DROP FUNCTION IF EXISTS public.update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_store_stats(UUID);
DROP FUNCTION IF EXISTS public.get_active_stores();
DROP FUNCTION IF EXISTS public.search_stores(TEXT);
DROP FUNCTION IF EXISTS get_game_companies(UUID, TEXT);
-- ========================================
-- CORRECTION DES TYPES DE RETOUR
-- ========================================

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
    s.name::TEXT as store_name,
    s.website_url as store_website_url,
    s.logo_url as store_logo_url,
    gp.price,
    gp.currency,
    gp.platform,
    gp.store_url,
    gp.is_available,
    gp.last_updated,
    gp.created_at
  FROM public.game_prices gp
  JOIN public.stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
    AND (store_filter IS NULL OR s.name ILIKE '%' || store_filter || '%')
    AND (platform_filter IS NULL OR gp.platform ILIKE '%' || platform_filter || '%')
  ORDER BY gp.price ASC, s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
    s.name::TEXT as store_name,
    s.website_url as store_website_url,
    s.logo_url as store_logo_url,
    gp.price,
    gp.currency,
    gp.platform,
    gp.store_url,
    gp.is_available,
    gp.last_updated,
    gp.created_at
  FROM public.game_prices gp
  JOIN public.stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
  ORDER BY gp.price ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction pour mettre à jour un magasin (corriger l'ambiguïté des noms de colonnes)
CREATE OR REPLACE FUNCTION public.update_store(
  store_id UUID,
  store_name TEXT DEFAULT NULL,
  website_url_param TEXT DEFAULT NULL,
  logo_url_param TEXT DEFAULT NULL,
  is_active_param BOOLEAN DEFAULT NULL
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
    SELECT 1 FROM public.stores s WHERE s.id = store_id
  ) INTO store_exists;

  IF NOT store_exists THEN
    RETURN QUERY SELECT FALSE, 'Magasin non trouvé'::TEXT;
    RETURN;
  END IF;

  -- Vérifier l'unicité du nom si un nouveau nom est fourni
  IF store_name IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.stores s WHERE s.name = store_name AND s.id != store_id
    ) INTO name_conflict;

    IF name_conflict THEN
      RETURN QUERY SELECT FALSE, 'Un autre magasin avec ce nom existe déjà'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Mettre à jour le magasin
  UPDATE public.stores s SET
    name = COALESCE(store_name, s.name),
    website_url = COALESCE(website_url_param, s.website_url),
    logo_url = COALESCE(logo_url_param, s.logo_url),
    is_active = COALESCE(is_active_param, s.is_active),
    updated_at = NOW()
  WHERE s.id = store_id;

  RETURN QUERY SELECT TRUE, 'Magasin mis à jour avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
    s.name::TEXT as store_name,
    COUNT(gp.id)::INTEGER as total_games,
    AVG(gp.price)::DECIMAL(10,2) as average_price,
    MIN(gp.price) as lowest_price,
    MAX(gp.price) as highest_price,
    MAX(gp.last_updated) as last_price_update
  FROM public.stores s
  LEFT JOIN public.game_prices gp ON s.id = gp.store_id AND gp.is_available = TRUE
  WHERE s.id = store_uuid
  GROUP BY s.id, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction pour récupérer tous les magasins actifs
CREATE OR REPLACE FUNCTION public.get_active_stores()
RETURNS TABLE (
  id UUID,
  name TEXT,
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
    s.name::TEXT,
    s.website_url,
    s.logo_url,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM public.stores s
  WHERE s.is_active = TRUE
  ORDER BY s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction pour rechercher des magasins par nom
CREATE OR REPLACE FUNCTION public.search_stores(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
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
    s.name::TEXT,
    s.website_url,
    s.logo_url,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM public.stores s
  WHERE s.name ILIKE '%' || search_term || '%'
    OR s.website_url ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE WHEN s.name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction utilitaire pour récupérer les entreprises d'un jeu par rôle
CREATE OR REPLACE FUNCTION get_game_companies(game_uuid UUID, company_role TEXT DEFAULT NULL)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    company_slug TEXT,
    role VARCHAR(50),
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name::TEXT,
        c.slug::TEXT,
        gc.role,
        gc.is_primary
    FROM public.companies c
    JOIN public.game_companies gc ON c.id = gc.company_id
    WHERE gc.game_id = game_uuid
    AND (company_role IS NULL OR gc.role = company_role)
    ORDER BY gc.is_primary DESC, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Commentaires pour documentation
COMMENT ON FUNCTION public.get_game_prices(UUID, TEXT, TEXT) IS 'Récupère tous les prix disponibles pour un jeu avec filtres optionnels par magasin et plateforme';
COMMENT ON FUNCTION public.get_best_price(UUID) IS 'Récupère le meilleur prix disponible pour un jeu';
COMMENT ON FUNCTION public.update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) IS 'Met à jour un magasin existant';
COMMENT ON FUNCTION public.get_store_stats(UUID) IS 'Récupère les statistiques d''un magasin';
COMMENT ON FUNCTION public.get_active_stores() IS 'Récupère tous les magasins actifs';
COMMENT ON FUNCTION public.search_stores(TEXT) IS 'Recherche des magasins par nom ou URL';
COMMENT ON FUNCTION get_game_companies(UUID, TEXT) IS 'Récupère les entreprises associées à un jeu par rôle';
