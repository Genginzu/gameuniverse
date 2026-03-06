# Plan d'implémentation : Gestion Admin des Avis

## Vue d'ensemble

Implémentation incrémentale de la gestion admin des avis : migration RLS, types,
validation, routes API, hook, composants UI, pages, puis tests. Chaque étape
s'appuie sur la précédente.

## Tasks

- [x] 1. Migration RLS et types de base
  - [x] 1.1 Créer la migration Supabase
        `supabase/migrations/20240218000001_admin_review_rls.sql`
    - Ajouter les politiques RLS permettant aux admins de modifier et supprimer
      toute review
    - Utiliser `auth.jwt() -> 'user_metadata' ->> 'role'` pour vérifier le rôle
      admin
    - _Requirements: 4.3_
  - [x] 1.2 Créer le fichier de types `src/types/admin-reviews.ts`
    - Définir `AdminReview`, `AdminReviewDetail`, `FetchAdminReviewsParams`
    - _Requirements: 1.2, 2.1_
  - [x] 1.3 Créer le schéma de validation
        `src/lib/validations/admin-review-query.ts`
    - Définir `adminReviewQuerySchema` avec les paramètres page, limit, search,
      sort_by, sort_order
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Routes API admin reviews
  - [x] 2.1 Créer `src/app/api/admin/reviews/route.ts` (GET liste paginée)
    - Appeler `requireAdmin()` en début de handler
    - Valider les paramètres avec `adminReviewQuerySchema`
    - Joindre `profiles` et `game_translations` pour récupérer nom joueur et
      titre jeu
    - Implémenter pagination, recherche (par nom joueur ou titre jeu) et tri
    - Retourner `{ reviews: AdminReview[], pagination: PaginationInfo }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1_
  - [x] 2.2 Créer `src/app/api/admin/reviews/[id]/route.ts` (GET, PUT, DELETE)
    - GET : retourner `AdminReviewDetail` avec jointures profil et jeu
    - PUT : valider avec `reviewSchema` existant, mettre à jour la review,
      retourner la review mise à jour
    - DELETE : supprimer la review, retourner `{ success: true }`
    - Chaque handler appelle `requireAdmin()`
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.2, 4.1, 5.1, 5.2_

- [x] 3. Checkpoint — Vérifier les routes API
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Hook et composants admin
  - [x] 4.1 Créer le hook `src/hooks/useAdminReviews.ts`
    - Suivre le pattern de `useAdminGames` : fetch paginé, delete, refetch
    - Gérer les états loading, error, pagination
    - _Requirements: 1.1, 3.2, 3.3_
  - [x] 4.2 Créer `src/components/admin/reviews/AdminReviewsTable.tsx`
    - Table paginée avec colonnes : joueur, jeu, note, extrait contenu, date
    - Recherche par texte, tri par colonnes, boutons éditer/supprimer
    - Suivre le pattern de `AdminGamesTable`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 4.3 Créer `src/components/admin/reviews/DeleteReviewDialog.tsx`
    - Dialogue de confirmation avec nom du joueur et titre du jeu
    - Boutons confirmer/annuler, état de chargement pendant la suppression
    - _Requirements: 3.1, 3.3, 3.4_
  - [x] 4.4 Créer `src/components/admin/reviews/AdminReviewForm.tsx`
    - Formulaire d'édition avec react-hook-form + Zod (`reviewSchema` existant)
    - Réutiliser `RichTextEditor`, `RatingInput`, `ReviewPointsList` existants
    - Afficher les erreurs de validation inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1_

- [x] 5. Pages admin
  - [x] 5.1 Créer `src/app/[locale]/admin/reviews/page.tsx`
    - Page liste utilisant `useAdminReviews` et `AdminReviewsTable`
    - Bouton d'édition naviguant vers `/admin/reviews/[id]/edit`
    - Dialogue de suppression avec `DeleteReviewDialog`
    - _Requirements: 1.1, 3.1_
  - [x] 5.2 Créer `src/app/[locale]/admin/reviews/[id]/edit/page.tsx`
    - Charger la review via GET `/api/admin/reviews/[id]`
    - Afficher `AdminReviewForm` pré-rempli
    - Soumettre via PUT, afficher notification succès, rediriger vers la liste
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 6. Ajouter le lien "Avis" dans la navigation admin
  - Ajouter l'entrée dans le layout/sidebar admin pour accéder à
    `/admin/reviews`
  - _Requirements: 1.1_

- [x] 7. Checkpoint — Vérifier l'intégration UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Tests
  - [x] 8.1 Écrire les tests unitaires pour `adminReviewQuerySchema`
    - Tester les valeurs par défaut, les bornes, les paramètres invalides
    - Emplacement : `test/unit/lib/validations/admin-review-query.test.ts`
    - _Requirements: 1.1_
  - [x] 8.2 Écrire le test property-based pour la validation des paramètres de
        requête
    - **Property 1: Pagination correcte**
    - **Validates: Requirements 1.1**
    - Emplacement :
      `test/unit/lib/validations/admin-review-query.property.test.ts`
  - [x] 8.3 Écrire les tests isolés pour les routes API admin reviews
    - Tester GET liste (pagination, recherche, tri, état vide)
    - Tester GET/PUT/DELETE par id (succès, 404, validation)
    - Mocker `requireAdmin` et Supabase avec `mock.module()`
    - Emplacement : `test/isolated/api/admin/reviews.test.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 3.2_
  - [x] 8.4 Écrire le test property-based pour le rejet d'accès non-admin
    - **Property 7: Rejet d'accès non-admin**
    - **Validates: Requirements 4.1, 4.2**
    - Emplacement : `test/isolated/api/admin/reviews.property.test.ts`
  - [x] 8.5 Écrire les tests unitaires pour les composants admin reviews
    - Tester `AdminReviewsTable` : rendu, état vide, recherche, tri
    - Tester `DeleteReviewDialog` : rendu, confirmation, annulation
    - Tester `AdminReviewForm` : rendu pré-rempli, soumission, erreurs
    - Emplacement : `test/unit/components/admin/reviews/`
    - _Requirements: 1.2, 1.5, 2.1, 2.4, 3.1_

- [x] 9. Validation finale
  - Exécuter `bun run test:all` et vérifier que tous les tests passent
  - Exécuter `bun run lint` et corriger les erreurs éventuelles
  - Exécuter `bun run build` et vérifier la compilation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. README de la fonctionnalité
  - [x] 10.1 Créer `docs/README_ADMIN_REVIEW_MANAGEMENT.md`
  - [x] 10.2 Documenter la fonctionnalité : description, accès (routes/URLs),
        prérequis (rôle admin), et utilisation (liste, édition, suppression des
        avis)

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les composants `RichTextEditor`, `RatingInput` et `ReviewPointsList` existants
  sont réutilisés
- Le schéma de validation `reviewSchema` existant est réutilisé pour le
  formulaire admin
- Les tests isolés utilisent `mock.module()` et doivent être dans
  `test/isolated/`
