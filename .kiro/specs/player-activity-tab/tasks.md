# Tâches — Onglet Activité du Profil Joueur

## Tâche 1 : Types et modèles de données

- [x] 1.1 Créer `src/types/activity.ts` avec les types `ActivityEventType`, `ActivityEvent`, `ActivityEventData` (union discriminée), `ActivityResponse`, `ActivityQueryParams`
- [x] 1.2 Ajouter les types spécifiques par événement : `ReviewEventData`, `CommentEventData`, `LibraryEventData`, `PlaytimeEventData`, `FavoriteEventData`, `CollectionEventData`

## Tâche 2 : Migration SQL — Fonction RPC d'agrégation

- [x] 2.1 Créer `supabase/migrations/20240306000001_player_activity_function.sql` avec la fonction `get_player_activity(player_uuid, locale_code, event_type, page_number, page_size)` qui effectue un `UNION ALL` sur les 5 tables sources avec jointures pour les traductions, tri par date décroissante, et pagination offset/limit
- [x] 2.2 Ajouter les index nécessaires sur les colonnes `user_id` et `created_at` des tables sources (si absents) pour optimiser la requête

## Tâche 3 : Service serveur d'activité

- [x] 3.1 Créer `src/lib/services/activityServerService.ts` avec une classe `ActivityServerService` exposant une méthode statique `fetchPlayerActivity(playerId, locale, type?, page?)` qui appelle la fonction RPC Supabase et transforme les résultats en `ActivityResponse`
- [x] 3.2 Gérer le cas PGRST205 (table/fonction non trouvée) en retournant une liste vide, conformément au pattern existant du projet

## Tâche 4 : Route API

- [x] 4.1 Créer `src/app/api/players/[id]/activity/route.ts` avec un handler GET qui valide l'ID joueur, parse les paramètres de pagination et filtre, appelle `ActivityServerService`, et retourne la réponse JSON
- [x] 4.2 Gérer les erreurs : 404 pour joueur inexistant, 400 pour ID invalide, 500 pour erreur serveur

## Tâche 5 : Service client d'activité

- [x] 5.1 Créer `src/lib/services/activityService.ts` avec une classe `ActivityService` exposant une méthode statique `fetchActivity(playerId, params: ActivityQueryParams)` qui appelle l'API et retourne `ActivityResponse`
- [x] 5.2 Propager les erreurs avec un message descriptif en cas d'échec

## Tâche 6 : Hook usePlayerActivity

- [x] 6.1 Créer `src/hooks/usePlayerActivity.ts` avec le hook `usePlayerActivity(playerId, locale)` gérant l'état du flux (events, isLoading, isLoadingMore, hasNextPage, activeFilter, error)
- [x] 6.2 Implémenter `setFilter(type)` qui reset la pagination et recharge les événements
- [x] 6.3 Implémenter `loadMore()` qui charge la page suivante et concatène les résultats

## Tâche 7 : Composants UI

- [x] 7.1 Créer `src/components/players/ActivityFilters.tsx` — barre de boutons de filtre par type d'événement avec icônes et libellés traduits
- [x] 7.2 Créer `src/components/players/ActivityItem.tsx` — composant de dispatch qui rend le sous-composant approprié selon le type, avec date relative et icône
- [x] 7.3 Créer `src/components/players/ActivityItemReview.tsx` — rendu d'une review (nom du jeu cliquable, note /20, extrait)
- [x] 7.4 Créer `src/components/players/ActivityItemComment.tsx` — rendu d'un commentaire (nom du personnage cliquable, extrait)
- [x] 7.5 Créer `src/components/players/ActivityItemLibrary.tsx` — rendu d'un ajout bibliothèque (nom du jeu cliquable, image, statut)
- [x] 7.6 Créer `src/components/players/ActivityItemPlaytime.tsx` — rendu d'un temps de jeu (nom du jeu cliquable, durées)
- [x] 7.7 Créer `src/components/players/ActivityItemFavorite.tsx` — rendu d'un favori (nom du personnage cliquable)
- [x] 7.8 Créer `src/components/players/ActivityItemCollection.tsx` — rendu d'une collection (nom, nombre de jeux)
- [x] 7.9 Créer `src/components/players/ActivityFeed.tsx` — composant principal avec scroll infini (IntersectionObserver), skeleton de chargement, message vide, attributs ARIA (`role="feed"`, `aria-busy`, `aria-label`)

## Tâche 8 : Intégration dans PlayerTabContent

- [x] 8.1 Modifier `src/components/players/PlayerTabContent.tsx` pour ajouter le case `"activity"` qui rend `<ActivityFeed playerId={player.id} locale={locale} />`

## Tâche 9 : Traductions i18n

- [x] 9.1 Ajouter les clés de traduction dans `src/messages/fr.json` sous `players.activity` : types d'événements, libellés de filtres, messages vides, libellés ARIA
- [x] 9.2 Ajouter les clés de traduction correspondantes dans `src/messages/en.json`

## Tâche 10 : Tests unitaires

- [x] 10.1 Créer `test/unit/api/players/activity.test.ts` — tests de la route API (réponse valide, 404, paramètres invalides, erreur serveur)
- [x] 10.2 Créer `test/unit/components/players/ActivityFeed.test.tsx` — tests du composant (rendu avec événements, état vide, chargement, attributs ARIA, filtrage)
- [x] 10.3 Créer `test/unit/lib/services/activityService.test.ts` — tests du service client (appel réussi, propagation d'erreur, construction URL)

## Tâche 11 : Tests property-based

- [x] 11.1 Créer `test/unit/lib/services/activityService.property.test.ts` avec les 5 propriétés identifiées dans le design :
  - Property 1 : Tri chronologique décroissant — `// Feature: player-activity-tab, Property 1: Tri chronologique décroissant`
  - Property 2 : Correction de la pagination — `// Feature: player-activity-tab, Property 2: Correction de la pagination`
  - Property 3 : Complétude des données par type — `// Feature: player-activity-tab, Property 3: Complétude des données par type`
  - Property 4 : Unicité du mapping d'icônes — `// Feature: player-activity-tab, Property 4: Unicité du mapping d'icônes`
  - Property 5 : Correction du filtrage par type — `// Feature: player-activity-tab, Property 5: Correction du filtrage par type`

## Tâche 12 : Exécution des tests complets

- [x] 12.1 Exécuter `bun run test:all`
- [x] 12.2 Vérifier que tous les tests passent (parallèles + isolés)
- [x] 12.3 Corriger les tests en échec si nécessaire

## Tâche 13 : Lint du code

- [x] 13.1 Exécuter `bun run lint`
- [x] 13.2 Vérifier qu'il n'y a pas d'erreurs de lint
- [x] 13.3 Corriger les erreurs de lint si nécessaire

## Tâche 14 : Build de production

- [x] 14.1 Exécuter `bun run build`
- [x] 14.2 Vérifier qu'il n'y a pas d'erreurs de compilation
- [x] 14.3 Corriger les erreurs de build si nécessaire

## Tâche 15 : README de la fonctionnalité

- [x] 15.1 Créer `docs/README_player-activity-tab.md`
- [x] 15.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation
