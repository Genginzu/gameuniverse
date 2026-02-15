# Plan d'implémentation : IGDB Field Tracking

## Vue d'ensemble

Implémentation incrémentale du système de suivi des modifications manuelles des
champs de jeux après import IGDB. Chaque tâche construit sur la précédente, en
commençant par le schéma DB, puis la logique métier, l'API, et enfin l'UI.

## Tâches

- [x] 1. Migration DB et types de base
  - [x] 1.1 Créer la migration Supabase
        `supabase/migrations/20240216000001_game_field_overrides.sql`
    - Créer la table `game_field_overrides` avec colonnes : id (UUID PK),
      game_id (FK games ON DELETE CASCADE), field_name (TEXT), modified_by (UUID
      FK auth.users ON DELETE SET NULL), modified_at (TIMESTAMPTZ DEFAULT NOW())
    - Ajouter la contrainte UNIQUE(game_id, field_name)
    - Ajouter l'index sur game_id
    - Activer RLS et créer la politique admin-only via `public.is_admin()`
    - Ajouter les COMMENT ON pour documenter la table et les colonnes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 1.2 Ajouter les types TypeScript dans `src/types/admin-games.ts`
    - Ajouter le type `TrackableField` (union des 13 catégories de champs)
    - Ajouter l'interface `GameFieldOverride` (id, gameId, fieldName,
      modifiedBy, modifiedAt)
    - Ajouter le type `TabId` mis à jour pour inclure `"sync"`
    - _Requirements: 1.4_

dr- [x] 2. Utilitaire de détection des modifications

- [x] 2.1 Créer `src/lib/utils/field-tracking.ts`
  - Exporter la constante `TRACKABLE_FIELDS` avec les 13 catégories
  - Implémenter
    `detectChangedFields(currentData, submittedData): TrackableField[]` qui
    compare les données actuelles en DB avec les données soumises et retourne la
    liste des champs modifiés
  - Implémenter `upsertFieldOverrides(supabase, gameId, changedFields, userId)`
    qui insère ou met à jour les overrides dans `game_field_overrides`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 Écrire le test property-based pour la détection des modifications
  - Fichier : `test/unit/lib/utils/field-tracking.property.test.ts`
  - **Property 1 : Détection des modifications de champs**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2.3 Écrire le test property-based pour l'idempotence de l'upsert
  - Fichier : `test/unit/lib/utils/field-tracking.property.test.ts`
  - **Property 2 : Idempotence de l'upsert des overrides**
  - **Validates: Requirements 1.3, 5.2**

- [x] 2.4 Écrire les tests unitaires pour `field-tracking.ts`
  - Fichier : `test/unit/lib/utils/field-tracking.test.ts`
  - Tester `detectChangedFields` avec cas spécifiques : aucun changement, un
    changement, tous les changements
  - Vérifier que `TRACKABLE_FIELDS` contient exactement les 13 catégories
    attendues
  - _Requirements: 1.1, 1.4_

- [x] 3. Service de synchronisation IGDB
  - [x] 3.1 Créer `src/lib/services/igdb-sync.ts`
    - Implémenter `syncGameField(supabase, gameId, igdbId, field)` qui récupère
      la donnée IGDB pour un champ spécifique, met à jour la DB et supprime
      l'override
    - Implémenter
      `syncAllGameFields(supabase, gameId, igdbId, overriddenFields?)` qui
      synchronise tous les champs (en respectant les overrides si
      `overriddenFields` est fourni)
    - Réutiliser la logique de transformation de
      `scripts/igdb-import/game-importer.ts` en l'extrayant dans des fonctions
      partagées si nécessaire
    - Mettre à jour `last_synced_at` après chaque synchronisation
    - _Requirements: 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 4.1, 4.2_

  - [x] 3.2 Écrire le test property-based pour la synchronisation respectant les
        overrides
    - Fichier : `test/unit/lib/services/igdb-sync.property.test.ts`
    - **Property 3 : La synchronisation respecte les overrides**
    - **Validates: Requirements 2.2, 2.3**

  - [x] 3.3 Écrire le test property-based pour la suppression des overrides
        après sync forcée
    - Fichier : `test/unit/lib/services/igdb-sync.property.test.ts`
    - **Property 4 : La synchronisation forcée supprime les overrides**
    - **Validates: Requirements 3.5, 4.1**

  - [x] 3.4 Écrire les tests unitaires pour `igdb-sync.ts`
    - Fichier : `test/unit/lib/services/igdb-sync.test.ts`
    - Tester le cas d'erreur : jeu sans igdb_id
    - Tester le cas d'erreur : échec de l'appel IGDB
    - Tester la mise à jour de last_synced_at
    - _Requirements: 4.3, 4.4, 2.4_

- [x] 4. Checkpoint - Vérifier la logique métier
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Intégration dans le PUT admin existant
  - [x] 5.1 Modifier `src/app/api/admin/games/[id]/route.ts` (fonction PUT)
    - Après la mise à jour du jeu, charger les données actuelles avant la mise à
      jour
    - Appeler `detectChangedFields()` pour identifier les champs modifiés
    - Appeler `upsertFieldOverrides()` pour enregistrer les overrides
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Écrire les tests unitaires pour l'intégration PUT
    - Fichier : `test/unit/api/admin-games-field-tracking.test.ts`
    - Vérifier qu'une modification via PUT crée les overrides attendus
    - _Requirements: 1.1_

- [x] 6. API de synchronisation
  - [x] 6.1 Créer la route GET `src/app/api/admin/games/[id]/overrides/route.ts`
    - Retourner la liste des overrides pour un jeu donné
    - Vérifier l'accès admin
    - _Requirements: 3.1_

  - [x] 6.2 Créer la route POST `src/app/api/admin/games/[id]/sync/route.ts`
    - Accepter `{ field?: string }` dans le body
    - Si `field` est fourni : synchroniser ce champ uniquement via
      `syncGameField()`
    - Si `field` est absent : synchroniser tous les champs via
      `syncAllGameFields()`
    - Vérifier que le jeu a un igdb_id (sinon 400)
    - Gérer les erreurs IGDB (502)
    - Retourner les données mises à jour
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.3 Écrire les tests unitaires pour les routes API sync
    - Fichier : `test/unit/api/admin-games-sync.test.ts`
    - Tester sync individuel, sync global, erreur 400 (pas d'igdb_id), erreur
      502 (échec IGDB)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Onglet Synchronisation dans le formulaire admin
  - [x] 7.1 Créer le hook `src/hooks/useGameSync.ts`
    - Gérer le chargement des overrides via GET /api/admin/games/:id/overrides
    - Gérer la synchronisation d'un champ ou de tous les champs via POST
      /api/admin/games/:id/sync
    - Exposer l'état de chargement, les overrides, et les fonctions de sync
    - _Requirements: 3.1, 3.3, 3.4, 3.6_

  - [x] 7.2 Créer le composant `src/components/admin/games/GameFormSyncTab.tsx`
    - Afficher la liste des 13 catégories de champs avec leur état (override ou
      synced IGDB)
    - Afficher un bouton de sync individuel par champ
    - Afficher un bouton de sync globale en haut
    - Afficher un message si le jeu n'a pas d'igdb_id
    - Afficher un indicateur de chargement pendant la sync
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x] 7.3 Intégrer l'onglet dans `GameForm.tsx`
    - Ajouter l'onglet « sync » dans la liste TABS (avec icône FaSync)
    - Rendre le composant `GameFormSyncTab` quand l'onglet est actif
    - Passer le gameId et igdbId au composant
    - N'afficher l'onglet que en mode "edit"
    - _Requirements: 3.1_

  - [x] 7.4 Ajouter les traductions i18n pour l'onglet sync
    - Ajouter les clés dans `src/messages/fr.json` et `src/messages/en.json`
      sous `admin.games.form`
    - Clés : syncTab, syncAll, syncField, fieldOverridden, fieldSynced,
      noIgdbLink, syncSuccess, syncError, lastSyncedAt
    - _Requirements: 3.1, 3.2_

- [x] 8. Indicateur visuel IGDB dans le formulaire d'édition
  - [x] 8.1 Créer le hook `src/hooks/useGameOverrides.ts`
    - Charger les overrides via GET /api/admin/games/:id/overrides au montage
    - Exposer une fonction `isIgdbField(fieldName: TrackableField): boolean` qui
      retourne `true` si le champ n'a PAS d'override (donnée IGDB originale)
    - Retourner `() => false` si le jeu n'a pas d'igdb_id (aucun indicateur)
    - Exposer l'état de chargement
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 8.2 Écrire le test property-based pour isIgdbField
    - Fichier : `test/unit/hooks/useGameOverrides.property.test.ts`
    - **Property 5 : Indicateur IGDB reflète l'absence d'override**
    - **Validates: Requirements 6.1, 6.2, 6.5**

  - [x] 8.3 Créer le composant
        `src/components/admin/games/IgdbFieldIndicator.tsx`
    - Afficher un petit badge/icône IGDB à côté du label du champ
    - Accepter les props `fieldName` et `isIgdbField`
    - Afficher un tooltip au survol : « Donnée provenant d'IGDB — non modifiée
      manuellement » (traduit via i18n)
    - Ne rien rendre si `isIgdbField` retourne `false`
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 8.4 Intégrer `useGameOverrides` dans `GameForm.tsx`
    - En mode "edit" et si le jeu a un igdb_id, appeler `useGameOverrides`
    - Passer la fonction `isIgdbField` comme prop optionnelle à chaque onglet
    - Ne pas passer la prop en mode "create" ou si pas d'igdb_id
    - _Requirements: 6.1, 6.3_

  - [x] 8.5 Ajouter `IgdbFieldIndicator` dans les onglets du formulaire
    - Modifier GameFormGeneralTab, GameFormImagesTab, GameFormTranslationsTab,
      GameFormGenresTab, GameFormCompaniesTab, GameFormAgeRatingsTab,
      GameFormVersionsTab, GameFormLanguagesTab pour afficher l'indicateur à
      côté des labels de champs synchronisables quand `isIgdbField` est fourni
    - Mapper chaque section d'onglet au bon `TrackableField` (ex : onglet images
      → "cover_image", "background_image", "screenshots", "artworks")
    - _Requirements: 6.1, 6.2_

  - [x] 8.6 Ajouter les traductions i18n pour l'indicateur IGDB
    - Ajouter les clés dans `src/messages/fr.json` et `src/messages/en.json`
    - Clés : igdbFieldTooltip (« Donnée provenant d'IGDB — non modifiée
      manuellement » / « Data from IGDB — not manually modified »)
    - _Requirements: 6.4_

  - [x] 8.7 Écrire les tests unitaires pour IgdbFieldIndicator et l'intégration
        dans les onglets
    - Fichier : `test/unit/components/admin/games/IgdbFieldIndicator.test.tsx`
    - Vérifier que l'indicateur s'affiche quand isIgdbField retourne true
    - Vérifier que l'indicateur ne s'affiche pas quand isIgdbField retourne
      false
    - Vérifier qu'aucun indicateur n'apparaît sans igdb_id
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Intégration dans le script d'import IGDB
  - [x] 9.1 Modifier `scripts/igdb-import/game-importer.ts`
    - Ajouter une fonction `syncExistingGame()` qui met à jour un jeu existant
      en respectant les overrides
    - Consulter `game_field_overrides` avant de mettre à jour chaque champ
    - Mettre à jour `last_synced_at` après la synchronisation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Fichier steering pour l'extensibilité
  - [x] 10.1 Créer `.kiro/steering/igdb-field-tracking.md` - Documenter la
        procédure pour ajouter un nouveau champ au système de tracking - Lister
        les 4 fichiers à modifier : `field-tracking.ts`, `igdb-sync.ts`,
        `GameFormSyncTab.tsx`, `TRACKABLE_FIELDS` P
- [x] 11. Checkpoint final
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

- [x] 15. README de la fonctionnalité
  - [x] 15.1 Créer `docs/README_igdb-field-tracking.md`
  - [-] 15.2 Documenter ce qui a été implémenté, comment y accéder, les
    prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les cas spécifiques et les conditions d'erreur
