-- Migration: Fix Function Search Path Security Warnings
-- Ajouter SET search_path = '' à toutes les fonctions pour corriger les warnings de sécurité

-- ========================================
-- FONCTIONS DE BASE
-- ========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, preferred_locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_locale', 'fr')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id 
    AND email LIKE '%@admin.gamesuniverse.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- ========================================
-- FONCTIONS DE NETTOYAGE
-- ========================================

-- Fonction pour nettoyer les données orphelines du système de classification
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_rating_data()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les descripteurs de classifications de jeux orphelins
  DELETE FROM public.game_rating_descriptors 
  WHERE game_rating_id NOT IN (SELECT id FROM public.game_ratings)
     OR content_descriptor_id NOT IN (SELECT id FROM public.content_descriptors);
  
  -- Supprimer les classifications de jeux orphelines
  DELETE FROM public.game_ratings 
  WHERE game_id NOT IN (SELECT id FROM public.games)
     OR rating_id NOT IN (SELECT id FROM public.ratings);
  
  -- Supprimer les traductions de descripteurs orphelines
  DELETE FROM public.content_descriptor_translations 
  WHERE content_descriptor_id NOT IN (SELECT id FROM public.content_descriptors);
  
  -- Supprimer les descripteurs de contenu orphelins
  DELETE FROM public.content_descriptors 
  WHERE rating_system_id NOT IN (SELECT id FROM public.rating_systems);
  
  -- Supprimer les classifications orphelines
  DELETE FROM public.ratings 
  WHERE rating_system_id NOT IN (SELECT id FROM public.rating_systems);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction principale pour nettoyer les données orphelines
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_data()
RETURNS VOID AS $$
BEGIN
  -- Nettoyer les données de classification
  PERFORM public.cleanup_orphaned_rating_data();
  
  -- Supprimer les traductions de jeux orphelines
  DELETE FROM public.game_translations 
  WHERE game_id NOT IN (SELECT id FROM public.games);
  
  -- Supprimer les traductions de genres orphelines
  DELETE FROM public.genre_translations 
  WHERE genre_id NOT IN (SELECT id FROM public.genres);
  
  -- Supprimer les associations jeux-genres orphelines
  DELETE FROM public.game_genres 
  WHERE game_id NOT IN (SELECT id FROM public.games)
     OR genre_id NOT IN (SELECT id FROM public.genres);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Fonction pour nettoyer les prix orphelins
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_prices()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les prix de jeux orphelins (jeux supprimés)
  DELETE FROM public.game_prices 
  WHERE game_id NOT IN (SELECT id FROM public.games);
  
  -- Supprimer les prix de magasins orphelins (magasins supprimés)
  DELETE FROM public.game_prices 
  WHERE store_id NOT IN (SELECT id FROM public.stores);
  
  -- Désactiver les prix des magasins inactifs
  UPDATE public.game_prices 
  SET is_available = false 
  WHERE store_id IN (SELECT id FROM public.stores WHERE is_active = false)
    AND is_available = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- ========================================
-- FONCTIONS DE VALIDATION
-- ========================================

-- Fonction pour valider les données de prix
CREATE OR REPLACE FUNCTION public.validate_price_data()
RETURNS TABLE(
  table_name TEXT,
  issue_type TEXT,
  issue_count BIGINT,
  sample_ids UUID[]
) AS $$
BEGIN
  -- Vérifier les prix négatifs
  RETURN QUERY
  SELECT 
    'game_prices'::TEXT,
    'negative_price'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM public.game_prices WHERE price < 0 ORDER BY id LIMIT 5)
  FROM public.game_prices 
  WHERE price < 0
  HAVING COUNT(*) > 0;
  
  -- Vérifier les devises invalides
  RETURN QUERY
  SELECT 
    'game_prices'::TEXT,
    'invalid_currency'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM public.game_prices WHERE LENGTH(currency) != 3 OR currency != UPPER(currency) ORDER BY id LIMIT 5)
  FROM public.game_prices 
  WHERE LENGTH(currency) != 3 OR currency != UPPER(currency)
  HAVING COUNT(*) > 0;
  
  -- Vérifier les plateformes vides
  RETURN QUERY
  SELECT 
    'game_prices'::TEXT,
    'empty_platform'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM public.game_prices WHERE LENGTH(TRIM(platform)) = 0 ORDER BY id LIMIT 5)
  FROM public.game_prices 
  WHERE LENGTH(TRIM(platform)) = 0
  HAVING COUNT(*) > 0;
  
  -- Vérifier les noms de magasins vides
  RETURN QUERY
  SELECT 
    'stores'::TEXT,
    'empty_store_name'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM public.stores WHERE LENGTH(TRIM(name)) = 0 ORDER BY id LIMIT 5)
  FROM public.stores 
  WHERE LENGTH(TRIM(name)) = 0
  HAVING COUNT(*) > 0;
  
  -- Vérifier les doublons de noms de magasins
  RETURN QUERY
  SELECT 
    'stores'::TEXT,
    'duplicate_store_names'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT s1.id FROM public.stores s1 WHERE EXISTS (SELECT 1 FROM public.stores s2 WHERE s2.name = s1.name AND s2.id != s1.id) ORDER BY s1.id LIMIT 5)
  FROM public.stores s1
  WHERE EXISTS (
    SELECT 1 FROM public.stores s2 
    WHERE s2.name = s1.name AND s2.id != s1.id
  )
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
    SELECT 1 FROM public.stores s WHERE s.name = store_name
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- ========================================
-- FONCTIONS DE GESTION DES PRIX
-- ========================================

-- Trigger pour mettre à jour last_updated lors des modifications de prix
CREATE OR REPLACE FUNCTION update_price_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price OR 
       OLD.is_available IS DISTINCT FROM NEW.is_available THEN
        NEW.last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
  FROM public.game_prices gp
  JOIN public.stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
  ORDER BY gp.price ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
  FROM public.game_prices gp
  JOIN public.stores s ON gp.store_id = s.id
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
    (SELECT gp2.currency FROM public.game_prices gp2 WHERE gp2.game_id = game_uuid AND gp2.is_available = TRUE LIMIT 1) as currency,
    (MAX(gp.price) - MIN(gp.price)) as price_range,
    price_data as stores_with_prices
  FROM public.game_prices gp
  JOIN public.stores s ON gp.store_id = s.id
  WHERE gp.game_id = game_uuid
    AND gp.is_available = TRUE
    AND s.is_active = TRUE
  GROUP BY game_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
  FROM public.stores s
  WHERE s.is_active = TRUE
  ORDER BY s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
  FROM public.stores s
  WHERE s.name ILIKE '%' || search_term || '%'
    OR s.website_url ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE WHEN s.name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    s.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
  INSERT INTO public.stores (name, website_url, logo_url, is_active)
  VALUES (store_name, website_url, logo_url, TRUE)
  RETURNING id INTO new_store_id;

  RETURN QUERY SELECT TRUE, new_store_id, 'Magasin créé avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
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
    website_url = COALESCE(website_url, s.website_url),
    logo_url = COALESCE(logo_url, s.logo_url),
    is_active = COALESCE(is_active, s.is_active),
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
    s.name as store_name,
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
-- ========================================
-- FONCTIONS DE GESTION DES ENTREPRISES
-- ========================================

-- Fonction utilitaire pour récupérer les entreprises d'un jeu par rôle
CREATE OR REPLACE FUNCTION get_game_companies(game_uuid UUID, company_role TEXT DEFAULT NULL)
RETURNS TABLE (
    company_id UUID,
    company_name VARCHAR(255),
    company_slug VARCHAR(255),
    role VARCHAR(50),
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        gc.role,
        gc.is_primary
    FROM public.companies c
    JOIN public.game_companies gc ON c.id = gc.company_id
    WHERE gc.game_id = game_uuid
    AND (company_role IS NULL OR gc.role = company_role)
    ORDER BY gc.is_primary DESC, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- ========================================
-- FONCTIONS DE GESTION DES CLASSIFICATIONS
-- ========================================

-- Fonction pour obtenir la classification principale d'un jeu
CREATE OR REPLACE FUNCTION get_primary_game_rating(game_uuid UUID, lang_code VARCHAR(2) DEFAULT 'fr')
RETURNS TABLE (
    rating_system_code VARCHAR(10),
    rating_display_name VARCHAR(50),
    minimum_age INTEGER,
    color_hex VARCHAR(7),
    content_descriptors JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.code,
        r.display_name,
        r.minimum_age,
        r.color_hex,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'code', cd.code,
                    'name', cdt.name,
                    'description', cdt.description
                )
            ) FILTER (WHERE cd.id IS NOT NULL),
            '[]'::jsonb
        ) as content_descriptors
    FROM public.game_ratings gr
    JOIN public.ratings r ON gr.rating_id = r.id
    JOIN public.rating_systems rs ON r.rating_system_id = rs.id
    LEFT JOIN public.game_rating_descriptors grd ON gr.id = grd.game_rating_id
    LEFT JOIN public.content_descriptors cd ON grd.content_descriptor_id = cd.id
    LEFT JOIN public.content_descriptor_translations cdt ON cd.id = cdt.content_descriptor_id 
        AND cdt.language_code = lang_code
    WHERE gr.game_id = game_uuid 
        AND gr.is_primary = true
    GROUP BY rs.code, r.display_name, r.minimum_age, r.color_hex
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
-- Commentaires pour documentation
COMMENT ON FUNCTION public.cleanup_orphaned_data() IS 'Nettoie toutes les données orphelines du système';
COMMENT ON FUNCTION public.cleanup_orphaned_prices() IS 'Nettoie les prix orphelins et désactive les prix des magasins inactifs';
COMMENT ON FUNCTION public.cleanup_orphaned_rating_data() IS 'Nettoie les données orphelines du système de classification';
COMMENT ON FUNCTION public.validate_price_data() IS 'Valide l''intégrité des données de prix et retourne les problèmes détectés';
COMMENT ON FUNCTION public.validate_store_data(TEXT, TEXT, TEXT) IS 'Valide les données d''un magasin avant création/modification';
COMMENT ON FUNCTION public.get_game_prices(UUID, TEXT, TEXT) IS 'Récupère tous les prix disponibles pour un jeu avec filtres optionnels par magasin et plateforme';
COMMENT ON FUNCTION public.get_best_price(UUID) IS 'Récupère le meilleur prix disponible pour un jeu';
COMMENT ON FUNCTION public.compare_game_prices(UUID) IS 'Compare tous les prix disponibles pour un jeu et retourne des statistiques';
COMMENT ON FUNCTION public.get_active_stores() IS 'Récupère tous les magasins actifs';
COMMENT ON FUNCTION public.search_stores(TEXT) IS 'Recherche des magasins par nom ou URL';
COMMENT ON FUNCTION public.create_store(TEXT, TEXT, TEXT) IS 'Crée un nouveau magasin avec validation';
COMMENT ON FUNCTION public.update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) IS 'Met à jour un magasin existant';
COMMENT ON FUNCTION public.get_store_stats(UUID) IS 'Récupère les statistiques d''un magasin';
COMMENT ON FUNCTION get_game_companies(UUID, TEXT) IS 'Récupère les entreprises associées à un jeu par rôle';
COMMENT ON FUNCTION get_primary_game_rating(UUID, VARCHAR) IS 'Récupère la classification principale d''un jeu avec descripteurs de contenu';
