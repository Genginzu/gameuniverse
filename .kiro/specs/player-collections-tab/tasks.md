# Tâches — Onglet Collections du Profil Joueur

## Vue d'ensemble

Implémenter l'onglet « Collections » complet du profil joueur : enrichir l'endpoint API existant avec pagination, tri et statistiques agrégées, créer un service client, un hook de gestion d'état, et les composants UI (statistiques, tri, grille de CollectionCard, scroll infini). Le tout intégré dans le `PlayerTabContent` existant avec traductions FR/EN et design glassmorphism. Aucune migration SQL nécessaire.

## Tâches

- [x] 1. Types et modèles de données
  - [x] 1.1 Créer `src/types/playerCollection.ts` avec les types `CollectionSortOption`, `PlayerCollectionsStatsData`, `PlayerCollectionsResponse`, `PlayerCollectionsQueryParams` tels que définis dans le design
    - Réutiliser le type `CollectionSummary` existant dans `src/types/collection.ts`
    - _Exigences : 1.2, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Service serveur et route API
  - [x] 2.1 Créer `src/lib/services/playerCollectionsServerService.ts` avec une classe `PlayerCollectionsServerService` exposant :
    - `fetchPlayerCollections(playerId, isOwner, sort, page)` : requête paginée sur `game_collections` avec jointure `game_collection_items` pour les couvertures et le comptage, filtre de visibilité (`is_public = true` si non-propriétaire), ORDER BY selon le paramètre sort, pagination offset/limit (12 par page)
    - `fetchPlayerCollectionsStats(playerId, isOwner)` : calcul du nombre total de collections, nombre total de jeux (somme des items), nom de la collection avec le plus de jeux
    - Gestion du cas PGRST205 (retourner liste vide)
    - Tri applicatif pour `games_count_desc` (récupérer toutes les collections visibles, trier en mémoire, puis paginer)
    - _Exigences : 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  - [x] 2.2 Enrichir `src/app/api/players/[id]/collections/route.ts` — modifier le handler GET pour :
    - Conserver la rétrocompatibilité (sans paramètre `page`, comportement identique)
    - Parser les paramètres `page`, `sort`, `locale` quand `page` est fourni
    - Appeler `PlayerCollectionsServerService` (stats uniquement pour page 1)
    - Retourner la réponse JSON avec collections, stats et pagination
    - Gérer les erreurs : 404 joueur inexistant, 400 UUID invalide, 500 erreur serveur
    - Valider le paramètre `sort` (fallback à `updated_at_desc` si invalide)
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [x] 3. Service client et fonctions pures
  - [x] 3.1 Créer `src/lib/services/playerCollectionsService.ts` avec une classe `PlayerCollectionsService` exposant :
    - `fetchCollections(playerId, params: PlayerCollectionsQueryParams)` : appel GET vers `/api/players/{id}/collections` avec query params
    - Propagation des erreurs avec message descriptif
    - Imports via alias `@/`
    - _Exigences : 6.1, 6.2, 6.3, 6.4_
  - [x] 3.2 Créer les fonctions pures utilitaires dans `src/lib/services/playerCollectionsService.ts` :
    - `buildCollectionsUrl(playerId, params)` : construction de l'URL avec query params
    - `computeCollectionsPagination(totalCount, page, pageSize)` : calcul pagination
    - `computeCollectionsStats(collections)` : calcul des statistiques agrégées
    - `filterCollectionsByVisibility(collections, isOwner)` : filtrage par visibilité
    - `sortCollections(collections, sortOption)` : tri d'une liste de collections
    - _Exigences : 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 6.1_

- [x] 4. Checkpoint — Vérifier que l'API et les services fonctionnent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Hook usePlayerCollections
  - [x] 5.1 Créer `src/hooks/usePlayerCollections.ts` avec le hook `usePlayerCollections(playerId, locale, isOwner)` gérant :
    - `collections: CollectionSummary[]` — liste cumulée
    - `stats: PlayerCollectionsStatsData | null` — statistiques (chargées une seule fois avec la page 1)
    - `isLoading`, `isLoadingMore`, `hasNextPage`, `sortOption`, `error`
    - `setSort(option)` — change le tri, reset la pagination et la liste
    - `loadMore()` — charge la page suivante et concatène
    - _Exigences : 2.1, 2.4, 4.1, 4.2, 4.3_

- [x] 6. Composants UI
  - [x] 6.1 Créer `src/components/players/PlayerCollectionsStats.tsx` — bloc glassmorphism affichant 3 métriques dans des cartes `.glass-card` :
    - Nombre total de collections
    - Nombre total de jeux dans toutes les collections
    - Nom de la collection contenant le plus de jeux
    - Fonds semi-transparents, dark mode, coins arrondis `rounded-xl`
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2_
  - [x] 6.2 Créer `src/components/players/PlayerCollectionsSortSelect.tsx` — sélecteur de tri glassmorphism avec 4 options :
    - « Plus récentes » (défaut, `updated_at_desc`)
    - « Nom A-Z » (`name_asc`)
    - « Nom Z-A » (`name_desc`)
    - « Plus de jeux » (`games_count_desc`)
    - Utiliser la classe `.glass-dropdown`
    - _Exigences : 4.1, 4.2, 4.3, 8.1, 8.2_
  - [x] 6.3 Créer `src/components/players/PlayerCollectionsFeed.tsx` — composant principal :
    - Affiche `PlayerCollectionsStats` en haut, puis `PlayerCollectionsSortSelect`, puis la grille de `CollectionCard` existant
    - Grille responsive : 2 colonnes mobile, 3 tablette, 4 desktop
    - Scroll infini via `IntersectionObserver` sur un élément sentinelle
    - Skeleton pendant le chargement initial (reprenant la forme des CollectionCard)
    - Message vide si aucune collection
    - Passer `isOwner` pour afficher les badges de visibilité sur les CollectionCard
    - Attributs ARIA : `role="feed"`, `aria-busy`, `aria-label`
    - Navigation clavier : liens focusables et activables via Entrée
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. Intégration et traductions
  - [x] 7.1 Modifier `src/components/players/PlayerTabContent.tsx` — remplacer `PlayerCollections` par `PlayerCollectionsFeed` dans le case `"collections"`, en passant `playerId`, `locale` et `isOwner`
    - _Exigences : 2.1_
  - [x] 7.2 Ajouter les clés de traduction dans `src/messages/fr.json` sous `players.collectionsTab` : titre, options de tri (« Plus récentes », « Nom A-Z », « Nom Z-A », « Plus de jeux »), messages vides, statistiques (« collections », « jeux au total », « plus grande collection »), badges de visibilité (« Public », « Privé »), libellés ARIA
    - _Exigences : 7.1, 7.2, 7.3_
  - [x] 7.3 Ajouter les clés de traduction correspondantes dans `src/messages/en.json`
    - _Exigences : 7.1, 7.2, 7.3_

- [x] 8. Checkpoint — Vérifier le rendu et l'intégration des composants
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Tests unitaires
  - [x] 9.1 Créer `test/unit/api/players/collections.test.ts` — tests de la route API : réponse valide avec collections et stats, joueur inexistant (404), UUID invalide (400), paramètre sort invalide (fallback défaut), visibilité propriétaire vs visiteur, erreur serveur (500), rétrocompatibilité sans paramètre `page`
    - _Exigences : 1.1, 1.2, 1.5, 1.8, 1.9, 1.10_
  - [ ] 9.2 Créer `test/unit/components/players/PlayerCollectionsFeed.test.tsx` — tests du composant : rendu avec collections, état vide, état de chargement (skeleton), attributs ARIA (`role="feed"`, `aria-busy`), sélecteur de tri, grille responsive
    - _Exigences : 2.1, 2.3, 2.5, 2.6, 8.3, 8.5_
  - [ ] 9.3 Créer `test/unit/lib/services/playerCollectionsService.test.ts` — tests du service client : appel réussi, propagation d'erreur avec message descriptif, construction URL avec différents paramètres
    - _Exigences : 6.1, 6.2, 6.3_

- [ ] 10. Tests property-based
  - [ ] 10.1 Créer `test/unit/lib/services/playerCollectionsService.property.test.ts` avec les propriétés suivantes :
  - [ ] 10.2 Propriété 1 : Correction du tri — pour toute liste de collections et toute option de tri, la liste retournée est correctement ordonnée selon le critère choisi
    - **Property 1 : Correction du tri**
    - `// Feature: player-collections-tab, Property 1: Correction du tri`
    - **Valide : Exigences 1.1, 1.5, 1.6**
  - [ ] 10.3 Propriété 2 : Correction de la pagination — pour tout N et page p, la page retourne au plus 12 collections, totalPages = ceil(N/12), hasNextPage ssi p < totalPages
    - **Property 2 : Correction de la pagination**
    - `// Feature: player-collections-tab, Property 2: Correction de la pagination`
    - **Valide : Exigences 1.2, 1.4**
  - [ ] 10.4 Propriété 3 : Correction des statistiques agrégées — pour tout ensemble de collections, totalCollections, totalGames et largestCollection sont corrects
    - **Property 3 : Correction des statistiques agrégées**
    - `// Feature: player-collections-tab, Property 3: Correction des statistiques agrégées`
    - **Valide : Exigence 1.7**
  - [ ] 10.5 Propriété 4 : Correction du filtrage par visibilité — pour tout ensemble de collections mixtes, le filtrage retourne toutes les collections si isOwner, sinon uniquement les publiques
    - **Property 4 : Correction du filtrage par visibilité**
    - `// Feature: player-collections-tab, Property 4: Correction du filtrage par visibilité`
    - **Valide : Exigences 1.8, 1.9**
  - [ ] 10.6 Propriété 5 : Construction correcte de l'URL — pour tout playerId et params, l'URL contient le bon chemin et les query params non-undefined
    - **Property 5 : Construction correcte de l'URL du service**
    - `// Feature: player-collections-tab, Property 5: Construction correcte de l'URL du service`
    - **Valide : Exigence 6.1**
  - [ ] 10.7 Propriété 6 : Propagation des erreurs — pour tout code HTTP d'erreur, le service lève une exception avec message descriptif
    - **Property 6 : Propagation des erreurs du service**
    - `// Feature: player-collections-tab, Property 6: Propagation des erreurs du service`
    - **Valide : Exigence 6.3**

- [ ] 11. Checkpoint final — Exécution des tests complets
  - [ ] 11.1 Exécuter `bun run test:all`
  - [ ] 11.2 Vérifier que tous les tests passent
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
  - [ ] 14.1 Créer `docs/README_player-collections-tab.md`
  - [ ] 14.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction du design (Propriétés 1-6)
- Les tests unitaires couvrent les cas concrets, les cas limites et les intégrations
- Tous les tests utilisent Vitest avec fast-check pour les property-based, placés dans `test/`
- TypeScript est le langage d'implémentation
- Aucune migration SQL nécessaire (table `game_collections` existante avec index)
- Le `CollectionCard` existant est réutilisé directement (pas de composant carte dédié)
- L'endpoint API existant est enrichi avec rétrocompatibilité (sans paramètre `page`, comportement inchangé)
