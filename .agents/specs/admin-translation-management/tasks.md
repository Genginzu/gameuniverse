# Plan d'implémentation : Admin Translation Management

## Vue d'ensemble

Implémentation incrémentale de la page d'administration `/admin/translations` permettant de visualiser l'état des traductions, de traduire automatiquement via Vercel AI Gateway (GPT-5.4 Nano), et de sauvegarder les résultats. L'approche commence par les types et validations, puis les services backend, les routes API, et enfin les composants React avec le hook SWR.

## Tâches

- [x] 1. Installer les dépendances et configurer l'environnement
  - Exécuter `bun add ai @ai-sdk/openai`
  - Ajouter `VERCEL_AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key` dans `.env.example` avec un commentaire `# Vercel AI Gateway (traduction automatique)`
  - _Requirements: 11.1, 11.2_

- [x] 2. Créer les types partagés et les schémas de validation
  - [x] 2.1 Créer `src/types/admin-translations.ts`
    - Définir `EntityType`, `TranslationStatus`, `TranslationMissingItem`, `TranslationStats`, `TranslateResult`, `BatchProgressEvent`, `BatchSummary`
    - Définir les constantes `REQUIRED_FIELDS`, `EDITABLE_FIELDS`, `TRANSLATION_TABLE_MAP`, `ENTITY_TABLE_MAP`, `FK_COLUMN_MAP`, `IDENTIFIER_FIELD_MAP`
    - Exporter l'interface `PaginationInfo` pour la pagination
    - _Requirements: 1.2, 1.4, 1.5, 2.2, 2.3, 9.4_

  - [x] 2.2 Créer `src/lib/validations/admin-translation.ts`
    - Définir `entityTypeSchema` avec les 10 types d'entités
    - Définir `missingQuerySchema` (type, targetLang, page, limit, search)
    - Définir `translateBodySchema` (entityType, entityId, targetLang, saveToDb)
    - Définir `translateBatchBodySchema` (entityType, entityIds max 50, targetLang)
    - Définir `saveTranslationBodySchema` (entityType, entityId, targetLang, translations)
    - _Requirements: 1.2, 1.3, 1.6, 5.6, 10.3_

  - [x] 2.3 Écrire le test de propriété pour la validation Zod
    - **Propriété 11 : Validation Zod des entrées**
    - **Valide : Requirements 10.3, 10.4**

  - [x] 2.4 Écrire le test de propriété pour les champs éditables
    - **Propriété 13 : Correspondance des champs éditables par type d'entité**
    - **Valide : Requirements 9.4**

- [x] 3. Implémenter le service de traduction IA (`aiTranslateService.ts`)
  - [x] 3.1 Créer `src/lib/services/aiTranslateService.ts`
    - Configurer le provider OpenAI via Vercel AI Gateway avec `createOpenAI` et `baseURL: "https://gateway.ai.vercel.app/v1"`
    - Implémenter `translateFields(params)` utilisant `generateObject` du Vercel AI SDK avec un schéma Zod dynamique basé sur `EDITABLE_FIELDS[entityType]`
    - Inclure un prompt système contextualisé (site de jeux vidéo, terminologie gaming, paire de langues)
    - Implémenter le timeout de 30 secondes via `AbortController`
    - Lever une erreur explicite si `VERCEL_AI_GATEWAY_API_KEY` n'est pas définie
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 11.1, 11.3, 11.4_

  - [x] 3.2 Écrire le test de propriété pour la complétude des champs de traduction
    - **Propriété 3 : Complétude des champs de traduction retournés**
    - **Valide : Requirements 1.5, 3.4, 3.5**

- [x] 4. Implémenter le service de traduction DB (`translationService.ts`)
  - [x] 4.1 Créer `src/lib/services/translationService.ts`
    - Implémenter `getMissingTranslations(params)` : requête Supabase avec LEFT JOIN sur la table de traduction, filtrage par champs obligatoires NULL/vides, pagination, recherche
    - Implémenter `getTranslationStats(params)` : compteurs par type d'entité et par langue, lecture dynamique des langues depuis `routing.ts`
    - Implémenter `getSourceText(params)` : récupération du texte source dans la meilleure langue disponible (priorité anglais)
    - Implémenter `upsertTranslation(params)` : upsert via `ON CONFLICT` sur la contrainte unique (entity_id, language_code)
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 4.2, 4.4, 10.2_

  - [x] 4.2 Écrire le test de propriété pour la classification du statut
    - **Propriété 1 : Classification correcte du statut de traduction**
    - **Valide : Requirements 1.4, 2.3**

  - [x] 4.3 Écrire le test de propriété pour l'invariant des statistiques
    - **Propriété 2 : Invariant des statistiques de traduction**
    - **Valide : Requirements 2.2**

  - [x] 4.4 Écrire le test de propriété pour la cohérence de la pagination
    - **Propriété 4 : Cohérence de la pagination**
    - **Valide : Requirements 1.6**

  - [x] 4.5 Écrire le test de propriété pour le filtrage par recherche
    - **Propriété 5 : Filtrage par recherche**
    - **Valide : Requirements 1.7**

  - [x] 4.6 Écrire le test de propriété pour la détection de la langue source
    - **Propriété 6 : Détection automatique de la langue source**
    - **Valide : Requirements 4.2**

- [x] 5. Checkpoint — Vérifier les services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implémenter les routes API
  - [x] 6.1 Créer `src/app/api/admin/translations/missing/route.ts`
    - Route GET avec `requireAdmin()`, validation des query params via `missingQuerySchema`
    - Appeler `getMissingTranslations` et retourner la liste paginée
    - Retourner HTTP 401 si non-admin, HTTP 400 si paramètres invalides
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 6.2 Créer `src/app/api/admin/translations/stats/route.ts`
    - Route GET avec `requireAdmin()`, lecture des langues depuis `routing.ts`
    - Appeler `getTranslationStats` et retourner les compteurs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.3 Créer `src/app/api/admin/translations/translate/route.ts`
    - Route POST avec `requireAdmin()`, validation du body via `translateBodySchema`
    - Récupérer le texte source via `getSourceText`, appeler `translateFields`, sauvegarder si `saveToDb: true`
    - Retourner HTTP 404 si entité inexistante, HTTP 400 si pas de texte source
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 6.4 Créer `src/app/api/admin/translations/translate-batch/route.ts`
    - Route POST avec `requireAdmin()`, validation via `translateBatchBodySchema`
    - Traitement séquentiel avec streaming NDJSON via `ReadableStream`
    - Chaque entité dans un try/catch individuel, sauvegarde avant passage à la suivante
    - Détection de l'annulation via `signal` de l'`AbortController`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 6.5 Créer `src/app/api/admin/translations/save/route.ts`
    - Route PUT avec `requireAdmin()`, validation via `saveTranslationBodySchema`
    - Appeler `upsertTranslation` pour sauvegarder les champs traduits
    - Retourner HTTP 400 si validation échoue, HTTP 404 si entité inexistante
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 6.6 Écrire le test de propriété pour la validation de la taille du lot
    - **Propriété 10 : Validation de la taille du lot**
    - **Valide : Requirements 5.6, 5.7**

  - [x] 6.7 Écrire le test de propriété pour la complétude du traitement par lot
    - **Propriété 8 : Complétude du traitement par lot**
    - **Valide : Requirements 5.2, 5.3**

  - [x] 6.8 Écrire le test de propriété pour la résilience du traitement par lot
    - **Propriété 9 : Résilience du traitement par lot**
    - **Valide : Requirements 5.5**

  - [x] 6.9 Écrire le test de propriété pour l'aller-retour upsert
    - **Propriété 7 : Aller-retour de l'upsert de traduction**
    - **Valide : Requirements 4.4, 10.2**

- [x] 7. Checkpoint — Vérifier les routes API
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Créer le hook SWR et les traductions i18n
  - [x] 8.1 Créer `src/hooks/useAdminTranslations.ts`
    - Implémenter le fetching SWR pour `/api/admin/translations/stats` et `/api/admin/translations/missing`
    - Exposer `translateOne`, `translateBatch` (avec parsing NDJSON et `AbortSignal`), et `saveTranslation`
    - Exposer `mutateStats` et `mutateItems` pour la revalidation après chaque action
    - Gérer les paramètres `targetLang`, `entityType`, `page`, `search`
    - _Requirements: 6.9, 7.2, 7.6, 8.3, 8.7, 8.8_

  - [x] 8.2 Ajouter les clés i18n dans `src/messages/fr.json` et `src/messages/en.json`
    - Ajouter le namespace `admin.translations` avec : titres de page, labels de statistiques, labels de colonnes, textes des boutons (Traduire, Traduire et relire, Traduire la sélection, Tout traduire, Annuler, Sauvegarder), messages de succès/erreur, textes de la modale de relecture, noms des langues dans le sélecteur
    - Ajouter simultanément dans les deux fichiers de langue
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 8.3 Écrire le test de propriété pour la synchronisation des clés i18n
    - **Propriété 12 : Synchronisation des clés i18n**
    - **Valide : Requirements 6.10, 9.8, 12.2, 12.4**

- [x] 9. Implémenter les composants React du dashboard
  - [x] 9.1 Créer `src/components/admin/translations/TranslationProgressBar.tsx`
    - Barre de progression globale avec gradient cyan → violet
    - Afficher le pourcentage de traduction complète tous types confondus
    - Design glassmorphism avec support dark mode
    - _Requirements: 6.3_

  - [x] 9.2 Créer `src/components/admin/translations/TranslationStatsCards.tsx`
    - Grille de cartes glassmorphism, une par type d'entité
    - Afficher total, traduit, non traduit, pourcentage de couverture pour la langue sélectionnée
    - _Requirements: 6.2_

  - [x] 9.3 Créer `src/components/admin/translations/TranslationBatchProgress.tsx`
    - Barre de progression du lot : compteur x/total, bouton annuler, résumé final (réussies/échouées)
    - _Requirements: 8.4, 8.6, 8.7_

  - [x] 9.4 Créer `src/components/admin/translations/TranslationTableRow.tsx`
    - Ligne du tableau avec checkbox, texte source, texte cible (ou indicateur "manquant"), statut
    - Boutons "Traduire" et "Traduire et relire" avec indicateur de chargement
    - _Requirements: 6.5, 7.1, 7.3, 9.1_

  - [x] 9.5 Créer `src/components/admin/translations/TranslationTable.tsx`
    - Tableau paginé et filtrable avec sélection multiple via checkboxes
    - Boutons "Traduire la sélection" et "Tout traduire" dans la barre d'actions
    - Champ de recherche par titre/nom, pagination 20 éléments par page
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 7.1, 8.1, 8.2_

  - [x] 9.6 Créer `src/components/admin/translations/TranslationReviewModal.tsx`
    - Modale glassmorphism avec texte source et traduction côte à côte dans des champs éditables
    - Champs dynamiques selon `EDITABLE_FIELDS[entityType]`
    - Boutons "Sauvegarder" et "Annuler", validation via React Hook Form + Zod
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 9.7 Créer `src/components/admin/translations/TranslationDashboard.tsx`
    - Composant principal orchestrant le dashboard
    - Sélecteur de langue cible (liste dynamique depuis la config i18n)
    - Filtre par type d'entité (10 types)
    - Intégration de tous les sous-composants : StatsCards, ProgressBar, Table, BatchProgress, ReviewModal
    - Utiliser `useTranslations("admin.translations")` pour tous les textes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.8, 6.9, 6.10, 7.2, 7.4, 7.5, 8.3, 8.5, 9.2, 9.3, 12.3_

- [x] 10. Créer la page admin et câbler le tout
  - [x] 10.1 Créer `src/app/[locale]/admin/translations/page.tsx`
    - Page serveur rendant le composant `TranslationDashboard`
    - _Requirements: 6.1_

  - [x] 10.2 Intégrer la navigation vers `/admin/translations` dans le menu admin existant
    - Ajouter un lien dans la sidebar/navigation admin avec une icône Iconify appropriée
    - _Requirements: 6.1_

- [x] 11. Checkpoint final — Vérifier l'ensemble
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Lint du code
  - Exécuter `bun run lint`
  - Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - Corriger les erreurs et warnings de lint si nécessaire

- [x] 13. Build de production
  - Exécuter `bun run build`
  - Vérifier qu'il n'y a pas d'erreurs de compilation
  - Corriger les erreurs de build si nécessaire

- [x] 14. README de la fonctionnalité
  - Créer `docs/dev/README_admin-translation-management.md`
  - Documenter : description de la fonctionnalité, accès (`/admin/translations`), prérequis (`VERCEL_AI_GATEWAY_API_KEY`, rôle admin), utilisation (consultation des stats, traduction individuelle, traduction par lot, relecture)

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests de propriété valident les propriétés universelles de correction
- Les tests unitaires valident les cas spécifiques et les cas limites
- Tous les textes UI utilisent `useTranslations("admin.translations")` — aucune chaîne en dur
