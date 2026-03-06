# Onglet Activité du Profil Joueur

## Description

Onglet « Activité » sur le profil joueur affichant un flux chronologique de
toutes les actions réalisées par un joueur sur Game Universe. Le flux agrège 6
types d'événements :

- **Reviews** : reviews de jeux publiées (nom du jeu, note /20, extrait)
- **Commentaires** : commentaires sur des personnages (nom du personnage,
  extrait)
- **Bibliothèque** : ajouts de jeux à la bibliothèque (nom du jeu, image,
  statut)
- **Temps de jeu** : temps de jeu renseignés (nom du jeu, durées rapide / normal
  / complétionniste)
- **Favoris** : personnages mis en favoris (nom du personnage)
- **Collections** : collections créées (nom, nombre de jeux)

L'agrégation se fait côté serveur via une fonction RPC Supabase
(`get_player_activity`) qui effectue un `UNION ALL` sur les tables
`game_reviews`, `character_comments`, `user_library`, `character_favorites` et
`game_collections`. Le flux supporte le scroll infini, le filtrage par type
d'événement et l'internationalisation (français / anglais).

## Accès

### Navigation

1. Ouvrir le profil d'un joueur : `/{locale}/players/{id}`
2. Cliquer sur l'onglet « Activité »

### Endpoint API

| Méthode | Route                        | Paramètres query                  | Description            |
| ------- | ---------------------------- | --------------------------------- | ---------------------- |
| GET     | `/api/players/{id}/activity` | `page`, `type`, `locale` (fr\|en) | Flux d'activité paginé |

Paramètres :

- `page` (int, défaut 1) — numéro de page
- `type` (string, optionnel) — filtre par type d'événement (`review`, `comment`,
  `library`, `playtime`, `favorite`, `collection`)
- `locale` (string, défaut `fr`) — langue pour les noms traduits

## Prérequis

1. **Migration base de données** : la migration
   `supabase/migrations/20240306000001_player_activity_function.sql` doit être
   appliquée. Elle crée la fonction RPC `get_player_activity` et les index
   nécessaires sur les colonnes `user_id` et `created_at` des tables sources.

2. **Clés i18n** : les traductions doivent être présentes dans
   `src/messages/fr.json` et `src/messages/en.json` sous les clés
   `players.activity`.

## Utilisation

### Flux d'activité

Le flux s'affiche automatiquement lorsque l'onglet « Activité » est sélectionné.
Les événements sont triés du plus récent au plus ancien avec dates relatives.

### Scroll infini

Quand le visiteur fait défiler la liste jusqu'en bas, la page suivante se charge
automatiquement via `IntersectionObserver`. Un skeleton de chargement s'affiche
pendant le chargement.

### Filtrage

Une barre de boutons en haut du flux permet de filtrer par type d'événement. Le
filtre « Tous » affiche l'ensemble des événements. Le filtre est conservé lors
du chargement de pages supplémentaires.

### Liens cliquables

Les noms de jeux et de personnages dans chaque événement sont des liens
cliquables redirigeant vers la page de détail correspondante.

## Architecture

### Service et hook

| Fichier                                     | Rôle                                 |
| ------------------------------------------- | ------------------------------------ |
| `src/lib/services/activityServerService.ts` | Service serveur (appel RPC Supabase) |
| `src/lib/services/activityService.ts`       | Service client (appel API)           |
| `src/hooks/usePlayerActivity.ts`            | Hook de gestion du flux + pagination |

### Types

| Fichier                 | Contenu                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/types/activity.ts` | `ActivityEvent`, `ActivityEventType`, `ActivityEventData`, `ActivityResponse`, `ActivityQueryParams` |

### Composants

| Composant                | Fichier                                             | Rôle                                |
| ------------------------ | --------------------------------------------------- | ----------------------------------- |
| `ActivityFeed`           | `src/components/players/ActivityFeed.tsx`           | Composant principal (scroll infini) |
| `ActivityFilters`        | `src/components/players/ActivityFilters.tsx`        | Barre de filtres par type           |
| `ActivityItem`           | `src/components/players/ActivityItem.tsx`           | Dispatch vers le sous-composant     |
| `ActivityItemReview`     | `src/components/players/ActivityItemReview.tsx`     | Rendu d'une review                  |
| `ActivityItemComment`    | `src/components/players/ActivityItemComment.tsx`    | Rendu d'un commentaire              |
| `ActivityItemLibrary`    | `src/components/players/ActivityItemLibrary.tsx`    | Rendu d'un ajout bibliothèque       |
| `ActivityItemPlaytime`   | `src/components/players/ActivityItemPlaytime.tsx`   | Rendu d'un temps de jeu             |
| `ActivityItemFavorite`   | `src/components/players/ActivityItemFavorite.tsx`   | Rendu d'un favori personnage        |
| `ActivityItemCollection` | `src/components/players/ActivityItemCollection.tsx` | Rendu d'une collection              |

### Route API

| Fichier                                      | Endpoint                      |
| -------------------------------------------- | ----------------------------- |
| `src/app/api/players/[id]/activity/route.ts` | GET /api/players/:id/activity |

### Accessibilité

Le composant `ActivityFeed` utilise les attributs ARIA suivants :

- `role="feed"` sur la liste d'événements
- `aria-busy="true"` pendant le chargement
- `aria-label` descriptif sur le flux

## Tests

| Fichier                                                   | Type           | Contenu                                |
| --------------------------------------------------------- | -------------- | -------------------------------------- |
| `test/unit/api/players/activity.test.ts`                  | Unitaire       | Route API (200, 404, 400, 500)         |
| `test/unit/components/players/ActivityFeed.test.tsx`      | Unitaire       | Composant (rendu, vide, ARIA, filtres) |
| `test/unit/lib/services/activityService.test.ts`          | Unitaire       | Service client (appels, erreurs, URLs) |
| `test/unit/lib/services/activityService.property.test.ts` | Property-based | 5 propriétés de correction             |

```bash
# Lancer tous les tests
bun run test:all

# Lancer uniquement les tests du service client
bunx vitest run test/unit/lib/services/activityService.test.ts

# Lancer les tests property-based
bunx vitest run test/unit/lib/services/activityService.property.test.ts
```
