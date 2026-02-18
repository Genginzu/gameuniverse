# Plan d'implémentation : Review Votes

## Vue d'ensemble

Implémentation incrémentale du système de votes sur les avis : migration DB → fonctions pures → API → service client → hook → composant UI → intégration.

## Tâches

- [-] 1. Créer la migration Supabase pour la table `review_votes`
  - Créer `supabase/migrations/20240221000001_review_votes.sql`
  - Table avec colonnes : id, user_id, review_id, vote_type, created_at
  - Contrainte UNIQUE(user_id, review_id), CHECK vote_type IN ('helpful', 'not_helpful')
  - FK CASCADE vers auth.users et game_reviews
  - Index sur review_id et user_id
  - Politiques RLS : SELECT public, INSERT/UPDATE/DELETE limité au propriétaire
  - COMMENT ON pour documenter la table et les colonnes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Types et fonctions pures
  - [~] 2.1 Étendre les types dans `src/types/review.ts`
    - Ajouter `VoteType`, `ReviewVoteCounts`, `ReviewWithVotes`
    - Mettre à jour `ReviewsResponse` pour utiliser `ReviewWithVotes[]`
    - _Requirements: 2.1, 5.5_

  - [~] 2.2 Créer les fonctions utilitaires pures dans `src/lib/utils/reviewVotes.ts`
    - Implémenter `resolveVoteAfterClick(currentVote, clickedType)`
    - Implémenter `computeVoteCountsAfterChange(counts, previousVote, newVote)`
    - _Requirements: 1.1, 1.2, 1.3, 2.2_

  - [~] 2.3 Écrire les tests property-based pour les fonctions pures
    - Créer `test/unit/lib/utils/reviewVotes.property.test.ts`
    - **Property 1: Cohérence des transitions de vote**
    - **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**

  - [~] 2.4 Écrire les tests unitaires pour les fonctions pures
    - Créer `test/unit/lib/utils/reviewVotes.test.ts`
    - Tester les cas spécifiques et edge cases
    - _Requirements: 1.1, 1.2, 1.3_

- [~] 3. Checkpoint — Vérifier que les tests des fonctions pures passent
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. API route pour les votes
  - [~] 4.1 Créer `src/app/api/review-votes/route.ts`
    - Implémenter POST (upsert/toggle) et DELETE
    - Validation : auth (401), review existe (404), pas son propre avis (403), vote_type valide (400)
    - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3, 5.4_

  - [~] 4.2 Étendre GET `/api/reviews` pour inclure les données de vote
    - Joindre les compteurs de votes par review (agrégation)
    - Inclure le vote de l'utilisateur courant pour chaque review
    - Retourner `ReviewWithVotes[]`
    - _Requirements: 5.5_

  - [~] 4.3 Écrire le test property-based pour la complétude de la réponse GET
    - Créer `test/unit/lib/services/reviewVotes.property.test.ts`
    - **Property 3: Complétude des données de vote dans la réponse GET**
    - **Validates: Requirements 5.5**

- [ ] 5. Service client et hook
  - [~] 5.1 Créer `src/lib/services/reviewVoteService.ts`
    - Méthodes statiques : `submitVote(reviewId, voteType)`, `removeVote(reviewId)`
    - Suit le pattern de `ReviewService`
    - _Requirements: 5.1, 5.2_

  - [~] 5.2 Créer `src/hooks/useReviewVote.ts`
    - Mise à jour optimiste avec `resolveVoteAfterClick` et `computeVoteCountsAfterChange`
    - Rollback en cas d'erreur API
    - Blocage du vote sur sa propre review
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2_

  - [~] 5.3 Écrire le test property-based pour la prévention du self-vote
    - Créer `test/unit/hooks/useReviewVote.property.test.ts`
    - **Property 2: Prévention du vote sur son propre avis**
    - **Validates: Requirements 3.2**

  - [~] 5.4 Écrire les tests unitaires pour le hook
    - Créer `test/unit/hooks/useReviewVote.test.ts`
    - Tester la logique optimiste et le rollback
    - _Requirements: 1.1, 1.2, 1.3, 2.2_

- [~] 6. Checkpoint — Vérifier que tous les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Composant UI et intégration
  - [~] 7.1 Créer `src/components/games/reviews/ReviewVoteButtons.tsx`
    - Boutons ThumbsUp/ThumbsDown avec compteurs
    - Mise en surbrillance du vote actif
    - Désactivé si non authentifié ou auteur de la review
    - Utilise le hook `useReviewVote`
    - _Requirements: 1.4, 2.1, 2.3, 3.1, 3.2_

  - [~] 7.2 Intégrer `ReviewVoteButtons` dans `ReviewCard.tsx`
    - Ajouter les boutons de vote dans le footer de la card
    - Passer les props `reviewId`, `reviewUserId`, `initialCounts`, `initialUserVote`
    - Mettre à jour les props pour accepter `ReviewWithVotes`
    - _Requirements: 2.1, 1.4_

- [~] 8. Checkpoint final — Vérifier que tous les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [~] 9. Lint du code
  - Exécuter `bun run lint`
  - Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - Corriger les erreurs et warnings si nécessaire

- [~] 10. Build de production
  - Exécuter `bun run build`
  - Vérifier qu'il n'y a pas d'erreurs de compilation
  - Corriger les erreurs de build si nécessaire

- [~] 11. README de la fonctionnalité
  - Créer `docs/README_REVIEW_VOTES.md`
  - Documenter : description, accès (routes, navigation), prérequis, utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based utilisent `fast-check` avec minimum 100 itérations
- Les tests unitaires utilisent le test runner Bun (pas Vitest)
- Tous les tests sont dans le répertoire `test/` centralisé
