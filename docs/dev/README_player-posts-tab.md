# Onglet Posts du Profil Joueur

## Description

L'onglet « Posts » remplace l'ancien onglet « Aperçu » (overview) sur la page de
profil d'un joueur. Il fonctionne comme un fil d'actualité de réseau social : le
propriétaire du profil peut publier et supprimer des posts textuels (max 2000
caractères). Les posts sont affichés par ordre chronologique inversé avec scroll
infini (20 par page). Les visiteurs peuvent consulter les posts mais seul le
propriétaire peut créer et supprimer. Design glassmorphism avec support dark
mode, traductions FR/EN via `next-intl`, et attributs ARIA d'accessibilité.

## Accès

1. Naviguer vers le profil d'un joueur (`/[locale]/players/[id]`)
2. L'onglet **« Posts »** est l'onglet actif par défaut

## Prérequis

- Exécuter la migration `supabase/migrations/20240310000001_player_posts.sql`
  pour créer la table `player_posts` avec les politiques RLS
- L'utilisateur doit être authentifié pour créer ou supprimer des posts
- Un joueur ne peut publier que sur son propre profil

## Utilisation

- **Consulter les posts** : visiter le profil d'un joueur, les posts se chargent
  automatiquement
- **Publier un post** : sur son propre profil, saisir du texte dans le
  formulaire et cliquer « Publier » (ou `Ctrl+Entrée`)
- **Supprimer un post** : cliquer l'icône de suppression sur un de ses posts,
  confirmer la suppression
- **Scroll infini** : défiler vers le bas pour charger automatiquement les posts
  suivants

## API

### `GET /api/players/[id]/posts`

| Paramètre | Type   | Défaut | Description    |
| --------- | ------ | ------ | -------------- |
| `page`    | number | `1`    | Numéro de page |

Retourne les posts triés par date décroissante (20 par page) avec métadonnées de
pagination (`currentPage`, `totalPages`, `totalCount`, `hasNextPage`).

### `POST /api/players/[id]/posts`

Body : `{ "content": "..." }` — crée un post et retourne le post créé (201).

### `DELETE /api/players/[id]/posts/[postId]`

Supprime un post appartenant à l'utilisateur authentifié (204).

## Fichiers créés

| Fichier                                               | Rôle                                       |
| ----------------------------------------------------- | ------------------------------------------ |
| `src/types/post.ts`                                   | Types partagés (Post, PostsResponse)       |
| `src/lib/services/playerPostsServerService.ts`        | Service serveur (requêtes Supabase)        |
| `src/lib/services/playerPostsService.ts`              | Service client                             |
| `src/app/api/players/[id]/posts/route.ts`             | Routes API GET + POST                      |
| `src/app/api/players/[id]/posts/[postId]/route.ts`    | Route API DELETE                           |
| `src/hooks/usePlayerPosts.ts`                         | Hook React                                 |
| `src/components/players/PostComposer.tsx`             | Formulaire de création de post             |
| `src/components/players/PostCard.tsx`                 | Carte d'affichage d'un post                |
| `src/components/players/PostsFeed.tsx`                | Composant principal (feed + scroll infini) |
| `supabase/migrations/20240310000001_player_posts.sql` | Migration : table, index, RLS              |

## Fichiers modifiés

- `src/components/players/PlayerProfileTabs.tsx` — remplacement de `overview`
  par `posts`, icône `MessageSquare`
- `src/components/players/PlayerTabContent.tsx` — case `"posts"` → `PostsFeed`
- `src/components/players/PlayerDetailsContent.tsx` — onglet par défaut
  `"posts"`
- `src/messages/fr.json` — clés `players.posts.*`, `players.tabs.posts`
- `src/messages/en.json` — clés `players.posts.*`, `players.tabs.posts`

## Tests

- Tests unitaires : routes API, service client, PostComposer, PostCard,
  PostsFeed
- Tests property-based (fast-check) : 12 propriétés couvrant le round-trip de
  création, la validation de longueur, le rejet de whitespace, le tri par date,
  la pagination, la suppression, la visibilité du composer et du bouton
  supprimer, le compteur de caractères, le bouton publier désactivé, l'insertion
  en tête de liste et la propagation d'erreurs
