# Documentation Technique - Système de Prix de Jeux

## Vue d'ensemble

Le système de prix de jeux a été restructuré pour passer d'une approche
simpliste (prix directs dans la table `games`) à un système flexible et
performant capable de gérer les prix sur différents magasins et plateformes.

## Architecture

### Principe de conception

Le nouveau système sépare les préoccupations en utilisant une architecture
relationnelle simple :

- **Stores** : Gestion centralisée des magasins en ligne
- **Game_Prices** : Prix actuels avec informations détaillées de magasin et
  plateforme
- **Fonctions utilitaires** : API de base de données pour requêtes optimisées

### Avantages de cette approche

1. **Simplicité** : Structure facile à comprendre et maintenir
2. **Flexibilité** : Support de nouveaux magasins sans modification de schéma
3. **Performance** : Optimisé pour les requêtes de comparaison de prix
4. **Intégrité** : Contraintes relationnelles garantissent la cohérence
5. **Évolutivité** : Architecture capable de gérer de nombreux prix

## Structure des Tables

### Table `stores`

Gère les informations des magasins en ligne où acheter des jeux.

```sql
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Champs :**

- `id` : Identifiant unique du magasin
- `name` : Nom unique du magasin (ex: "Steam", "Epic Games Store")
- `website_url` : URL du site web du magasin
- `logo_url` : URL du logo du magasin
- `is_active` : Indique si le magasin est actif
- `created_at` / `updated_at` : Horodatage de création et modification

**Contraintes :**

- Nom unique et non vide
- URL du site web doit commencer par http:// ou https://
- Index sur le nom et le statut actif pour les performances

### Table `game_prices`

Stocke les prix des jeux sur différents magasins et plateformes.

```sql
CREATE TABLE public.game_prices (
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

**Champs :**

- `id` : Identifiant unique du prix
- `game_id` : Référence vers le jeu
- `store_id` : Référence vers le magasin
- `price` : Prix du jeu (doit être positif)
- `currency` : Code devise ISO 4217 (3 lettres majuscules)
- `platform` : Plateforme de jeu (PC, PlayStation, Xbox, etc.)
- `store_url` : URL directe vers la page du jeu sur ce magasin
- `is_available` : Indique si le jeu est disponible à l'achat
- `last_updated` : Dernière mise à jour du prix ou de la disponibilité

**Contraintes :**

- Prix positif obligatoire
- Code devise de 3 lettres en majuscules
- Unicité par combinaison jeu/magasin/plateforme
- Plateforme non vide
- URL du magasin doit commencer par http:// ou https://

**Index de performance :**

- Index simples : `game_id`, `store_id`, `platform`, `is_available`, `price`,
  `last_updated`
- Index composites : `(game_id, is_available)`, `(game_id, platform)`,
  `(game_id, store_id, platform)`

## Fonctions de Base de Données

### Fonctions de récupération de prix

#### `get_game_prices(game_uuid, store_filter?, platform_filter?)`

Récupère tous les prix disponibles pour un jeu avec filtres optionnels.

```sql
SELECT * FROM get_game_prices(
  'game-uuid-here',
  'Steam',      -- Filtre optionnel par magasin
  'PC'          -- Filtre optionnel par plateforme
);
```

**Retourne :**

- Informations complètes du prix avec détails du magasin
- Trié par prix croissant puis par nom de magasin
- Seulement les prix disponibles et magasins actifs

#### `get_best_price(game_uuid)`

Récupère le meilleur prix disponible pour un jeu.

```sql
SELECT * FROM get_best_price('game-uuid-here');
```

**Retourne :**

- Le prix le plus bas disponible
- Informations complètes du magasin
- Un seul résultat (LIMIT 1)

#### `compare_game_prices(game_uuid)`

Compare tous les prix disponibles pour un jeu et retourne des statistiques.

```sql
SELECT * FROM compare_game_prices('game-uuid-here');
```

**Retourne :**

- Statistiques complètes : meilleur prix, pire prix, prix moyen
- Nombre de magasins avec prix
- Écart de prix (différence max-min)
- Détails JSON de tous les magasins avec prix

### Fonctions de gestion des magasins

#### `get_active_stores()`

Récupère tous les magasins actifs.

```sql
SELECT * FROM get_active_stores();
```

#### `search_stores(search_term)`

Recherche des magasins par nom ou URL.

```sql
SELECT * FROM search_stores('Steam');
```

#### `validate_store_data(store_name, website_url?, logo_url?)`

Valide les données d'un magasin avant création/modification.

```sql
SELECT * FROM validate_store_data('Nouveau Magasin', 'https://example.com');
```

#### `create_store(store_name, website_url?, logo_url?)`

Crée un nouveau magasin avec validation.

```sql
SELECT * FROM create_store('Nouveau Magasin', 'https://example.com', 'https://example.com/logo.png');
```

#### `update_store(store_id, store_name?, website_url?, logo_url?, is_active?)`

Met à jour un magasin existant.

```sql
SELECT * FROM update_store(
  'store-uuid-here',
  'Nouveau Nom',
  'https://newurl.com',
  NULL,
  TRUE
);
```

#### `get_store_stats(store_uuid)`

Récupère les statistiques d'un magasin.

```sql
SELECT * FROM get_store_stats('store-uuid-here');
```

## Types TypeScript

Le système utilise des types TypeScript générés automatiquement et des
interfaces personnalisées pour une meilleure expérience développeur.

### Types de base

```typescript
// Types générés automatiquement depuis la base de données
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type GamePrice = Database["public"]["Tables"]["game_prices"]["Row"];
export type StoreInsert = Database["public"]["Tables"]["stores"]["Insert"];
export type GamePriceInsert =
  Database["public"]["Tables"]["game_prices"]["Insert"];
```

### Interfaces enrichies

```typescript
// Prix de jeu avec informations de magasin populées
export interface EnrichedGamePrice extends GamePrice {
  store: Store;
}

// Réponse des fonctions de prix avec informations aplaties
export interface GamePriceResponse {
  id: string;
  game_id: string;
  store_id: string;
  price: number;
  currency: string;
  platform: string;
  store_url: string | null;
  is_available: boolean;
  last_updated: string;
  created_at: string;
  store_name: string;
  store_website_url: string | null;
  store_logo_url: string | null;
}

// Comparaison détaillée de prix
export interface DetailedPriceComparison {
  game_id: string;
  prices: GamePriceResponse[];
  best_price?: GamePriceResponse;
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  store_count: number;
}
```

## Sécurité et Permissions

### Row Level Security (RLS)

- **Lecture publique** : Tous les utilisateurs peuvent lire les prix et magasins
- **Écriture authentifiée** : Seuls les utilisateurs authentifiés peuvent
  modifier
- **Administration** : Fonctions d'administration réservées aux administrateurs

### Permissions des fonctions

```sql
-- Lecture publique pour les fonctions de consultation
GRANT EXECUTE ON FUNCTION get_game_prices(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_best_price(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION compare_game_prices(UUID) TO anon, authenticated;

-- Gestion réservée aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_store(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
```

## Performance et Optimisation

### Index stratégiques

Le système utilise des index optimisés pour les requêtes courantes :

1. **Index simples** : Champs fréquemment filtrés
2. **Index composites** : Combinaisons de champs pour requêtes complexes
3. **Index de tri** : Optimisation des ORDER BY

### Requêtes optimisées

- Jointures efficaces entre `game_prices` et `stores`
- Filtrage précoce sur `is_available` et `is_active`
- Tri optimisé par prix puis nom de magasin

### Triggers automatiques

- Mise à jour automatique de `updated_at`
- Mise à jour de `last_updated` lors de changements de prix
- Validation automatique des contraintes

## Migration des Données

### Processus de migration

1. **Création du schéma** : Tables et contraintes
2. **Migration des données** : Préservation des prix existants
3. **Nettoyage** : Suppression de l'ancien schéma

### Données migrées

- `launch_price` et `current_price` → `game_prices`
- `currency` → préservé dans `game_prices`
- Attribution à un magasin par défaut (Steam)
- Validation de l'intégrité des données

## Maintenance et Monitoring

### Fonctions de validation

```sql
-- Validation des données de prix
SELECT * FROM validate_price_data();

-- Nettoyage des données orphelines
SELECT cleanup_orphaned_prices();
```

### Monitoring des performances

- Surveillance des temps de réponse des requêtes
- Monitoring de l'utilisation des index
- Alertes sur les données incohérentes

## Évolution Future

### Extensibilité

- Support facile de nouveaux magasins
- Ajout de métadonnées supplémentaires
- Intégration d'APIs externes pour mise à jour automatique

### Améliorations possibles

- Historique des prix
- Alertes de baisse de prix
- Comparaison de prix en temps réel
- Support de promotions et réductions
