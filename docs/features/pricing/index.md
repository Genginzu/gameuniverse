# Index de la Documentation - Système de Prix de Jeux

## 📋 Table des Matières

### 🏠 Point d'Entrée

- **[README_PRICING.md](./README_PRICING.md)** - Vue d'ensemble complète et
  démarrage rapide

### 📚 Documentation Technique

#### 🏗️ Architecture

- **[PRICING_SYSTEM.md](./PRICING_SYSTEM.md)** - Architecture technique
  détaillée
  - Structure des tables de base de données
  - Contraintes et index de performance
  - Sécurité et permissions RLS
  - Stratégie de maintenance et monitoring

#### 👨‍💻 Guide du Développeur

- **[PRICING_API_EXAMPLES.md](./PRICING_API_EXAMPLES.md)** - Exemples pratiques
  d'utilisation
  - Configuration initiale avec Supabase
  - Récupération et comparaison de prix
  - Gestion des magasins
  - Composants React et hooks personnalisés
  - Gestion des erreurs et optimisation des performances
  - Tests d'exemple

#### 🔄 Migration

- **[PRICING_MIGRATION_GUIDE.md](./PRICING_MIGRATION_GUIDE.md)** - Guide complet
  de migration
  - Processus de migration étape par étape
  - Sauvegarde et validation des données
  - Mise à jour du code application
  - Procédures de rollback
  - Vérifications post-migration
  - Maintenance et monitoring

#### 📖 Référence API

- **[DATABASE_FUNCTIONS_REFERENCE.md](./DATABASE_FUNCTIONS_REFERENCE.md)** -
  Référence complète des fonctions
  - Fonctions de récupération de prix
  - Fonctions de gestion des magasins
  - Fonctions utilitaires et maintenance
  - Signatures, paramètres et exemples
  - Permissions et sécurité
  - Optimisation et performance

## 🎯 Navigation par Cas d'Usage

### Je veux comprendre le système

1. Commencer par **[README_PRICING.md](./README_PRICING.md)** pour la vue
   d'ensemble
2. Lire **[PRICING_SYSTEM.md](./PRICING_SYSTEM.md)** pour l'architecture
   technique

### Je veux développer avec l'API

1. Consulter **[PRICING_API_EXAMPLES.md](./PRICING_API_EXAMPLES.md)** pour les
   exemples pratiques
2. Utiliser
   **[DATABASE_FUNCTIONS_REFERENCE.md](./DATABASE_FUNCTIONS_REFERENCE.md)**
   comme référence

### Je veux migrer depuis l'ancien système

1. Suivre **[PRICING_MIGRATION_GUIDE.md](./PRICING_MIGRATION_GUIDE.md)** étape
   par étape
2. Consulter **[PRICING_SYSTEM.md](./PRICING_SYSTEM.md)** pour comprendre la
   nouvelle architecture

### Je cherche une fonction spécifique

1. Aller directement à
   **[DATABASE_FUNCTIONS_REFERENCE.md](./DATABASE_FUNCTIONS_REFERENCE.md)**
2. Utiliser la table des matières pour trouver la fonction

## 🔍 Index des Fonctions

### Récupération de Prix

- `get_game_prices(game_uuid, store_filter?, platform_filter?)` - Tous les prix
  d'un jeu
- `get_best_price(game_uuid)` - Meilleur prix disponible
- `compare_game_prices(game_uuid)` - Statistiques de comparaison

### Gestion des Magasins

- `get_active_stores()` - Liste des magasins actifs
- `search_stores(search_term)` - Recherche de magasins
- `validate_store_data(store_name, website_url?, logo_url?)` - Validation des
  données
- `create_store(store_name, website_url?, logo_url?)` - Création de magasin
- `update_store(store_id, ...)` - Mise à jour de magasin
- `get_store_stats(store_uuid)` - Statistiques d'un magasin

### Maintenance

- `cleanup_orphaned_prices()` - Nettoyage des prix orphelins
- `validate_price_data()` - Validation de l'intégrité des données

## 📊 Index des Types TypeScript

### Types de Base

- `Store` - Type de base pour les magasins
- `GamePrice` - Type de base pour les prix
- `StoreInsert` / `GamePriceInsert` - Types d'insertion
- `StoreUpdate` / `GamePriceUpdate` - Types de mise à jour

### Interfaces Enrichies

- `EnrichedGamePrice` - Prix avec informations de magasin
- `GamePriceResponse` - Réponse des fonctions de prix
- `DetailedPriceComparison` - Comparaison détaillée
- `StoreStats` - Statistiques de magasin

### Types Utilitaires

- `PriceFilters` - Options de filtrage
- `StorePayload` / `GamePricePayload` - Données de création
- `StoreValidationResponse` - Réponse de validation
- `StoreCreationResponse` / `StoreUpdateResponse` - Réponses d'opération

## 🧪 Index des Tests

### Tests de Propriété

- **Property 1**: Store Name Uniqueness - Unicité des noms de magasins
- **Property 2**: Price Non-Negativity - Prix non-négatifs
- **Property 3**: Game-Store-Platform Uniqueness - Unicité des combinaisons
- **Property 4**: Store Reference Integrity - Intégrité référentielle
- **Property 5**: Price Comparison Accuracy - Précision des comparaisons

### Tests d'Intégration

- Tests des fonctions de récupération de prix
- Tests de gestion des magasins
- Tests de migration des données
- Tests de performance

## 🔧 Index des Outils

### Scripts de Développement

```bash
bun run db:types          # Générer les types TypeScript
bun run test:pricing      # Tests spécifiques au pricing
bun run test:coverage     # Tests avec couverture
bun run migrate:pricing   # Migration du système de prix
```

### Fonctions SQL Utilitaires

```sql
-- Santé du système
SELECT * FROM price_system_health;

-- Nettoyage
SELECT cleanup_orphaned_prices();

-- Validation
SELECT * FROM validate_price_data();
```

## 📈 Métriques de Performance

| Fonction              | Temps Typique | Optimisation         |
| --------------------- | ------------- | -------------------- |
| `get_game_prices`     | < 50ms        | Index composites     |
| `get_best_price`      | < 20ms        | LIMIT 1 + index      |
| `compare_game_prices` | < 100ms       | Agrégation optimisée |
| `get_active_stores`   | < 30ms        | Table petite + cache |

## 🔒 Niveaux de Permission

| Rôle            | Fonctions Autorisées                |
| --------------- | ----------------------------------- |
| `anon`          | Consultation des prix et magasins   |
| `authenticated` | Consultation + gestion des magasins |
| `admin`         | Toutes les fonctions + maintenance  |

## 🚀 Roadmap

### Version Actuelle (v1.0)

- ✅ Architecture de base
- ✅ Fonctions de prix
- ✅ Gestion des magasins
- ✅ Migration complète
- ✅ Documentation complète

### Version Suivante (v1.1)

- 🔄 Historique des prix
- 🔄 Alertes de prix
- 🔄 API externe
- 🔄 Interface d'administration

### Version Future (v2.0)

- 📋 Promotions et réductions
- 📋 Wishlist utilisateur
- 📋 Recommandations IA
- 📋 Analytics avancées

---

**💡 Conseil** : Commencez toujours par [README_PRICING.md](./README_PRICING.md)
pour une vue d'ensemble, puis naviguez vers la documentation spécifique selon
vos besoins.
