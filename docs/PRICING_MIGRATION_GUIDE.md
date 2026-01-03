# Guide de Migration - Système de Prix de Jeux

## Vue d'ensemble de la Migration

Ce guide détaille le processus de migration de l'ancien système de prix (champs
directs dans la table `games`) vers le nouveau système flexible avec tables
dédiées `stores` et `game_prices`.

## Avant la Migration

### Ancien Schéma

```sql
-- Structure avant migration
ALTER TABLE games ADD COLUMN launch_price DECIMAL(10,2);
ALTER TABLE games ADD COLUMN current_price DECIMAL(10,2);
ALTER TABLE games ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';
```

### Limitations de l'Ancien Système

1. **Un seul prix par jeu** : Impossible de comparer les prix entre magasins
2. **Pas d'historique** : Aucun suivi des changements de prix
3. **Informations limitées** : Pas de lien vers les magasins ou plateformes
4. **Maintenance difficile** : Mise à jour manuelle des prix
5. **Pas de métadonnées** : Aucune information sur la disponibilité

## Nouveau Schéma

### Structure Après Migration

```sql
-- Nouvelles tables
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  platform VARCHAR(50) NOT NULL,
  store_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Processus de Migration Détaillé

### Phase 1: Préparation

#### 1.1 Sauvegarde des Données

```sql
-- Créer une sauvegarde des données existantes
CREATE TABLE games_price_backup AS
SELECT id, launch_price, current_price, currency
FROM games
WHERE launch_price IS NOT NULL OR current_price IS NOT NULL;

-- Vérifier la sauvegarde
SELECT COUNT(*) as total_games_with_prices FROM games_price_backup;
```

#### 1.2 Analyse des Données Existantes

```sql
-- Analyser les données de prix existantes
SELECT
  COUNT(*) as total_games,
  COUNT(launch_price) as games_with_launch_price,
  COUNT(current_price) as games_with_current_price,
  COUNT(DISTINCT currency) as unique_currencies,
  MIN(COALESCE(current_price, launch_price)) as min_price,
  MAX(COALESCE(current_price, launch_price)) as max_price,
  AVG(COALESCE(current_price, launch_price)) as avg_price
FROM games
WHERE launch_price IS NOT NULL OR current_price IS NOT NULL;

-- Analyser les devises utilisées
SELECT currency, COUNT(*) as count
FROM games
WHERE currency IS NOT NULL
GROUP BY currency
ORDER BY count DESC;
```

### Phase 2: Création du Nouveau Schéma

#### 2.1 Création des Tables

```sql
-- Exécuter les migrations dans l'ordre
-- Migration 005: Table stores
\i supabase/migrations/20240101000005_stores_table.sql

-- Migration 006: Table game_prices
\i supabase/migrations/20240101000006_game_prices_table.sql

-- Migration 007: Politiques RLS
\i supabase/migrations/20240101000007_pricing_rls_policies.sql
```

#### 2.2 Vérification du Schéma

```sql
-- Vérifier que les tables ont été créées
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('stores', 'game_prices')
ORDER BY table_name, ordinal_position;

-- Vérifier les contraintes
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('stores', 'game_prices');
```

### Phase 3: Migration des Données

#### 3.1 Création des Magasins par Défaut

```sql
-- Insérer les magasins principaux
INSERT INTO stores (name, website_url, logo_url, is_active) VALUES
('Steam', 'https://store.steampowered.com', 'https://store.steampowered.com/public/shared/images/header/logo_steam.svg', true),
('Epic Games Store', 'https://store.epicgames.com', 'https://cdn2.unrealengine.com/Epic+Games+Node%2Fxlarge_whitetext_blackback_epiclogo_504x512_1529964470588-503x512-ac795e81c54b27aaa2e196456dd307bfe4ca3ca4.jpg', true),
('PlayStation Store', 'https://store.playstation.com', 'https://gmedia.playstation.com/is/image/GMCTNS/ps-logo-vector-01', true),
('Xbox Store', 'https://www.microsoft.com/store/games/xbox', 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b', true),
('Nintendo eShop', 'https://www.nintendo.com/store', 'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/en_US/merchandising/nintendo-eshop-logo', true),
('GOG', 'https://www.gog.com', 'https://images.gog-statics.com/3c88e4e0b7e8b4a66bb8b493d5e94aeeb8b5c5b5.png', true),
('Generic Store', NULL, NULL, true); -- Magasin par défaut pour les prix sans source

-- Vérifier l'insertion
SELECT id, name, is_active FROM stores ORDER BY name;
```

#### 3.2 Migration des Prix Existants

```sql
-- Migrer les prix existants vers la nouvelle structure
DO $
DECLARE
  default_store_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Récupérer l'ID du magasin par défaut
  SELECT id INTO default_store_id FROM stores WHERE name = 'Generic Store';

  -- Migrer current_price en priorité, sinon launch_price
  INSERT INTO game_prices (game_id, store_id, price, currency, platform, is_available)
  SELECT
    g.id as game_id,
    default_store_id as store_id,
    COALESCE(g.current_price, g.launch_price) as price,
    COALESCE(g.currency, 'EUR') as currency,
    'PC' as platform, -- Plateforme par défaut
    true as is_available
  FROM games g
  WHERE (g.launch_price IS NOT NULL OR g.current_price IS NOT NULL)
    AND COALESCE(g.current_price, g.launch_price) > 0;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migration terminée: % prix migrés', migrated_count;
END;
$;
```

#### 3.3 Validation de la Migration

```sql
-- Comparer les données avant/après migration
WITH migration_stats AS (
  SELECT
    COUNT(*) as new_prices_count,
    MIN(price) as new_min_price,
    MAX(price) as new_max_price,
    AVG(price) as new_avg_price
  FROM game_prices
),
original_stats AS (
  SELECT
    COUNT(*) as original_count,
    MIN(COALESCE(current_price, launch_price)) as original_min_price,
    MAX(COALESCE(current_price, launch_price)) as original_max_price,
    AVG(COALESCE(current_price, launch_price)) as original_avg_price
  FROM games_price_backup
)
SELECT
  'Migration Validation' as check_type,
  o.original_count,
  m.new_prices_count,
  CASE
    WHEN o.original_count = m.new_prices_count THEN 'OK'
    ELSE 'ERREUR'
  END as count_check,
  o.original_min_price,
  m.new_min_price,
  o.original_max_price,
  m.new_max_price,
  o.original_avg_price,
  m.new_avg_price
FROM original_stats o, migration_stats m;

-- Vérifier l'intégrité référentielle
SELECT
  'Integrity Check' as check_type,
  COUNT(*) as total_prices,
  COUNT(DISTINCT game_id) as unique_games,
  COUNT(DISTINCT store_id) as unique_stores,
  SUM(CASE WHEN price <= 0 THEN 1 ELSE 0 END) as invalid_prices
FROM game_prices;
```

### Phase 4: Nettoyage de l'Ancien Schéma

#### 4.1 Vérification Finale

```sql
-- Vérifier que toutes les données ont été migrées
SELECT
  g.id,
  g.slug,
  g.launch_price,
  g.current_price,
  g.currency,
  gp.price as new_price,
  gp.currency as new_currency
FROM games g
LEFT JOIN game_prices gp ON g.id = gp.game_id
WHERE (g.launch_price IS NOT NULL OR g.current_price IS NOT NULL)
  AND gp.id IS NULL;

-- Cette requête ne doit retourner aucun résultat
```

#### 4.2 Suppression des Anciennes Colonnes

```sql
-- Supprimer les anciennes colonnes de prix
ALTER TABLE games DROP COLUMN IF EXISTS launch_price;
ALTER TABLE games DROP COLUMN IF EXISTS current_price;
ALTER TABLE games DROP COLUMN IF EXISTS currency;

-- Vérifier la suppression
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('launch_price', 'current_price', 'currency');
```

### Phase 5: Création des Fonctions Utilitaires

#### 5.1 Installation des Fonctions

```sql
-- Exécuter la migration des fonctions utilitaires
\i supabase/migrations/20240101000010_price_utility_functions.sql
```

#### 5.2 Test des Fonctions

```sql
-- Tester les fonctions avec un jeu existant
DO $
DECLARE
  test_game_id UUID;
  price_count INTEGER;
BEGIN
  -- Récupérer un jeu avec prix pour les tests
  SELECT game_id INTO test_game_id
  FROM game_prices
  LIMIT 1;

  -- Tester get_game_prices
  SELECT COUNT(*) INTO price_count
  FROM get_game_prices(test_game_id);
  RAISE NOTICE 'get_game_prices: % prix trouvés', price_count;

  -- Tester get_best_price
  IF EXISTS(SELECT 1 FROM get_best_price(test_game_id)) THEN
    RAISE NOTICE 'get_best_price: OK';
  ELSE
    RAISE NOTICE 'get_best_price: ERREUR';
  END IF;

  -- Tester compare_game_prices
  IF EXISTS(SELECT 1 FROM compare_game_prices(test_game_id)) THEN
    RAISE NOTICE 'compare_game_prices: OK';
  ELSE
    RAISE NOTICE 'compare_game_prices: ERREUR';
  END IF;
END;
$;
```

## Mise à Jour du Code Application

### Avant Migration (Ancien Code)

```typescript
// Ancien code - accès direct aux champs
interface OldGame {
  id: string;
  slug: string;
  launch_price?: number;
  current_price?: number;
  currency?: string;
}

// Récupération des prix
const { data: games } = await supabase
  .from("games")
  .select("id, slug, current_price, launch_price, currency")
  .eq("id", gameId);

const game = games?.[0];
const price = game?.current_price || game?.launch_price;
```

### Après Migration (Nouveau Code)

```typescript
// Nouveau code - utilisation des fonctions
import type { GamePriceResponse } from "@/lib/pricing-types";

// Récupération des prix via les nouvelles fonctions
const { data: prices } = await supabase.rpc("get_game_prices", {
  game_uuid: gameId,
});

const { data: bestPrice } = await supabase.rpc("get_best_price", {
  game_uuid: gameId,
});

// Comparaison de prix
const { data: comparison } = await supabase.rpc("compare_game_prices", {
  game_uuid: gameId,
});
```

### Mise à Jour des Types TypeScript

```bash
# Régénérer les types depuis la base de données
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

## Rollback en Cas de Problème

### Procédure de Rollback

```sql
-- 1. Restaurer les anciennes colonnes
ALTER TABLE games ADD COLUMN launch_price DECIMAL(10,2);
ALTER TABLE games ADD COLUMN current_price DECIMAL(10,2);
ALTER TABLE games ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';

-- 2. Restaurer les données depuis la sauvegarde
UPDATE games SET
  launch_price = b.launch_price,
  current_price = b.current_price,
  currency = b.currency
FROM games_price_backup b
WHERE games.id = b.id;

-- 3. Supprimer les nouvelles tables (ATTENTION: perte de données)
DROP TABLE IF EXISTS game_prices CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- 4. Supprimer les fonctions
DROP FUNCTION IF EXISTS get_game_prices(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_best_price(UUID);
DROP FUNCTION IF EXISTS compare_game_prices(UUID);
-- ... autres fonctions
```

## Vérifications Post-Migration

### 1. Tests de Performance

```sql
-- Tester les performances des nouvelles requêtes
EXPLAIN ANALYZE
SELECT * FROM get_game_prices('550e8400-e29b-41d4-a716-446655440000');

EXPLAIN ANALYZE
SELECT * FROM get_best_price('550e8400-e29b-41d4-a716-446655440000');
```

### 2. Tests d'Intégrité

```sql
-- Vérifier l'intégrité des données
SELECT
  'Data Integrity Check' as test_name,
  COUNT(*) as total_prices,
  COUNT(CASE WHEN price < 0 THEN 1 END) as negative_prices,
  COUNT(CASE WHEN game_id IS NULL THEN 1 END) as null_game_ids,
  COUNT(CASE WHEN store_id IS NULL THEN 1 END) as null_store_ids
FROM game_prices;

-- Vérifier les références
SELECT
  'Reference Check' as test_name,
  COUNT(*) as orphaned_prices
FROM game_prices gp
LEFT JOIN games g ON gp.game_id = g.id
LEFT JOIN stores s ON gp.store_id = s.id
WHERE g.id IS NULL OR s.id IS NULL;
```

### 3. Tests Fonctionnels

```sql
-- Tester avec différents scénarios
SELECT 'Test: Jeu avec plusieurs prix' as test_case,
       COUNT(*) as price_count
FROM get_game_prices((
  SELECT game_id FROM game_prices
  GROUP BY game_id
  HAVING COUNT(*) > 1
  LIMIT 1
));

SELECT 'Test: Jeu sans prix' as test_case,
       COUNT(*) as price_count
FROM get_game_prices('00000000-0000-0000-0000-000000000000');
```

## Maintenance Post-Migration

### 1. Nettoyage Régulier

```sql
-- Fonction de nettoyage des données orphelines
CREATE OR REPLACE FUNCTION cleanup_orphaned_prices()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM game_prices
  WHERE game_id NOT IN (SELECT id FROM games);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Exécuter le nettoyage
SELECT cleanup_orphaned_prices() as deleted_orphaned_prices;
```

### 2. Monitoring

```sql
-- Vue pour surveiller la santé du système
CREATE VIEW price_system_health AS
SELECT
  'System Health' as metric_type,
  COUNT(DISTINCT gp.game_id) as games_with_prices,
  COUNT(gp.id) as total_prices,
  COUNT(DISTINCT gp.store_id) as active_stores,
  AVG(gp.price) as average_price,
  MIN(gp.last_updated) as oldest_price_update,
  MAX(gp.last_updated) as newest_price_update
FROM game_prices gp
JOIN stores s ON gp.store_id = s.id
WHERE gp.is_available = true AND s.is_active = true;

-- Consulter la santé du système
SELECT * FROM price_system_health;
```

## Conclusion

Cette migration transforme un système de prix simple en une architecture
flexible et évolutive. Les étapes détaillées garantissent une migration sûre
avec possibilité de rollback et validation complète des données.

### Points Clés de Succès

1. **Sauvegarde complète** avant migration
2. **Validation à chaque étape** du processus
3. **Tests complets** des nouvelles fonctionnalités
4. **Mise à jour coordonnée** du code application
5. **Monitoring continu** post-migration

### Bénéfices Obtenus

- **Flexibilité** : Support de multiples magasins et plateformes
- **Performance** : Requêtes optimisées avec index appropriés
- **Maintenabilité** : Structure claire et fonctions dédiées
- **Évolutivité** : Architecture prête pour de nouvelles fonctionnalités
- **Intégrité** : Contraintes et validations robustes
