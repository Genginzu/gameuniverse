# Statistiques Joueur Enrichies

## Description

Fonctionnalité ajoutant des statistiques avancées au profil joueur :

- **Temps de jeu total** : somme agrégée de toutes les heures de jeu
- **Genre favori** : genre le plus joué, pondéré équitablement pour les jeux
  multi-genres
- **Reviews** : nombre de reviews écrites et note moyenne
- **Année en Revue** : page récapitulative annuelle (style Spotify Wrapped)
  présentant les statistiques de jeu pour une année donnée

Les statistiques sont calculées à la volée côté serveur à partir des tables
`user_library`, `game_reviews`, `game_genres` et `genre_translations`.

## Accès

### Pages

| Page           | Route                                | Description                                 |
| -------------- | ------------------------------------ | ------------------------------------------- |
| Profil joueur  | `/{locale}/players/{id}`             | Stats enrichies affichées en section dédiée |
| Année en Revue | `/{locale}/players/{id}/year/{year}` | Résumé annuel visuel                        |

### Endpoints API

| Méthode | Route                           | Paramètres query  | Description     |
| ------- | ------------------------------- | ----------------- | --------------- |
| GET     | `/api/players/{id}/stats`       | `locale` (fr\|en) | Stats enrichies |
| GET     | `/api/players/{id}/year/{year}` | `locale` (fr\|en) | Résumé annuel   |

## Prérequis

1. **Migration base de données** : la migration
   `supabase/migrations/20240227000001_player_stats_privacy.sql` doit être
   appliquée. Elle ajoute la colonne `stats_private` (BOOLEAN, défaut FALSE) à
   la table `profiles`.

2. **Clés i18n** : les traductions doivent être présentes dans
   `src/messages/fr.json` et `src/messages/en.json` sous les clés
   `players.enrichedStats` et `players.yearInReview`.

## Utilisation

### Affichage automatique

Les statistiques enrichies s'affichent automatiquement sur chaque profil joueur,
sans action requise.

### Confidentialité

- Par défaut, les stats sont **publiques**.
- Un joueur peut rendre ses stats privées via la colonne `stats_private` dans
  `profiles`.
- Quand les stats sont privées, les visiteurs voient un message « Statistiques
  privées ». Le propriétaire du profil voit toujours ses propres stats.

### Lien Année en Revue

Un lien vers le résumé annuel apparaît sur le profil si le joueur a des données
pour au moins une année. Le lien pointe vers l'année en cours si elle contient
des données, sinon vers l'année la plus récente avec des données.

## Architecture

### Service et helpers

| Fichier                                      | Rôle                                      |
| -------------------------------------------- | ----------------------------------------- |
| `src/lib/services/playerStatsService.ts`     | Service principal (calculs + requêtes DB) |
| `src/lib/services/playerStatsDbHelpers.ts`   | Helpers pour les requêtes Supabase        |
| `src/lib/services/playerStatsYearHelpers.ts` | Helpers pour le résumé annuel             |

### Types

| Fichier                     | Contenu                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `src/types/player-stats.ts` | `EnrichedStats`, `FavoriteGenre`, `TopGame`, `MostActiveMonth`, `YearInReview`, réponses API |

### Composants

| Composant             | Fichier                                          | Rôle                               |
| --------------------- | ------------------------------------------------ | ---------------------------------- |
| `PlayerEnrichedStats` | `src/components/players/PlayerEnrichedStats.tsx` | Section stats sur le profil        |
| `EnrichedStatCards`   | `src/components/players/EnrichedStatCards.tsx`   | Cartes individuelles des stats     |
| `YearInReviewLink`    | `src/components/players/YearInReviewLink.tsx`    | Lien vers le résumé annuel         |
| `YearInReviewContent` | `src/components/players/YearInReviewContent.tsx` | Contenu principal du résumé annuel |
| `YearInReviewCards`   | `src/components/players/YearInReviewCards.tsx`   | Cartes visuelles du résumé annuel  |

### Routes API

| Fichier                                         | Endpoint                        |
| ----------------------------------------------- | ------------------------------- |
| `src/app/api/players/[id]/stats/route.ts`       | GET /api/players/:id/stats      |
| `src/app/api/players/[id]/year/[year]/route.ts` | GET /api/players/:id/year/:year |

### Page

`src/app/[locale]/players/[id]/year/[year]/page.tsx` — Server component du
résumé annuel.

## Tests

| Fichier                                                      | Type           | Contenu                       |
| ------------------------------------------------------------ | -------------- | ----------------------------- |
| `test/unit/lib/services/playerStatsService.test.ts`          | Unitaire       | Cas spécifiques et limites    |
| `test/unit/lib/services/playerStatsService.property.test.ts` | Property-based | 9 propriétés de correction    |
| `test/unit/api/players/stats/route.test.ts`                  | Unitaire       | Route API stats enrichies     |
| `test/unit/api/players/year/route.test.ts`                   | Unitaire       | Route API résumé annuel       |
| `test/unit/components/players/YearInReviewLink.test.ts`      | Unitaire       | Composant lien année en revue |

```bash
# Lancer tous les tests
bun run test:all

# Lancer uniquement les tests du service
bunx vitest run test/unit/lib/services/playerStatsService.test.ts

# Lancer les tests property-based
bunx vitest run test/unit/lib/services/playerStatsService.property.test.ts
```
