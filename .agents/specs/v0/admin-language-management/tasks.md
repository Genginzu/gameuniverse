# Plan d'Implémentation: Admin Language Management

## Vue d'ensemble

Ce plan décrit les tâches pour implémenter l'interface d'administration de
gestion des langues supportées par les jeux (CRUD) et la consultation des
locales du site. L'implémentation utilise TypeScript, Next.js, React Hook Form,
Zod et les composants UI existants du projet, en suivant les patterns établis
par le module admin des jeux.

## Tâches

- [x] 1. Créer le schéma de validation et les types
  - [x] 1.1 Créer le schéma Zod pour le formulaire de langue
    - Créer `src/lib/validations/admin-language-form.ts`
    - Définir `adminLanguageFormSchema` avec les règles : code (2-10 chars,
      pattern `^[a-z]([a-z-]*[a-z])?$`), name (1-100 chars), native_name (0-100
      chars optionnel)
    - Exporter le type `LanguageFormData`
    - _Requirements: 4.6, 8.1, 8.2_

  - [x] 1.2 Écrire le test property-based pour la validation du schéma
    - Créer `test/unit/lib/validations/admin-language-form.property.test.ts`
    - **Property 1: Validation du Schéma de Langue**
    - Générer des codes valides/invalides avec fast-check et vérifier que le
      schéma accepte/rejette correctement
    - **Validates: Requirements 4.5, 4.6, 8.1, 8.2, 8.3**

- [x] 2. Créer les routes API admin pour les langues
  - [x] 2.1 Créer la route API liste + création
    - Créer `src/app/api/admin/languages/route.ts`
    - Implémenter GET avec pagination, recherche (par code/nom) et tri
    - Implémenter POST avec validation Zod côté serveur et vérification
      d'unicité du code
    - Utiliser `requireAdmin()` pour le contrôle d'accès
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.3, 3.4, 3.5, 4.3, 4.4, 8.2_

  - [x] 2.2 Créer la route API détail + modification + suppression
    - Créer `src/app/api/admin/languages/[code]/route.ts`
    - Implémenter GET pour récupérer une langue par code
    - Implémenter PUT pour modifier name et native_name (code non modifiable)
    - Implémenter DELETE avec vérification d'usage dans `game_languages` et
      support du paramètre `force=true`
    - _Requirements: 5.3, 5.4, 6.3, 6.4_

  - [x] 2.3 Écrire le test property-based pour la recherche et le tri
    - Créer `test/unit/hooks/useAdminLanguages.property.test.ts`
    - **Property 2: Cohérence de la Recherche et du Tri**
    - Générer des listes de langues aléatoires, appliquer recherche et tri,
      vérifier que les résultats sont cohérents
    - **Validates: Requirements 3.3, 3.4**

- [x] 3. Checkpoint - Vérifier les routes API
  - Vérifier que les routes API fonctionnent (CRUD complet)
  - Vérifier le contrôle d'accès admin
  - Demander à l'utilisateur s'il y a des questions

- [x] 4. Créer les hooks personnalisés
  - [x] 4.1 Créer le hook useAdminLanguages
    - Créer `src/hooks/useAdminLanguages.ts`
    - Implémenter fetchLanguages avec pagination, recherche et tri
    - Implémenter deleteLanguage et checkLanguageUsage
    - Gérer les états de chargement et d'erreur
    - Suivre le pattern de `useAdminGames.ts`
    - _Requirements: 3.1, 3.3, 3.4, 6.3, 6.4_

  - [x] 4.2 Créer le hook useLanguageForm
    - Créer `src/hooks/useLanguageForm.ts`
    - Intégrer React Hook Form avec le schéma Zod
    - Gérer la soumission (création et modification)
    - Suivre le pattern de `useGameForm.ts`
    - _Requirements: 4.3, 5.4_

- [x] 5. Créer les composants UI
  - [x] 5.1 Créer le composant AdminLanguagesTable
    - Créer `src/components/admin/languages/AdminLanguagesTable.tsx`
    - Afficher les colonnes : code, nom anglais, nom natif, actions
    - Implémenter pagination, recherche et tri
    - Suivre le pattern de `AdminGamesTable.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.2 Créer le composant LanguageForm
    - Créer `src/components/admin/languages/LanguageForm.tsx`
    - Implémenter les champs : code (désactivé en édition), nom anglais, nom
      natif
    - Afficher les erreurs de validation inline
    - Supporter les modes création et édition
    - _Requirements: 4.2, 4.5, 5.1, 5.2, 5.3_

  - [x] 5.3 Créer le composant DeleteLanguageDialog
    - Créer `src/components/admin/languages/DeleteLanguageDialog.tsx`
    - Afficher le nom de la langue et l'avertissement irréversible
    - Afficher l'avertissement d'usage par des jeux si applicable
    - Suivre le pattern de `DeleteGameDialog.tsx`
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 5.4 Créer le composant SiteLocalesSection
    - Créer `src/components/admin/languages/SiteLocalesSection.tsx`
    - Afficher la liste des locales du site (code, nom, défaut, nb clés)
    - Afficher le message indiquant que la gestion complète sera dans un futur
      module
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 5.5 Écrire le test property-based pour l'affichage des langues
    - Créer
      `test/unit/components/admin/languages/AdminLanguagesTable.property.test.ts`
    - **Property 3: Affichage Complet des Informations de Langue**
    - Générer des langues aléatoires et vérifier que le rendu contient code, nom
      et nom natif
    - **Validates: Requirements 3.2**

- [x] 6. Créer les pages admin
  - [x] 6.1 Créer la page de liste des langues
    - Créer `src/app/[locale]/admin/languages/page.tsx`
    - Intégrer AdminLanguagesTable, SiteLocalesSection et useAdminLanguages
    - Ajouter le bouton "Nouvelle langue" et DeleteLanguageDialog
    - Suivre le pattern de la page admin des jeux
    - _Requirements: 2.2, 2.3, 3.1, 9.1, 9.2_

  - [x] 6.2 Créer la page de création de langue
    - Créer `src/app/[locale]/admin/languages/new/page.tsx`
    - Intégrer LanguageForm en mode création avec useLanguageForm
    - Gérer la redirection après succès et les notifications
    - _Requirements: 4.1, 4.3, 4.4, 9.1, 9.2_

  - [x] 6.3 Créer la page de modification de langue
    - Créer `src/app/[locale]/admin/languages/[code]/edit/page.tsx`
    - Charger les données existantes via l'API
    - Intégrer LanguageForm en mode édition avec pré-remplissage
    - _Requirements: 5.1, 5.4, 5.5, 9.1, 9.2_

- [x] 7. Intégrer dans la navigation admin
  - [x] 7.1 Ajouter le lien "Langues" dans AdminSidebar
    - Modifier `src/components/layout/admin/AdminSidebar.tsx`
    - Ajouter le lien vers `/admin/languages` avec une icône appropriée
    - _Requirements: 2.1_

  - [x] 7.2 Ajouter les traductions i18n
    - Ajouter les clés `admin.languages.*` dans `src/messages/fr.json`
    - Ajouter les clés `admin.languages.*` dans `src/messages/en.json`
    - Ajouter la clé `admin.nav.languages` pour le sidebar
    - _Requirements: 2.4_

  - [x] 7.3 Écrire le test property-based pour l'i18n
    - Créer `test/unit/lib/i18n/admin-languages-i18n.property.test.ts`
    - **Property 7: Support de l'Internationalisation**
    - Vérifier que toutes les clés admin.languages existent dans fr et en
    - **Validates: Requirements 2.4**

- [x] 8. Checkpoint - Vérifier l'ensemble de la fonctionnalité
  - Vérifier le CRUD complet (création, lecture, modification, suppression)
  - Vérifier la navigation et l'intégration dans le sidebar
  - Vérifier les notifications de succès/erreur
  - Demander à l'utilisateur s'il y a des questions

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
  - [x] 12.1 Créer `docs/README_ADMIN_LANGUAGE_MANAGEMENT.md`
  - [x] 12.2 Documenter ce qui a été implémenté, comment y accéder, les
        prérequis et l'utilisation

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour
  un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- Les tests property-based valident les propriétés de correction universelles
- Les tests unitaires valident les exemples spécifiques et les cas limites
- Utiliser Bun test runner (`bun:test`) pour tous les tests
- Placer les tests dans `test/` (pas dans `src/`)
- Utiliser des imports relatifs dans les tests (pas d'alias `@/`)
