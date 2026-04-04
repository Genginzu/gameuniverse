-- Migration 007: Politiques RLS pour les tables de prix
-- Configuration de la sécurité Row Level Security pour stores et game_prices

-- Activation RLS sur les nouvelles tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_prices ENABLE ROW LEVEL SECURITY;
-- Politiques de lecture publique pour les magasins
CREATE POLICY "Stores are viewable by everyone" ON stores 
  FOR SELECT USING (true);
-- Politiques de lecture publique pour les prix de jeux
CREATE POLICY "Game prices are viewable by everyone" ON game_prices 
  FOR SELECT USING (true);
-- Politiques d'administration pour les magasins (rôle admin requis)
CREATE POLICY "Admins can manage stores" ON stores 
  FOR ALL USING (public.is_admin());
-- Politiques d'administration pour les prix de jeux (rôle admin requis)
CREATE POLICY "Admins can manage game prices" ON game_prices 
  FOR ALL USING (public.is_admin());
-- Politiques pour permettre l'insertion de données de test en développement
-- Ces politiques peuvent être supprimées en production
CREATE POLICY "Allow insert stores for development" ON stores 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert game prices for development" ON game_prices 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update stores for development" ON stores 
  FOR UPDATE USING (true);
CREATE POLICY "Allow update game prices for development" ON game_prices 
  FOR UPDATE USING (true);
-- Fonction pour nettoyer les prix orphelins
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_prices()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les prix de jeux orphelins (jeux supprimés)
  DELETE FROM game_prices 
  WHERE game_id NOT IN (SELECT id FROM games);
  
  -- Supprimer les prix de magasins orphelins (magasins supprimés)
  DELETE FROM game_prices 
  WHERE store_id NOT IN (SELECT id FROM stores);
  
  -- Désactiver les prix des magasins inactifs
  UPDATE game_prices 
  SET is_available = false 
  WHERE store_id IN (SELECT id FROM stores WHERE is_active = false)
    AND is_available = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
    ARRAY(SELECT id FROM game_prices WHERE price < 0 ORDER BY id LIMIT 5)
  FROM game_prices 
  WHERE price < 0
  HAVING COUNT(*) > 0;
  
  -- Vérifier les devises invalides
  RETURN QUERY
  SELECT 
    'game_prices'::TEXT,
    'invalid_currency'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM game_prices WHERE LENGTH(currency) != 3 OR currency != UPPER(currency) ORDER BY id LIMIT 5)
  FROM game_prices 
  WHERE LENGTH(currency) != 3 OR currency != UPPER(currency)
  HAVING COUNT(*) > 0;
  
  -- Vérifier les plateformes vides
  RETURN QUERY
  SELECT 
    'game_prices'::TEXT,
    'empty_platform'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM game_prices WHERE LENGTH(TRIM(platform)) = 0 ORDER BY id LIMIT 5)
  FROM game_prices 
  WHERE LENGTH(TRIM(platform)) = 0
  HAVING COUNT(*) > 0;
  
  -- Vérifier les noms de magasins vides
  RETURN QUERY
  SELECT 
    'stores'::TEXT,
    'empty_store_name'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT id FROM stores WHERE LENGTH(TRIM(name)) = 0 ORDER BY id LIMIT 5)
  FROM stores 
  WHERE LENGTH(TRIM(name)) = 0
  HAVING COUNT(*) > 0;
  
  -- Vérifier les doublons de noms de magasins
  RETURN QUERY
  SELECT 
    'stores'::TEXT,
    'duplicate_store_names'::TEXT,
    COUNT(*)::BIGINT,
    ARRAY(SELECT s1.id FROM stores s1 WHERE EXISTS (SELECT 1 FROM stores s2 WHERE s2.name = s1.name AND s2.id != s1.id) ORDER BY s1.id LIMIT 5)
  FROM stores s1
  WHERE EXISTS (
    SELECT 1 FROM stores s2 
    WHERE s2.name = s1.name AND s2.id != s1.id
  )
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Commentaires pour documentation
COMMENT ON FUNCTION public.cleanup_orphaned_prices() IS 'Nettoie les prix orphelins et désactive les prix des magasins inactifs';
COMMENT ON FUNCTION public.validate_price_data() IS 'Valide l''intégrité des données de prix et retourne les problèmes détectés';
