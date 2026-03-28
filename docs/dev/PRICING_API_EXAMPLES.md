# Guide d'Utilisation - API de Prix de Jeux

## Exemples d'Utilisation pour Développeurs

Ce guide présente des exemples pratiques d'utilisation du système de prix de
jeux avec TypeScript et Supabase.

## Configuration Initiale

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  GamePriceResponse,
  DetailedPriceComparison,
  StoreStats,
} from "@/lib/pricing-types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Récupération des Prix

### 1. Obtenir tous les prix d'un jeu

```typescript
async function getAllGamePrices(gameId: string): Promise<GamePriceResponse[]> {
  const { data, error } = await supabase.rpc("get_game_prices", {
    game_uuid: gameId,
  });

  if (error) {
    console.error("Erreur lors de la récupération des prix:", error);
    return [];
  }

  return data || [];
}

// Utilisation
const prices = await getAllGamePrices("550e8400-e29b-41d4-a716-446655440000");
console.log(`${prices.length} prix trouvés pour ce jeu`);
```

### 2. Filtrer les prix par magasin

```typescript
async function getPricesFromStore(
  gameId: string,
  storeName: string
): Promise<GamePriceResponse[]> {
  const { data, error } = await supabase.rpc("get_game_prices", {
    game_uuid: gameId,
    store_filter: storeName,
  });

  if (error) {
    console.error("Erreur lors du filtrage par magasin:", error);
    return [];
  }

  return data || [];
}

// Utilisation
const steamPrices = await getPricesFromStore(gameId, "Steam");
const epicPrices = await getPricesFromStore(gameId, "Epic Games");
```

### 3. Filtrer les prix par plateforme

```typescript
async function getPricesForPlatform(
  gameId: string,
  platform: string
): Promise<GamePriceResponse[]> {
  const { data, error } = await supabase.rpc("get_game_prices", {
    game_uuid: gameId,
    platform_filter: platform,
  });

  if (error) {
    console.error("Erreur lors du filtrage par plateforme:", error);
    return [];
  }

  return data || [];
}

// Utilisation
const pcPrices = await getPricesForPlatform(gameId, "PC");
const consolePrices = await getPricesForPlatform(gameId, "PlayStation");
```

### 4. Obtenir le meilleur prix

```typescript
async function getBestPrice(gameId: string): Promise<GamePriceResponse | null> {
  const { data, error } = await supabase.rpc("get_best_price", {
    game_uuid: gameId,
  });

  if (error) {
    console.error("Erreur lors de la récupération du meilleur prix:", error);
    return null;
  }

  return data?.[0] || null;
}

// Utilisation
const bestPrice = await getBestPrice(gameId);
if (bestPrice) {
  console.log(`Meilleur prix: ${bestPrice.price}€ sur ${bestPrice.store_name}`);
}
```

## Comparaison de Prix

### 1. Comparaison complète avec statistiques

```typescript
async function compareGamePrices(gameId: string) {
  const { data, error } = await supabase.rpc("compare_game_prices", {
    game_uuid: gameId,
  });

  if (error) {
    console.error("Erreur lors de la comparaison:", error);
    return null;
  }

  const comparison = data?.[0];
  if (!comparison) return null;

  return {
    gameId: comparison.game_id,
    totalStores: comparison.total_stores,
    bestPrice: comparison.best_price,
    worstPrice: comparison.worst_price,
    averagePrice: comparison.average_price,
    currency: comparison.currency,
    priceRange: comparison.price_range,
    storesWithPrices: comparison.stores_with_prices,
  };
}

// Utilisation
const comparison = await compareGamePrices(gameId);
if (comparison) {
  console.log(`Prix disponible sur ${comparison.totalStores} magasins`);
  console.log(`Écart de prix: ${comparison.priceRange}€`);
  console.log(`Prix moyen: ${comparison.averagePrice}€`);
}
```

### 2. Comparaison détaillée pour affichage

```typescript
async function getDetailedPriceComparison(
  gameId: string
): Promise<DetailedPriceComparison | null> {
  // Récupérer tous les prix
  const prices = await getAllGamePrices(gameId);

  if (prices.length === 0) return null;

  // Trouver le meilleur prix
  const bestPrice = prices.reduce((best, current) =>
    current.price < best.price ? current : best
  );

  // Calculer les statistiques
  const priceValues = prices.map((p) => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  return {
    game_id: gameId,
    prices,
    best_price: bestPrice,
    price_range: {
      min: minPrice,
      max: maxPrice,
      currency: prices[0].currency,
    },
    store_count: prices.length,
  };
}

// Utilisation
const detailedComparison = await getDetailedPriceComparison(gameId);
if (detailedComparison) {
  console.log("Comparaison détaillée:");
  detailedComparison.prices.forEach((price) => {
    console.log(`${price.store_name}: ${price.price}€ (${price.platform})`);
  });
}
```

## Gestion des Magasins

### 1. Récupérer tous les magasins actifs

```typescript
async function getActiveStores() {
  const { data, error } = await supabase.rpc("get_active_stores");

  if (error) {
    console.error("Erreur lors de la récupération des magasins:", error);
    return [];
  }

  return data || [];
}

// Utilisation
const stores = await getActiveStores();
console.log(`${stores.length} magasins actifs`);
```

### 2. Rechercher des magasins

```typescript
async function searchStores(searchTerm: string) {
  const { data, error } = await supabase.rpc("search_stores", {
    search_term: searchTerm,
  });

  if (error) {
    console.error("Erreur lors de la recherche:", error);
    return [];
  }

  return data || [];
}

// Utilisation
const steamStores = await searchStores("Steam");
const epicStores = await searchStores("Epic");
```

### 3. Créer un nouveau magasin

```typescript
async function createNewStore(
  name: string,
  websiteUrl?: string,
  logoUrl?: string
) {
  const { data, error } = await supabase.rpc("create_store", {
    store_name: name,
    website_url: websiteUrl,
    logo_url: logoUrl,
  });

  if (error) {
    console.error("Erreur lors de la création:", error);
    return null;
  }

  const result = data?.[0];
  if (result?.success) {
    console.log(`Magasin créé avec succès: ${result.store_id}`);
    return result.store_id;
  } else {
    console.error(`Échec de création: ${result?.message}`);
    return null;
  }
}

// Utilisation
const newStoreId = await createNewStore(
  "GOG",
  "https://www.gog.com",
  "https://www.gog.com/logo.png"
);
```

### 4. Obtenir les statistiques d'un magasin

```typescript
async function getStoreStatistics(storeId: string): Promise<StoreStats | null> {
  const { data, error } = await supabase.rpc("get_store_stats", {
    store_uuid: storeId,
  });

  if (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return null;
  }

  return data?.[0] || null;
}

// Utilisation
const stats = await getStoreStatistics(storeId);
if (stats) {
  console.log(`${stats.store_name}:`);
  console.log(`- ${stats.total_games} jeux`);
  console.log(`- Prix moyen: ${stats.average_price}€`);
  console.log(`- Écart: ${stats.lowest_price}€ - ${stats.highest_price}€`);
}
```

## Composants React d'Exemple

### 1. Composant de comparaison de prix

```typescript
import React, { useEffect, useState } from 'react';
import type { GamePriceResponse } from '@/lib/pricing-types';

interface PriceComparisonProps {
  gameId: string;
}

export function PriceComparison({ gameId }: PriceComparisonProps) {
  const [prices, setPrices] = useState<GamePriceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      const gamePrices = await getAllGamePrices(gameId);
      setPrices(gamePrices);
      setLoading(false);
    }

    loadPrices();
  }, [gameId]);

  if (loading) return <div>Chargement des prix...</div>;

  if (prices.length === 0) {
    return <div>Aucun prix disponible pour ce jeu.</div>;
  }

  const bestPrice = prices[0]; // Déjà trié par prix croissant

  return (
    <div className="price-comparison">
      <h3>Comparaison de Prix</h3>

      <div className="best-price">
        <h4>Meilleur Prix</h4>
        <div className="price-card highlight">
          <span className="store">{bestPrice.store_name}</span>
          <span className="price">{bestPrice.price}€</span>
          <span className="platform">{bestPrice.platform}</span>
          {bestPrice.store_url && (
            <a href={bestPrice.store_url} target="_blank" rel="noopener">
              Acheter
            </a>
          )}
        </div>
      </div>

      <div className="all-prices">
        <h4>Tous les Prix</h4>
        {prices.map((price) => (
          <div key={price.id} className="price-card">
            <span className="store">{price.store_name}</span>
            <span className="price">{price.price}€</span>
            <span className="platform">{price.platform}</span>
            <span className="updated">
              Mis à jour: {new Date(price.last_updated).toLocaleDateString()}
            </span>
            {price.store_url && (
              <a href={price.store_url} target="_blank" rel="noopener">
                Voir
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Hook personnalisé pour les prix

```typescript
import { useState, useEffect } from 'react';
import type { GamePriceResponse } from '@/lib/pricing-types';

export function useGamePrices(gameId: string) {
  const [prices, setPrices] = useState<GamePriceResponse[]>([]);
  const [bestPrice, setBestPrice] = useState<GamePriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        setError(null);

        const [allPrices, best] = await Promise.all([
          getAllGamePrices(gameId),
          getBestPrice(gameId)
        ]);

        setPrices(allPrices);
        setBestPrice(best);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    if (gameId) {
      fetchPrices();
    }
  }, [gameId]);

  return {
    prices,
    bestPrice,
    loading,
    error,
    priceCount: prices.length,
    hasMultiplePrices: prices.length > 1
  };
}

// Utilisation du hook
function GamePriceDisplay({ gameId }: { gameId: string }) {
  const { prices, bestPrice, loading, error, hasMultiplePrices } = useGamePrices(gameId);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!bestPrice) return <div>Aucun prix disponible</div>;

  return (
    <div>
      <div>Meilleur prix: {bestPrice.price}€ sur {bestPrice.store_name}</div>
      {hasMultiplePrices && (
        <div>Disponible sur {prices.length} magasins</div>
      )}
    </div>
  );
}
```

## Gestion des Erreurs

### 1. Wrapper avec gestion d'erreur

```typescript
async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error("Erreur API:", error);
    return fallbackValue;
  }
}

// Utilisation
const prices = await safeApiCall(() => getAllGamePrices(gameId), []);
```

### 2. Validation des données

```typescript
function validateGamePrice(price: any): price is GamePriceResponse {
  return (
    typeof price === "object" &&
    typeof price.id === "string" &&
    typeof price.game_id === "string" &&
    typeof price.store_id === "string" &&
    typeof price.price === "number" &&
    price.price >= 0 &&
    typeof price.currency === "string" &&
    typeof price.platform === "string" &&
    typeof price.store_name === "string"
  );
}

async function getSafeGamePrices(gameId: string): Promise<GamePriceResponse[]> {
  const prices = await getAllGamePrices(gameId);
  return prices.filter(validateGamePrice);
}
```

## Optimisation des Performances

### 1. Cache des prix

```typescript
class PriceCache {
  private cache = new Map<
    string,
    { data: GamePriceResponse[]; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getGamePrices(gameId: string): Promise<GamePriceResponse[]> {
    const cached = this.cache.get(gameId);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const prices = await getAllGamePrices(gameId);
    this.cache.set(gameId, { data: prices, timestamp: now });
    return prices;
  }

  clearCache() {
    this.cache.clear();
  }
}

const priceCache = new PriceCache();
```

### 2. Requêtes en lot

```typescript
async function getMultipleGamePrices(
  gameIds: string[]
): Promise<Map<string, GamePriceResponse[]>> {
  const results = new Map<string, GamePriceResponse[]>();

  // Traiter par lots de 10 pour éviter la surcharge
  const batchSize = 10;
  for (let i = 0; i < gameIds.length; i += batchSize) {
    const batch = gameIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (gameId) => {
      const prices = await getAllGamePrices(gameId);
      return { gameId, prices };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ gameId, prices }) => {
      results.set(gameId, prices);
    });
  }

  return results;
}
```

## Tests d'Exemple

### 1. Test unitaire

```typescript
import { describe, it, expect, mock } from "bun:test";

describe("Price API Functions", () => {
  it("should return empty array when no prices found", async () => {
    // Mock Supabase response
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

    const prices = await getAllGamePrices("non-existent-game");
    expect(prices).toEqual([]);
  });

  it("should handle API errors gracefully", async () => {
    // Mock error response
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error("Database error"),
    });

    const prices = await getAllGamePrices("game-id");
    expect(prices).toEqual([]);
  });
});
```

### 2. Test d'intégration

```typescript
describe("Price Comparison Integration", () => {
  it("should compare prices correctly", async () => {
    const gameId = "test-game-id";
    const comparison = await getDetailedPriceComparison(gameId);

    expect(comparison).toBeDefined();
    expect(comparison?.prices.length).toBeGreaterThan(0);
    expect(comparison?.best_price).toBeDefined();
    expect(comparison?.price_range.min).toBeLessThanOrEqual(
      comparison?.price_range.max
    );
  });
});
```

Ce guide fournit une base solide pour utiliser le système de prix de jeux dans
vos applications. Adaptez les exemples selon vos besoins spécifiques et
n'hésitez pas à étendre les fonctionnalités selon vos cas d'usage.
