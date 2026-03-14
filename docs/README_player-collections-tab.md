# Onglet Collections du Profil Joueur

## Description

Onglet « Collections » sur la page de profil d'un joueur, affichant la liste
paginée de toutes ses collections de jeux. Inclut des statistiques agrégées
(nombre total de collections, nombre total de jeux, plus grande collection), un
tri par date, nom ou nombre de jeux, et un scroll infini. Gestion de la
visibilité : le propriétaire voit ses collections privées avec badges, les
visiteurs ne voient que les collections publiques. Design glassmorphism avec
support dark mode, traductions FR/EN via `next-intl`, et attributs ARIA
d'accessibilité.

## Accès

1. Naviguer vers le profil d'un joueur (`/[locale]/players/[slug]`)
2. Cliquer sur l'onglet **« Collections »**

## Prérequis

- La table `game_collections` doit exister dans Supabase (déjà présente, aucune
  migration nécessaire)
- La table `game_collection_items` est utilisée pour les jointures (couvertures
  et comptage de jeux)

## Utilisation

- **Statistiques** : le bloc en haut affiche le nombre total de collections, le
  nombre total de jeux dans toutes les collections, et le nom de la collection
  contenant le plus de jeux
- **Tri** : sélecteur avec 4 options — Plus récentes (défaut), Nom A-Z, Nom Z-A,
  Plus de jeux
- **Scroll infini** : les collections suivantes se chargent automatiquement en
  atteignant le bas de la liste (12 par page)
- **Visibilité** : le propriétaire voit toutes ses collections (publiques et
  privées) avec un badge « Public » / « Privé » sur chaque carte ; les visiteurs
  ne voient que les collections publiques sans badge

## API

`GET /api/players/[id]/collections`

| Paramètre | Type   | Défaut            | Description                                                          |
| --------- | ------ | ----------------- | -------------------------------------------------------------------- |
| `page`    | number | `1`               | Numéro de page (active le mode paginé)                               |
| `sort`    | string | `updated_at_desc` | Tri : `updated_at_desc`, `name_asc`, `name_desc`, `games_count_desc` |
| `locale`  | string | `fr`              | Locale pour le formatage                                             |

Les statistiques agrégées sont incluses uniquement dans la réponse de la page 1.
Sans paramètre `page`, l'endpoint conserve son comportement d'origine
(rétrocompatibilité).

## Fichiers créés

| Fichier                                                  | Rôle                                       |
| -------------------------------------------------------- | ------------------------------------------ |
| `src/types/playerCollection.ts`                          | Types partagés                             |
| `src/lib/services/playerCollectionsServerService.ts`     | Service serveur (requêtes Supabase)        |
| `src/lib/services/playerCollectionsService.ts`           | Service client + fonctions pures           |
| `src/hooks/usePlayerCollections.ts`                      | Hook React                                 |
| `src/components/players/PlayerCollectionsStats.tsx`      | Composant statistiques                     |
| `src/components/players/PlayerCollectionsSortSelect.tsx` | Sélecteur de tri                           |
| `src/components/players/PlayerCollectionsFeed.tsx`       | Composant principal (feed + scroll infini) |

## Fichiers modifiés

- `src/app/api/players/[id]/collections/route.ts` — enrichissement du handler
  GET avec pagination, tri et statistiques
- `src/components/players/PlayerTabContent.tsx` — remplacement de
  `PlayerCollections` par `PlayerCollectionsFeed` dans le case `"collections"`
- `src/messages/fr.json` — clés `players.collectionsTab.*`
- `src/messages/en.json` — clés `players.collectionsTab.*`

## Tests

- Tests unitaires : route API, composant feed, service client
- Tests property-based (fast-check) : 6 propriétés couvrant le tri, la
  pagination, les statistiques agrégées, le filtrage par visibilité, la
  construction d'URL et la propagation d'erreurs
