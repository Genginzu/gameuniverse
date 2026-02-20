# Historique de Prix

## Description

Système de suivi automatique des variations de prix des jeux via des triggers
PostgreSQL. Chaque modification de prix dans `game_prices` génère un snapshot
horodaté dans `game_price_history`. L'évolution des prix est visualisable sous
forme de graphique Recharts sur la page de détail d'un jeu.

### Fonctionnalités

- Capture automatique des changements de prix via trigger PostgreSQL
- Graphique en courbe (Recharts LineChart) avec une ligne par magasin
- Statistiques agrégées : prix minimum, maximum et moyen
- Indicateurs visuels : « prix au plus bas » et « en dessous de la moyenne »
- Filtrage par période (1m, 3m, 6m, 1y, tout) et par magasin
- Infobulle au survol affichant prix, magasin, plateforme et date

## Accès

### Utilisateur

- Page de détail d'un jeu → onglet « Prix » (icône TrendingUp)
- Le graphique, les stats et les filtres sont affichés dans cet onglet

### API

- `GET /api/games/{slug}/price-history?period=1y&store=Steam&platform=PC`
  - Paramètres optionnels : `period` (1m, 3m, 6m, 1y, all), `store`, `platform`
  - Réponse : `{ history: PriceSnapshot[], stats: PriceHistoryStats }`

## Prérequis

- Migrations Supabase appliquées :
  - `20240228000001_game_price_history.sql` — Table `game_price_history`, index,
    RLS, trigger `record_price_history()`
  - `20240228000002_price_history_functions.sql` — Fonctions SQL
    `get_price_history()` et `get_price_history_stats()`
- Package `recharts` installé

## Utilisation

### Enregistrement automatique des prix

Les snapshots sont créés automatiquement par le trigger PostgreSQL :

- **INSERT** dans `game_prices` → snapshot initial enregistré
- **UPDATE** dans `game_prices` → snapshot enregistré uniquement si le prix a
  changé (`OLD.price IS DISTINCT FROM NEW.price`)
- En cas d'erreur, le trigger journalise via `RAISE WARNING` sans bloquer la
  transaction

### Consultation de l'historique

1. Ouvrir la page de détail d'un jeu
2. Cliquer sur l'onglet « Prix »
3. Le graphique affiche une courbe par magasin avec des couleurs distinctes
4. Les cartes de stats affichent min/max/moyenne avec indicateurs contextuels
5. Utiliser les boutons de période et le filtre magasin pour affiner la vue

## Architecture

```
SQL
├── game_price_history              # Table de snapshots
├── record_price_history()          # Trigger AFTER INSERT OR UPDATE sur game_prices
├── get_price_history()             # Fonction de récupération avec filtres
└── get_price_history_stats()       # Fonction de statistiques agrégées

API
└── src/app/api/games/[slug]/price-history/route.ts

Service
└── src/lib/services/priceHistoryService.ts

Hook
└── src/hooks/usePriceHistory.ts

Composants
├── src/components/games/details/PriceHistoryTab.tsx       # Orchestrateur
├── src/components/games/details/PriceHistoryChart.tsx      # Graphique Recharts
├── src/components/games/details/PriceHistoryStats.tsx      # Cartes min/max/avg
└── src/components/games/details/PriceHistoryFilters.tsx    # Période + magasin

Types
└── src/types/price-history.ts
```
