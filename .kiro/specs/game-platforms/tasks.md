# Implementation Plan: Game Platforms

## Overview

Ajout de la gestion des plateformes de jeux vidéo dans Game Universe. L'implémentation suit le pattern existant des genres : migration SQL, types TypeScript, service, validation Zod, API routes admin + publique, composants UI (filtres, stats, admin CRUD), modification de l'import IGDB, et traductions i18n FR/EN.

Le langage d'implémentation est **TypeScript** (Next.js / Supabase / Vitest / fast-check).

## Tasks

- [x] 1. Migration SQL — tables, index, RLS
  - [x] 1.1 Créer la migration `supabase/migrations/20240317000001_game_platforms.sql`
    - Créer la table `platforms` (id UUID, slug UNIQUE, igdb_id INTEGER UNIQUE, icon_url TEXT, created_at, updated_at)
    - Créer la table `platform_translations` (id UUID, platform_id FK CASCADE, language_code TEXT, name TEXT, abbreviation TEXT, UNIQUE(platform_id, language_code))
    - Créer la table `game_platforms` (game_id FK CASCADE, platform_id FK CASCADE, PRIMARY KEY composite)
    - Créer les index `idx_game_platforms_game_id` et `idx_game_platforms_platform_id`
    - Activer RLS sur les 3 tables avec lecture publique et écriture admin
    - Ajouter les `COMMENT ON` pour documenter les tables et colonnes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Types TypeScript
  - [x] 2.1 Créer `src/types/platform.ts`
    - Définir `PlatformSummary`, `GamePlatform`, `GameSummaryPlatform`
    - _Requirements: 2.3, 2.4, 3.2_
  - [x] 2.2 Créer `src/types/admin-platforms.ts`
    - Définir `PlatformTranslation`, `AdminPlatform`, `FetchPlatformsParams`
    - _Requirements: 7.1_
  - [x] 2.3 Modifier `src/types/game.ts` — ajouter champ `platforms` dans `GameDetails` et `GameSummary`
    - _Requirements: 2.3, 2.4_
  - [x] 2.4 Modifier `src/types/character.ts` — ajouter champ `platforms` dans `CharacterDetails`
    - _Requirements: 3.2_
  - [x] 2.5 Modifier `src/types/dashboard-stats.ts` — ajouter `PlatformDistributionEntry` et champ `platformDistribution` dans `DashboardStatsResponse`
    - _Requirements: 5.1, 5.3_
  - [x] 2.6 Modifier `src/types/igdb.ts` — ajouter champ `platforms` dans `IGDBGame`
    - _Requirements: 6.1_

- [x] 3. Service platformService et validation Zod
  - [x] 3.1 Créer `src/lib/services/platformService.ts`
    - Implémenter `fetchPlatforms(params)` — liste paginée avec search, tri, game count
    - Implémenter `fetchPlatformsByLocale(locale)` — liste pour les filtres UI avec fallback EN
    - Implémenter `fetchPlatformBySlug(slug, locale)` — détail d'une plateforme
    - Suivre le pattern de `genreService.ts`
    - _Requirements: 2.1, 2.2, 8.1, 8.2_
  - [x] 3.2 Créer `src/lib/validations/admin-platform-form.ts`
    - Schéma Zod pour création/édition : slug requis, au moins un nom (FR ou EN) requis
    - Schéma pour les query params de listing admin
    - _Requirements: 7.2, 7.5_
  - [x] 3.3 Ajouter `computePlatformDistribution()` dans `src/lib/services/dashboardStatsCompute.ts`
    - Calculer le nombre de jeux par plateforme et le pourcentage à partir de `user_library` + `game_platforms`
    - Trier par count décroissant
    - _Requirements: 5.1, 5.3_
  - [x] 3.4 Intégrer `platformDistribution` dans `src/lib/services/dashboardStatsService.ts`
    - Appeler `computePlatformDistribution()` et inclure dans la réponse
    - _Requirements: 5.3_

- [x] 4. Checkpoint — Vérifier la cohérence types + service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. API routes admin CRUD plateformes
  - [x] 5.1 Créer `src/app/api/admin/platforms/route.ts` — GET (list) + POST (create)
    - GET : liste paginée avec search, tri, game count, traductions
    - POST : validation Zod, vérification slug unique (409 si doublon), création plateforme + traductions
    - Protection admin via `requireAdmin()`
    - _Requirements: 7.1, 7.2, 7.5_
  - [x] 5.2 Créer `src/app/api/admin/platforms/[slug]/route.ts` — GET + PUT + DELETE
    - GET : détail plateforme par slug avec traductions
    - PUT : modification slug, traductions, icône
    - DELETE : suppression avec cascade (confirmation côté client)
    - Protection admin, 404 si non trouvé
    - _Requirements: 7.3, 7.4, 7.5_
  - [x] 5.3 Écrire les tests unitaires pour les routes admin platforms
    - Fichier : `test/unit/api/admin/platforms.test.ts`
    - Tester CRUD complet, slug en doublon (409), validation (400), non-admin (403), not found (404)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. API route publique plateformes + modification routes games/characters
  - [x] 6.1 Créer `src/app/api/platforms/route.ts` — GET public
    - Retourner la liste des plateformes avec game count, traduites dans la locale courante
    - _Requirements: 8.1, 8.2_
  - [x] 6.2 Modifier `src/app/api/games/route.ts` — support filtre `platforms` query param
    - Ajouter JOIN sur `game_platforms` quand le paramètre `platforms` (slugs séparés par virgule) est présent
    - Intersection avec les filtres genre existants
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 6.3 Modifier `src/app/api/games/[slug]/route.ts` — inclure plateformes dans GameDetails
    - Joindre `game_platforms` → `platforms` → `platform_translations` pour retourner les plateformes du jeu
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 6.4 Modifier `src/app/api/characters/route.ts` — support filtre `platforms` query param
    - Filtrer les personnages dont au moins un jeu est disponible sur une des plateformes sélectionnées
    - _Requirements: 4.2_
  - [x] 6.5 Écrire les tests unitaires pour la route publique et les filtres
    - Fichier : `test/unit/api/platforms.test.ts`
    - Tester GET public, filtre games par plateforme, filtre characters par plateforme, combinaison genre+plateforme
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Checkpoint — Vérifier API routes et filtres
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Composants UI — filtres plateforme et stats dashboard
  - [x] 8.1 Créer `src/components/games/PlatformFilter.tsx`
    - Composant filtre multi-sélection par plateforme pour la page games listing
    - Fetch des plateformes via `/api/platforms`, style glassmorphism cohérent avec les filtres genre existants
    - _Requirements: 4.1, 4.5_
  - [x] 8.2 Intégrer `PlatformFilter` dans `src/components/games/AllGamesContent.tsx`
    - Ajouter le filtre plateforme à côté du filtre genre existant
    - Passer les slugs sélectionnés comme query param `platforms` à l'API
    - _Requirements: 4.1, 4.3, 4.5_
  - [x] 8.3 Créer `src/components/characters/CharacterPlatformFilter.tsx`
    - Composant filtre multi-sélection par plateforme pour la page characters listing
    - Style glassmorphism cohérent avec les filtres existants (jeux, rôles)
    - _Requirements: 4.2, 4.6_
  - [x] 8.4 Intégrer `CharacterPlatformFilter` dans `src/components/characters/CharacterFilters.tsx`
    - Ajouter le filtre plateforme dans les filtres existants
    - Passer les slugs sélectionnés comme query param `platforms` à l'API
    - _Requirements: 4.2, 4.6_
  - [x] 8.5 Créer `src/components/dashboard/PlatformDistribution.tsx`
    - Composant affichant la répartition par plateforme (nom, count, pourcentage)
    - État vide avec message explicatif quand la bibliothèque est vide
    - Style glassmorphism cohérent avec `GenreDistributionEntry` existant
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 8.6 Intégrer `PlatformDistribution` dans la page dashboard stats
    - Ajouter la section "Répartition par plateforme" dans le dashboard joueur
    - _Requirements: 5.1, 5.4_

- [x] 9. Page admin plateformes
  - [x] 9.1 Créer `src/components/admin/platforms/PlatformList.tsx`
    - Liste des plateformes avec nom traduit, slug, icône, game count
    - Pagination, recherche, tri — pattern identique à `AdminGenresTable.tsx`
    - _Requirements: 7.1, 7.6_
  - [x] 9.2 Créer `src/components/admin/platforms/PlatformForm.tsx`
    - Formulaire création/édition avec champs : slug, icon_url, nom FR, nom EN, abréviation
    - Validation Zod côté client, gestion erreur slug doublon
    - _Requirements: 7.2, 7.3, 7.5, 7.6_
  - [x] 9.3 Créer `src/components/admin/platforms/DeletePlatformDialog.tsx`
    - Dialog de confirmation de suppression avec message d'avertissement cascade
    - _Requirements: 7.4_
  - [x] 9.4 Créer `src/app/[locale]/admin/platforms/page.tsx`
    - Page admin orchestrant PlatformList, PlatformForm, DeletePlatformDialog
    - _Requirements: 7.1, 7.6_

- [x] 10. Modification IGDB import — plateformes
  - [x] 10.1 Modifier `scripts/igdb-import/game-importer.ts`
    - Ajouter `ensurePlatforms(igdbGame, verbose)` — crée les plateformes manquantes (upsert par igdb_id), crée la traduction EN
    - Ajouter `linkPlatforms(gameId, platformIds)` — crée les associations `game_platforms`
    - Appeler ces fonctions dans `importGameFromIGDB()` après la création du jeu
    - Gérer le cas où IGDB ne retourne aucune plateforme (continuer sans erreur)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  - [x] 10.2 Modifier `scripts/igdb-import/game-sync.ts`
    - Ajouter la synchronisation des plateformes lors du sync d'un jeu existant
    - Ajouter les nouvelles plateformes sans supprimer les existantes (superset)
    - _Requirements: 6.5_
  - [x] 10.3 Modifier `scripts/igdb-import/types.ts` si nécessaire
    - Ajouter les types liés aux plateformes IGDB si non couverts par `src/types/igdb.ts`
    - _Requirements: 6.1_

- [x] 11. Traductions i18n FR/EN
  - [x] 11.1 Ajouter les clés i18n dans `src/messages/fr.json`
    - Clés `platforms.filter.*`, `platforms.distribution.*`, `platforms.empty`
    - Clés `admin.platforms.*` (titre, CRUD, erreurs, labels)
    - _Requirements: 8.3, 8.4_
  - [x] 11.2 Ajouter les clés i18n dans `src/messages/en.json`
    - Mêmes clés que fr.json avec traductions anglaises
    - _Requirements: 8.3, 8.4_

- [x] 12. Checkpoint — Vérifier l'ensemble de l'implémentation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Tests property-based et unitaires
  - [x] 13.1 Écrire le test property pour la distribution par plateforme
    - Fichier : `test/unit/lib/services/platformDistribution.property.test.ts`
    - **Property 6: Platform distribution computation**
    - Vérifier que la somme des counts = total des game-platform assignments, pourcentages ≈ 100%, tri décroissant
    - **Validates: Requirements 5.1, 5.3**
  - [x] 13.2 Écrire les tests property pour le filtrage par plateforme
    - Fichier : `test/unit/lib/services/platformFiltering.property.test.ts`
    - **Property 3: Game platform filter correctness**
    - **Property 4: Character platform filter correctness**
    - **Property 5: Combined filter intersection**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - [x] 13.3 Écrire le test property pour la validation admin
    - Fichier : `test/unit/lib/validations/adminPlatformValidation.property.test.ts`
    - **Property 10: Admin platform validation**
    - Vérifier que les payloads sans slug ou sans traduction sont rejetés, les valides sont acceptés
    - **Validates: Requirements 7.2**
  - [x] 13.4 Écrire le test property pour le fallback de traduction
    - Fichier : `test/unit/lib/services/platformTranslation.property.test.ts`
    - **Property 12: Locale translation with English fallback**
    - Vérifier que la traduction locale est retournée si elle existe, sinon fallback EN
    - **Validates: Requirements 8.1, 8.2**
  - [x] 13.5 Écrire les tests unitaires pour platformService
    - Fichier : `test/unit/lib/services/platformService.test.ts`
    - Tester fetchPlatforms, fetchPlatformsByLocale, fetchPlatformBySlug, edge cases (0 plateformes, fallback)
    - _Requirements: 2.1, 2.2, 8.1, 8.2_
  - [x] 13.6 Écrire les tests unitaires pour computePlatformDistribution
    - Fichier : `test/unit/lib/services/dashboardStatsCompute.test.ts` (ajout de tests)
    - Tester bibliothèque vide, un jeu multi-plateformes, pourcentages, tri
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 13.7 Écrire les tests unitaires pour la validation Zod admin-platform-form
    - Fichier : `test/unit/lib/validations/admin-platform-form.test.ts`
    - Tester slug manquant, aucune traduction, slug valide + traduction, abréviation optionnelle
    - _Requirements: 7.2, 7.5_
  - [x] 13.8 Écrire les tests pour l'import/sync IGDB plateformes
    - Fichier : `test/scripts/igdb-import/platforms.test.ts`
    - Tester ensurePlatforms (création, upsert idempotent), linkPlatforms, sync superset
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 14. Final checkpoint — Validation complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Lint du code
  - [x] 15.1 Exécuter `bun run lint`
  - [x] 15.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 15.3 Corriger les erreurs et warnings de lint si nécessaire

- [x] 16. Build de production
  - [x] 16.1 Exécuter `bun run build`
  - [x] 16.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 16.3 Corriger les erreurs de build si nécessaire

- [x] 17. README de la fonctionnalité
  - [x] 17.1 Créer `docs/README_GAME_PLATFORMS.md`
    - Description : résumé de ce qui a été implémenté
    - Accès : routes, URLs, navigation
    - Prérequis : configuration ou permissions nécessaires
    - Utilisation : guide rapide des principales actions disponibles

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (fast-check, min 100 iterations)
- Unit tests validate specific examples and edge cases (Vitest)
- All tests in `test/` directory, property tests use `*.property.test.ts` naming
- Translations must be added simultaneously in `fr.json` and `en.json`
- All files must stay under 300 lines
