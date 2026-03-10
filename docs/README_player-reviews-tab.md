# Onglet Avis du Profil Joueur

## Description

Onglet « Avis » sur la page de profil d'un joueur, affichant la liste paginée de
toutes ses reviews de jeux. Inclut des statistiques agrégées (nombre total, note
moyenne, distribution par tranche), un tri par date ou par note, et un scroll
infini. Design glassmorphism avec support dark mode, traductions FR/EN via
`next-intl`, et attributs ARIA d'accessibilité.

## Accès

1. Naviguer vers le profil d'un joueur (`/[locale]/players/[slug]`)
2. Cliquer sur l'onglet **« Avis »** / **« Reviews »**

## Prérequis

- La table `game_reviews` doit exister dans Supabase (déjà présente, aucune
  migration nécessaire)
- Les index `idx_game_reviews_user_id` et `idx_game_reviews_created_at` sont
  déjà en place

## Utilisation

- **Statistiques** : le bloc en haut affiche le nombre total d'avis, la note
  moyenne avec code couleur, et la distribution des notes en 4 tranches (0-5,
  6-10, 11-15, 16-20)
- **Tri** : sélecteur avec 4 options — Plus récents (défaut), Plus anciens,
  Meilleures notes, Notes les plus basses
- **Scroll infini** : les avis suivants se chargent automatiquement en
  atteignant le bas de la liste (10 par page)
- **Carte d'avis** : affiche l'image du jeu, le nom (lien vers la page du jeu),
  la note sur 20, un extrait du contenu, les points positifs/négatifs et la date

## API

`GET /api/players/[id]/reviews`

| Paramètre | Type   | Défaut      | Description                                                |
| --------- | ------ | ----------- | ---------------------------------------------------------- |
| `page`    | number | `1`         | Numéro de page                                             |
| `sort`    | string | `date_desc` | Tri : `date_desc`, `date_asc`, `rating_desc`, `rating_asc` |
| `locale`  | string | `fr`        | Locale pour le nom du jeu                                  |

Les statistiques agrégées sont incluses uniquement dans la réponse de la page 1.

## Fichiers créés

| Fichier                                              | Rôle                                       |
| ---------------------------------------------------- | ------------------------------------------ |
| `src/types/playerReview.ts`                          | Types partagés                             |
| `src/lib/services/playerReviewsServerService.ts`     | Service serveur (requêtes Supabase)        |
| `src/app/api/players/[id]/reviews/route.ts`          | Route API GET                              |
| `src/lib/services/playerReviewsService.ts`           | Service client                             |
| `src/lib/utils/playerReviewUtils.ts`                 | Fonctions utilitaires pures                |
| `src/hooks/usePlayerReviews.ts`                      | Hook React                                 |
| `src/components/players/PlayerReviewsStats.tsx`      | Composant statistiques                     |
| `src/components/players/PlayerReviewsSortSelect.tsx` | Sélecteur de tri                           |
| `src/components/players/PlayerReviewCard.tsx`        | Carte d'avis                               |
| `src/components/players/PlayerReviewsFeed.tsx`       | Composant principal (feed + scroll infini) |

## Fichiers modifiés

- `src/components/players/PlayerTabContent.tsx` — ajout du case `"reviews"`
- `src/messages/fr.json` — clés `players.reviews.*`
- `src/messages/en.json` — clés `players.reviews.*`

## Tests

- Tests unitaires : route API, composant feed, service client
- Tests property-based (fast-check) : 6 propriétés couvrant le tri, la
  transformation, la pagination, les statistiques, la construction d'URL et la
  propagation d'erreurs
