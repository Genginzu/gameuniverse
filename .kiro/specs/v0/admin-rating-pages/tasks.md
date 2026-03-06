# Plan d'implémentation : Pages dédiées pour les notes de classification

## Vue d'ensemble

Implémentation incrémentale : migration DB → types → validation → API → pages et
composants → simplification de l'onglet.

## Tâches

- [x] 1. Migration de base de données et types
  - [x] 1.1 Créer la migration
        `supabase/migrations/20240217000001_rating_translations.sql`
    - Créer la table `rating_translations` avec `id`, `rating_id`,
      `language_code`, `description`
    - Ajouter la contrainte `UNIQUE(rating_id, language_code)`
    - Ajouter `ON DELETE CASCADE` sur `rating_id`
    - Créer l'index `idx_rating_translations_rating_id`
    - Ajouter les `COMMENT ON` pour documenter la table et les colonnes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Mettre à jour `src/types/admin-age-classifications.ts`
    - Ajouter l'interface `RatingTranslation` avec `language_code` et
      `description`
    - Mettre à jour `AdminRating` : remplacer `description: string | null` par
      `translations: RatingTranslation[]`
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Schéma de validation et hook
  - [x] 2.1 Mettre à jour `src/lib/validations/admin-rating-form.ts`
    - Ajouter `ratingTranslationSchema` avec `language_code` (min 1) et
      `description` (min 1, max 500)
    - Ajouter le champ
      `translations: z.array(ratingTranslationSchema).default([])` au schéma
      principal
    - Supprimer le champ `description` du schéma principal
    - Exporter `RatingTranslationData`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Écrire un test property-based pour la validation du schéma
    - **Property 1 : Validation du schéma — données valides acceptées, données
      invalides rejetées**
    - **Validates: Requirements 2.1**
    - Fichier : `test/unit/lib/validations/admin-rating-form.property.test.ts`
    - Utiliser `fast-check` avec Bun test runner, minimum 100 itérations

  - [x] 2.3 Mettre à jour `src/hooks/useRatingForm.ts`
    - Adapter les `defaultValues` pour inclure `translations: []` au lieu de
      `description: ""`
    - Adapter le payload `submitRating` pour envoyer `translations` au lieu de
      `description`
    - _Requirements: 2.1, 4.3, 4.4_

- [x] 3. Checkpoint — Vérifier la compilation
  - Vérifier que le projet compile sans erreurs TypeScript après les changements
    de types et validation. Demander à l'utilisateur si des questions se posent.

- [x] 4. Mise à jour des routes API
  - [x] 4.1 Mettre à jour
        `src/app/api/admin/age-classifications/[id]/ratings/route.ts`
    - GET : joindre `rating_translations` pour chaque note, mapper en tableau
      `translations`
    - POST : valider avec le nouveau schéma, insérer les traductions après la
      note, rollback si échec
    - Supprimer la gestion du champ `description` sur la table `ratings`
    - _Requirements: 4.1, 4.3, 4.6_

  - [x] 4.2 Mettre à jour
        `src/app/api/admin/age-classifications/[id]/ratings/[ratingId]/route.ts`
    - GET : joindre `rating_translations`, mapper en tableau `translations`
    - PUT : supprimer les anciennes traductions puis insérer les nouvelles
      (upsert par delete+insert)
    - DELETE : les traductions sont supprimées par cascade, pas de changement
      nécessaire
    - Supprimer la gestion du champ `description` sur la table `ratings`
    - _Requirements: 4.2, 4.4, 4.5_

- [x] 5. Checkpoint — Vérifier les routes API
  - Vérifier que les routes API compilent et que les types sont cohérents.
    Demander à l'utilisateur si des questions se posent.

- [x] 6. Composant de traductions et formulaire
  - [x] 6.1 Créer
        `src/components/admin/age-classifications/RatingFormTranslations.tsx`
    - Suivre le même patron que `DescriptorFormTranslations.tsx`
    - Utiliser `useFieldArray` sur `translations`
    - Afficher les champs `language_code` et `description` (pas de champ `name`,
      contrairement aux descripteurs)
    - Boutons ajouter/supprimer une traduction
    - _Requirements: 7.1, 7.2_

  - [x] 6.2 Mettre à jour
        `src/components/admin/age-classifications/RatingForm.tsx`
    - Supprimer le champ `description` (Textarea)
    - Ajouter le composant `RatingFormTranslations` à la place
    - Conserver tous les autres champs inchangés
    - _Requirements: 7.3, 7.4_

- [x] 7. Pages dédiées
  - [x] 7.1 Créer
        `src/app/[locale]/admin/age-classifications/[id]/ratings/new/page.tsx`
    - Suivre le patron de
      `src/app/[locale]/admin/age-classifications/new/page.tsx`
    - Utiliser `useRatingForm("create", ratingSystemId)`
    - Bouton retour vers `/admin/age-classifications/[id]/edit`
    - Toast de succès et redirection après création
    - _Requirements: 5.1, 5.4_

  - [x] 7.2 Créer
        `src/app/[locale]/admin/age-classifications/[id]/ratings/[ratingId]/edit/page.tsx`
    - Charger la note via GET
      `/api/admin/age-classifications/[id]/ratings/[ratingId]`
    - Utiliser `useRatingForm("edit", ratingSystemId, ratingId, initialData)`
    - Gérer le cas 404 (note introuvable) avec message d'erreur
    - Bouton retour vers `/admin/age-classifications/[id]/edit`
    - Toast de succès et redirection après modification
    - Pré-remplir les traductions existantes
    - _Requirements: 5.2, 5.3, 5.5, 7.5_

- [x] 8. Simplification de l'onglet Notes
  - [x] 8.1 Mettre à jour
        `src/components/admin/age-classifications/RatingsTab.tsx`
    - Supprimer tout le state et la logique liés au formulaire inline
      (`isCreating`, `editingRating`, `formMode`, `useRatingForm`,
      `handleFormSubmit`, `handleCancel`, `showForm`)
    - Le bouton « Nouvelle note » navigue vers
      `/admin/age-classifications/[id]/ratings/new` via `useRouter`
    - Conserver la recherche, la table et la boîte de dialogue de suppression
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 8.2 Mettre à jour
        `src/components/admin/age-classifications/RatingsTable.tsx`
    - `onEdit` reçoit toujours un `AdminRating` mais le parent navigue vers la
      page d'édition
    - Le clic sur une ligne et le bouton d'édition déclenchent `onEdit`
      (comportement existant conservé)
    - _Requirements: 6.3_

- [x] 9. Exécution des tests complets
  - [x] 9.1 Exécuter `bun run test:all`
  - [x] 9.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 9.3 Corriger les tests en échec si nécessaire

- [x] 10. Lint du code
  - [x] 10.1 Exécuter `bun run lint`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 10.3 Corriger les erreurs de lint si nécessaire

- [x] 11. Build de production
  - [x] 11.1 Exécuter `bun run build`
  - [x] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 11.3 Corriger les erreurs de build si nécessaire

- [x] 12. README de la fonctionnalité
  - [x] 12.1 Mettre à jour `docs/README_ADMIN_AGE_CLASSIFICATION.md`
  - [x] 12.2 Documenter les pages dédiées pour les notes, les traductions de
        description et les changements de navigation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Le patron de traductions suit exactement celui des descripteurs de contenu
  (`DescriptorFormTranslations`)
