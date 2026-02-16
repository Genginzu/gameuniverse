# Plan d'implémentation : Commentaires sur les personnages

## Overview

Implémentation du système de commentaires sur les personnages, côté joueur (onglet commentaires sur la page personnage) et côté admin (liste, édition, suppression). Suit les patterns existants des reviews de jeux.

## Tasks

- [x] 1. Créer la table `character_comments` et les politiques RLS
  - [x] 1.1 Créer la migration `supabase/migrations/20240219000001_character_comments.sql`
    - Table `character_comments` avec colonnes : id (UUID PK), user_id (FK auth.users), character_id (FK characters), content (TEXT avec CHECK), created_at, updated_at, UNIQUE(user_id, character_id)
    - Index sur character_id, user_id, created_at DESC
    - RLS activé avec politiques : lecture publique, insertion par l'auteur, mise à jour par l'auteur
    - _Requirements: 7.3_
  - [x] 1.2 Créer la migration `supabase/migrations/20240219000002_admin_comment_rls.sql`
    - Remplacer la politique UPDATE pour inclure les admins
    - Ajouter la politique DELETE pour les admins uniquement
    - Suivre le pattern de `20240218000001_admin_review_rls.sql`
    - _Requirements: 7.3_

- [x] 2. Créer les types et la validation
  - [x] 2.1 Créer `src/types/comment.ts`
    - Interfaces : Comment, CommentFormData, CommentsResponse
    - _Requirements: 1.2, 3.2_
  - [x] 2.2 Créer `src/types/admin-comments.ts`
    - Interfaces : AdminComment, AdminCommentDetail, FetchAdminCommentsParams
    - _Requirements: 4.2_
  - [x] 2.3 Créer `src/lib/validations/comment.ts`
    - Schéma Zod `commentSchema` : content non-vide après trim, max 1000 caractères
    - Export du type `CommentInput`
    - _Requirements: 2.1, 2.2, 8.1_
  - [x] 2.4 Créer `src/lib/validations/admin-comment-query.ts`
    - Schéma Zod pour les query params admin (page, limit, search, sort_by, sort_order)
    - Suivre le pattern de `admin-review-query.ts`
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 2.5 Écrire le test property-based pour la validation du commentaire
    - Fichier : `test/unit/lib/validations/comment.property.test.ts`
    - **Property 1 : Validation du commentaire — acceptation et rejet**
    - **Validates: Requirements 2.1, 2.2, 5.3, 8.2**
  - [x] 2.6 Écrire les tests unitaires pour la validation du commentaire
    - Fichier : `test/unit/lib/validations/comment.test.ts`
    - Cas limites : vide, espaces, 1000 chars exactement, 1001 chars, contenu valide
    - _Requirements: 2.1, 2.2_

- [x] 3. Checkpoint — Vérifier que les types et la validation sont corrects
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implémenter l'API côté joueur
  - [x] 4.1 Créer `src/lib/services/commentService.ts`
    - Méthodes statiques : fetchComments(characterId), submitComment(characterId, data), updateComment(characterId, data)
    - Suivre le pattern de `reviewService.ts`
    - _Requirements: 1.2, 3.1_
  - [x] 4.2 Créer `src/app/api/comments/route.ts`
    - GET : liste des commentaires d'un personnage avec profils, tri par date décroissante, statut utilisateur courant
    - POST : création d'un commentaire (auth requise, validation commentSchema, vérification unicité)
    - PUT : modification du commentaire de l'utilisateur courant (auth requise, validation)
    - Suivre le pattern de `/api/reviews/route.ts`
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 3.1, 3.4, 7.4_
  - [x] 4.3 Créer `src/hooks/useComments.ts`
    - Hook avec états : comments, totalCount, userHasCommented, userComment, loading, error, submitting
    - Méthodes : fetchComments, submitComment, updateComment
    - Suivre le pattern de `useReviews.ts`
    - _Requirements: 1.2, 1.3, 1.4, 3.1_

- [x] 5. Implémenter les composants joueur
  - [x] 5.1 Créer `src/components/characters/comments/CommentCard.tsx`
    - Affiche le nom du joueur, le texte du commentaire et la date
    - _Requirements: 3.2_
  - [x] 5.2 Créer `src/components/characters/comments/CommentList.tsx`
    - Liste des CommentCard, état vide avec message d'invitation
    - _Requirements: 3.1, 3.3_
  - [x] 5.3 Créer `src/components/characters/comments/CommentForm.tsx`
    - Textarea avec compteur de caractères, validation Zod, mode création et édition
    - _Requirements: 1.2, 1.4, 2.1, 2.2, 2.3_
  - [x] 5.4 Créer `src/components/characters/comments/CharacterCommentsTab.tsx`
    - Onglet principal : total count, formulaire conditionnel (auth/non-auth, commentaire existant), liste
    - Suivre le pattern de `GameReviewsTab.tsx`
    - _Requirements: 1.1, 1.4, 1.5, 3.4_
  - [x] 5.5 Intégrer l'onglet "Commentaires" dans `CharacterDetailsContent.tsx`
    - Ajouter le type `"comments"` au state `activeTab`
    - Ajouter le bouton d'onglet avec icône MessageCircle et le compteur
    - Rendre `CharacterCommentsTab` quand l'onglet est actif
    - _Requirements: 1.1, 3.1_

- [x] 6. Checkpoint — Vérifier le fonctionnement côté joueur
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implémenter l'API admin
  - [x] 7.1 Créer `src/app/api/admin/comments/route.ts`
    - GET : liste paginée avec recherche (nom joueur, nom personnage) et tri
    - Suivre le pattern de `/api/admin/reviews/route.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2_
  - [x] 7.2 Créer `src/app/api/admin/comments/[id]/route.ts`
    - GET : détail d'un commentaire pour édition
    - PUT : modification (validation commentSchema, mise à jour updated_at)
    - DELETE : suppression
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 6.2, 7.1, 7.2_
  - [x] 7.3 Créer `src/hooks/useAdminComments.ts`
    - Hook avec pagination, recherche, tri, suppression
    - Suivre le pattern de `useAdminReviews.ts`
    - _Requirements: 4.1, 4.3, 4.4, 6.2_

- [x] 8. Implémenter les composants admin
  - [x] 8.1 Créer `src/components/admin/comments/AdminCommentsTable.tsx`
    - Table paginée avec recherche, tri, boutons édition/suppression
    - Colonnes : joueur, personnage, extrait contenu, date, actions
    - Suivre le pattern de `AdminReviewsTable.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 8.2 Créer `src/components/admin/comments/DeleteCommentDialog.tsx`
    - Dialogue de confirmation avec nom du joueur et nom du personnage
    - Suivre le pattern de `DeleteReviewDialog.tsx`
    - _Requirements: 6.1, 6.3, 6.4_
  - [x] 8.3 Créer `src/components/admin/comments/AdminCommentForm.tsx`
    - Formulaire d'édition avec textarea, validation commentSchema, notifications
    - Suivre le pattern de `AdminReviewForm.tsx`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 8.4 Créer `src/app/[locale]/admin/comments/page.tsx`
    - Page liste admin avec AdminCommentsTable et DeleteCommentDialog
    - _Requirements: 4.1_
  - [x] 8.5 Créer `src/app/[locale]/admin/comments/[id]/edit/page.tsx`
    - Page édition admin avec AdminCommentForm
    - _Requirements: 5.1_
  - [x] 8.6 Ajouter le lien "Commentaires" dans la navigation admin
    - Ajouter l'entrée dans le menu de navigation admin existant
    - _Requirements: 4.1_

- [x] 9. Checkpoint — Vérifier le fonctionnement côté admin
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Ajouter les traductions i18n
  - Ajouter les clés de traduction pour les commentaires côté joueur et côté admin dans les fichiers de messages next-intl
  - Clés joueur : onglet commentaires, formulaire, liste vide, login prompt, compteur, erreurs
  - Clés admin : colonnes table, recherche, pagination, formulaire édition, dialogue suppression, notifications
  - _Requirements: 1.1, 1.5, 3.3, 4.5, 5.5, 6.1_

- [x] 11. Tests property-based et unitaires complémentaires
  - [x] 11.1 Écrire le test property-based pour le tri par date
    - Fichier : `test/unit/lib/utils/commentSort.property.test.ts`
    - **Property 4 : Tri par date décroissante**
    - **Validates: Requirements 3.1**
  - [x] 11.2 Écrire le test property-based pour la transformation des données
    - Fichier : `test/unit/lib/utils/commentTransform.property.test.ts`
    - **Property 5 : Transformation inclut tous les champs requis**
    - **Property 6 : Total count = longueur de la liste**
    - **Validates: Requirements 3.2, 3.4, 4.2**
  - [x] 11.3 Écrire les tests unitaires pour les composants joueur
    - Fichier : `test/unit/components/characters/CharacterCommentsTab.test.ts`
    - Rendu conditionnel : authentifié/non-authentifié, commentaire existant/nouveau
    - _Requirements: 1.1, 1.4, 1.5, 3.3_
  - [x] 11.4 Écrire les tests unitaires pour l'API comments
    - Fichier : `test/unit/api/comments.test.ts`
    - GET, POST, PUT, validation, erreurs 401/409
    - _Requirements: 1.2, 1.3, 2.1, 7.4_
  - [x] 11.5 Écrire les tests unitaires pour l'API admin comments
    - Fichier : `test/unit/api/admin-comments.test.ts`
    - CRUD admin, sécurité 403
    - _Requirements: 4.1, 5.2, 6.2, 7.1, 7.2_

- [x] 12. Validation finale
  - Exécuter `bun run test:all` et vérifier que tous les tests passent
  - Exécuter `bun run lint` et corriger les éventuelles erreurs
  - Exécuter `bun run build` et vérifier la compilation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les cas spécifiques et les edge cases
