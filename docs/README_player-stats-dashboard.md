# Dashboard de Statistiques Joueur

## Description

Remplacement de l'onglet « Stats » basique (`PlayerEnrichedStats`) par un
dashboard riche organisé en 10 sections thématiques :

- **Vue d'ensemble** : grille de 6 métriques clés (jeux, temps de jeu, avis,
  note moyenne, collections, amis)
- **Répartition par genre** : donut chart Recharts des 5 genres principaux + «
  Autres »
- **Progression de complétion** : barre de progression colorée par statut
  (completed, playing, owned, wishlist)
- **Analyse des avis** : histogramme par tranches de notes + moyenne, médiane,
  mode, votes helpful
- **Statistiques sociales** : amis, commentaires, favoris, collections
- **Chronologie d'activité** : graphique en barres des 12 derniers mois
- **Temps de jeu** : temps moyen par jeu + top game avec couverture
- **Succès** : 10 badges prédéfinis avec progression globale
- **Sessions de jeu** : total, durée moyenne, plus longue session, fréquence par
  jour de la semaine
- **Objectifs personnels** : CRUD d'objectifs avec barres de progression
  (privés, visibles uniquement par le propriétaire)

L'onglet « Overview » conserve l'ancien composant `PlayerEnrichedStats`
inchangé.

## Accès

### Navigation

Profil joueur → onglet **Stats** : `/{locale}/players/{playerId}` → cliquer sur
l'onglet « Stats ».

### Endpoints API

| Méthode | Route                                     | Paramètres          | Description           |
| ------- | ----------------------------------------- | ------------------- | --------------------- |
| GET     | `/api/players/{id}/stats/dashboard`       | `locale` (fr\|en)   | Données complètes     |
| POST    | `/api/players/{id}/stats/dashboard/goals` | Body JSON           | Créer un objectif     |
| PUT     | `/api/players/{id}/stats/dashboard/goals` | Body JSON (avec id) | Modifier un objectif  |
| DELETE  | `/api/players/{id}/stats/dashboard/goals` | Body JSON (avec id) | Supprimer un objectif |

## Prérequis

### Migrations base de données

Trois nouvelles tables doivent être créées via les migrations dans
`supabase/migrations/` :

| Migration                                | Table                 | Description                 |
| ---------------------------------------- | --------------------- | --------------------------- |
| `20240310000001_player_achievements.sql` | `player_achievements` | Succès débloqués par joueur |
| `20240310000002_game_sessions.sql`       | `game_sessions`       | Sessions de jeu avec durée  |
| `20240310000003_player_goals.sql`        | `player_goals`        | Objectifs personnels        |

### Dépendances

- **Recharts** v3.7.0 (déjà installé) — graphiques donut, barres, histogramme
- **fast-check** v4.5.3 (déjà installé) — tests property-based

### Traductions

Clés i18n sous le namespace `playerStats.*` dans `src/messages/fr.json` et
`src/messages/en.json`.

## Utilisation

### Affichage

Le dashboard se charge automatiquement à l'ouverture de l'onglet Stats. Un seul
appel API agrège toutes les données, les requêtes DB étant parallélisées côté
serveur via `Promise.all`.

### Confidentialité

- Contrôlée par le champ `stats_private` sur la table `profiles`
- **Stats privées + visiteur** : message « Statistiques privées » avec icône
  cadenas
- **Propriétaire du profil** : voit toujours ses stats, quel que soit le réglage

### Objectifs personnels

- Visibles uniquement par le propriétaire du profil (masqués pour les visiteurs)
- Types disponibles : `games_to_complete`, `play_time_hours`,
  `reviews_to_write`, `collections_to_create`
- Actions : créer, modifier, supprimer via l'interface ou l'API CRUD
- Indicateur visuel de complétion quand `current_value >= target_value`

### Succès

10 badges prédéfinis définis dans la constante `ACHIEVEMENT_DEFINITIONS` :
premier jeu, 10 jeux, 50 jeux, premier avis, 10 avis, 100h de jeu, 500h, premier
ami, 10 amis, première collection. Barre de progression globale (débloqués /
total).

## Architecture

### Composants UI (`src/components/players/stats/`)

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

### Service et calculs

| Fichier                                     | Rôle                                 |
| ------------------------------------------- | ------------------------------------ |
| `src/lib/services/dashboardStatsService.ts` | Requêtes DB parallèles (Supabase)    |
| `src/lib/services/dashboardStatsCompute.ts` | 11 fonctions pures de calcul         |
| `src/lib/utils/statsFormatters.ts`          | Formatage localisé + validation UUID |
| `src/types/dashboard-stats.ts`              | Types et interfaces partagés         |

### Routes API

| Fichier                                                   | Endpoint                      |
| --------------------------------------------------------- | ----------------------------- |
| `src/app/api/players/[id]/stats/dashboard/route.ts`       | GET dashboard                 |
| `src/app/api/players/[id]/stats/dashboard/goals/route.ts` | POST / PUT / DELETE objectifs |

## Tests

| Fichier                                                         | Type           | Contenu                               |
| --------------------------------------------------------------- | -------------- | ------------------------------------- |
| `test/unit/lib/services/dashboardStatsCompute.property.test.ts` | Property-based | Properties 1-9, 13-16 (11 propriétés) |
| `test/unit/lib/services/dashboardStatsCompute.test.ts`          | Unitaire       | Edge cases fonctions de calcul        |
| `test/unit/lib/utils/statsFormatters.property.test.ts`          | Property-based | Properties 7, 12                      |
| `test/unit/lib/utils/statsFormatters.test.ts`                   | Unitaire       | Formatage et validation               |
| `test/unit/lib/utils/statsVisibility.property.test.ts`          | Property-based | Properties 10, 11, 17                 |
| `test/unit/api/players/statsDashboard.test.ts`                  | Unitaire       | Route API (400, 404, privacy, 500)    |

```bash
# Lancer tous les tests
bun run test:all

# Lancer les tests property-based du dashboard
bunx vitest run test/unit/lib/services/dashboardStatsCompute.property.test.ts

# Lancer les tests unitaires des calculs
bunx vitest run test/unit/lib/services/dashboardStatsCompute.test.ts
```
