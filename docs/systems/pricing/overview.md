# Système de Prix de Jeux

Documentation complète du système de prix multi-magasins / multi-plateformes.

## Vue d'ensemble

Le système de prix gère les prix de jeux sur différents magasins (Steam, Epic,
PlayStation Store, Xbox Store, Nintendo eShop, GOG…) et plateformes (PC,
PlayStation, Xbox, Nintendo Switch…) via une architecture relationnelle simple
autour des tables `stores` et `game_prices`.

### Fonctionnalités

- **Multi-magasins / multi-plateformes** — support flexible, ajout d'un nouveau
  magasin sans modification de schéma.
- **Comparaison de prix** — identification automatique du meilleur prix via
  fonctions SQL dédiées.
- **Performance** — requêtes indexées, fonctions de base de données optimisées.
- **Type-safe** — intégration TypeScript complète avec types générés.
- **Tests de propriété** — couverture property-based (fast-check).

## Documentation associée

| Document                                     | Contenu                                      |
| -------------------------------------------- | -------------------------------------------- |
| [api-examples.md](./api-examples.md)         | Exemples TypeScript, hooks React, tests      |
| [migration-guide.md](./migration-guide.md)   | Migration depuis l'ancien schéma             |
| [price-history.md](./price-history.md)       | Historique des prix (feature dédiée)         |

Référence des fonctions DB : [../database-functions.md](../database-functions.md).

## Architecture

### Table `stores`

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

**Contraintes** : nom unique non vide, `website_url` en `http(s)://`, index sur
le nom et le statut actif.

### Table `game_prices`

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

**Contraintes** : prix positif, code devise ISO 4217 en majuscules, unicité
`(game_id, store_id, platform)`, `store_url` en `http(s)://`.

**Index** : `game_id`, `store_id`, `platform`, `is_available`, `price`,
`last_updated`, plus composites `(game_id, is_available)`, `(game_id, platform)`,
`(game_id, store_id, platform)`.

## Fonctions DB principales

### Récupération de prix

| Fonction                                                     | Description                       |
| ------------------------------------------------------------ | --------------------------------- |
| `get_game_prices(game_uuid, store_filter?, platform_filter?)` | Tous les prix disponibles         |
| `get_best_price(game_uuid)`                                  | Prix le plus bas (LIMIT 1)        |
| `compare_game_prices(game_uuid)`                             | Statistiques (min/max/moyenne)    |

### Gestion des magasins

| Fonction                                                    | Description                    |
| ----------------------------------------------------------- | ------------------------------ |
| `get_active_stores()`                                       | Magasins actifs                |
| `search_stores(search_term)`                                | Recherche par nom ou URL       |
| `validate_store_data(name, website_url?, logo_url?)`        | Validation avant création      |
| `create_store(name, website_url?, logo_url?)`               | Création avec validation       |
| `update_store(id, name?, website_url?, logo_url?, active?)` | Mise à jour                    |
| `get_store_stats(store_uuid)`                               | Statistiques d'un magasin      |

### Maintenance

- `cleanup_orphaned_prices()` — supprime les prix orphelins
- `validate_price_data()` — valide l'intégrité

## Types TypeScript

```typescript
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type GamePrice = Database["public"]["Tables"]["game_prices"]["Row"];

export interface EnrichedGamePrice extends GamePrice {
  store: Store;
}

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

export interface DetailedPriceComparison {
  game_id: string;
  prices: GamePriceResponse[];
  best_price?: GamePriceResponse;
  price_range: { min: number; max: number; currency: string };
  store_count: number;
}
```

## Utilisation rapide

```typescript
import { supabase } from "@/lib/supabase";

// Tous les prix d'un jeu
const { data: prices } = await supabase.rpc("get_game_prices", {
  game_uuid: "your-game-id",
});

// Meilleur prix
const { data: bestPrice } = await supabase.rpc("get_best_price", {
  game_uuid: "your-game-id",
});

// Comparaison avec statistiques
const { data: comparison } = await supabase.rpc("compare_game_prices", {
  game_uuid: "your-game-id",
});
```

Composants React et hooks dans [api-examples.md](./api-examples.md).

## Sécurité

Row Level Security :

- **Lecture publique** (`anon`, `authenticated`) — consultation des prix et
  magasins.
- **Écriture authentifiée** — gestion des magasins.
- **Administration** — fonctions de maintenance.

```sql
GRANT EXECUTE ON FUNCTION get_game_prices(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_best_price(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION compare_game_prices(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_store(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
```

## Performance

| Fonction              | Temps typique | Optimisation         |
| --------------------- | ------------- | -------------------- |
| `get_game_prices`     | < 50ms        | Index composites     |
| `get_best_price`      | < 20ms        | LIMIT 1 + index      |
| `compare_game_prices` | < 100ms       | Agrégation optimisée |
| `get_active_stores`   | < 30ms        | Table petite + cache |

## Maintenance

```sql
-- Santé du système
CREATE VIEW price_system_health AS
SELECT
  COUNT(DISTINCT gp.game_id) AS games_with_prices,
  COUNT(gp.id) AS total_prices,
  COUNT(DISTINCT gp.store_id) AS active_stores,
  AVG(gp.price) AS average_price
FROM game_prices gp
JOIN stores s ON gp.store_id = s.id
WHERE gp.is_available = true AND s.is_active = true;

-- Nettoyage
SELECT cleanup_orphaned_prices();

-- Validation
SELECT * FROM validate_price_data();
```

## Tests

Tests property-based (fast-check) couvrant :

- Unicité des noms de magasins
- Prix non-négatifs
- Unicité `(game_id, store_id, platform)`
- Intégrité référentielle
- Précision des comparaisons

```bash
bunx vitest run test/unit/lib/services/pricing
```

## Ajouter un nouveau magasin

```sql
SELECT * FROM create_store(
  'Nouveau Magasin',
  'https://example.com',
  'https://example.com/logo.png'
);
```

## Évolutions

- Historique des prix — voir [price-history.md](./price-history.md)
- Alertes de baisse de prix
- Synchronisation via APIs externes des magasins
- Support des promotions et réductions
