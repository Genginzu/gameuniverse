# Posts Enrichis — Images, Tags, Mentions, Recherche

## Description

Extension du système de posts joueurs existant (`player-posts-tab`) avec quatre
nouvelles capacités :

- **Image URL** — Le propriétaire peut attacher une URL d'image (HTTPS
  uniquement) à un post via un bouton toggle dans le PostComposer. L'image
  s'affiche sous le contenu avec coins arrondis et gestion gracieuse des erreurs
  de chargement (masquée si l'URL est cassée).
- **Tags (#hashtags)** — Les joueurs incluent des `#tags` dans le contenu du
  post. Les tags sont extraits côté serveur, normalisés en minuscules,
  dédupliqués, limités à 10 par post, et stockés dans une table dédiée
  `post_tags`. Ils s'affichent comme des badges néon violet/cyan dans le
  PostCard.
- **Mentions (@joueur)** — Les joueurs mentionnent d'autres joueurs avec
  `@pseudo` dans le contenu. Les mentions sont extraites côté serveur, résolues
  contre `profiles.full_name`, et stockées dans `post_mentions`. Les mentions
  valides s'affichent comme des liens cliquables vers le profil du joueur. Les
  mentions invalides restent en texte brut.
- **Recherche** — Un composant SearchBar avec debounce 300ms permet de
  rechercher dans les posts d'un joueur. La recherche utilise un filtre ILIKE
  côté serveur avec un index GIN trigram pour la performance. Supporte la
  recherche par contenu, `#tags` et `@mentions`.

## Accès

1. Naviguer vers le profil d'un joueur (`/[locale]/players/[id]`)
2. L'onglet **« Posts »** affiche le fil enrichi avec la barre de recherche

## Prérequis

- Appliquer la migration
  `supabase/migrations/20240311000001_enhanced_player_posts.sql` (ajoute la
  colonne `image_url`, les tables `post_tags` et `post_mentions`, l'extension
  `pg_trgm` et l'index GIN)
- La migration de base `player-posts-tab` (`20240310000001_player_posts.sql`)
  doit être déjà appliquée

## Utilisation

- **Ajouter une image** : cliquer l'icône image (toggle) dans le formulaire de
  création, saisir une URL `https://`. Un message d'erreur s'affiche si l'URL
  est invalide.
- **Ajouter des tags** : écrire `#tag` dans le contenu du post (ex :
  `#rpg #speedrun`). Les tags sont extraits et stockés automatiquement.
- **Mentionner un joueur** : écrire `@pseudo` dans le contenu (doit correspondre
  au `full_name` d'un profil existant). Les mentions invalides restent en texte
  brut.
- **Rechercher** : utiliser la barre de recherche au-dessus de la liste des
  posts. Supporte le texte libre, `#tags` et `@mentions`.

## API

### `GET /api/players/[id]/posts`

| Paramètre | Type   | Défaut | Description                                     |
| --------- | ------ | ------ | ----------------------------------------------- |
| `page`    | number | `1`    | Numéro de page                                  |
| `search`  | string | —      | Terme de recherche (filtre ILIKE sur `content`) |

Retourne les posts enrichis avec `imageUrl`, `tags` (tableau de chaînes) et
`mentions` (tableau d'objets `{ playerId, username }`).

### `POST /api/players/[id]/posts`

Body : `{ "content": "...", "imageUrl": "https://..." }`

Le champ `imageUrl` est optionnel. Les tags et mentions sont extraits
automatiquement du contenu. Retourne le post créé enrichi (201).

## Fichiers créés

| Fichier                                                        | Rôle                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| `supabase/migrations/20240311000001_enhanced_player_posts.sql` | Migration : `image_url`, `post_tags`, `post_mentions`, index GIN      |
| `src/lib/utils/postContentParser.ts`                           | Fonctions pures : `extractTags`, `extractMentions`, `isValidImageUrl` |
| `src/components/players/SearchBar.tsx`                         | Barre de recherche glassmorphism                                      |
| `src/components/players/PostContentRenderer.tsx`               | Rendu du contenu avec tags/mentions stylisés                          |

## Fichiers modifiés

- `src/types/post.ts` — type `PostMention`, champs `imageUrl`/`tags`/`mentions`
  sur `Post`, `imageUrl` sur `CreatePostPayload`
- `src/lib/services/playerPostsServerService.ts` — paramètre `search`, filtre
  ILIKE, jointures `post_tags`/`post_mentions`, `createPost` enrichi
- `src/lib/services/playerPostsService.ts` — paramètres `search` et `imageUrl`
- `src/app/api/players/[id]/posts/route.ts` — paramètre `search` en GET,
  validation `imageUrl` en POST
- `src/hooks/usePlayerPosts.ts` — état `searchTerm` avec debounce, `imageUrl`
  dans `createPost`
- `src/components/players/PostComposer.tsx` — toggle et champ URL d'image
- `src/components/players/PostCard.tsx` — affichage image, intégration
  `PostContentRenderer`
- `src/components/players/PostsFeed.tsx` — intégration `SearchBar`, message
  aucun résultat
- `src/messages/fr.json` — clés i18n sous `players.posts`
- `src/messages/en.json` — clés i18n sous `players.posts`

## Tests

- **Tests unitaires** : parser (`extractTags`, `extractMentions`,
  `isValidImageUrl`), composants `SearchBar` et `PostContentRenderer`
- **Tests property-based** (fast-check, 6 propriétés) : extraction correcte des
  tags, invariants de sortie `extractTags`, extraction correcte des mentions,
  invariants de sortie `extractMentions`, validation d'URL image, filtrage de
  recherche par contenu
