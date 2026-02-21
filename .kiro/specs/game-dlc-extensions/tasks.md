# Plan d'implémentation : Extensions et DLC de jeux

## Vue d'ensemble

Implémentation incrémentale : migration DB → types → service IGDB → service d'import → API route → composant UI → script bulk import. Chaque étape est testable indépendamment.

## Tâches

- [ ] 1. Créer la table `game_dlc_extensions` et les types
  - [ ] 1.1 Créer la migration Supabase `supabase/migrations/20240301000001_game_dlc_extensions.sql`
    - Table avec colonnes : id, game_id, igdb_id, name, slug, summary, category, cover_image_url, release_date, display_order, created_at
    - Contrainte UNIQUE(game_id, igdb_id), CHECK sur category ('dlc', 'expansion', 'bundle')
    - Index sur game_id et igdb_id
    - RLS : lecture publique, écriture service_role
    - COMMENT ON pour documenter la table et les colonnes
    - _Requirements: 3.1, 3.2_
  - [ ] 1.2 Ajouter les types IGDB dans `src/types/igdb.ts`
    - Ajouter `category?: number`, `dlcs?: number[]`, `expansions?: number[]`, `bundles?: number[]` à `IGDBGame`
    - Créer l'interface `IGDBDlcExtension` avec id, name, slug, summary, category, first_release_date, cover
    - _Requirements: 1.1, 1.2_
  - [ ] 1.3 Ajouter les types applicatifs dans `src/types/game.ts`
    - Créer le type `DlcExtensionCategory = "dlc" | "expansion" | "bundle"`
    - Créer l'interface `GameDlcExtension` avec id, igdbId, name, slug, summary, category, coverImageUrl, releaseDate, gameSlug
    - Ajouter `dlcExtensions?: GameDlcExtension[]` à `GameDetails`
    - _Requirements: 3.2, 6.1, 7.4_

- [ ] 2. Implémenter le service IGDB et la logique de transformation
  - [ ] 2.1 Modifier `IGDBService.getGameDetails()` dans `src/lib/services/igdbService.ts`
    - Ajouter `dlcs`, `expansions`, `bundles` aux champs de la requête IGDB
    - _Requirements: 1.1_
  - [ ] 2.2 Créer `IGDBService.getDlcExtensions()` dans `src/lib/services/igdbService.ts`
    - Méthode statique qui prend un tableau d'IDs et retourne `IGDBDlcExtension[]`
    - Requête batch vers `/games` avec `where id = (id1, id2, ...)`
    - Champs : name, slug, summary, category, first_release_date, cover.image_id
    - Retourne tableau vide si aucun ID ou si erreur
    - _Requirements: 2.1, 2.2_
  - [ ] 2.3 Créer une fonction utilitaire de transformation dans `src/lib/utils/dlcExtensionUtils.ts`
    - Fonction `transformIgdbToDlcExtensionRow(extension, gameId, sourceCategory, displayOrder)` qui transforme un `IGDBDlcExtension` en row de base de données
    - Fonction `collectDlcExtensionIds(igdbGame)` qui collecte et tague les IDs depuis dlcs/expansions/bundles
    - Fonction `sortDlcExtensions(extensions)` qui trie par catégorie puis date
    - Fonction `groupDlcExtensionsByCategory(extensions)` qui regroupe par catégorie
    - _Requirements: 3.1, 3.2, 6.1, 7.3_
  - [ ]* 2.4 Écrire le test property-based pour la transformation
    - **Property 1: Transformation IGDB → base de données complète et correcte**
    - **Validates: Requirements 3.1, 3.2**
    - Fichier : `test/unit/lib/utils/dlcExtensionUtils.property.test.ts`
  - [ ]* 2.5 Écrire le test property-based pour le tri
    - **Property 2: Tri des contenus additionnels par catégorie puis par date**
    - **Validates: Requirements 6.1**
    - Fichier : `test/unit/lib/utils/dlcExtensionUtils.property.test.ts`
  - [ ]* 2.6 Écrire le test property-based pour le regroupement
    - **Property 3: Regroupement par catégorie**
    - **Validates: Requirements 7.3**
    - Fichier : `test/unit/lib/utils/dlcExtensionUtils.property.test.ts`

- [ ] 3. Checkpoint - Vérifier les tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Intégrer dans le service d'import
  - [ ] 4.1 Ajouter `createDlcExtensions()` dans `src/lib/services/gameImportService.ts`
    - Méthode privée statique qui collecte les IDs, appelle `getDlcExtensions`, transforme et insère
    - Try/catch avec log d'erreur, ne bloque pas l'import principal
    - _Requirements: 3.1, 4.1_
  - [ ] 4.2 Ajouter `updateDlcExtensions()` dans `src/lib/services/gameImportService.ts`
    - Supprime les entrées existantes puis appelle `createDlcExtensions`
    - _Requirements: 3.4, 4.2_
  - [ ] 4.3 Appeler `createDlcExtensions` dans `importFromIGDB()` et `updateDlcExtensions` dans `syncWithIGDB()`
    - Ajouter les appels après `createVersions`/`updateVersions` respectivement
    - _Requirements: 4.1, 4.2_

- [ ] 5. Exposer via l'API et afficher dans l'UI
  - [ ] 5.1 Ajouter la requête `game_dlc_extensions` dans `src/app/api/games/[slug]/route.ts`
    - Requête séparée avec try/catch (pattern game_versions)
    - Tri par catégorie puis date de sortie
    - Sous-requête pour résoudre les gameSlug des jeux locaux via igdb_id
    - Ajouter `dlcExtensions` à la réponse transformée
    - _Requirements: 6.1, 6.2, 7.5_
  - [ ] 5.2 Créer le composant `src/components/games/GameDlcExtensions.tsx`
    - Reçoit `dlcExtensions` et `accentColor`
    - Regroupe par catégorie avec titres traduits
    - Cartes avec couverture, nom, résumé tronqué, date de sortie
    - Lien vers la page du jeu si `gameSlug` est défini
    - _Requirements: 7.3, 7.4, 7.5_
  - [ ] 5.3 Ajouter l'onglet `dlcExtensions` dans `src/components/games/details/GameDetailsTabs.tsx`
    - Ajouter `"dlcExtensions"` au type `TabType`
    - Bouton conditionnel (visible si `game.dlcExtensions?.length > 0`)
    - Rendu du composant `GameDlcExtensions` dans le contenu de l'onglet
    - _Requirements: 7.1, 7.2_
  - [ ] 5.4 Ajouter les traductions dans `src/messages/fr.json` et `src/messages/en.json`
    - Clés : `gameDetails.tabs.dlcExtensions`, `gameDetails.dlcExtensions.title`, `gameDetails.dlcExtensions.noData`, `gameDetails.dlcExtensions.categories.dlc/expansion/bundle`, `gameDetails.dlcExtensions.viewGame`
    - _Requirements: 8.1, 8.2_
  - [ ]* 5.5 Écrire le test property-based pour le rendu des cartes
    - **Property 4: Complétude du rendu par carte**
    - **Validates: Requirements 7.4**
    - Fichier : `test/unit/components/games/GameDlcExtensions.property.test.ts`

- [ ] 6. Intégrer dans le script d'import en masse
  - [ ] 6.1 Créer la fonction `importDlcExtensions()` dans `scripts/igdb-import/game-importer.ts`
    - Suit le pattern de `importGameVersions`
    - Support dry-run avec affichage du nombre trouvé
    - _Requirements: 5.1, 5.2_
  - [ ] 6.2 Appeler `importDlcExtensions` dans `importGameFromIGDB()`
    - Ajouter l'appel après `importGameVersions`
    - _Requirements: 5.1_

- [ ] 7. Checkpoint final - Vérifier tous les tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Lint du code
  - [ ] 8.1 Exécuter `bun run lint`
  - [ ] 8.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [ ] 8.3 Corriger les erreurs et warnings de lint si nécessaire

- [ ] 9. Build de production
  - [ ] 9.1 Exécuter `bun run build`
  - [ ] 9.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 9.3 Corriger les erreurs de build si nécessaire

- [ ] 10. README de la fonctionnalité
  - [ ] 10.1 Créer `docs/README_GAME_DLC_EXTENSIONS.md`
  - [ ] 10.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés de correction universelles
- Les tests unitaires valident les exemples spécifiques et les cas limites
