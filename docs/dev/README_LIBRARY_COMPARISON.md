# Comparaison de bibliothèques entre joueurs

## Description

La fonctionnalité **Comparaison de bibliothèques** permet à un utilisateur
connecté de découvrir les jeux qu'il a en commun avec un autre joueur. En
consultant le profil d'un joueur, une section dédiée affiche automatiquement le
nombre de jeux partagés ainsi qu'une liste détaillée avec couverture, titre et
genres.

Fonctionnalités principales :

- Calcul d'intersection des bibliothèques via une fonction SQL optimisée
- Indicateur visuel du nombre de jeux en commun sur le profil
- Liste détaillée des jeux partagés avec pagination (12 par page)
- Navigation directe vers la fiche d'un jeu en commun
- Masquage automatique si non authentifié ou sur son propre profil
- Internationalisation FR/EN

## Accès

### Page

La section de comparaison apparaît automatiquement sur la page profil d'un
joueur, entre les statistiques et la bibliothèque :

| Page          | URL                      | Description                  |
| ------------- | ------------------------ | ---------------------------- |
| Profil joueur | `/[locale]/players/[id]` | Section comparaison intégrée |

La section est visible uniquement si :

- L'utilisateur est authentifié
- Il consulte le profil d'un **autre** joueur

### Route API

| Méthode | Route                            | Description                   |
| ------- | -------------------------------- | ----------------------------- |
| GET     | `/api/players/[id]/common-games` | Jeux en commun avec le joueur |

Paramètres query optionnels : `locale` (défaut `fr`), `page` (défaut `1`).

## Prérequis

1. **Migration Supabase** : la migration
   `supabase/migrations/20240225000001_library_comparison.sql` doit être
   appliquée. Elle crée la fonction RPC `get_common_games` et un index sur
   `user_library(game_id)`.
2. **Authentification** : l'utilisateur doit être connecté pour voir la section
   de comparaison et appeler l'API.
3. **Bibliothèques non vides** : les deux joueurs doivent avoir des jeux dans
   leur bibliothèque pour que des jeux en commun apparaissent.

## Utilisation

### Consulter les jeux en commun

Naviguer vers le profil d'un autre joueur (`/[locale]/players/[id]`). La section
« Jeux en commun » s'affiche automatiquement avec un indicateur du nombre de
jeux partagés et la liste des jeux.

### Naviguer vers un jeu

Cliquer sur un jeu dans la liste pour accéder à sa fiche détaillée
(`/[locale]/games/[slug]`).

### Pagination

Si plus de 12 jeux sont en commun, la pagination permet de parcourir les
résultats page par page.

## Architecture

### Base de données

- `get_common_games` — Fonction RPC effectuant l'intersection des bibliothèques
  via `INNER JOIN` sur `user_library`, avec jointures sur `games`,
  `game_translations`, `game_genres` et `genre_translations`
- Index sur `user_library(game_id)` pour optimiser l'intersection

### Service (`src/lib/services/`)

- `libraryComparisonService.ts` — `LibraryComparisonService` avec méthodes
  `getCommonGames`, `computePagination` et `transformCommonGameRow`

### Composants React (`src/components/players/`)

- `LibraryComparisonSection.tsx` — Orchestrateur : fetch, gestion des états
  (loading, error, success)
- `CommonGamesIndicator.tsx` — Badge affichant le nombre de jeux en commun
- `CommonGamesList.tsx` — Grille paginée des jeux partagés

### Intégration

- `PlayerDetailsContent.tsx` — Intègre `LibraryComparisonSection` avec logique
  de visibilité (`shouldShowComparison`)

### Types (`src/types/player.ts`)

Interfaces : `CommonGame`, `CommonGamesResult`.

### Internationalisation

Clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`,
section `players.comparison`.

## Tests

- Tests unitaires API : `test/unit/api/players/common-games/route.test.ts`
- Tests property-based (fast-check) :
  `test/unit/lib/services/libraryComparison.property.test.ts`,
  `test/unit/api/players/common-games/validation.property.test.ts`,
  `test/unit/components/players/libraryComparison.property.test.ts`
