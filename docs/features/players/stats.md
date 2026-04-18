# Statistiques Joueur

Documentation du système de statistiques du profil joueur. Deux surfaces coexistent :

- **Stats enrichies** (legacy) — section historique sur le profil avec temps de
  jeu total, genre favori, reviews, et page « Année en Revue ».
- **Dashboard de statistiques** (actuel) — onglet « Stats » riche avec 10
  sections thématiques (graphiques, succès, objectifs personnels…). Remplace
  l'ancien onglet « Aperçu ».

Les deux exposent leurs propres endpoints API et composants. Le dashboard est
la surface principale ; les stats enrichies restent exposées sur la section
overview du profil et pour la rétrocompatibilité de la page « Année en Revue ».

## Accès

| Surface                | Route                                         | Onglet / Section         |
| ---------------------- | --------------------------------------------- | ------------------------ |
| Dashboard (actuel)     | `/{locale}/players/{playerId}`                | Onglet **Stats**         |
| Stats enrichies        | `/{locale}/players/{playerId}`                | Section profil           |
| Année en Revue         | `/{locale}/players/{playerId}/year/{year}`    | Page dédiée              |

## Endpoints API

### Dashboard

| Méthode | Route                                       | Paramètres          | Description           |
| ------- | ------------------------------------------- | ------------------- | --------------------- |
| GET     | `/api/players/{id}/stats/dashboard`         | `locale` (fr\|en)   | Données complètes     |
| POST    | `/api/players/{id}/stats/dashboard/goals`   | Body JSON           | Créer un objectif     |
| PUT     | `/api/players/{id}/stats/dashboard/goals`   | Body JSON (avec id) | Modifier un objectif  |
| DELETE  | `/api/players/{id}/stats/dashboard/goals`   | Body JSON (avec id) | Supprimer un objectif |

### Stats enrichies / Année en Revue

| Méthode | Route                           | Paramètres        | Description     |
| ------- | ------------------------------- | ----------------- | --------------- |
| GET     | `/api/players/{id}/stats`       | `locale` (fr\|en) | Stats enrichies |
| GET     | `/api/players/{id}/year/{year}` | `locale` (fr\|en) | Résumé annuel   |

## Prérequis

### Migrations base de données

| Migration                                           | Table                 | Description                          |
| --------------------------------------------------- | --------------------- | ------------------------------------ |
| `20240227000001_player_stats_privacy.sql`           | `profiles.stats_private` | Flag de confidentialité (enriched) |
| `20240310000001_player_achievements.sql`            | `player_achievements` | Succès débloqués par joueur          |
| `20240310000002_game_sessions.sql`                  | `game_sessions`       | Sessions de jeu avec durée           |
| `20240310000003_player_goals.sql`                   | `player_goals`        | Objectifs personnels                 |

### Dépendances

- **Recharts** v3.7.0 — graphiques donut, barres, histogramme (dashboard)
- **fast-check** v4.5.3 — tests property-based

### Traductions

- Dashboard : namespace `playerStats.*` dans `src/messages/{fr,en}.json`
- Stats enrichies : `players.enrichedStats`, `players.yearInReview`

## Confidentialité

Contrôlée par le champ `stats_private` (BOOLEAN, défaut FALSE) sur `profiles`.

- **Stats publiques** (par défaut) — accessibles à tous les visiteurs.
- **Stats privées + visiteur** — message « Statistiques privées » avec icône
  cadenas.
- **Propriétaire du profil** — voit toujours ses propres stats.
- **Objectifs personnels** — toujours masqués aux visiteurs, même sur profil
  public.

## Dashboard — 10 sections

| Section                   | Contenu                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| **Vue d'ensemble**        | Grille de 6 métriques clés (jeux, temps, avis, note, collections, amis) |
| **Répartition par genre** | Donut chart Recharts des 5 genres principaux + « Autres »               |
| **Progression complétion** | Barre colorée par statut (completed, playing, owned, wishlist)         |
| **Analyse des avis**      | Histogramme par tranches + moyenne, médiane, mode, votes helpful        |
| **Statistiques sociales** | Amis, commentaires, favoris, collections                                |
| **Chronologie d'activité** | Barres activité 12 derniers mois                                       |
| **Temps de jeu**          | Temps moyen par jeu + top game avec couverture                          |
| **Succès**                | 10 badges prédéfinis avec progression globale                           |
| **Sessions de jeu**       | Total, durée moyenne, plus longue, fréquence par jour de la semaine     |
| **Objectifs personnels**  | CRUD privés avec barres de progression                                  |

### Objectifs personnels

Types disponibles : `games_to_complete`, `play_time_hours`, `reviews_to_write`,
`collections_to_create`. Indicateur de complétion quand
`current_value >= target_value`.

### Succès

10 badges définis dans la constante `ACHIEVEMENT_DEFINITIONS` : premier jeu, 10
jeux, 50 jeux, premier avis, 10 avis, 100h de jeu, 500h, premier ami, 10 amis,
première collection. Barre de progression globale (débloqués / total).

## Stats enrichies — Contenu

- **Temps de jeu total** — somme agrégée de toutes les heures de jeu
- **Genre favori** — genre le plus joué, pondéré équitablement pour les jeux
  multi-genres
- **Reviews** — nombre de reviews écrites et note moyenne
- **Année en Revue** — page récapitulative annuelle (style Spotify Wrapped)

Les statistiques sont calculées à la volée côté serveur à partir des tables
`user_library`, `game_reviews`, `game_genres` et `genre_translations`.

Un lien vers le résumé annuel apparaît sur le profil si le joueur a des données
pour au moins une année. Il pointe vers l'année en cours si elle contient des
données, sinon vers l'année la plus récente.

## Architecture

### Dashboard

**Composants** (`src/components/players/stats/`)

| Composant                | Rôle                                   |
| ------------------------ | -------------------------------------- |
| `StatsDashboard`         | Orchestrateur (fetch + layout + états) |
| `StatsOverviewCards`     | Grille de 6 métriques clés             |
| `GenreDistributionChart` | Donut chart genres (Recharts PieChart) |
| `CompletionTracker`      | Barre de progression par statut        |
| `ReviewAnalytics`        | Histogramme + stats avis (BarChart)    |
| `SocialStats`            | 4 cartes métriques sociales            |
| `ActivityTimeline`       | Barres activité 12 mois (BarChart)     |
| `PlaytimeStats`          | Temps moyen + top game                 |
| `AchievementsList`       | Badges avec statut et progression      |
| `SessionStats`           | Stats sessions + fréquence par jour    |
| `PersonalGoals`          | CRUD objectifs + barres de progression |
| `PersonalGoalForm`       | Formulaire création/édition d'objectif |
| `StatsEmptyState`        | État vide réutilisable                 |

**Services / utilitaires**

| Fichier                                     | Rôle                                 |
| ------------------------------------------- | ------------------------------------ |
| `src/lib/services/dashboardStatsService.ts` | Requêtes DB parallèles (Supabase)    |
| `src/lib/services/dashboardStatsCompute.ts` | 11 fonctions pures de calcul         |
| `src/lib/utils/statsFormatters.ts`          | Formatage localisé + validation UUID |
| `src/types/dashboard-stats.ts`              | Types et interfaces partagés         |

**Routes API**

| Fichier                                                   | Endpoint                      |
| --------------------------------------------------------- | ----------------------------- |
| `src/app/api/players/[id]/stats/dashboard/route.ts`       | GET dashboard                 |
| `src/app/api/players/[id]/stats/dashboard/goals/route.ts` | POST / PUT / DELETE objectifs |

### Stats enrichies

**Services**

| Fichier                                      | Rôle                                      |
| -------------------------------------------- | ----------------------------------------- |
| `src/lib/services/playerStatsService.ts`     | Service principal (calculs + requêtes DB) |
| `src/lib/services/playerStatsDbHelpers.ts`   | Helpers pour les requêtes Supabase        |
| `src/lib/services/playerStatsYearHelpers.ts` | Helpers pour le résumé annuel             |

**Types** : `src/types/player-stats.ts` — `EnrichedStats`, `FavoriteGenre`,
`TopGame`, `MostActiveMonth`, `YearInReview`, réponses API.

**Composants**

| Composant             | Fichier                                          | Rôle                               |
| --------------------- | ------------------------------------------------ | ---------------------------------- |
| `PlayerEnrichedStats` | `src/components/players/PlayerEnrichedStats.tsx` | Section stats sur le profil        |
| `EnrichedStatCards`   | `src/components/players/EnrichedStatCards.tsx`   | Cartes individuelles des stats     |
| `YearInReviewLink`    | `src/components/players/YearInReviewLink.tsx`    | Lien vers le résumé annuel         |
| `YearInReviewContent` | `src/components/players/YearInReviewContent.tsx` | Contenu principal du résumé annuel |
| `YearInReviewCards`   | `src/components/players/YearInReviewCards.tsx`   | Cartes visuelles du résumé annuel  |

**Routes API**

| Fichier                                         | Endpoint                        |
| ----------------------------------------------- | ------------------------------- |
| `src/app/api/players/[id]/stats/route.ts`       | GET /api/players/:id/stats      |
| `src/app/api/players/[id]/year/[year]/route.ts` | GET /api/players/:id/year/:year |

**Page** : `src/app/[locale]/players/[id]/year/[year]/page.tsx` — Server
component du résumé annuel.

## Tests

| Fichier                                                         | Type           | Contenu                               |
| --------------------------------------------------------------- | -------------- | ------------------------------------- |
| `test/unit/lib/services/dashboardStatsCompute.property.test.ts` | Property-based | Properties 1-9, 13-16 (11 propriétés) |
| `test/unit/lib/services/dashboardStatsCompute.test.ts`          | Unitaire       | Edge cases fonctions de calcul        |
| `test/unit/lib/utils/statsFormatters.property.test.ts`          | Property-based | Properties 7, 12                      |
| `test/unit/lib/utils/statsFormatters.test.ts`                   | Unitaire       | Formatage et validation               |
| `test/unit/lib/utils/statsVisibility.property.test.ts`          | Property-based | Properties 10, 11, 17                 |
| `test/unit/api/players/statsDashboard.test.ts`                  | Unitaire       | Route API dashboard (400, 404, 500)   |
| `test/unit/lib/services/playerStatsService.test.ts`             | Unitaire       | Cas spécifiques et limites            |
| `test/unit/lib/services/playerStatsService.property.test.ts`    | Property-based | 9 propriétés de correction            |
| `test/unit/api/players/stats/route.test.ts`                     | Unitaire       | Route API stats enrichies             |
| `test/unit/api/players/year/route.test.ts`                      | Unitaire       | Route API résumé annuel               |
| `test/unit/components/players/YearInReviewLink.test.ts`         | Unitaire       | Composant lien année en revue         |

```bash
bunx vitest run test/unit/lib/services/dashboardStatsCompute.property.test.ts
bunx vitest run test/unit/lib/services/playerStatsService.test.ts
```
