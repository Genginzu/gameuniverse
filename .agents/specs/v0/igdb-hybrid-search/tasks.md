# Plan d'Implémentation : Recherche Hybride IGDB

## Vue d'ensemble

Ce plan implémente la fonctionnalité de recherche hybride combinant Supabase et
IGDB. L'implémentation suit une approche incrémentale : d'abord les services
backend, puis les API routes, et enfin les composants UI.

## Tâches

- [x] 1. Configuration et types de base
  - [x] 1.1 Ajouter les variables d'environnement IGDB
    - Ajouter `IGDB_CLIENT_ID` et `IGDB_CLIENT_SECRET` dans `.env.local`
    - Mettre à jour `.env.example` avec les nouvelles variables
    - _Exigences: 6.1_
  - [x] 1.2 Créer les types TypeScript pour IGDB et la recherche
    - Créer `src/types/igdb.ts` avec les interfaces `IGDBGame`,
      `IGDBSearchResult`, `IGDBAuthToken`
    - Créer `src/types/search.ts` avec `HybridSearchRequest`,
      `HybridSearchResponse`, `SearchResultItem`
    - Étendre `src/types/game.ts` avec `igdbId` et `source`
    - _Exigences: 6.4_

  - [x] 1.3 Ajouter la colonne igdb_id à la table games
    - Créer une migration Supabase pour ajouter `igdb_id INTEGER UNIQUE` à la
      table `games`
    - Créer l'index `idx_games_igdb_id`
    - _Exigences: 3.2_

- [x] 2. Implémenter IGDBService
  - [x] 2.1 Implémenter l'authentification Twitch OAuth
    - Créer `src/lib/services/igdbService.ts`
    - Implémenter `getAccessToken()` avec cache en mémoire
    - Gérer l'expiration et le rafraîchissement du token
    - _Exigences: 6.1, 6.3_

  - [x] 2.2 Écrire le test de propriété pour le cache du token
    - **Property 10: Cache du token IGDB**
    - **Valide: Exigences 6.3**

  - [x] 2.3 Implémenter la recherche de jeux IGDB
    - Implémenter `searchGames(query, limit)` avec requête à l'API IGDB
    - Implémenter `buildImageUrl(imageId, size)` pour les URLs d'images
    - Transformer les résultats au format `IGDBSearchResult`
    - _Exigences: 1.2, 6.4_

  - [x] 2.4 Écrire le test de propriété pour la transformation des données
    - **Property 11: Transformation données IGDB valide**
    - **Valide: Exigences 6.4**

  - [x] 2.5 Implémenter la récupération des détails d'un jeu
    - Implémenter `getGameDetails(igdbId)` pour récupérer toutes les
      informations
    - Inclure cover, screenshots, genres, companies
    - _Exigences: 5.1_

- [ ] 3. Checkpoint - Vérifier IGDBService
  - S'assurer que tous les tests passent, demander à l'utilisateur si des
    questions se posent.

- [x] 4. Implémenter HybridSearchService
  - [x] 4.1 Implémenter la recherche parallèle
    - Créer `src/lib/services/hybridSearchService.ts`
    - Implémenter `search(options)` avec `Promise.allSettled` pour les deux
      sources
    - Gérer les erreurs partielles (une source échoue)
    - _Exigences: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Écrire le test de propriété pour la recherche parallèle
    - **Property 1: Recherche parallèle déclenchée**
    - **Valide: Exigences 1.1, 1.2**

  - [x] 4.3 Écrire le test de propriété pour la résilience aux erreurs
    - **Property 2: Résilience aux erreurs de source**
    - **Valide: Exigences 1.4**

  - [x] 4.4 Implémenter la déduplication des résultats
    - Implémenter `deduplicateResults(localGames, igdbGames)`
    - Utiliser `igdbId` comme clé de correspondance
    - Préserver l'ordre (local d'abord)
    - _Exigences: 3.1, 3.2, 3.3_

  - [x] 4.5 Écrire le test de propriété pour la déduplication
    - **Property 6: Déduplication par identifiant IGDB**
    - **Valide: Exigences 3.1, 3.2**

  - [x] 4.6 Implémenter la limitation des résultats
    - Limiter à 5 jeux locaux et 5 jeux IGDB maximum
    - Calculer `hasMore` pour le lien "Voir tous"
    - _Exigences: 7.3_

  - [x] 4.7 Écrire le test de propriété pour la limite d'affichage
    - **Property 12: Limite d'affichage respectée**
    - **Valide: Exigences 7.3**

- [x] 5. Implémenter GameImportService
  - [x] 5.1 Implémenter l'import d'un nouveau jeu
    - Créer `src/lib/services/gameImportService.ts`
    - Implémenter `importFromIGDB(igdbId)` pour créer un jeu complet
    - Transformer les données IGDB vers le format Supabase
    - _Exigences: 5.1, 5.2_

  - [x] 5.2 Implémenter la gestion des entités liées
    - Implémenter `ensureRelatedEntities(igdbGame)` pour genres et companies
    - Créer les entités manquantes ou réutiliser les existantes
    - Créer les traductions FR/EN si disponibles
    - _Exigences: 5.3, 5.4_

  - [x] 5.3 Écrire le test de propriété pour l'import complet
    - **Property 9: Import complet depuis IGDB**
    - **Valide: Exigences 5.1, 5.2, 5.3, 5.4**

  - [x] 5.4 Implémenter la synchronisation d'un jeu existant
    - Implémenter `syncWithIGDB(gameId, igdbId)` pour mise à jour background
    - Préserver les données existantes en cas d'erreur
    - _Exigences: 4.2, 4.3, 4.4_

  - [x] 5.5 Écrire le test de propriété pour la préservation des données
    - **Property 8: Préservation des données en cas d'erreur de
      synchronisation**
    - **Valide: Exigences 4.4**

- [ ] 6. Checkpoint - Vérifier les services
  - S'assurer que tous les tests passent, demander à l'utilisateur si des
    questions se posent.

- [x] 7. Créer les API Routes
  - [x] 7.1 Créer l'API de recherche hybride
    - Créer `src/app/api/search/hybrid/route.ts`
    - Implémenter GET avec paramètres `query`, `locale`, `localLimit`,
      `igdbLimit`
    - Valider la longueur minimale de la requête (2 caractères)
    - _Exigences: 1.1, 1.2, 7.3_

  - [x] 7.2 Créer l'API d'import de jeu
    - Créer `src/app/api/games/import/route.ts`
    - Implémenter POST avec `igdbId` dans le body
    - Retourner le jeu créé ou une erreur
    - _Exigences: 5.1, 5.2, 5.5, 5.6_

  - [x] 7.3 Créer l'API de synchronisation de jeu
    - Créer `src/app/api/games/[slug]/sync/route.ts`
    - Implémenter POST pour déclencher la mise à jour background
    - Retourner immédiatement (fire-and-forget)
    - _Exigences: 4.2, 4.3_

- [x] 8. Implémenter les composants UI
  - [x] 8.1 Créer le composant SearchResultsDropdown
    - Créer `src/components/games/SearchResultsDropdown.tsx`
    - Afficher les résultats avec image, titre, développeur
    - Afficher l'indicateur de source (local/IGDB)
    - Afficher le lien "Voir tous les résultats"
    - Afficher "Aucun jeu trouvé" si vide
    - _Exigences: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 8.2 Écrire les tests de propriété pour l'affichage
    - **Property 3: Informations de jeu dans le rendu**
    - **Property 4: Ordre des résultats (local d'abord)**
    - **Property 5: Indicateur de source présent**
    - **Valide: Exigences 2.1, 2.2, 2.3**

  - [x] 8.3 Modifier GameSearchBar pour la recherche hybride
    - Modifier `src/components/games/GameSearchBar.tsx`
    - Intégrer l'appel à l'API de recherche hybride
    - Gérer le debounce (300ms) et l'annulation des requêtes
    - Afficher le SearchResultsDropdown avec les résultats
    - _Exigences: 7.1, 7.2_

  - [x] 8.4 Implémenter la gestion des clics sur les résultats
    - Naviguer vers la page du jeu pour les jeux locaux
    - Déclencher la sync background pour les jeux locaux avec igdbId
    - Appeler l'API d'import pour les jeux IGDB
    - Gérer les états de chargement et d'erreur
    - _Exigences: 4.1, 4.2, 5.5, 5.6_

  - [x] 8.5 Implémenter la fermeture du dropdown
    - Fermer sur clic extérieur
    - Fermer sur touche Échap
    - Fermer après sélection d'un jeu
    - _Exigences: 7.4, 7.5_

- [ ] 9. Checkpoint final - Vérifier l'intégration complète
  - S'assurer que tous les tests passent, demander à l'utilisateur si des
    questions se posent.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour
  un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- Les tests de propriétés valident les propriétés de correction universelles
- Les tests unitaires valident les exemples spécifiques et cas limites
