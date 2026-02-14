# Plan d'implémentation : Game Reviews

## Vue d'ensemble

Implémentation incrémentale de la fonctionnalité "Avis" : migration DB, types,
validation, API, composants UI, puis intégration dans l'onglet existant.

## Tasks

- [x] 1. Créer la migration Supabase et les types
  - [x] 1.1 Créer la migration SQL `game_reviews` avec contraintes et RLS
    - Créer `supabase/migrations/XXXXXX_game_reviews.sql`
    - Table `game_reviews` avec colonnes : id, user_id, game_id, rating,
      content, positive_points, negative_points, created_at, updated_at
    - Contrainte UNIQUE(user_id, game_id), CHECK rating 0-20
    - Policies RLS : lecture publique, insertion/update par l'auteur
    - _Requirements: 1.4, 2.1_
  - [x] 1.2 Créer les types TypeScript dans `src/types/review.ts`
    - Interfaces : Review, ReviewFormData, ReviewsResponse
    - _Requirements: 5.2_

- [x] 2. Créer le schéma de validation et l'utilitaire stripHtmlTags
  - [x] 2.1 Créer `src/lib/validations/review.ts` avec le schéma Zod
    - Fonction `stripHtmlTags` pour extraire le texte brut du HTML
    - Schéma `reviewSchema` : rating (entier 0-20), content (HTML non vide,
      texte brut ≤ 5000), positivePoints (tableau 0-10, chaque élément non vide
      ≤ 200), negativePoints (idem)
    - Export du type `ReviewInput`
    - _Requirements: 2.1, 2.2, 2.3, 3.3, 3.4, 4.3, 4.4, 4.5, 6.1_
  - [x] 2.2 Écrire les property tests pour la validation du rating
    - **Property 1: Validation du rating — valeurs invalides rejetées**
    - **Validates: Requirements 2.2, 2.3**
  - [x] 2.3 Écrire les property tests pour la validation du contenu HTML
    - **Property 2: Contenu HTML vide rejeté**
    - **Property 3: Contenu HTML trop long rejeté**
    - **Validates: Requirements 3.3, 3.4**
  - [x] 2.4 Écrire les property tests pour la validation des points
    - **Property 4: Points positifs/négatifs invalides rejetés**
    - **Property 5: Limite du nombre de points respectée**
    - **Validates: Requirements 4.3, 4.4, 4.5**
  - [x] 2.5 Écrire le property test round-trip pour stripHtmlTags
    - **Property 9: Round-trip stripHtmlTags**
    - **Validates: Requirements 3.3, 3.4**

- [x] 3. Checkpoint — Vérifier que la validation fonctionne
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Créer la route API reviews
  - [x] 4.1 Créer `src/app/api/reviews/route.ts` avec GET et POST
    - GET : récupérer les reviews d'un jeu (query param `gameId`), joindre les
      profils pour le nom/avatar, calculer la moyenne, vérifier si l'utilisateur
      a déjà reviewé
    - POST : valider avec `reviewSchema`, insérer dans `game_reviews`, appeler
      `POST /api/library` pour ajouter le jeu à la bibliothèque si pas déjà
      présent
    - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.4, 6.1, 6.3_
  - [x] 4.2 Écrire le property test pour le tri des reviews
    - **Property 7: Tri des reviews par date décroissante**
    - **Validates: Requirements 5.1**
  - [x] 4.3 Écrire le property test pour le calcul de la note moyenne
    - **Property 8: Calcul correct de la note moyenne**
    - **Validates: Requirements 5.4**

- [x] 5. Créer le service et le hook reviews
  - [x] 5.1 Créer `src/lib/services/reviewService.ts`
    - Méthodes : `fetchReviews(gameId)`, `submitReview(gameId, data)`
    - _Requirements: 1.2, 5.1_
  - [x] 5.2 Créer `src/hooks/useReviews.ts`
    - État : reviews, averageRating, loading, error, userHasReviewed
    - Actions : fetchReviews, submitReview avec gestion optimiste
    - _Requirements: 1.2, 5.1, 5.4_

- [x] 6. Checkpoint — Vérifier que l'API et le service fonctionnent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Créer les composants UI de base
  - [x] 7.1 Installer Tiptap et créer
        `src/components/games/reviews/RichTextEditor.tsx`
    - Installer `@tiptap/react`, `@tiptap/starter-kit`
    - Wrapper Tiptap avec toolbar (gras, italique, liste à puces, liste
      numérotée)
    - _Requirements: 3.1, 3.2_
  - [x] 7.2 Créer `src/components/games/reviews/RatingInput.tsx`
    - Input numérique avec bornes 0-20, feedback visuel
    - _Requirements: 2.1_
  - [x] 7.3 Créer `src/components/games/reviews/ReviewPointsList.tsx`
    - Liste dynamique d'inputs pour ajouter/supprimer des points
    - Props : type ("positive" | "negative"), maxPoints, onChange
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Créer les composants d'affichage et le formulaire
  - [x] 8.1 Créer `src/components/games/reviews/ReviewCard.tsx`
    - Affichage d'une review : nom joueur, avatar, note, contenu enrichi, points
      +/-
    - _Requirements: 5.2, 3.5_
  - [x] 8.2 Créer `src/components/games/reviews/ReviewForm.tsx`
    - Formulaire react-hook-form + Zod resolver
    - Intègre RichTextEditor, RatingInput, ReviewPointsList
    - Gestion erreurs inline, préservation données en cas d'erreur
    - _Requirements: 1.1, 1.2, 6.1, 6.2_
  - [x] 8.3 Créer `src/components/games/reviews/ReviewList.tsx`
    - Liste des ReviewCard, état vide avec message d'invitation
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Intégrer dans l'onglet Avis existant
  - [x] 9.1 Créer `src/components/games/reviews/GameReviewsTab.tsx`
    - Orchestrateur : affiche note moyenne, ReviewForm (si authentifié),
      ReviewList
    - Message de connexion si non authentifié
    - _Requirements: 1.1, 5.4, 6.3_
  - [x] 9.2 Modifier `src/components/games/details/GameDetailsTabs.tsx`
    - Remplacer le placeholder "coming soon" de l'onglet reviews par
      `GameReviewsTab`
    - Passer `game.id` et `game.title` en props
    - _Requirements: 1.1, 5.1_
  - [x] 9.3 Écrire les tests unitaires pour les composants reviews
    - Tester ReviewCard, ReviewForm, ReviewList, GameReviewsTab
    - Tester les cas : authentifié/non authentifié, liste vide, erreurs de
      validation
    - _Requirements: 1.1, 5.2, 5.3, 6.2, 6.3_

- [x] 10. Ajouter les traductions i18n
  - Ajouter les clés de traduction FR et EN pour les reviews
  - Labels du formulaire, messages d'erreur, textes de l'onglet
  - _Requirements: tous_

- [x] 11. Checkpoint final — Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Exécution des tests complets
  - [x] 12.1 Exécuter `bun run test:all`
  - [x] 12.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 12.3 Corriger les tests en échec si nécessaire

- [x] 13. Lint du code
  - [x] 13.1 Exécuter `bun run lint`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 13.3 Corriger les erreurs de lint si nécessaire

- [x] 14. Build de production
  - [x] 14.1 Exécuter `bun run build`
  - [x] 14.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 14.3 Corriger les erreurs de build si nécessaire

- [ ] 15. README de la fonctionnalité
  - [ ] 15.1 Créer `docs/README_GAME_REVIEWS.md`
  - [ ] 15.2 Documenter ce qui a été implémenté, comment y accéder, les
        prérequis et l'utilisation

## Notes

- Les tasks marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  rapide
- Chaque task référence les requirements spécifiques pour la traçabilité
- Les property tests utilisent `fast-check` (déjà installé) avec le test runner
  Bun
- Les tests API avec `mock.module()` vont dans `test/isolated/api/reviews/`
- Les tests unitaires vont dans `test/unit/`
