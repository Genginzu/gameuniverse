# Système de Prix de Jeux - Documentation Complète

## 🎯 Vue d'ensemble

Le système de prix de jeux a été entièrement restructuré pour passer d'une
approche simpliste (prix directs dans la table `games`) à une architecture
flexible et performante capable de gérer les prix sur différents magasins et
plateformes.

### ✨ Fonctionnalités Principales

- **Multi-magasins** : Support de Steam, Epic Games Store, PlayStation Store,
  Xbox Store, Nintendo eShop, GOG, etc.
- **Multi-plateformes** : PC, PlayStation, Xbox, Nintendo Switch et plus
- **Comparaison de prix** : Identification automatique du meilleur prix
- **Performance optimisée** : Requêtes indexées et fonctions de base de données
  efficaces
- **API type-safe** : Intégration TypeScript complète avec types générés
- **Tests de propriété** : Couverture de test complète avec propriétés de
  correction

## 📚 Documentation Disponible

### 🏗️ Architecture et Technique

**[PRICING_SYSTEM.md](./PRICING_SYSTEM.md)**

- Vue d'ensemble de l'architecture
- Structure des tables de base de données
- Contraintes et index de performance
- Sécurité et permissions RLS
- Stratégie de maintenance

### 👨‍💻 Guide du Développeur

**[PRICING_API_EXAMPLES.md](./PRICING_API_EXAMPLES.md)**

- Exemples d'utilisation avec TypeScript
- Composants React prêts à l'emploi
- Hooks personnalisés
- Gestion des erreurs et optimisation
- Tests d'exemple

### 🔄 Migration

**[PRICING_MIGRATION_GUIDE.md](./PRICING_MIGRATION_GUIDE.md)**

- Processus de migration étape par étape
- Sauvegarde et validation des données
- Mise à jour du code application
- Procédures de rollback
- Vérifications post-migration

### 📖 Référence API

**[DATABASE_FUNCTIONS_REFERENCE.md](./DATABASE_FUNCTIONS_REFERENCE.md)**

- Référence complète de toutes les fonctions
- Signatures, paramètres et exemples
- Cas d'usage et bonnes pratiques
- Permissions et sécurité
- Métriques de performance

## 🚀 Démarrage Rapide

### 1. Installation et Configuration

```bash
# Installer les dépendances
bun install

# Générer les types TypeScript depuis la base de données
bun run db:types

# Vérifier la configuration
bun run test:pricing
```

### 2. Utilisation de Base

```typescript
import { supabase } from "@/lib/supabase";
import type { GamePriceResponse } from "@/lib/pricing-types";

// Récupérer tous les prix d'un jeu
const { data: prices } = await supabase.rpc("get_game_prices", {
  game_uuid: "your-game-id",
});

// Obtenir le meilleur prix
const { data: bestPrice } = await supabase.rpc("get_best_price", {
  game_uuid: "your-game-id",
});

// Comparer les prix avec statistiques
const { data: comparison } = await supabase.rpc("compare_game_prices", {
  game_uuid: "your-game-id",
});
```

### 3. Composant React d'Exemple

```typescript
import { useGamePrices } from '@/hooks/useGamePrices';

function GamePriceDisplay({ gameId }: { gameId: string }) {
  const { prices, bestPrice, loading, error } = useGamePrices(gameId);

  if (loading) return <div>Chargement des prix...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!bestPrice) return <div>Aucun prix disponible</div>;

  return (
    <div className="price-display">
      <div className="best-price">
        <h3>Meilleur Prix</h3>
        <div className="price-card">
          <span className="price">{bestPrice.price}€</span>
          <span className="store">{bestPrice.store_name}</span>
          <a href={bestPrice.store_url} target="_blank">
            Acheter
          </a>
        </div>
      </div>

      {prices.length > 1 && (
        <div className="all-prices">
          <h4>Autres Prix ({prices.length - 1})</h4>
          {prices.slice(1).map(price => (
            <div key={price.id} className="price-card">
              <span className="price">{price.price}€</span>
              <span className="store">{price.store_name}</span>
              <span className="platform">{price.platform}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🏛️ Architecture du Système

### Tables Principales

```sql
-- Magasins en ligne
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Prix des jeux
CREATE TABLE game_prices (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  store_id UUID REFERENCES stores(id),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  platform VARCHAR(50) NOT NULL,
  store_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### Fonctions Principales

| Fonction                | Description                     | Usage                  |
| ----------------------- | ------------------------------- | ---------------------- |
| `get_game_prices()`     | Récupère tous les prix d'un jeu | Comparaison complète   |
| `get_best_price()`      | Trouve le meilleur prix         | Recommandation d'achat |
| `compare_game_prices()` | Statistiques de prix            | Analyse de marché      |
| `get_active_stores()`   | Liste des magasins actifs       | Configuration          |
| `create_store()`        | Ajouter un nouveau magasin      | Administration         |

## 🔧 Types TypeScript

### Types de Base

```typescript
// Types générés automatiquement
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type GamePrice = Database["public"]["Tables"]["game_prices"]["Row"];

// Interfaces enrichies
export interface GamePriceResponse {
  id: string;
  game_id: string;
  store_id: string;
  price: number;
  currency: string;
  platform: string;
  store_name: string;
  store_website_url: string | null;
  store_logo_url: string | null;
  // ... autres champs
}

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

## 🧪 Tests et Qualité

### Tests de Propriété

Le système utilise des tests de propriété pour garantir la correction :

```typescript
// Propriété 1: Unicité des noms de magasins
test("Store names should be unique", () => {
  fc.assert(
    fc.property(fc.array(fc.record({ name: fc.string() })), (stores) => {
      const names = stores.map((s) => s.name);
      const uniqueNames = new Set(names);
      return names.length === uniqueNames.size;
    })
  );
});

// Propriété 2: Prix non-négatifs
test("All prices should be non-negative", () => {
  fc.assert(
    fc.property(fc.float({ min: 0, max: 1000 }), (price) => price >= 0)
  );
});
```

### Tests d'Intégration

```bash
# Exécuter tous les tests
bun run test

# Tests spécifiques au pricing
bun run test:pricing

# Tests avec couverture
bun run test:coverage
```

## 📊 Performance et Monitoring

### Métriques Typiques

- `get_game_prices` : < 50ms pour 10 prix
- `get_best_price` : < 20ms (optimisé)
- `compare_game_prices` : < 100ms
- `get_active_stores` : < 30ms

### Index de Performance

```sql
-- Index simples
CREATE INDEX idx_game_prices_game_id ON game_prices(game_id);
CREATE INDEX idx_game_prices_store_id ON game_prices(store_id);
CREATE INDEX idx_game_prices_available ON game_prices(is_available);

-- Index composites
CREATE INDEX idx_game_prices_game_available ON game_prices(game_id, is_available);
CREATE INDEX idx_game_prices_game_platform ON game_prices(game_id, platform);
```

## 🔒 Sécurité

### Row Level Security (RLS)

- **Lecture publique** : Tous peuvent consulter les prix
- **Écriture authentifiée** : Seuls les utilisateurs connectés peuvent modifier
- **Administration** : Fonctions sensibles réservées aux admins

### Permissions des Fonctions

```sql
-- Consultation publique
GRANT EXECUTE ON FUNCTION get_game_prices(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_best_price(UUID) TO anon, authenticated;

-- Gestion réservée
GRANT EXECUTE ON FUNCTION create_store(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_store(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
```

## 🛠️ Maintenance

### Nettoyage Automatique

```sql
-- Nettoyer les prix orphelins
SELECT cleanup_orphaned_prices();

-- Valider l'intégrité des données
SELECT * FROM validate_price_data();
```

### Monitoring de Santé

```sql
-- Vue de santé du système
CREATE VIEW price_system_health AS
SELECT
  COUNT(DISTINCT gp.game_id) as games_with_prices,
  COUNT(gp.id) as total_prices,
  COUNT(DISTINCT gp.store_id) as active_stores,
  AVG(gp.price) as average_price
FROM game_prices gp
JOIN stores s ON gp.store_id = s.id
WHERE gp.is_available = true AND s.is_active = true;
```

## 🚀 Évolution Future

### Fonctionnalités Prévues

- **Historique des prix** : Suivi des variations dans le temps
- **Alertes de prix** : Notifications de baisse de prix
- **API externe** : Intégration avec les APIs des magasins
- **Promotions** : Support des réductions et offres spéciales
- **Wishlist** : Suivi des prix pour les jeux souhaités

### Extensibilité

- Support facile de nouveaux magasins
- Ajout de métadonnées supplémentaires
- Intégration d'APIs externes
- Support de nouvelles plateformes

## 🤝 Contribution

### Ajouter un Nouveau Magasin

```sql
-- Via fonction SQL
SELECT * FROM create_store(
  'Nouveau Magasin',
  'https://example.com',
  'https://example.com/logo.png'
);
```

### Ajouter des Prix

```typescript
// Via API TypeScript
const { data, error } = await supabase.from("game_prices").insert({
  game_id: "game-uuid",
  store_id: "store-uuid",
  price: 29.99,
  currency: "EUR",
  platform: "PC",
  store_url: "https://store.com/game",
});
```

## 📞 Support

### Problèmes Courants

1. **Prix manquants** : Vérifier que le magasin est actif
2. **Erreurs de type** : Régénérer les types avec `bun run db:types`
3. **Performance lente** : Vérifier les index de base de données
4. **Données incohérentes** : Exécuter `validate_price_data()`

### Ressources

- [Issues GitHub](https://github.com/your-repo/issues)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide TypeScript](https://www.typescriptlang.org/docs/)

---

**📝 Note** : Cette documentation est maintenue à jour avec chaque version. Pour
des questions spécifiques, consultez les fichiers de documentation détaillés ou
ouvrez une issue sur GitHub.
