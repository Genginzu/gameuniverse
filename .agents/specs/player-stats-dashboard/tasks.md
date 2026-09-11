# Implementation Plan: Player Stats Dashboard

## Overview

Remplacer l'onglet "stats" existant (`PlayerEnrichedStats`) par un dashboard riche organisé en sections thématiques. Implémenter 3 nouvelles tables SQL, un endpoint API dédié avec requêtes parallèles, des fonctions pures de calcul (testables en property-based), 11 composants UI glassmorphism avec Recharts, et les traductions FR/EN. L'onglet "overview" conserve l'ancien composant inchangé.

## Tasks

- [x] 1. Database migrations
  - [x] 1.1 Create `supabase/migrations/20240310000001_player_achievements.sql` with `player_achievements` table (id UUID PK, user_id UUID FK, achievement_key VARCHAR(50), unlocked_at TIMESTAMPTZ), UNIQUE(user_id, achievement_key), index on user_id, RLS policies (public read, owner insert), COMMENT ON
    - _Requirements: 11.2, 11.5_
  - [x] 1.2 Create `supabase/migrations/20240310000002_game_sessions.sql` with `game_sessions` table (id UUID PK, user_id UUID FK, game_id UUID FK, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ, duration_minutes INTEGER), CHECK(ended_at > started_at), index on user_id, RLS policies, COMMENT ON
    - If `GENERATED ALWAYS AS` is not supported, use a trigger `BEFORE INSERT OR UPDATE` for duration_minutes
    - _Requirements: 12.1, 12.5_
  - [x] 1.3 Create `supabase/migrations/20240310000003_player_goals.sql` with `player_goals` table (id UUID PK, user_id UUID FK, goal_type VARCHAR(30) CHECK, target_value INTEGER CHECK > 0, current_value INTEGER DEFAULT 0, created_at TIMESTAMPTZ, deadline DATE nullable), index on user_id, RLS policies (owner-only CRUD), COMMENT ON
    - _Requirements: 13.1, 13.2_

- [x] 2. Types and data models
  - [x] 2.1 Create `src/types/dashboard-stats.ts` with all TypeScript interfaces: `OverviewMetrics`, `GenreDistributionEntry`, `CompletionStats`, `ReviewAnalyticsData`, `ReviewBucket`, `SocialStatsData`, `MonthlyActivity`, `PlaytimeData`, `AchievementData`, `AchievementDefinition`, `SessionStatsData`, `DayFrequency`, `PlayerGoal`, `DashboardStatsResponse`, `DashboardStatsPrivateResponse`
    - Include `ACHIEVEMENT_DEFINITIONS` constant array with the 10 achievement definitions
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 9.2, 11.1, 12.1, 13.2_

- [x] 3. Pure computation functions and formatters
  - [x] 3.1 Create `src/lib/services/dashboardStatsCompute.ts` with exported pure functions:
    - `computeOverviewMetrics(libraryEntries, reviews, collections, friends)` — Req 1.2, 1.3, 1.4
    - `computeGenreDistribution(libraryWithGenres)` — top 5 + "Autres", Req 2.2, 2.3, 2.4
    - `computeCompletionStats(libraryEntries)` — counts by status + percentage, Req 3.1, 3.2, 3.3
    - `computeReviewDistribution(ratings)` — buckets 0-5, 6-10, 11-15, 16-20, Req 4.1, 4.2
    - `computeReviewStatistics(ratings)` — average, median, mode, Req 4.3
    - `computeActivityByMonth(libraryEntries, referenceDate, locale)` — 12 months, Req 6.1, 6.2, 6.3
    - `computeAveragePlaytime(playTimes)` — excludes zero, Req 7.1, 7.2
    - `computeTopGame(games)` — max play time, Req 7.3
    - `computeAchievementProgress(definitions, playerCounts, unlockedKeys)` — Req 11.3, 11.6
    - `computeSessionFrequency(sessions)` — 7 entries Mon-Sun, Req 12.3
    - `computeGoalProgress(goal)` — ratio + isCompleted, Req 13.3, 13.4
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 11.3, 11.6, 12.3, 13.3, 13.4_
  - [x] 3.2 Create `src/lib/utils/statsFormatters.ts` with:
    - `formatLocalizedNumber(value, locale)` — locale-aware number formatting, Req 10.3
    - `getLocalizedMonthLabel(month, year, locale)` — via `Intl.DateTimeFormat`, Req 6.4, 10.4
    - `validatePlayerId(id)` — UUID v4 validation, Req 9.4
    - _Requirements: 6.4, 9.4, 10.3, 10.4_

- [x] 4. Checkpoint — Ensure pure functions compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Property-based tests for computation functions
  - [x] 5.1 Write property test: Genre distribution counts each game once per genre
    - **Property 1: Genre distribution counts each game once per genre**
    - `// Feature: player-stats-dashboard, Property 1: Genre distribution counts each game once per genre`
    - **Validates: Requirements 2.2, 2.3**
  - [x] 5.2 Write property test: Genre distribution truncation preserves total
    - **Property 2: Genre distribution truncation preserves total**
    - `// Feature: player-stats-dashboard, Property 2: Genre distribution truncation preserves total`
    - **Validates: Requirements 2.4**
  - [x] 5.3 Write property test: Completion stats are consistent with library
    - **Property 3: Completion stats are consistent with library**
    - `// Feature: player-stats-dashboard, Property 3: Completion stats are consistent with library`
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [x] 5.4 Write property test: Review rating distribution bucketing is exhaustive
    - **Property 4: Review rating distribution bucketing is exhaustive**
    - `// Feature: player-stats-dashboard, Property 4: Review rating distribution bucketing is exhaustive`
    - **Validates: Requirements 4.1, 4.2**
  - [x] 5.5 Write property test: Review statistical measures are correct
    - **Property 5: Review statistical measures are correct**
    - `// Feature: player-stats-dashboard, Property 5: Review statistical measures are correct`
    - **Validates: Requirements 4.3**
  - [x] 5.6 Write property test: Activity timeline always has 12 entries
    - **Property 6: Activity timeline always has 12 entries**
    - `// Feature: player-stats-dashboard, Property 6: Activity timeline always has 12 entries`
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 5.7 Write property test: Month labels match locale
    - **Property 7: Month labels match locale**
    - `// Feature: player-stats-dashboard, Property 7: Month labels match locale`
    - **Validates: Requirements 6.4, 10.4**
  - [x] 5.8 Write property test: Average playtime excludes zero-time games
    - **Property 8: Average playtime excludes zero-time games**
    - `// Feature: player-stats-dashboard, Property 8: Average playtime excludes zero-time games`
    - **Validates: Requirements 7.1, 7.2**
  - [x] 5.9 Write property test: Top game has maximum play time
    - **Property 9: Top game has maximum play time**
    - `// Feature: player-stats-dashboard, Property 9: Top game has maximum play time`
    - **Validates: Requirements 7.3**
  - [x] 5.10 Write property test: Stats visibility follows privacy rule
    - **Property 10: Stats visibility follows privacy rule**
    - `// Feature: player-stats-dashboard, Property 10: Stats visibility follows privacy rule`
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  - [x] 5.11 Write property test: UUID validation rejects non-UUID strings
    - **Property 11: UUID validation rejects non-UUID strings**
    - `// Feature: player-stats-dashboard, Property 11: UUID validation rejects non-UUID strings`
    - **Validates: Requirements 9.4**
  - [x] 5.12 Write property test: Number formatting respects locale
    - **Property 12: Number formatting respects locale**
    - `// Feature: player-stats-dashboard, Property 12: Number formatting respects locale`
    - **Validates: Requirements 10.3**
  - [x] 5.13 Write property test: Achievement unlock check is correct
    - **Property 13: Achievement unlock check is correct**
    - `// Feature: player-stats-dashboard, Property 13: Achievement unlock check is correct`
    - **Validates: Requirements 11.3, 11.6**
  - [x] 5.14 Write property test: Session statistics are correct
    - **Property 14: Session statistics are correct**
    - `// Feature: player-stats-dashboard, Property 14: Session statistics are correct`
    - **Validates: Requirements 12.2, 12.5**
  - [x] 5.15 Write property test: Session frequency by day of week has 7 entries
    - **Property 15: Session frequency by day of week has 7 entries**
    - `// Feature: player-stats-dashboard, Property 15: Session frequency by day of week has 7 entries`
    - **Validates: Requirements 12.3**
  - [x] 5.16 Write property test: Goal progress computation
    - **Property 16: Goal progress computation**
    - `// Feature: player-stats-dashboard, Property 16: Goal progress computation`
    - **Validates: Requirements 13.2, 13.3, 13.4**
  - [x] 5.17 Write property test: Personal goals are hidden for visitors
    - **Property 17: Personal goals are hidden for visitors**
    - `// Feature: player-stats-dashboard, Property 17: Personal goals are hidden for visitors`
    - **Validates: Requirements 13.6**

- [x] 6. Server service and API route
  - [x] 6.1 Create `src/lib/services/dashboardStatsService.ts` with class `DashboardStatsService` exposing:
    - `fetchOverviewMetrics(playerId)` — queries `user_library`, `game_reviews`, `game_collections`, `friendships`
    - `fetchGenreDistribution(playerId, locale)` — queries `user_library` joined with `game_genres` + `genre_translations`
    - `fetchCompletionStats(playerId)` — queries `user_library` grouped by status
    - `fetchReviewAnalytics(playerId)` — queries `game_reviews` + `review_votes`
    - `fetchSocialStats(playerId)` — queries `friendships`, `character_comments`, `character_favorites`, `game_collections`
    - `fetchActivityTimeline(playerId, locale)` — queries `user_library` with `added_at` for last 12 months
    - `fetchPlaytimeStats(playerId, locale)` — queries `user_library` for play times + top game
    - `fetchAchievements(playerId)` — queries `player_achievements`
    - `fetchSessionStats(playerId)` — queries `game_sessions`
    - `fetchPlayerGoals(playerId)` — queries `player_goals`
    - All methods use Supabase server client, each calls the corresponding pure compute function
    - `fetchAllStats(playerId, locale)` — runs all fetches in parallel via `Promise.all`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.1, 7.3, 9.6, 11.2, 12.1, 13.1_
  - [x] 6.2 Create `src/app/api/players/[id]/stats/dashboard/route.ts` with GET handler:
    - Parse `locale` query param (default "fr")
    - Validate player ID with `validatePlayerId` (400 if invalid)
    - Check player exists (404 if not)
    - Check privacy: compare authenticated user with player ID, return `{ stats: null, private: true }` if private for visitor
    - Call `DashboardStatsService.fetchAllStats` and return full JSON response
    - Error handling: 500 for internal errors
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 6.3 Create `src/app/api/players/[id]/stats/dashboard/goals/route.ts` with POST, PUT, DELETE handlers for personal goals CRUD:
    - POST: create a new goal (auth required, own profile only, validate goal_type and target_value)
    - PUT: update an existing goal (auth required, own profile only)
    - DELETE: delete a goal (auth required, own profile only)
    - Error handling: 401, 403, 400, 404
    - _Requirements: 13.1, 13.2, 13.5_

- [x] 7. Checkpoint — Ensure API routes and services compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. UI Components — Core sections
  - [x] 8.1 Create `src/components/players/stats/StatsEmptyState.tsx` — reusable empty state with icon + message, glassmorphism `.glass-card`, dark mode
    - _Requirements: 1.5, 2.6, 3.4, 4.4, 5.5, 6.5, 7.4, 12.4_
  - [x] 8.2 Create `src/components/players/stats/StatsOverviewCards.tsx` — 6 `.glass-card` metrics: total games, total play time, reviews, average rating, collections, friends. Localized numbers via `formatLocalizedNumber`. Empty state if no data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 10.3_
  - [x] 8.3 Create `src/components/players/stats/GenreDistributionChart.tsx` — Recharts `PieChart` donut with top 5 genres + "Autres", tooltip on hover with genre name, count, percentage. Empty state if no genres
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 8.4 Create `src/components/players/stats/CompletionTracker.tsx` — progress bar with colored segments (green=completed, blue=playing, gray=owned, orange=wishlist), counters per status, percentage label. Empty state at 0%
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 8.5 Create `src/components/players/stats/ReviewAnalytics.tsx` — Recharts `BarChart` for rating distribution by buckets, metrics cards for average/median/mode/total/helpful votes. Empty state if no reviews
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 8.6 Create `src/components/players/stats/SocialStats.tsx` — 4 `.glass-card` metrics: friends, comments, favorites, collections. Empty state if all zero
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 8.7 Create `src/components/players/stats/ActivityTimeline.tsx` — Recharts `BarChart` for 12 months of activity, localized month labels. Empty state if no activity
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 8.8 Create `src/components/players/stats/PlaytimeStats.tsx` — average play time + top game card with cover image and title. Empty state if no play time data
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. UI Components — Advanced sections (new data)
  - [x] 9.1 Create `src/components/players/stats/AchievementsList.tsx` — list of badges with unlocked/locked status, unlock date, global progress bar (unlocked/total). Uses `ACHIEVEMENT_DEFINITIONS` constant
    - _Requirements: 11.1, 11.4, 11.5, 11.6_
  - [x] 9.2 Create `src/components/players/stats/SessionStats.tsx` — metrics (total sessions, average duration, longest session) + Recharts `BarChart` for frequency by day of week. Empty state if no sessions
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [x] 9.3 Create `src/components/players/stats/PersonalGoals.tsx` — list of goals with progress bars, completion badge, CRUD actions (create/edit/delete) for owner only. Hidden for visitors regardless of privacy setting
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 10. Dashboard orchestrator and integration
  - [x] 10.1 Create `src/components/players/stats/StatsDashboard.tsx` — orchestrator component:
    - Props: `playerId`, `locale`, `isOwnProfile`, `statsPrivate`
    - Fetch from `/api/players/:id/stats/dashboard?locale=...`
    - FetchState pattern (loading/error/private/success) matching `PlayerEnrichedStats`
    - Distribute data to all sub-components
    - Private state: lock icon + message (same pattern as existing)
    - Loading state: skeleton cards
    - Error state: message + retry button
    - _Requirements: 1.1, 8.1, 8.2, 8.3, 9.1_
  - [x] 10.2 Modify `src/components/players/PlayerTabContent.tsx` — replace `PlayerEnrichedStats` with `StatsDashboard` in the `case "stats"` branch, passing `playerId`, `locale`, `isOwnProfile: isOwner`, `statsPrivate: player.statsPrivate`. Keep `PlayerEnrichedStats` in the overview tab unchanged
    - _Requirements: 1.1, 8.1_

- [x] 11. Internationalization
  - [x] 11.1 Add `playerStats.*` translation keys in `src/messages/fr.json` — titles for each section (Vue d'ensemble, Répartition par genre, Progression, Analyse des avis, Statistiques sociales, Chronologie, Temps de jeu, Succès, Sessions, Objectifs), metric labels, empty state messages, privacy message, error/retry, goal types, achievement names, day-of-week labels
    - _Requirements: 10.1, 10.2_
  - [x] 11.2 Add corresponding `playerStats.*` translation keys in `src/messages/en.json`
    - _Requirements: 10.1, 10.2_

- [x] 12. Checkpoint — Ensure all components render and integrate correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Unit tests
  - [x] 13.1 Create `test/unit/api/players/statsDashboard.test.ts` — test GET dashboard route: valid response with all fields (Req 9.2), 400 for invalid UUID (Req 9.4), 404 for non-existent player (Req 9.5), private stats for visitor returns `{ stats: null, private: true }` (Req 8.2), owner sees stats even when private (Req 8.3), locale param forwarded (Req 9.3), 500 on internal error
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 13.2 Create `test/unit/lib/services/dashboardStatsCompute.test.ts` — unit tests for edge cases:
    - Empty library returns zero metrics (Req 1.5)
    - Empty genre list returns empty distribution (Req 2.6)
    - Zero completion returns 0% (Req 3.4)
    - No reviews returns null statistics (Req 4.4)
    - No social activity returns zeros (Req 5.5)
    - No activity in 12 months returns 12 zero entries (Req 6.5)
    - No play time returns null average (Req 7.4)
    - No sessions returns empty stats (Req 12.4)
    - Achievement definitions has 10 entries (Req 11.1)
    - _Requirements: 1.5, 2.6, 3.4, 4.4, 5.5, 6.5, 7.4, 11.1, 12.4_
  - [x] 13.3 Create `test/unit/lib/utils/statsFormatters.test.ts` — unit tests for `formatLocalizedNumber`, `getLocalizedMonthLabel`, `validatePlayerId`
    - _Requirements: 6.4, 9.4, 10.3, 10.4_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Lint du code
  - [x] 15.1 Exécuter `bun run lint`
  - [x] 15.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 15.3 Corriger les erreurs de lint si nécessaire

- [x] 16. Build de production
  - [x] 16.1 Exécuter `bun run build`
  - [x] 16.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 16.3 Corriger les erreurs de build si nécessaire

- [x] 17. README de la fonctionnalité
  - [x] 17.1 Créer `docs/README_player-stats-dashboard.md`
  - [x] 17.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les 17 propriétés universelles de correction du design (Properties 1-17)
- Les tests unitaires couvrent les cas concrets, les cas limites et les intégrations API
- Tous les tests utilisent Vitest avec fast-check pour les property-based, placés dans `test/`
- Fichiers property-based : `test/unit/lib/services/dashboardStatsCompute.property.test.ts` (Properties 1-9, 13-16), `test/unit/lib/utils/statsFormatters.property.test.ts` (Properties 7, 12), `test/unit/lib/utils/statsVisibility.property.test.ts` (Properties 10, 11, 17)
- TypeScript est le langage d'implémentation
- Recharts (v3.7.0, déjà installé) pour les graphiques donut, barres et histogramme
- L'onglet "overview" conserve `PlayerEnrichedStats` inchangé — seul le case "stats" est remplacé
- Les 3 nouvelles tables nécessitent des migrations dans `supabase/migrations/`
- Le champ `stats_private` existant sur `profiles` contrôle la visibilité pour les visiteurs
