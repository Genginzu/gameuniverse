# Plan d'implémentation : Administration des classifications d'âge

## Vue d'ensemble

Implémentation incrémentale du CRUD admin pour les classifications d'âge, en
suivant le pattern existant (langues, genres). On commence par les types et
validations, puis les API routes, puis les hooks et composants UI, en câblant
chaque couche au fur et à mesure.

## Tâches

- [x] 1. Types partagés et schémas de validation
  - [x] 1.1 Créer `src/types/admin-age-classifications.ts` avec les interfaces
        `AdminRatingSystem`, `AdminRating`, `AdminContentDescriptor`,
        `ContentDescriptorTranslation`, et les types de paramètres de fetch
    - _Exigences : 2.1, 6.1, 10.1_
  - [x] 1.2 Créer `src/lib/validations/admin-rating-system-form.ts` avec le
        schéma Zod pour le formulaire système (code, name, description,
        country_codes, website_url) et le schéma de query params
    - _Exigences : 3.1, 3.3, 14.1_
  - [x] 1.3 Créer `src/lib/validations/admin-rating-form.ts` avec le schéma Zod
        pour le formulaire note (code, display_name, minimum_age, color_hex,
        icon_url, description, sort_order)
    - _Exigences : 7.1, 7.3, 14.1_
  - [x] 1.4 Créer `src/lib/validations/admin-descriptor-form.ts` avec le schéma
        Zod pour le formulaire descripteur (code, icon_url, translations) et le
        schéma de traduction
    - _Exigences : 11.1, 11.3, 14.1_
  - [x] 1.5 Écrire les tests unitaires des schémas Zod dans
        `test/unit/lib/validations/admin-rating-system-form.test.ts`,
        `admin-rating-form.test.ts`, `admin-descriptor-form.test.ts`
    - Tester les cas valides et invalides (code vide, âge négatif, URL invalide,
      code trop long, color_hex invalide)
    - _Exigences : 3.3, 7.3, 14.1_
  - [x] 1.6 Écrire les tests property-based des schémas Zod dans
        `test/unit/lib/validations/admin-age-classifications.property.test.ts`
    - **Propriété 4 : Rejet des doublons de code** — Tester que les schémas
      acceptent les codes valides et rejettent les codes invalides
    - **Propriété 5 : Rejet des données invalides** — Pour toute donnée ne
      respectant pas le schéma, safeParse retourne success: false
    - **Valide : Exigences 3.2, 3.3, 7.2, 7.3, 11.2, 14.1, 14.4**

- [x] 2. API Routes — Systèmes de classification
  - [x] 2.1 Créer `src/app/api/admin/age-classifications/route.ts` avec GET
        (liste paginée, recherche, tri) et POST (création avec validation Zod)
    - Suivre le pattern de `src/app/api/admin/languages/route.ts`
    - Inclure le comptage des notes et descripteurs par système
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 14.1, 14.2_
  - [x] 2.2 Créer `src/app/api/admin/age-classifications/[id]/route.ts` avec GET
        (détail), PUT (modification), DELETE (suppression conditionnelle)
    - Suivre le pattern de `src/app/api/admin/genres/[slug]/route.ts`
    - DELETE vérifie l'absence de notes et descripteurs avant suppression
    - _Exigences : 4.1, 4.2, 4.3, 5.2, 5.3, 14.2, 14.3_

- [x] 3. API Routes — Notes
  - [x] 3.1 Créer `src/app/api/admin/age-classifications/[id]/ratings/route.ts`
        avec GET (liste des notes du système, recherche) et POST (création avec
        validation)
    - _Exigences : 6.1, 6.2, 7.1, 7.2, 7.3, 14.1, 14.2_
  - [x] 3.2 Créer
        `src/app/api/admin/age-classifications/[id]/ratings/[ratingId]/route.ts`
        avec GET, PUT, DELETE (suppression conditionnelle si game_ratings)
    - _Exigences : 8.1, 8.2, 9.2, 9.3, 14.2, 14.3_

- [x] 4. API Routes — Descripteurs de contenu
  - [x] 4.1 Créer
        `src/app/api/admin/age-classifications/[id]/descriptors/route.ts` avec
        GET (liste avec traductions, recherche) et POST (création avec
        traductions)
    - Suivre le pattern de `src/app/api/admin/genres/route.ts` pour la gestion
      des traductions
    - _Exigences : 10.1, 10.2, 11.1, 11.2, 11.3, 14.1, 14.2_
  - [x] 4.2 Créer
        `src/app/api/admin/age-classifications/[id]/descriptors/[descriptorId]/route.ts`
        avec GET, PUT (upsert traductions), DELETE (suppression conditionnelle
        si game_rating_descriptors)
    - _Exigences : 12.1, 12.2, 13.2, 13.3, 14.2, 14.3_

- [x] 5. Checkpoint — Vérifier que toutes les routes API fonctionnent
  - S'assurer que tous les tests passent, demander à l'utilisateur en cas de
    questions.

- [x] 6. Hooks de données
  - [x] 6.1 Créer `src/hooks/useAdminRatingSystems.ts`
    - _Exigences : 2.1, 2.2, 2.3, 2.4_
  - [x] 6.2 Créer `src/hooks/useRatingSystemForm.ts`
    - _Exigences : 3.1, 4.1, 4.2_
  - [x] 6.3 Créer `src/hooks/useAdminRatings.ts`
    - _Exigences : 6.1, 6.2_
  - [x] 6.4 Créer `src/hooks/useRatingForm.ts`
    - _Exigences : 7.1, 8.1, 8.2_
  - [x] 6.5 Créer `src/hooks/useAdminDescriptors.ts`
    - _Exigences : 10.1, 10.2_
  - [x] 6.6 Créer `src/hooks/useDescriptorForm.ts`
    - _Exigences : 11.1, 12.1, 12.2_

- [x] 7. Composants UI — Systèmes de classification
  - [x] 7.1 Créer `RatingSystemsTable.tsx` — Tableau avec recherche, tri,
        pagination
    - _Exigences : 2.1, 2.2, 2.3, 2.4_
  - [x] 7.2 Créer `RatingSystemForm.tsx` — Formulaire création/édition système
    - _Exigences : 3.1, 3.3, 4.1, 4.2, 15.1, 15.2_
  - [x] 7.3 Créer `DeleteRatingSystemDialog.tsx` — Dialogue de confirmation
        suppression
    - _Exigences : 5.1, 5.2, 5.3, 15.1, 15.2_

- [x] 8. Composants UI — Notes
  - [x] 8.1 Créer `src/components/admin/age-classifications/RatingsTable.tsx` —
        Tableau des notes d'un système avec recherche
    - _Exigences : 6.1, 6.2_
  - [x] 8.2 Créer `src/components/admin/age-classifications/RatingForm.tsx` —
        Formulaire création/édition note
    - _Exigences : 7.1, 7.3, 8.1, 8.2, 15.1, 15.2_
  - [x] 8.3 Créer
        `src/components/admin/age-classifications/DeleteRatingDialog.tsx` —
        Dialogue de confirmation suppression note
    - _Exigences : 9.1, 9.2, 9.3, 15.1, 15.2_

- [x] 9. Composants UI — Descripteurs de contenu
  - [x] 9.1 Créer
        `src/components/admin/age-classifications/DescriptorsTable.tsx` —
        Tableau des descripteurs avec recherche
    - _Exigences : 10.1, 10.2_
  - [x] 9.2 Créer `src/components/admin/age-classifications/DescriptorForm.tsx`
        — Formulaire création/édition descripteur
    - _Exigences : 11.1, 11.2, 12.1, 12.2, 15.1, 15.2_
  - [x] 9.3 Créer
        `src/components/admin/age-classifications/DescriptorFormTranslations.tsx`
        — Section traductions, suivant le pattern `GenreFormTranslations`
    - _Exigences : 11.3, 12.2_
  - [x] 9.4 Créer
        `src/components/admin/age-classifications/DeleteDescriptorDialog.tsx` —
        Dialogue de confirmation suppression descripteur
    - _Exigences : 13.1, 13.2, 13.3, 15.1, 15.2_

- [x] 10. Pages Next.js et navigation
  - [x] 10.1 Créer `src/app/[locale]/admin/age-classifications/page.tsx` — Page
        liste des systèmes, utilisant `RatingSystemsTable` et
        `useAdminRatingSystems`
    - _Exigences : 2.1_
  - [x] 10.2 Créer `src/app/[locale]/admin/age-classifications/new/page.tsx` —
        Page création système, utilisant `RatingSystemForm`
    - _Exigences : 3.1_
  - [x] 10.3 Créer
        `src/app/[locale]/admin/age-classifications/[id]/edit/page.tsx` — Page
        édition système avec onglets pour notes et descripteurs
    - _Exigences : 4.1, 6.1, 10.1_
  - [x] 10.4 Ajouter le lien « Classifications d'âge » dans `AdminSidebar.tsx`
        sous la catégorie « Jeux », avec l'icône `FaShieldAlt`
    - _Exigences : 1.1_

- [x] 11. Checkpoint — Vérifier l'intégration complète
  - S'assurer que tous les tests passent, demander à l'utilisateur en cas de
    questions.

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

- [x] 15. README de la fonctionnalité
  - [x] 15.1 Créer `docs/README_ADMIN_AGE_CLASSIFICATION.md`
  - [x] 15.2 Documenter ce qui a été implémenté, comment y accéder, les
        prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés de correction universelles
- Les tests unitaires valident les cas spécifiques et les cas limites
- Aucune migration de base de données n'est nécessaire — les tables existent
  déjà
