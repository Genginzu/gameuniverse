# Plan d'implémentation : Gestion admin des entreprises

## Vue d'ensemble

Implémentation du CRUD complet des entreprises dans l'interface admin, en
suivant les patterns existants du module genres. La table `companies` et
`game_companies` existent déjà en base de données.

## Tâches

- [x] 1. Créer les types et le schéma de validation
  - [x] 1.1 Créer le fichier de types `src/types/admin-companies.ts`
    - Définir `AdminCompany` et `FetchCompaniesParams`
    - _Requirements: 1.1, 2.1_
  - [x] 1.2 Créer le schéma de validation Zod
        `src/lib/validations/admin-company-form.ts`
    - Définir `adminCompanyFormSchema` avec tous les champs (name, slug,
      company_type, description, website_url, logo_url, founded_year,
      headquarters)
    - Définir `companyQuerySchema` pour les paramètres de liste
    - Exporter les types inférés `CompanyFormData` et `CompanyQueryParams`
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 5.1_
  - [x] 1.3 Écrire les tests property-based pour le schéma de validation
    - **Property 5: Validation du slug**
    - **Property 6: Validation des champs du formulaire**
    - **Property 7: Validation de l'année de fondation**
    - Fichier : `test/unit/lib/validations/admin-company-form.property.test.ts`
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.9**
  - [x] 1.4 Écrire les tests unitaires pour le schéma de validation
    - Tester les cas limites : URL invalide, slug avec caractères spéciaux,
      année hors bornes
    - Fichier : `test/unit/lib/validations/admin-company-form.test.ts`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 2. Implémenter les routes API
  - [x] 2.1 Créer `src/app/api/admin/companies/route.ts` (GET + POST)
    - GET : pagination, recherche sur name/slug, tri par name/slug
    - POST : validation Zod, insertion dans `companies`, gestion doublon 409
    - Protection par `requireAdmin()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 5.2_
  - [x] 2.2 Créer `src/app/api/admin/companies/[slug]/route.ts` (GET, PUT,
        DELETE)
    - GET : retourne l'entreprise avec gameCount
    - PUT : mise à jour des champs (slug immuable), validation Zod
    - DELETE : vérification usage game_companies, support ?force=true
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Checkpoint — Vérifier les routes API
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implémenter les hooks React
  - [x] 4.1 Créer `src/hooks/useAdminCompanies.ts`
    - État : companies, pagination, loading, error
    - Actions : fetchCompanies, deleteCompany, checkCompanyUsage, refetch
    - Même pattern que `useAdminGenres`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3_
  - [x] 4.2 Créer `src/hooks/useCompanyForm.ts`
    - Intégrer react-hook-form avec zodResolver
    - Gérer POST (create) et PUT (edit)
    - Retourner form, submitCompany, isSubmitting, submitError
    - _Requirements: 2.1, 3.1, 3.2, 5.1, 5.3_
  - [x] 4.3 Écrire les tests isolés pour les hooks
    - `test/isolated/hooks/useAdminCompanies.test.ts`
    - `test/isolated/hooks/useCompanyForm.test.ts`
    - _Requirements: 1.1, 1.2, 2.1, 3.2, 4.1_

- [x] 5. Implémenter les composants UI
  - [x] 5.1 Créer `src/components/admin/companies/AdminCompaniesTable.tsx`
    - Colonnes : nom, slug, type, nombre de jeux, actions
    - Barre de recherche, tri par colonnes, pagination
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 5.2 Créer `src/components/admin/companies/CompanyForm.tsx`
    - Champs : slug (disabled en edit), nom, type (select), description, site
      web, logo URL, année de fondation, siège social
    - Validation en temps réel via react-hook-form + Zod
    - _Requirements: 2.1, 2.3, 3.1, 3.3, 5.3_
  - [x] 5.3 Créer `src/components/admin/companies/DeleteCompanyDialog.tsx`
    - Dialogue de confirmation avec avertissement si entreprise utilisée
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Implémenter les pages admin
  - [x] 6.1 Créer `src/app/[locale]/admin/companies/page.tsx`
    - Utiliser useAdminCompanies, afficher AdminCompaniesTable et
      DeleteCompanyDialog
    - Bouton "Nouvelle entreprise"
    - _Requirements: 1.1_
  - [x] 6.2 Créer `src/app/[locale]/admin/companies/new/page.tsx`
    - Utiliser useCompanyForm("create"), afficher CompanyForm
    - Redirection vers la liste après création
    - _Requirements: 2.1_
  - [x] 6.3 Créer `src/app/[locale]/admin/companies/[slug]/edit/page.tsx`
    - Charger l'entreprise via GET, utiliser useCompanyForm("edit", initialData)
    - _Requirements: 3.1, 3.2_

- [x] 7. Intégration dans la navigation admin
  - [x] 7.1 Ajouter le lien "Entreprises" dans le menu de navigation admin
    - Mettre à jour le layout ou la sidebar admin existante
    - _Requirements: 1.1_
  - [x] 7.2 Ajouter les traductions i18n pour le module entreprises
    - Ajouter les clés dans les fichiers de messages fr et en
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 8. Exécution des tests complets
  - [x] 8.1 Exécuter `bun run test:all`
  - [x] 8.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 8.3 Corriger les tests en échec si nécessaire

- [x] 9. Lint du code
  - [x] 9.1 Exécuter `bun run lint`
  - [x] 9.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 9.3 Corriger les erreurs de lint si nécessaire

- [x] 10. Build de production
  - [x] 10.1 Exécuter `bun run build`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 10.3 Corriger les erreurs de build si nécessaire

- [x] 11. README de la fonctionnalité
  - [x] 11.1 Créer `docs/README_ADMIN_COMPANY_MANAGEMENT.md`
  - [x] 11.2 Documenter ce qui a �t� impl�ment�, comment y acc�der, les
        pr�requis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les exemples spécifiques et les edge cases
