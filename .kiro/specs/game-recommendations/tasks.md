# Implementation Plan: Game Recommendations

## Overview

Implémentation incrémentale du système de recommandations. On commence par les types et les fonctions de scoring pures (testables isolément), puis le service d'orchestration, les API routes, et enfin les composants UI.

## Tasks

- [ ] 1. Types et configuration
  - [ ] 1.1 Créer `src/types/recommendation.ts` avec les interfaces `GameRecommendation`, `RecommendationsResponse`, `PersonalRecommendationsResponse`, `ScoringWeights`, `CandidateScores`
    - Définir toutes les interfaces du Data Models section du design
    - _Requirements: 5.4, 9.1_

- [ ] 2. Fonctions de scoring pures
  - [ ] 2.1 Créer `src/lib/services/recommendation/genreScorer.ts`
    - Implémenter `computeGenreScore` avec le coefficient de Jaccard
    - Exporter l'interface `GenreScoreInput`
    - _Requirements: 1.1, 1.2_
  - [ ]* 2.2 Écrire le property test pour genreScorer
    - **Property 1: Jaccard coefficient correctness**
    - **Validates: Requirements 1.1, 1.2**
    - Fichier: `test/unit/lib/services/recommendation/genreScorer.property.test.ts`
  - [ ] 2.3 Créer `src/lib/services/recommendation/collaborativeScorer.ts`
    - Implémenter `computeCollaborativeScore` avec co-occurrence normalisée
    - Exporter l'interface `CollaborativeScoreInput`
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 2.4 Écrire le property test pour collaborativeScorer
    - **Property 3: Collaborative score with status filtering**
    - **Validates: Requirements 2.1, 2.3, 2.2**
    - Fichier: `test/unit/lib/services/recommendation/collaborativeScorer.property.test.ts`
  - [ ] 2.5 Créer `src/lib/services/recommendation/reviewScorer.ts`
    - Implémenter `computeReviewScore` avec discount de confiance
    - Exporter l'interface `ReviewScoreInput`
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 2.6 Écrire le property test pour reviewScorer
    - **Property 4: Review score confidence discount**
    - **Validates: Requirements 3.3, 3.2**
    - Fichier: `test/unit/lib/services/recommendation/reviewScorer.property.test.ts`
  - [ ] 2.7 Créer `src/lib/services/recommendation/scoreCombiner.ts`
    - Implémenter `computeCombinedScore` comme somme pondérée normalisée
    - Exporter les constantes de poids par défaut `DEFAULT_WEIGHTS`
    - _Requirements: 4.1, 3.1_
  - [ ]* 2.8 Écrire le property test pour scoreCombiner
    - **Property 5: Combined score is a weighted sum**
    - **Validates: Requirements 4.1, 3.1**
    - Fichier: `test/unit/lib/services/recommendation/scoreCombiner.property.test.ts`
  - [ ] 2.9 Créer `src/lib/services/recommendation/index.ts` barrel export
    - Réexporter toutes les fonctions et interfaces de scoring
    - _Requirements: aucun (organisation du code)_

- [ ] 3. Checkpoint - Vérifier les fonctions de scoring
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Service de recommandation
  - [ ] 4.1 Créer `src/lib/services/recommendationService.ts`
    - Implémenter `getRecommendationsForGame`: fetch genres/co-occurrences/reviews depuis Supabase, calculer les scores, trier, filtrer, limiter
    - Implémenter `getPersonalRecommendations`: agréger les recommandations de tous les jeux de la bibliothèque, dédupliquer avec score max
    - Implémenter le cache in-memory avec TTL configurable
    - _Requirements: 1.3, 4.2, 4.3, 4.4, 7.1, 7.2, 8.2_
  - [ ]* 4.2 Écrire les property tests pour le service
    - **Property 2: Source game exclusion**
    - **Property 6: Output sorted by descending score**
    - **Property 7: Output respects limit**
    - **Property 8: Library exclusion**
    - **Property 9: Deduplication keeps max score**
    - **Property 10: Recommendation serialization round-trip**
    - **Property 11: Response contains required fields**
    - **Validates: Requirements 1.3, 4.2, 4.3, 4.4, 5.4, 7.2, 9.1, 9.2**
    - Fichier: `test/unit/lib/services/recommendation/recommendationService.property.test.ts`
  - [ ]* 4.3 Écrire les unit tests pour le service
    - Tester les cas limites: 0 candidats, bibliothèque vide, cache hit/miss
    - Mocker les appels Supabase
    - Fichier: `test/unit/lib/services/recommendationService.test.ts`
    - _Requirements: 7.3, 8.2, 8.3_

- [ ] 5. Checkpoint - Vérifier le service
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. API Routes
  - [ ] 6.1 Créer `src/app/api/games/[slug]/recommendations/route.ts`
    - Implémenter GET handler: résoudre le slug en gameId, appeler `getRecommendationsForGame`, gérer l'authentification optionnelle pour l'exclusion de la bibliothèque
    - Retourner 404 si le slug n'existe pas, 500 en cas d'erreur serveur
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ] 6.2 Créer `src/app/api/recommendations/personal/route.ts`
    - Implémenter GET handler: vérifier l'authentification, appeler `getPersonalRecommendations`
    - Retourner 401 si non authentifié
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 6.3 Écrire les unit tests pour les API routes
    - Tester les status codes (200, 401, 404, 500)
    - Mocker le RecommendationService
    - Fichier: `test/unit/lib/services/recommendationService.test.ts` (section API)
    - _Requirements: 5.1, 5.2, 7.1_

- [ ] 7. Composants UI
  - [ ] 7.1 Créer `src/hooks/useRecommendations.ts`
    - Hook pour fetch les recommandations d'un jeu via l'API
    - Gérer les états loading, error, data
    - _Requirements: 6.1, 6.2_
  - [ ] 7.2 Créer `src/components/games/RecommendationSection.tsx`
    - Section avec titre localisé « Si vous aimez ce jeu… »
    - États: loading (skeletons), empty (message), data (grille de GameCard)
    - Réutiliser le composant `GameCard` existant
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 7.3 Intégrer `RecommendationSection` dans `GameDetailsContent.tsx`
    - Ajouter la section après les tabs existants
    - Passer le game ID et la locale
    - _Requirements: 6.1_
  - [ ]* 7.4 Écrire les unit tests pour le hook et le composant
    - Tester les états loading, empty, error, data
    - Fichier: `test/unit/hooks/useRecommendations.test.ts` et `test/unit/components/games/RecommendationSection.test.tsx`
    - _Requirements: 6.2, 6.3_

- [ ] 8. Recommandations personnalisées UI
  - [ ] 8.1 Créer `src/hooks/usePersonalRecommendations.ts`
    - Hook pour fetch les recommandations personnalisées via l'API
    - _Requirements: 7.1_
  - [ ] 8.2 Créer `src/components/games/PersonalRecommendationSection.tsx`
    - Section pour le profil joueur avec message si bibliothèque vide
    - Réutiliser `GameCard`
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 8.3 Intégrer dans la page profil du joueur
    - Ajouter la section de recommandations personnalisées
    - _Requirements: 7.1_

- [ ] 9. Final checkpoint - Vérifier l'ensemble
  - Exécuter `bun run test:all`
  - Vérifier que tous les tests passent (parallèles + isolés)
  - Corriger les tests en échec si nécessaire

- [ ] 10. Lint du code
  - [ ] 10.1 Exécuter `bun run lint`
  - [ ] 10.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [ ] 10.3 Corriger les erreurs de lint si nécessaire

- [ ] 11. Build de production
  - [ ] 11.1 Exécuter `bun run build`
  - [ ] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 11.3 Corriger les erreurs de build si nécessaire

- [ ] 12. README de la fonctionnalité
  - [ ] 12.1 Créer `docs/README_GAME_RECOMMENDATIONS.md`
  - [ ] 12.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Les fonctions de scoring sont pures et ne dépendent pas de Supabase, ce qui facilite le testing
- Le composant `GameCard` existant est réutilisé pour les cartes de recommandation
- fast-check doit être installé comme dépendance de développement (`bun add -d fast-check`)
- Aucune migration SQL n'est nécessaire — le système exploite les tables existantes
