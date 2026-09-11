# Tâches — Onglet Avis du Profil Joueur

## Vue d'ensemble

Implémenter l'onglet « Avis » du profil joueur : un endpoint API paginé avec statistiques agrégées, un service client, un hook de gestion d'état, et les composants UI (statistiques, tri, cartes d'avis, scroll infini). Le tout intégré dans le `PlayerTabContent` existant avec traductions FR/EN et design glassmorphism.

## Tâches

- [x] 1. Types et modèles de données
  - [x] 1.1 Créer `src/types/playerReview.ts` avec les types `ReviewSortOption`, `PlayerReviewItem`, `RatingDistribution`, `PlayerReviewsStatsData`, `PlayerReviewsResponse`, `PlayerReviewsQueryParams` tels que définis dans le design
    - _Exigences : 1.2, 1.4, 1.5_

- [x] 2. Service serveur et route API
  - [x] 2.1 Créer `src/lib/services/playerReviewsServerService.ts` avec une classe `PlayerReviewsServerService` exposant :
    - `fetchPlayerReviews(playerId, locale, sort, page)` : requête paginée sur `game_reviews` avec jointures `games` et `game_translations`, ORDER BY selon le paramètre sort, pagination offset/limit (10 par page)
    - `fetchPlayerReviewsStats(playerId)` : calcul du count, avg(rating), et distribution par tranche (0-5, 6-10, 11-15, 16-20)
    - Gestion du cas PGRST205 (retourner liste vide)
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_
  - [x] 2.2 Créer `src/app/api/players/[id]/reviews/route.ts` avec un handler GET qui :
    - Valide l'ID joueur via `PlayerService.validatePlayerId`
    - Parse les paramètres `page`, `sort`, `locale`
    - Appelle `PlayerReviewsServerService` (stats uniquement pour page 1)
    - Retourne la réponse JSON avec reviews, stats et pagination
    - Gère les erreurs : 404 joueur inexistant, 400 UUID invalide, 500 erreur serveur
    - _Exigences : 1.1, 1.3, 1.5, 1.6, 1.7_

- [x] 3. Service client
  - [x] 3.1 Créer `src/lib/services/playerReviewsService.ts` avec une classe `PlayerReviewsService` exposant :
    - `fetchReviews(playerId, params: PlayerReviewsQueryParams)` : appel GET vers `/api/players/{id}/reviews` avec query params
    - Propagation des erreurs avec message descriptif
    - Imports via alias `@/`
    - _Exigences : 5.1, 5.2, 5.3_
  - [x] 3.2 Créer les fonctions pures utilitaires dans `src/lib/services/playerReviewsService.ts` (ou `src/lib/utils/playerReviewUtils.ts` si nécessaire pour la taille) :
    - `buildReviewsUrl(playerId, params)` : construction de l'URL avec query params
    - `computeReviewsPagination(totalCount, page, pageSize)` : calcul pagination
    - `computeRatingDistribution(ratings)` : calcul distribution par tranche
    - `sortReviews(reviews, sortOption)` : tri d'une liste d'avis
    - `transformReviewRecord(record)` : transformation d'un enregistrement brut en `PlayerReviewItem`
    - _Exigences : 1.2, 1.3, 1.4, 1.5, 5.1_

- [x] 4. Checkpoint — Vérifier que l'API et les services fonctionnent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Hook usePlayerReviews
  - [x] 5.1 Créer `src/hooks/usePlayerReviews.ts` avec le hook `usePlayerReviews(playerId, locale)` gérant :
    - `reviews: PlayerReviewItem[]` — liste cumulée
    - `stats: PlayerReviewsStatsData | null` — statistiques (chargées une seule fois)
    - `isLoading`, `isLoadingMore`, `hasNextPage`, `sortOption`, `error`
    - `setSort(option)` — change le tri, reset la pagination
    - `loadMore()` — charge la page suivante et concatène
    - _Exigences : 2.1, 2.3, 4.1, 4.2, 4.3_

- [x] 6. Composants UI
  - [x] 6.1 Créer `src/components/players/PlayerReviewsStats.tsx` — bloc glassmorphism affichant :
    - Nombre total d'avis
    - Note moyenne avec `getRatingColor`
    - Distribution des notes en 4 barres horizontales (0-5, 6-10, 11-15, 16-20) avec pourcentage et count
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 7.1_
  - [x] 6.2 Créer `src/components/players/PlayerReviewsSortSelect.tsx` — sélecteur de tri glassmorphism avec 4 options : « Plus récents » (défaut), « Plus anciens », « Meilleures notes », « Notes les plus basses »
    - _Exigences : 4.1, 4.2, 7.1_
  - [x] 6.3 Créer `src/components/players/PlayerReviewCard.tsx` — carte glassmorphism affichant :
    - Image de couverture du jeu (miniature)
    - Nom du jeu (lien vers `/[locale]/games/[slug]`)
    - Note sur 20 avec code couleur (`getRatingColor`)
    - Extrait du contenu HTML (tronqué)
    - Points positifs et négatifs
    - Date formatée selon la locale
    - _Exigences : 2.2, 6.2, 7.1, 7.2, 7.4_
  - [x] 6.4 Créer `src/components/players/PlayerReviewsFeed.tsx` — composant principal :
    - Affiche `PlayerReviewsStats` en haut, puis `PlayerReviewsSortSelect`, puis la liste de `PlayerReviewCard`
    - Scroll infini via `IntersectionObserver` sur un élément sentinelle
    - Skeleton pendant le chargement initial
    - Message vide si aucun avis
    - Attributs ARIA : `role="feed"`, `aria-busy`, `aria-label`
    - _Exigences : 2.1, 2.3, 2.4, 2.5, 3.4, 7.1, 7.3, 7.5_

- [x] 7. Intégration et traductions
  - [x] 7.1 Modifier `src/components/players/PlayerTabContent.tsx` — ajouter le case `"reviews"` qui rend `<PlayerReviewsFeed playerId={player.id} locale={locale} />`
    - _Exigences : 2.1_
  - [x] 7.2 Ajouter les clés de traduction dans `src/messages/fr.json` sous `players.reviews` : titre, options de tri, messages vides, statistiques, libellés de tranches de notes, libellés ARIA
    - _Exigences : 6.1, 6.2, 6.3_
  - [x] 7.3 Ajouter les clés de traduction correspondantes dans `src/messages/en.json`
    - _Exigences : 6.1, 6.2, 6.3_

- [x] 8. Checkpoint — Vérifier le rendu et l'intégration des composants
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Tests unitaires
  - [x] 9.1 Créer `test/unit/api/players/reviews.test.ts` — tests de la route API : réponse valide avec reviews et stats, joueur inexistant (404), UUID invalide (400), paramètre sort invalide (fallback défaut), erreur serveur (500)
    - _Exigences : 1.1, 1.6, 1.7_
  - [x] 9.2 Créer `test/unit/components/players/PlayerReviewsFeed.test.tsx` — tests du composant : rendu avec avis, état vide, état de chargement (skeleton), attributs ARIA (`role="feed"`, `aria-busy`), sélecteur de tri
    - _Exigences : 2.1, 2.4, 2.5, 7.3, 7.5_
  - [x] 9.3 Créer `test/unit/lib/services/playerReviewsService.test.ts` — tests du service client : appel réussi, propagation d'erreur avec message descriptif, construction URL avec différents paramètres
    - _Exigences : 5.1, 5.2_

- [x] 10. Tests property-based
  - [x] 10.1 Créer `test/unit/lib/services/playerReviewsService.property.test.ts` avec les propriétés suivantes :
  - [x] 10.2 Propriété 1 : Correction du tri — pour toute liste d'avis et toute option de tri, la liste retournée est correctement ordonnée
    - **Property 1 : Correction du tri**
    - `// Feature: player-reviews-tab, Property 1: Correction du tri`
    - **Valide : Exigences 1.1, 1.7, 4.2**
  - [x] 10.3 Propriété 2 : Complétude des données après transformation — pour tout enregistrement brut, le `PlayerReviewItem` résultant contient tous les champs requis
    - **Property 2 : Complétude des données après transformation**
    - `// Feature: player-reviews-tab, Property 2: Complétude des données après transformation`
    - **Valide : Exigence 1.2**
  - [x] 10.4 Propriété 3 : Correction de la pagination — pour tout N et page p, la pagination retourne au plus 10 avis, totalPages = ceil(N/10), hasNextPage ssi p < totalPages
    - **Property 3 : Correction de la pagination**
    - `// Feature: player-reviews-tab, Property 3: Correction de la pagination`
    - **Valide : Exigences 1.3, 1.5**
  - [x] 10.5 Propriété 4 : Correction des statistiques agrégées — pour tout ensemble de notes, totalCount, averageRating et distribution sont corrects
    - **Property 4 : Correction des statistiques agrégées**
    - `// Feature: player-reviews-tab, Property 4: Correction des statistiques agrégées`
    - **Valide : Exigences 1.4, 3.3**
  - [x] 10.6 Propriété 5 : Construction correcte de l'URL — pour tout playerId et params, l'URL contient le bon chemin et les query params non-undefined
    - **Property 5 : Construction correcte de l'URL du service**
    - `// Feature: player-reviews-tab, Property 5: Construction correcte de l'URL du service`
    - **Valide : Exigence 5.1**
  - [x] 10.7 Propriété 6 : Propagation des erreurs — pour tout code HTTP d'erreur, le service lève une exception avec message descriptif
    - **Property 6 : Propagation des erreurs du service**
    - `// Feature: player-reviews-tab, Property 6: Propagation des erreurs du service`
    - **Valide : Exigence 5.2**

- [x] 11. Checkpoint final — Exécution des tests complets
  - [x] 11.1 Exécuter `bun run test:all`
  - [x] 11.2 Vérifier que tous les tests passent
  - [x] 11.3 Corriger les tests en échec si nécessaire

- [x] 12. Lint du code
  - [x] 12.1 Exécuter `bun run lint`
  - [x] 12.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 12.3 Corriger les erreurs de lint si nécessaire

- [x] 13. Build de production
  - [x] 13.1 Exécuter `bun run build`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 13.3 Corriger les erreurs de build si nécessaire

- [x] 14. README de la fonctionnalité
  - [x] 14.1 Créer `docs/README_player-reviews-tab.md`
  - [x] 14.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction du design (Propriétés 1-6)
- Les tests unitaires couvrent les cas concrets, les cas limites et les intégrations
- Tous les tests utilisent Vitest avec fast-check pour les property-based, placés dans `test/`
- TypeScript est le langage d'implémentation
- Aucune migration SQL nécessaire (table `game_reviews` existante avec index)
