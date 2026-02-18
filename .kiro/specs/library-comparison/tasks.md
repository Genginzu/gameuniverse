# Plan d'implémentation : Comparaison de bibliothèques entre joueurs

## Vue d'ensemble

Implémentation incrémentale de la comparaison de bibliothèques : migration SQL,
service, API route, composants React, puis tests. Chaque étape s'appuie sur la
précédente.

## Tâches

- [ ] 1. Migration SQL et fonction de comparaison
  - [ ] 1.1 Créer la migration `supabase/migrations/20240221000001_library_comparison.sql`
    - Ajouter un index sur `user_library(game_id)` si inexistant
    - Créer la fonction `get_common_games(current_user_id, target_player_id, game_locale, page_number, page_size)` qui retourne les jeux en commun avec métadonnées (game_id, slug, cover_image_url, title, genre_names, total_count)
    - La fonction effectue l'intersection via `INNER JOIN` sur `user_library` et joint `games`, `game_translations`, `game_genres`, `genre_translations`
    - Utiliser une window function `COUNT(*) OVER()` pour le total sans requête supplémentaire
    - _Requirements: 1.1, 5.1, 5.2_

- [ ] 2. Types et service de comparaison
  - [ ] 2.1 Ajouter les types `CommonGame` et `CommonGamesResult` dans `src/types/player.ts`
    - `CommonGame` : gameId, slug, title, coverImage, genres
    - `CommonGamesResult` : commonGamesCount, commonGames, pagination
    - _Requirements: 1.2, 3.1_

  - [ ] 2.2 Créer `src/lib/services/libraryComparisonService.ts`
    - Méthode statique `getCommonGames(currentUserId, targetPlayerId, locale, page)` qui appelle la fonction RPC `get_common_games` via Supabase
    - Transformer les données brutes SQL en types `CommonGamesResult`
    - Calculer la pagination (totalPages, hasNextPage) à partir de total_count
    - Méthode statique pure `computePagination(totalCount, page, pageSize)` pour le calcul de pagination
    - Méthode statique pure `transformCommonGameRow(row, locale)` pour la transformation des données
    - _Requirements: 1.1, 1.2, 3.4, 6.3_

  - [ ]* 2.3 Écrire les tests property-based pour le service
    - Fichier : `test/unit/lib/services/libraryComparison.property.test.ts`
    - **Property 2 : Invariant du compteur** — Pour tout résultat, commonGamesCount >= commonGames.length et commonGames.length <= pageSize
    - **Validates: Requirements 1.2**
    - **Property 5 : Calcul de pagination** — Pour tout totalCount et page, totalPages = ceil(totalCount / 12) et hasNextPage = (page < totalPages)
    - **Validates: Requirements 3.4**
    - **Property 7 : Sélection du titre selon la locale** — Pour tout jeu avec traductions multiples, le titre retourné correspond à la locale demandée ou au fallback
    - **Validates: Requirements 6.3**

- [ ] 3. API Route de comparaison
  - [ ] 3.1 Créer `src/app/api/players/[id]/common-games/route.ts`
    - Handler GET avec authentification via `createRouteHandlerClient`
    - Validation UUID du paramètre `id` via `PlayerService.validatePlayerId`
    - Vérification que le joueur cible existe via `PlayerService.playerExists`
    - Rejet si currentUserId === targetPlayerId (400)
    - Paramètres query : `locale` (défaut `fr`), `page` (défaut `1`)
    - Appel à `LibraryComparisonService.getCommonGames`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.2 Écrire les tests unitaires pour l'API route
    - Fichier : `test/unit/api/players/common-games/route.test.ts`
    - Tester : 401 sans auth, 400 UUID invalide, 404 joueur inexistant, 400 self-comparison, 200 succès
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.3 Écrire le test property-based pour la validation UUID
    - Fichier : `test/unit/api/players/common-games/validation.property.test.ts`
    - **Property 6 : Validation UUID** — Pour toute chaîne non-UUID, rejet ; pour tout UUID valide, pas de rejet de format
    - **Validates: Requirements 4.3**

- [ ] 4. Checkpoint — Vérifier que la couche données et API fonctionne
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Composants React de comparaison
  - [ ] 5.1 Créer `src/components/players/CommonGamesIndicator.tsx`
    - Affiche un badge/carte avec le nombre de jeux en commun (icône + "X jeux en commun")
    - États : chargement (skeleton), zéro jeux (message), N jeux (compteur cliquable)
    - Utiliser les traductions i18n (`players.comparison.*`)
    - _Requirements: 2.1, 2.4, 3.3_

  - [ ] 5.2 Créer `src/components/players/CommonGamesList.tsx`
    - Grille de jeux en commun avec image de couverture, titre, genres
    - Chaque jeu est un lien vers `/{locale}/games/{slug}`
    - Pagination si plus de 12 jeux
    - Réutiliser le pattern de `PlayerLibraryGrid` existant
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 5.3 Créer `src/components/players/LibraryComparisonSection.tsx`
    - Composant orchestrateur : fetch des données via `/api/players/[id]/common-games`
    - Affiche `CommonGamesIndicator` puis `CommonGamesList` au clic/expansion
    - Gère les états loading, error, success
    - Masque la section en cas d'erreur (ne casse pas la page profil)
    - _Requirements: 2.1, 7.1, 7.2_

  - [ ] 5.4 Intégrer `LibraryComparisonSection` dans `PlayerDetailsContent.tsx`
    - Ajouter la section entre les stats et la bibliothèque du joueur
    - Passer le `playerId` cible et la `locale`
    - Conditionner l'affichage : utilisateur authentifié ET profil différent du sien
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 5.5 Écrire le test property-based pour la visibilité de l'indicateur
    - Fichier : `test/unit/components/players/libraryComparison.property.test.ts`
    - **Property 3 : Visibilité de l'indicateur** — Pour toute combinaison (isAuthenticated, currentUserId, targetPlayerId), visible ssi authentifié ET ids différents
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 5.6 Écrire le test property-based pour la complétude des données
    - Fichier : `test/unit/components/players/libraryComparison.property.test.ts` (même fichier)
    - **Property 4 : Complétude des données** — Pour tout CommonGame, gameId/slug/title non vides et lien = `/{locale}/games/{slug}`
    - **Validates: Requirements 3.1, 3.2**

- [ ] 6. Traductions i18n
  - [ ] 6.1 Ajouter les clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`
    - Clés sous `players.comparison` : `commonGames`, `noCommonGames`, `gamesInCommon`, `loading`, `error`, `retry`
    - _Requirements: 6.1, 6.2_

- [ ] 7. Checkpoint final — Vérifier l'ensemble
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Lint du code
  - [ ] 8.1 Exécuter `bun run lint`
  - [ ] 8.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [ ] 8.3 Corriger les erreurs et warnings de lint si nécessaire

- [ ] 9. Build de production
  - [ ] 9.1 Exécuter `bun run build`
  - [ ] 9.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 9.3 Corriger les erreurs de build si nécessaire

- [ ] 10. README de la fonctionnalité
  - [ ] 10.1 Créer `docs/README_LIBRARY_COMPARISON.md`
  - [ ] 10.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les tests property-based utilisent `fast-check` avec `bun:test`
- Les tests sont placés dans `test/unit/` conformément aux conventions du projet
