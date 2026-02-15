# Plan d'implémentation : IGDB Field Tracking

## Vue d'ensemble

Implémentation incrémentale du système de suivi des modifications manuelles des
champs de jeux après import IGDB. Chaque tâche construit sur la précédente, en
commençant par le schéma DB, puis la logique métier, l'API, et enfin l'UI.

## Tâches

- [ ] 1. Migration DB et types de base
  - [ ] 1.1 Créer la migration Supabase
        `supabase/migrations/20240216000001_game_field_overrides.sql`
    - Créer la table `game_field_overrides` avec colonnes : id (UUID PK),
      game_id (FK games ON DELETE CASCADE), field_name (TEXT), modified_by (UUID
      FK auth.users ON DELETE SET NULL), modified_at (TIMESTAMPTZ DEFAULT NOW())
    - Ajouter la contrainte UNIQUE(game_id, field_name)
    - Ajouter l'index sur game_id
    - Activer RLS et créer la politique admin-only via `public.is_admin()`
    - Ajouter les COMMENT ON pour documenter la table et les colonnes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 1.2 Ajouter les types TypeScript dans `src/types/admin-games.ts`
    - Ajouter le type `TrackableField` (union des 13 catégories de champs)
    - Ajouter l'interface `GameFieldOverride` (id, gameId, fieldName,
      modifiedBy, modifiedAt)
    - Ajouter le type `TabId` mis à jour pour inclure `"sync"`
    - _Requirements: 1.4_

- [ ] 2. Utilitaire de détection des modifications
  - [ ] 2.1 Créer `src/lib/utils/field-tracking.ts`
    - Exporter la constante `TRACKABLE_FIELDS` avec les 13 catégories
    - Implémenter
      `detectChangedFields(currentData, submittedData): TrackableField[]` qui
      compare les données actuelles en DB avec les données soumises et retourne
      la liste des champs modifiés
    - Implémenter
      `upsertFieldOverrides(supabase, gameId, changedFields, userId)` qui insère
      ou met à jour les overrides dans `game_field_overrides`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.2 Écrire le test property-based pour la détection des modifications
    - Fichier : `test/unit/lib/utils/field-tracking.property.test.ts`
    - **Property 1 : Détection des modifications de champs**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 2.3 Écrire le test property-based pour l'idempotence de l'upsert
    - Fichier : `test/unit/lib/utils/field-tracking.property.test.ts`
    - **Property 2 : Idempotence de l'upsert des overrides**
    - **Validates: Requirements 1.3, 5.2**

  - [ ] 2.4 Écrire les tests unitaires pour `field-tracking.ts`
    - Fichier : `test/unit/lib/utils/field-tracking.test.ts`
    - Tester `detectChangedFields` avec cas spécifiques : aucun changement, un
      changement, tous les changements
    - Vérifier que `TRACKABLE_FIELDS` contient exactement les 13 catégories
      attendues
    - _Requirements: 1.1, 1.4_

- [ ] 3. Service de synchronisation IGDB
  - [ ] 3.1 Créer `src/lib/services/igdb-sync.ts`
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

  - [ ] 3.2 Écrire le test property-based pour la synchronisation respectant les
        overrides
    - Fichier : `test/unit/lib/services/igdb-sync.property.test.ts`
    - **Property 3 : La synchronisation respecte les overrides**
    - **Validates: Requirements 2.2, 2.3**

  - [ ] 3.3 Écrire le test property-based pour la suppression des overrides
        après sync forcée
    - Fichier : `test/unit/lib/services/igdb-sync.property.test.ts`
    - **Property 4 : La synchronisation forcée supprime les overrides**
    - **Validates: Requirements 3.5, 4.1**

  - [ ] 3.4 Écrire les tests unitaires pour `igdb-sync.ts`
    - Fichier : `test/unit/lib/services/igdb-sync.test.ts`
    - Tester le cas d'erreur : jeu sans igdb_id
    - Tester le cas d'erreur : échec de l'appel IGDB
    - Tester la mise à jour de last_synced_at
    - _Requirements: 4.3, 4.4, 2.4_

- [ ] 4. Checkpoint - Vérifier la logique métier
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Intégration dans le PUT admin existant
  - [ ] 5.1 Modifier `src/app/api/admin/games/[id]/route.ts` (fonction PUT)
    - Après la mise à jour du jeu, charger les données actuelles avant la mise à
      jour
    - Appeler `detectChangedFields()` pour identifier les champs modifiés
    - Appeler `upsertFieldOverrides()` pour enregistrer les overrides
    - _Requirements: 1.1, 1.2_

  - [ ] 5.2 Écrire les tests unitaires pour l'intégration PUT
    - Fichier : `test/unit/api/admin-games-field-tracking.test.ts`
    - Vérifier qu'une modification via PUT crée les overrides attendus
    - _Requirements: 1.1_

- [ ] 6. API de synchronisation
  - [ ] 6.1 Créer la route GET `src/app/api/admin/games/[id]/overrides/route.ts`
    - Retourner la liste des overrides pour un jeu donné
    - Vérifier l'accès admin
    - _Requirements: 3.1_

  - [ ] 6.2 Créer la route POST `src/app/api/admin/games/[id]/sync/route.ts`
    - Accepter `{ field?: string }` dans le body
    - Si `field` est fourni : synchroniser ce champ uniquement via
      `syncGameField()`
    - Si `field` est absent : synchroniser tous les champs via
      `syncAllGameFields()`
    - Vérifier que le jeu a un igdb_id (sinon 400)
    - Gérer les erreurs IGDB (502)
    - Retourner les données mises à jour
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.3 Écrire les tests unitaires pour les routes API sync
    - Fichier : `test/unit/api/admin-games-sync.test.ts`
    - Tester sync individuel, sync global, erreur 400 (pas d'igdb_id), erreur
      502 (échec IGDB)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Onglet Synchronisation dans le formulaire admin
  - [ ] 7.1 Créer le hook `src/hooks/useGameSync.ts`
    - Gérer le chargement des overrides via GET /api/admin/games/:id/overrides
    - Gérer la synchronisation d'un champ ou de tous les champs via POST
      /api/admin/games/:id/sync
    - Exposer l'état de chargement, les overrides, et les fonctions de sync
    - _Requirements: 3.1, 3.3, 3.4, 3.6_

  - [ ] 7.2 Créer le composant `src/components/admin/games/GameFormSyncTab.tsx`
    - Afficher la liste des 13 catégories de champs avec leur état (override ou
      synced IGDB)
    - Afficher un bouton de sync individuel par champ
    - Afficher un bouton de sync globale en haut
    - Afficher un message si le jeu n'a pas d'igdb_id
    - Afficher un indicateur de chargement pendant la sync
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ] 7.3 Intégrer l'onglet dans `GameForm.tsx`
    - Ajouter l'onglet « sync » dans la liste TABS (avec icône FaSync)
    - Rendre le composant `GameFormSyncTab` quand l'onglet est actif
    - Passer le gameId et igdbId au composant
    - N'afficher l'onglet que en mode "edit"
    - _Requirements: 3.1_

  - [ ] 7.4 Ajouter les traductions i18n pour l'onglet sync
    - Ajouter les clés dans `src/messages/fr.json` et `src/messages/en.json`
      sous `admin.games.form`
    - Clés : syncTab, syncAll, syncField, fieldOverridden, fieldSynced,
      noIgdbLink, syncSuccess, syncError, lastSyncedAt
    - _Requirements: 3.1, 3.2_

- [ ] 8. Intégration dans le script d'import IGDB
  - [ ] 8.1 Modifier `scripts/igdb-import/game-importer.ts`
    - Ajouter une fonction `syncExistingGame()` qui met à jour un jeu existant
      en respectant les overrides
    - Consulter `game_field_overrides` avant de mettre à jour chaque champ
    - Mettre à jour `last_synced_at` après la synchronisation
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 9. Fichier steering pour l'extensibilité
  - [ ] 9.1 Créer `.kiro/steering/igdb-field-tracking.md`
    - Documenter la procédure pour ajouter un nouveau champ au système de
      tracking
    - Lister les 4 fichiers à modifier : `field-tracking.ts`, `igdb-sync.ts`,
      `GameFormSyncTab.tsx`, `TRACKABLE_FIELDS`

- [ ] 10. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Exécution des tests complets
  - [ ] 11.1 Exécuter `bun run test:all`
  - [ ] 11.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [ ] 11.3 Corriger les tests en échec si nécessaire

- [ ] 12. Lint du code
  - [ ] 12.1 Exécuter `bun run lint`
  - [ ] 12.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [ ] 12.3 Corriger les erreurs de lint si nécessaire

- [ ] 13. Build de production
  - [ ] 13.1 Exécuter `bun run build`
  - [ ] 13.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 13.3 Corriger les erreurs de build si nécessaire

- [ ] 14. README de la fonctionnalité
  - [ ] 14.1 Créer `docs/README_igdb-field-tracking.md`
  - [ ] 14.2 Documenter ce qui a été implémenté, comment y accéder, les
        prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les cas spécifiques et les conditions d'erreur
