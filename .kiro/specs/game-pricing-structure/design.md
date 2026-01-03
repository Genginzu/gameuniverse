# Design Document - Structure des Prix de Jeux

## Overview

Cette conception transforme la structure simpliste des prix actuels (champs
directs dans la table `games`) en un système simple et efficace capable de gérer
les prix de jeux sur différents magasins en ligne. Le nouveau système supportera
multiple magasins, plateformes, et permettra une comparaison facile des prix.

## Architecture

### Approche Relationnelle Simple

La nouvelle architecture sépare les préoccupations en deux tables principales :

- **Stores** : Gestion des magasins en ligne (Steam, Epic Games, etc.)
- **Game_Prices** : Prix actuels avec informations de magasin et plateforme

### Avantages de cette Approche

1. **Simplicité** : Structure facile à comprendre et maintenir
2. **Flexibilité** : Support de nouveaux magasins sans modification de schéma
3. **Performance** : Optimisé pour les requêtes de comparaison de prix
4. **Intégrité** : Contraintes relationnelles garantissent la cohérence
5. **Évolutivité** : Architecture capable de gérer de nombreux prix

## Components and Interfaces

### 1. Table Stores

```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Exemples de magasins :**

- Steam, Epic Games Store, GOG (PC)
- PlayStation Store, Xbox Store (Console)
- Nintendo eShop (Nintendo)

### 2. Table Game_Prices

```sql
CREATE TABLE game_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,

  -- Informations de prix
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

  -- Informations de plateforme et disponibilité
  platform VARCHAR(50) NOT NULL, -- PC, PlayStation, Xbox, Nintendo Switch, etc.
  store_url TEXT, -- URL directe vers la page du jeu sur ce magasin
  is_available BOOLEAN DEFAULT TRUE,

  -- Métadonnées
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Contraintes
  UNIQUE(game_id, store_id, platform),
  CHECK (price >= 0)
);
```

## Data Models

### TypeScript Interfaces

```typescript
interface Store {
  id: string;
  name: string;
  website_url?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

interface GamePrice {
  id: string;
  game_id: string;
  store_id: string;
  price: number;
  currency: string;
  platform: string;
  store_url?: string;
  is_available: boolean;
  last_updated: string;
  created_at: string;

  // Relations populées
  store?: Store;
}

interface GamePriceComparison {
  game_id: string;
  prices: GamePrice[];
  best_price?: GamePrice;
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system-essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Store Name Uniqueness

_For any_ two stores in the system, their names should be different, ensuring no
duplicate store entries. **Validates: Requirements 1.2**

### Property 2: Price Non-Negativity

_For any_ game price entry, the price should be greater than or equal to zero,
ensuring valid pricing data. **Validates: Requirements 2.1**

### Property 3: Game-Store-Platform Uniqueness

_For any_ game, there should be at most one price entry per store-platform
combination, ensuring no duplicate price entries. **Validates: Requirements
2.3**

### Property 4: Store Reference Integrity

_For any_ game price entry, the referenced store should exist and be active,
ensuring data consistency. **Validates: Requirements 1.4, 2.2**

### Property 5: Price Comparison Accuracy

_For any_ set of prices for the same game, the price comparison should correctly
identify the lowest price, ensuring accurate best offer detection. **Validates:
Requirements 4.2**

## Error Handling

### Price Data Validation

- Validate currency codes against common standards (EUR, USD, GBP, etc.)
- Ensure prices are non-negative
- Check store-platform compatibility
- Validate URL formats for store_url fields

### Migration Error Handling

- Rollback capability for failed migrations
- Data validation before and after migration
- Backup of original price data
- Detailed logging of migration process

### API Error Responses

- Structured error responses with error codes
- Graceful degradation when price data is unavailable
- Timeout handling for external price sources
- Rate limiting for price update operations

## Testing Strategy

### Unit Tests

- Test price retrieval logic with various filters
- Validate store creation and uniqueness constraints
- Test price comparison across different stores
- Verify data migration accuracy

### Property-Based Tests

- Generate random price data and verify consistency properties
- Test store name uniqueness across random store data
- Validate price comparison accuracy with various price sets
- Test currency and platform validation with random inputs

### Integration Tests

- Test complete price retrieval workflows
- Verify price comparison across multiple stores
- Test store management operations
- Validate migration process with sample data

### Performance Tests

- Benchmark price queries for single games
- Test bulk price retrieval performance
- Measure price comparison response times
- Validate indexing effectiveness

## Migration Strategy

### Phase 1: Schema Creation

1. Create stores table with initial data
2. Create game_prices table with proper constraints and indexes
3. Set up foreign key relationships

### Phase 2: Data Migration

1. Create default store entries (Generic, Steam, Epic Games, etc.)
2. Migrate existing price data to new structure
3. Preserve existing currency information
4. Validate data integrity

### Phase 3: Cleanup

1. Verify data integrity in new structure
2. Update application code to use new price system
3. Remove old price columns from games table
4. Update database types and API interfaces

### Migration Script Example

```sql
-- Créer les magasins par défaut
INSERT INTO stores (name, website_url, is_active) VALUES
('Steam', 'https://store.steampowered.com', true),
('Epic Games Store', 'https://store.epicgames.com', true),
('PlayStation Store', 'https://store.playstation.com', true),
('Xbox Store', 'https://www.microsoft.com/store', true),
('Nintendo eShop', 'https://www.nintendo.com/store', true),
('GOG', 'https://www.gog.com', true);

-- Migrer les prix existants
INSERT INTO game_prices (game_id, store_id, price, currency, platform, is_available)
SELECT
  g.id,
  (SELECT id FROM stores WHERE name = 'Steam' LIMIT 1),
  COALESCE(g.current_price, g.launch_price, 0),
  COALESCE(g.currency, 'EUR'),
  'PC',
  true
FROM games g
WHERE g.launch_price IS NOT NULL OR g.current_price IS NOT NULL;
```
