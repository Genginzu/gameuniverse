# Plan d'Implémentation : Collections de Jeux

## Vue d'ensemble

Implémentation incrémentale de la fonctionnalité de collections de jeux :
migration DB, types, validation, service, API routes, composants React, hooks,
pages, et tests. Chaque étape construit sur la précédente.

## Tâches

- [x] 1. Fondations : migration DB, types et validation
  - [x] 1.1 Créer la migration Supabase `supabase/migrations/20240221000001_game_collections.sql`
    - Tables `game_collections` et `game_collection_items` avec contraintes, index, politiques RLS, et trigger `updated_at`
    - Suivre le schéma SQL défini dans le design
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.5, 3.2, 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Créer les types TypeScript `src/types/collection.ts`
    - Interfaces : `CollectionSummary`, `CollectionDetail`, `CollectionItem`, `CreateCollectionInput`, `UpdateCollectionInput`, `AddCollectionItemInput`, `ReorderCollectionItemsInput`
    - _Requirements: 4.3, 5.2, 5.3_

  - [x] 1.3 Créer les schémas de validation Zod `src/lib/validations/collection.ts`
    - Schémas : `createCollectionSchema`, `updateCollectionSchema`, `addCollectionItemSchema`, `reorderCollectionItemsSchema`
    - _Requirements: 1.2, 1.5, 2.5_

  - [x] 1.4 Écrire les tests property-based pour la validation `test/unit/lib/validations/collection.property.test.ts`
    - **Property 2 : Validation des entrées**
    - **Validates: Requirements 1.2, 1.5, 2.5**

- [x] 2. Service layer : `collectionService.ts`
  - [x] 2.1 Créer `src/lib/services/collectionService.ts` — fonctions utilitaires
    - `generateSlug(name: string): string` — génération de slug URL-safe à partir du nom
    - `calculateNextPosition(items: CollectionItem[]): number` — calcul de la prochaine position
    - `reorderPositions(items: Array<{gameId: string}>, removedIndex: number): Array<{gameId: string, position: number}>` — réordonnancement après suppression
    - _Requirements: 1.3, 2.1, 2.3_

  - [x] 2.2 Écrire les tests property-based pour le slug `test/unit/lib/services/collectionService.property.test.ts`
    - **Property 3 : Génération de slug**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Écrire les tests property-based pour les positions `test/unit/lib/services/collectionService.property.test.ts`
    - **Property 4 : Position d'ajout séquentielle**
    - **Property 6 : Réordonnancement des positions après suppression**
    - **Validates: Requirements 2.1, 2.3**

  - [x] 2.4 Implémenter les fonctions CRUD Supabase dans `collectionService.ts`
    - `fetchCollections(playerId, currentUserId?, locale?)` — liste avec filtrage visibilité
    - `fetchCollectionDetail(playerId, slug, currentUserId?, locale?)` — détail avec jeux ordonnés
    - `createCollection(userId, input)` — création avec slug et défauts
    - `updateCollection(userId, slug, input)` — modification sans changer le slug
    - `deleteCollection(userId, slug)` — suppression en cascade
    - `addItem(userId, collectionSlug, input)` — ajout avec position auto
    - `removeItem(userId, collectionSlug, gameId)` — retrait avec réordonnancement
    - `reorderItems(userId, collectionSlug, items)` — réordonnancement
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.4_

- [x] 3. Checkpoint — Vérifier que le service compile et que les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API Routes
  - [x] 4.1 Créer `src/app/api/players/[id]/collections/route.ts`
    - GET : lister les collections (publiques pour non-propriétaire, toutes pour propriétaire)
    - POST : créer une collection (authentifié, propriétaire uniquement)
    - _Requirements: 1.1, 4.1, 4.2, 8.3, 8.4_

  - [x] 4.2 Créer `src/app/api/players/[id]/collections/[slug]/route.ts`
    - GET : détail d'une collection (404 si privée et non-propriétaire)
    - PATCH : modifier une collection (propriétaire uniquement)
    - DELETE : supprimer une collection (propriétaire uniquement)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.4, 6.3, 6.4_

  - [x] 4.3 Créer `src/app/api/players/[id]/collections/[slug]/items/route.ts`
    - POST : ajouter un jeu à la collection
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 4.4 Créer `src/app/api/players/[id]/collections/[slug]/items/[gameId]/route.ts`
    - DELETE : retirer un jeu de la collection
    - _Requirements: 2.3_

  - [x] 4.5 Créer `src/app/api/players/[id]/collections/[slug]/items/reorder/route.ts`
    - PATCH : réordonner les jeux
    - _Requirements: 2.4_

- [x] 5. Checkpoint — Vérifier que les API routes fonctionnent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Hooks React
  - [x] 6.1 Créer `src/hooks/useCollections.ts`
    - Fetch des collections d'un joueur via l'API GET
    - Gestion du loading et des erreurs
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 6.2 Créer `src/hooks/useCollectionDetail.ts`
    - Fetch du détail d'une collection via l'API GET
    - Gestion du loading et des erreurs
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 6.3 Créer `src/hooks/useCollectionMutations.ts`
    - Fonctions : `createCollection`, `updateCollection`, `deleteCollection`, `toggleVisibility`, `addItem`, `removeItem`, `reorderItems`
    - Invalidation du cache après mutation
    - _Requirements: 1.1, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 7. Composants React
  - [x] 7.1 Créer `src/components/collections/CollectionCard.tsx`
    - Affichage : nom, description tronquée, nombre de jeux, couvertures miniatures, date de modification
    - Badge de visibilité pour le propriétaire
    - _Requirements: 4.3_

  - [x] 7.2 Créer `src/components/collections/CollectionList.tsx`
    - Grille de `CollectionCard`, état vide, skeleton de chargement
    - _Requirements: 4.4, 4.5_

  - [x] 7.3 Créer `src/components/collections/CollectionForm.tsx`
    - Formulaire de création/édition avec validation Zod
    - Champs : nom, description, visibilité
    - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.3_

  - [x] 7.4 Créer `src/components/collections/CollectionDetail.tsx`
    - En-tête : nom, description, propriétaire, nombre de jeux, date
    - Liste ordonnée des jeux
    - _Requirements: 5.1, 5.2_

  - [x] 7.5 Créer `src/components/collections/CollectionGameCard.tsx`
    - Affichage : couverture, titre, genres, note du propriétaire
    - _Requirements: 5.3_

  - [x] 7.6 Créer `src/components/collections/CollectionActions.tsx`
    - Boutons : modifier, supprimer, basculer visibilité, copier lien de partage
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2_

  - [x] 7.7 Créer `src/components/collections/AddGameToCollection.tsx`
    - Recherche de jeux avec sélection
    - Champ note optionnel
    - _Requirements: 2.1, 2.5_

  - [x] 7.8 Créer `src/components/collections/CollectionSkeleton.tsx`
    - Skeleton pour la liste et le détail
    - _Requirements: 4.5, 5.5_

- [x] 8. Pages Next.js
  - [x] 8.1 Créer `src/app/[locale]/players/[id]/collections/page.tsx`
    - Page liste des collections d'un joueur
    - Utilise `useCollections` et `CollectionList`
    - Bouton « Créer une collection » pour le propriétaire
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Créer `src/app/[locale]/players/[id]/collections/[slug]/page.tsx`
    - Page détail d'une collection
    - Utilise `useCollectionDetail`, `CollectionDetail`, `CollectionActions`
    - Gestion 404 pour collections privées/inexistantes
    - _Requirements: 5.1, 5.4, 6.1, 6.2, 6.3_

- [x] 9. Internationalisation
  - [x] 9.1 Ajouter les clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`
    - Section `collections` avec toutes les chaînes UI (titres, boutons, messages d'erreur, états vides)
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Tests des composants et du service
  - [x] 10.1 Écrire les tests unitaires du service `test/unit/lib/services/collectionService.test.ts`
    - Tests des fonctions utilitaires (slug, positions)
    - Tests des edge cases (noms avec caractères spéciaux, collections vides)
    - _Requirements: 1.3, 2.1, 2.3_

  - [x] 10.2 Écrire les tests unitaires de validation `test/unit/lib/validations/collection.test.ts`
    - Tests des cas limites de validation (longueurs exactes, caractères spéciaux)
    - _Requirements: 1.2, 1.5, 2.5_

  - [x] 10.3 Écrire les tests de composants `test/unit/components/collections/CollectionCard.test.tsx`
    - Rendu avec données complètes et partielles
    - Badge de visibilité conditionnel
    - _Requirements: 4.3_

  - [x] 10.4 Écrire les tests de composants `test/unit/components/collections/CollectionForm.test.tsx`
    - Validation du formulaire, soumission, messages d'erreur
    - _Requirements: 1.2, 1.5_

- [x] 11. Checkpoint final — Vérifier que tous les tests passent
  - Exécuter `bun run test:all`
  - Vérifier que tous les tests passent (parallèles + isolés)
  - Corriger les tests en échec si nécessaire

- [x] 12. Lint du code
  - [x] 12.1 Exécuter `bun run lint`
  - [x] 12.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 12.3 Corriger les erreurs de lint si nécessaire

- [x] 13. Build de production
  - [x] 13.1 Exécuter `bun run build`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 13.3 Corriger les erreurs de build si nécessaire

- [x] 14. README de la fonctionnalité
  - [x] 14.1 Créer `docs/README_GAME_COLLECTIONS.md`
  - [x] 14.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les property tests valident les propriétés universelles de correction
- Les tests unitaires valident les cas spécifiques et les edge cases
- Framework de test : Bun (`bun:test`) + `fast-check` pour les property tests
- Tous les tests dans `test/` (pas de `__tests__` dans `src/`)
