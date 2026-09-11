# Plan d'implémentation : Gestion admin des genres

## Vue d'ensemble

Implémentation du CRUD admin des genres en suivant les patterns existants
(langues admin). L'ordre des tâches assure une progression incrémentale : types
→ validation → API → hooks → composants → pages → tests.

## Tâches

- [x] 1. Types et validation
  - [x] 1.1 Créer les types admin genres dans `src/types/admin-genres.ts`
    - Définir `AdminGenre`, `GenreTranslation`, `FetchGenresParams`
    - _Requirements: 1.1, 2.1, 3.1_
  - [x] 1.2 Créer le schéma Zod dans `src/lib/validations/admin-genre-form.ts`
    - Schéma `genreTranslationSchema` (language_code, name, description)
    - Schéma `adminGenreFormSchema` (slug + translations)
    - Exporter le type `GenreFormData`
    - _Requirements: 2.4, 2.5, 2.6, 5.1_
  - [x] 1.3 Écrire les tests property-based pour la validation du slug
    - **Property 5 : Validation du slug**
    - **Validates: Requirements 2.4**
    - Fichier : `test/unit/lib/validations/admin-genre-form.property.test.ts`
  - [x] 1.4 Écrire les tests property-based pour la validation des traductions
    - **Property 6 : Validation des traductions**
    - **Validates: Requirements 2.5, 2.6**
    - Fichier : `test/unit/lib/validations/admin-genre-form.property.test.ts`

- [x] 2. Routes API admin genres
  - [x] 2.1 Créer les routes GET et POST `/api/admin/genres`
    - GET : pagination, recherche (slug + nom traduit), tri, jointure
      game_genres pour compteur
    - POST : validation Zod, insertion genre + traductions, gestion doublon slug
      (409)
    - Protection `requireAdmin()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 5.2_
  - [x] 2.2 Créer les routes GET/PUT/DELETE `/api/admin/genres/[slug]`
    - GET : genre avec toutes les traductions + gameCount
    - PUT : validation Zod, upsert traductions, slug immuable
    - DELETE : vérification usage game_genres, support `?force=true`,
      suppression cascade
    - Protection `requireAdmin()`
    - _Requirements: 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 5.2, 6.2_
  - [x] 2.3 Écrire les tests PBT pour le rejet des données invalides par l'API
    - **Property 9 : Rejet des données invalides par l'API**
    - **Validates: Requirements 5.2**
    - Fichier : `test/isolated/api/admin/genres/admin-genres.property.test.ts`

- [x] 3. Checkpoint — Vérifier que les routes API fonctionnent

- [x] 4. Hooks React
  - [x] 4.1 Créer le hook `useAdminGenres` dans `src/hooks/useAdminGenres.ts`
    - État : genres, pagination, loading, error
    - Actions : fetchGenres, deleteGenre, checkGenreUsage, refetch
    - Même pattern que `useAdminLanguages`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2_
  - [x] 4.2 Créer le hook `useGenreForm` dans `src/hooks/useGenreForm.ts`
    - Intégration react-hook-form + zodResolver
    - Récupération des langues supportées
    - Soumission vers POST (create) ou PUT (edit)
    - _Requirements: 2.1, 3.1, 3.2, 5.1, 5.3, 6.1_

- [x] 5. Composants admin genres
  - [x] 5.1 Créer le composant `AdminGenresTable`
    - Table avec colonnes : slug, nom, nombre de jeux, actions
    - Barre de recherche, tri par colonnes, pagination
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 5.2 Créer le composant `DeleteGenreDialog`
    - Dialogue de confirmation avec avertissement d'usage
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.3 Créer `GenreForm` dans `src/components/admin/genres/GenreForm.tsx`
    - Champ slug (désactivé en edit)
    - Section traductions dynamique par langue supportée
    - _Requirements: 2.1, 2.3, 3.1, 3.3, 5.3, 6.1, 6.3_

- [x] 6. Pages admin genres
  - [x] 6.1 Créer la page liste dans `src/app/[locale]/admin/genres/page.tsx`
    - Utilise useAdminGenres, AdminGenresTable, DeleteGenreDialog
    - Bouton "Nouveau genre"
    - _Requirements: 1.1, 4.1, 4.2_
  - [x] 6.2 Créer la page création dans
        `src/app/[locale]/admin/genres/new/page.tsx`
    - Utilise useGenreForm("create"), GenreForm
    - Redirection vers la liste après succès
    - _Requirements: 2.1, 6.1_
  - [x] 6.3 Créer la page édition dans
        `src/app/[locale]/admin/genres/[slug]/edit/page.tsx`
    - Charge le genre via fetch, utilise useGenreForm("edit"), GenreForm
    - _Requirements: 3.1, 3.2, 3.3, 6.1_

- [x] 7. Exécution des tests complets
  - [x] 7.1 Exécuter `bun run test:all`
  - [x] 7.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 7.3 Corriger les tests en échec si nécessaire

- [x] 8. Lint du code
  - [x] 8.1 Exécuter `bun run lint`
  - [x] 8.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 8.3 Corriger les erreurs de lint si nécessaire

- [x] 9. Build de production
  - [x] 9.1 Exécuter `bun run build`
  - [x] 9.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 9.3 Corriger les erreurs de build si nécessaire

- [x] 10. README de la fonctionnalité
  - [x] 10.1 Créer `docs/README_ADMIN_GENRE_MANAGEMENT.md`
  - [x] 10.2 Documenter la fonctionnalité complète

## Notes

- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les tests property-based utilisent `fast-check` avec `bun:test`
- Les tests d'API isolés vont dans `test/isolated/` pour éviter les conflits de
  mock
- Le pattern suit exactement celui des langues admin (`useAdminLanguages`,
  `LanguageForm`, etc.)
