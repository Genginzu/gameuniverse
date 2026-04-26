# Référence des Fonctions de Base de Données - Système de Prix

## Vue d'ensemble

Ce document présente toutes les fonctions de base de données disponibles pour le
système de prix de jeux, avec leurs signatures, paramètres, valeurs de retour et
exemples d'utilisation.

## Fonctions de Récupération de Prix

### `get_game_prices(game_uuid, store_filter?, platform_filter?)`

Récupère tous les prix disponibles pour un jeu avec filtres optionnels.

#### Signature

```sql
get_game_prices(
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
)
```

#### Paramètres

- `game_uuid` (UUID, requis) : Identifiant unique du jeu
- `store_filter` (TEXT, optionnel) : Filtre par nom de magasin (recherche
  partielle insensible à la casse)
- `platform_filter` (TEXT, optionnel) : Filtre par plateforme (recherche
  partielle insensible à la casse)

#### Comportement

- Retourne uniquement les prix disponibles (`is_available = TRUE`)
- Inclut uniquement les magasins actifs (`is_active = TRUE`)
- Résultats triés par prix croissant, puis par nom de magasin
- Jointure automatique avec la table `stores` pour les informations enrichies

#### Exemples d'utilisation

```sql
-- Tous les prix d'un jeu
SELECT * FROM get_game_prices('550e8400-e29b-41d4-a716-446655440000');

-- Prix sur Steam uniquement
SELECT * FROM get_game_prices(
  '550e8400-e29b-41d4-a716-446655440000',
  'Steam'
);

-- Prix sur PC uniquement
SELECT * FROM get_game_prices(
  '550e8400-e29b-41d4-a716-446655440000',
  NULL,
  'PC'
);

-- Prix Steam sur PC
SELECT * FROM get_game_prices(
  '550e8400-e29b-41d4-a716-446655440000',
  'Steam',
  'PC'
);
```

#### Cas d'usage typiques

- Affichage de tous les prix d'un jeu
- Comparaison de prix entre magasins
- Filtrage par plateforme spécifique
- Recherche de prix sur un magasin particulier

---

### `get_best_price(game_uuid)`

Récupère le meilleur prix (le plus bas) disponible pour un jeu.

#### Signature

```sql
get_best_price(game_uuid UUID)
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
)
```

#### Paramètres

- `game_uuid` (UUID, requis) : Identifiant unique du jeu

#### Comportement

- Retourne le prix le plus bas disponible
- Un seul résultat maximum (LIMIT 1)
- Même filtrage que `get_game_prices` (disponible et magasin actif)
- Retourne une table vide si aucun prix n'est trouvé

#### Exemples d'utilisation

```sql
-- Meilleur prix pour un jeu
SELECT * FROM get_best_price('550e8400-e29b-41d4-a716-446655440000');

-- Vérifier si un jeu a un prix disponible
SELECT EXISTS(
  SELECT 1 FROM get_best_price('550e8400-e29b-41d4-a716-446655440000')
) as has_price;

-- Récupérer juste le prix et le magasin
SELECT price, store_name
FROM get_best_price('550e8400-e29b-41d4-a716-446655440000');
```

#### Cas d'usage typiques

- Affichage du prix le plus attractif
- Recommandation d'achat
- Comparaison rapide entre jeux
- Alertes de prix

---

### `compare_game_prices(game_uuid)`

Compare tous les prix disponibles pour un jeu et retourne des statistiques
complètes.

#### Signature

```sql
compare_game_prices(game_uuid UUID)
RETURNS TABLE (
  game_id UUID,
  total_stores INTEGER,
  best_price DECIMAL(10,2),
  worst_price DECIMAL(10,2),
  average_price DECIMAL(10,2),
  currency VARCHAR(3),
  price_range DECIMAL(10,2),
  stores_with_prices JSON
)
```

#### Paramètres

- `game_uuid` (UUID, requis) : Identifiant unique du jeu

#### Comportement

- Calcule des statistiques sur tous les prix disponibles
- `price_range` = différence entre le prix le plus haut et le plus bas
- `stores_with_prices` contient un JSON avec tous les détails des magasins
- Retourne une ligne vide si aucun prix n'est trouvé

#### Structure du JSON `stores_with_prices`

```json
[
  {
    "store_id": "uuid",
    "store_name": "Steam",
    "store_website_url": "https://store.steampowered.com",
    "store_logo_url": "https://...",
    "price": 29.99,
    "currency": "EUR",
    "platform": "PC",
    "store_url": "https://store.steampowered.com/app/123",
    "last_updated": "2024-01-01T12:00:00Z"
  }
]
```

#### Exemples d'utilisation

```sql
-- Comparaison complète
SELECT * FROM compare_game_prices('550e8400-e29b-41d4-a716-446655440000');

-- Juste les statistiques de prix
SELECT
  best_price,
  worst_price,
  average_price,
  price_range,
  total_stores
FROM compare_game_prices('550e8400-e29b-41d4-a716-446655440000');

-- Extraire les détails des magasins depuis le JSON
SELECT
  game_id,
  json_array_elements(stores_with_prices) as store_detail
FROM compare_game_prices('550e8400-e29b-41d4-a716-446655440000');
```

#### Cas d'usage typiques

- Tableau de comparaison de prix
- Analyse de marché
- Détection d'opportunités d'achat
- Statistiques pour les développeurs

---

## Fonctions de Gestion des Magasins

### `get_active_stores()`

Récupère tous les magasins actifs du système.

#### Signature

```sql
get_active_stores()
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Paramètres

Aucun paramètre requis.

#### Comportement

- Retourne uniquement les magasins avec `is_active = TRUE`
- Résultats triés par nom alphabétique
- Inclut toutes les métadonnées du magasin

#### Exemples d'utilisation

```sql
-- Tous les magasins actifs
SELECT * FROM get_active_stores();

-- Juste les noms et URLs
SELECT name, website_url FROM get_active_stores();

-- Compter les magasins actifs
SELECT COUNT(*) as active_stores_count FROM get_active_stores();
```

---

### `search_stores(search_term)`

Recherche des magasins par nom ou URL avec classement par pertinence.

#### Signature

```sql
search_stores(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Paramètres

- `search_term` (TEXT, requis) : Terme de recherche

#### Comportement

- Recherche insensible à la casse dans le nom et l'URL du site web
- Classement par pertinence : correspondances exactes en premier
- Inclut les magasins actifs et inactifs
- Utilise l'opérateur ILIKE pour la recherche partielle

#### Exemples d'utilisation

```sql
-- Rechercher Steam
SELECT * FROM search_stores('Steam');

-- Rechercher par domaine
SELECT * FROM search_stores('epicgames.com');

-- Recherche partielle
SELECT * FROM search_stores('Play');
```

---

### `validate_store_data(store_name, website_url?, logo_url?)`

Valide les données d'un magasin avant création ou modification.

#### Signature

```sql
validate_store_data(
  store_name TEXT,
  website_url TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
)
```

#### Paramètres

- `store_name` (TEXT, requis) : Nom du magasin à valider
- `website_url` (TEXT, optionnel) : URL du site web
- `logo_url` (TEXT, optionnel) : URL du logo

#### Règles de Validation

1. **Nom requis** : Le nom ne peut pas être vide ou NULL
2. **Unicité du nom** : Le nom doit être unique dans la base
3. **Format URL site web** : Doit commencer par http:// ou https://
4. **Format URL logo** : Doit commencer par http:// ou https://

#### Exemples d'utilisation

```sql
-- Valider un nouveau magasin
SELECT * FROM validate_store_data(
  'Nouveau Magasin',
  'https://example.com',
  'https://example.com/logo.png'
);

-- Valider juste le nom
SELECT * FROM validate_store_data('Test Store');

-- Exemple de validation échouée
SELECT * FROM validate_store_data('Steam'); -- Nom déjà existant
```

#### Réponses Typiques

```sql
-- Succès
(true, 'Données valides')

-- Échecs possibles
(false, 'Le nom du magasin ne peut pas être vide')
(false, 'Un magasin avec ce nom existe déjà')
(false, 'L''URL du site web doit commencer par http:// ou https://')
(false, 'L''URL du logo doit commencer par http:// ou https://')
```

---

### `create_store(store_name, website_url?, logo_url?)`

Crée un nouveau magasin avec validation automatique.

#### Signature

```sql
create_store(
  store_name TEXT,
  website_url TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  store_id UUID,
  message TEXT
)
```

#### Paramètres

- `store_name` (TEXT, requis) : Nom du nouveau magasin
- `website_url` (TEXT, optionnel) : URL du site web
- `logo_url` (TEXT, optionnel) : URL du logo

#### Comportement

- Validation automatique via `validate_store_data`
- Création uniquement si la validation réussit
- Le magasin est créé comme actif par défaut
- Retourne l'ID du magasin créé en cas de succès

#### Exemples d'utilisation

```sql
-- Créer un magasin complet
SELECT * FROM create_store(
  'GOG',
  'https://www.gog.com',
  'https://www.gog.com/logo.png'
);

-- Créer un magasin minimal
SELECT * FROM create_store('Nouveau Magasin');

-- Vérifier le succès de la création
DO $
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM create_store('Test Store', 'https://test.com');

  IF result.success THEN
    RAISE NOTICE 'Magasin créé avec ID: %', result.store_id;
  ELSE
    RAISE NOTICE 'Échec: %', result.message;
  END IF;
END;
$;
```

#### Réponses Typiques

```sql
-- Succès
(true, '550e8400-e29b-41d4-a716-446655440000', 'Magasin créé avec succès')

-- Échec
(false, null, 'Un magasin avec ce nom existe déjà')
```

---

### `update_store(store_id, store_name?, website_url?, logo_url?, is_active?)`

Met à jour un magasin existant avec validation.

#### Signature

```sql
update_store(
  store_id UUID,
  store_name TEXT DEFAULT NULL,
  website_url TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
```

#### Paramètres

- `store_id` (UUID, requis) : Identifiant du magasin à modifier
- `store_name` (TEXT, optionnel) : Nouveau nom
- `website_url` (TEXT, optionnel) : Nouvelle URL du site web
- `logo_url` (TEXT, optionnel) : Nouvelle URL du logo
- `is_active` (BOOLEAN, optionnel) : Nouveau statut actif/inactif

#### Comportement

- Seuls les paramètres non-NULL sont mis à jour
- Validation de l'unicité du nom si fourni
- Vérification de l'existence du magasin
- Mise à jour automatique du timestamp `updated_at`

#### Exemples d'utilisation

```sql
-- Changer juste le nom
SELECT * FROM update_store(
  '550e8400-e29b-41d4-a716-446655440000',
  'Nouveau Nom'
);

-- Désactiver un magasin
SELECT * FROM update_store(
  '550e8400-e29b-41d4-a716-446655440000',
  NULL, NULL, NULL,
  false
);

-- Mise à jour complète
SELECT * FROM update_store(
  '550e8400-e29b-41d4-a716-446655440000',
  'Nom Mis à Jour',
  'https://nouveau-site.com',
  'https://nouveau-site.com/logo.png',
  true
);
```

---

### `get_store_stats(store_uuid)`

Récupère les statistiques détaillées d'un magasin.

#### Signature

```sql
get_store_stats(store_uuid UUID)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  total_games INTEGER,
  average_price DECIMAL(10,2),
  lowest_price DECIMAL(10,2),
  highest_price DECIMAL(10,2),
  last_price_update TIMESTAMP
)
```

#### Paramètres

- `store_uuid` (UUID, requis) : Identifiant du magasin

#### Comportement

- Calcule les statistiques sur tous les prix disponibles du magasin
- Inclut uniquement les prix avec `is_available = TRUE`
- Retourne des NULL si le magasin n'a aucun prix
- `last_price_update` correspond à la mise à jour la plus récente

#### Exemples d'utilisation

```sql
-- Statistiques d'un magasin
SELECT * FROM get_store_stats('550e8400-e29b-41d4-a716-446655440000');

-- Comparer les statistiques de plusieurs magasins
SELECT
  store_name,
  total_games,
  average_price,
  lowest_price,
  highest_price
FROM get_store_stats('steam-id')
UNION ALL
SELECT
  store_name,
  total_games,
  average_price,
  lowest_price,
  highest_price
FROM get_store_stats('epic-id');

-- Magasins avec le plus de jeux
SELECT store_name, total_games
FROM get_store_stats('store-id')
ORDER BY total_games DESC;
```

---

## Fonctions Utilitaires et Maintenance

### `cleanup_orphaned_prices()`

Nettoie les prix orphelins (sans jeu correspondant).

#### Signature

```sql
cleanup_orphaned_prices()
RETURNS INTEGER
```

#### Comportement

- Supprime les prix dont le `game_id` ne correspond à aucun jeu existant
- Retourne le nombre de prix supprimés
- Opération sûre qui préserve l'intégrité référentielle

#### Exemple d'utilisation

```sql
-- Nettoyer les prix orphelins
SELECT cleanup_orphaned_prices() as deleted_count;
```

### `validate_price_data()`

Valide l'intégrité des données de prix dans le système.

#### Signature

```sql
validate_price_data()
RETURNS TABLE (
  table_name TEXT,
  issue_type TEXT,
  issue_count INTEGER,
  sample_ids TEXT[]
)
```

#### Comportement

- Vérifie différents types de problèmes d'intégrité
- Retourne un rapport détaillé avec exemples
- Identifie les prix négatifs, les références cassées, etc.

#### Exemple d'utilisation

```sql
-- Rapport de validation
SELECT * FROM validate_price_data();
```

---

## Permissions et Sécurité

### Permissions par Rôle

#### Utilisateurs Anonymes (`anon`)

```sql
-- Lecture seule des prix et magasins
GRANT EXECUTE ON FUNCTION get_game_prices(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_best_price(UUID) TO anon;
GRANT EXECUTE ON FUNCTION compare_game_prices(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_active_stores() TO anon;
GRANT EXECUTE ON FUNCTION search_stores(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_store_stats(UUID) TO anon;
```

#### Utilisateurs Authentifiés (`authenticated`)

```sql
-- Toutes les permissions des anonymes plus la gestion des magasins
GRANT EXECUTE ON FUNCTION validate_store_data(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_store(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
```

#### Administrateurs

Les fonctions de maintenance sont généralement réservées aux administrateurs via
des politiques RLS spécifiques.

### Sécurité des Fonctions

- Toutes les fonctions sont marquées `SECURITY DEFINER`
- Validation des paramètres d'entrée
- Protection contre l'injection SQL
- Respect des politiques RLS sur les tables sous-jacentes

---

## Optimisation et Performance

### Index Utilisés

Les fonctions tirent parti des index suivants :

```sql
-- Index simples
CREATE INDEX idx_game_prices_game_id ON game_prices(game_id);
CREATE INDEX idx_game_prices_store_id ON game_prices(store_id);
CREATE INDEX idx_game_prices_available ON game_prices(is_available);
CREATE INDEX idx_stores_active ON stores(is_active);

-- Index composites
CREATE INDEX idx_game_prices_game_available ON game_prices(game_id, is_available);
CREATE INDEX idx_game_prices_game_platform ON game_prices(game_id, platform);
```

### Conseils de Performance

1. **Filtrage précoce** : Utilisez les filtres `store_filter` et
   `platform_filter`
2. **Cache des résultats** : Les statistiques changent peu fréquemment
3. **Pagination** : Pour les listes de magasins importantes
4. **Monitoring** : Surveillez les temps de réponse des fonctions

### Métriques de Performance Typiques

- `get_game_prices` : < 50ms pour un jeu avec 10 prix
- `get_best_price` : < 20ms (optimisé avec LIMIT 1)
- `compare_game_prices` : < 100ms (calculs d'agrégation)
- `get_active_stores` : < 30ms (table généralement petite)

---

## Exemples d'Intégration

### Avec TypeScript/Supabase

```typescript
// Récupération typée des prix
const { data: prices, error } = await supabase
  .rpc("get_game_prices", {
    game_uuid: gameId,
    store_filter: "Steam",
  })
  .returns<GamePriceResponse[]>();

// Gestion des erreurs
if (error) {
  console.error("Erreur lors de la récupération des prix:", error);
  return [];
}

return prices || [];
```

### Avec des Requêtes Complexes

```sql
-- Jeux avec les plus grandes différences de prix
SELECT
  g.slug,
  c.best_price,
  c.worst_price,
  c.price_range,
  c.total_stores
FROM games g
JOIN LATERAL compare_game_prices(g.id) c ON true
WHERE c.total_stores > 1
ORDER BY c.price_range DESC
LIMIT 10;
```

Cette référence complète vous permet d'utiliser efficacement toutes les
fonctions du système de prix de jeux. Chaque fonction est optimisée pour des cas
d'usage spécifiques et respecte les bonnes pratiques de sécurité et de
performance.
