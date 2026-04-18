# Posts du Profil Joueur

L'onglet « Posts » du profil joueur fonctionne comme un fil d'actualité de
réseau social. Le propriétaire publie des posts textuels (max 2000 caractères),
enrichis d'images, tags et mentions. Les visiteurs consultent et recherchent.

## Fonctionnalités

### Base

- **CRUD textuel** — publication et suppression par le propriétaire uniquement
- **Consultation publique** — affichage par ordre chronologique inversé
- **Scroll infini** — 20 posts par page, chargement automatique
- **Design glassmorphism** — dark mode, traductions FR/EN, ARIA

### Enrichissements

- **Image URL** — image HTTPS optionnelle via toggle dans le PostComposer.
  Affichée sous le contenu avec coins arrondis. Gestion gracieuse des erreurs
  de chargement (masquée si URL cassée).
- **Tags (`#hashtags`)** — extraits côté serveur depuis le contenu, normalisés
  en minuscules, dédupliqués, max 10 par post, stockés dans `post_tags`.
  Affichés comme badges néon violet/cyan.
- **Mentions (`@joueur`)** — extraites côté serveur, résolues contre
  `profiles.full_name`, stockées dans `post_mentions`. Les mentions valides
  deviennent des liens cliquables ; les invalides restent en texte brut.
- **Recherche** — SearchBar avec debounce 300ms, filtre ILIKE côté serveur
  avec index GIN trigram. Couvre contenu, tags et mentions.

## Accès

1. Naviguer vers `/[locale]/players/[id]`
2. L'onglet **Posts** est actif par défaut

## Prérequis

- `supabase/migrations/20240310000001_player_posts.sql` — table `player_posts`
  avec RLS
- `supabase/migrations/20240311000001_enhanced_player_posts.sql` — colonne
  `image_url`, tables `post_tags` / `post_mentions`, extension `pg_trgm`,
  index GIN
- Utilisateur authentifié pour créer/supprimer ; publication possible
  uniquement sur son propre profil

## Utilisation

- **Publier** : sur son profil, saisir du texte et cliquer « Publier » (ou
  `Ctrl+Entrée`)
- **Ajouter une image** : cliquer l'icône image, saisir une URL `https://`
- **Ajouter des tags** : écrire `#tag` dans le contenu (ex. `#rpg #speedrun`)
- **Mentionner** : écrire `@pseudo` (doit correspondre à `full_name` existant)
- **Supprimer** : cliquer l'icône de suppression sur un de ses posts
- **Rechercher** : barre de recherche au-dessus du fil
- **Scroll infini** : défiler vers le bas

## API

### `GET /api/players/[id]/posts`

| Paramètre | Type   | Défaut | Description                                     |
| --------- | ------ | ------ | ----------------------------------------------- |
| `page`    | number | `1`    | Numéro de page (20 posts)                       |
| `search`  | string | —      | Terme de recherche (filtre ILIKE sur `content`) |

Retourne les posts enrichis avec `imageUrl`, `tags` (string[]) et `mentions`
(`{ playerId, username }[]`). Inclut les métadonnées de pagination
(`currentPage`, `totalPages`, `totalCount`, `hasNextPage`).

### `POST /api/players/[id]/posts`

Body : `{ "content": "...", "imageUrl": "https://..." }`

`imageUrl` optionnel. Les tags et mentions sont extraits automatiquement du
contenu. Retourne le post créé enrichi (201).

### `DELETE /api/players/[id]/posts/[postId]`

Supprime un post appartenant à l'utilisateur authentifié (204).

## Fichiers

### Base (player-posts)

| Fichier                                               | Rôle                                       |
| ----------------------------------------------------- | ------------------------------------------ |
| `src/types/post.ts`                                   | Types partagés (Post, PostsResponse)       |
| `src/lib/services/playerPostsServerService.ts`        | Service serveur (requêtes Supabase)        |
| `src/lib/services/playerPostsService.ts`              | Service client                             |
| `src/app/api/players/[id]/posts/route.ts`             | Routes API GET + POST                      |
| `src/app/api/players/[id]/posts/[postId]/route.ts`    | Route API DELETE                           |
| `src/hooks/usePlayerPosts.ts`                         | Hook React                                 |
| `src/components/players/PostComposer.tsx`             | Formulaire de création                     |
| `src/components/players/PostCard.tsx`                 | Carte d'affichage                          |
| `src/components/players/PostsFeed.tsx`                | Feed + scroll infini                       |
| `supabase/migrations/20240310000001_player_posts.sql` | Migration : table, index, RLS              |

### Enrichissements (enhanced-posts)

| Fichier                                                        | Rôle                                            |
| -------------------------------------------------------------- | ----------------------------------------------- |
| `supabase/migrations/20240311000001_enhanced_player_posts.sql` | `image_url`, `post_tags`, `post_mentions`, GIN  |
| `src/lib/utils/postContentParser.ts`                           | `extractTags`, `extractMentions`, `isValidImageUrl` |
| `src/components/players/SearchBar.tsx`                         | Barre de recherche glassmorphism                |
| `src/components/players/PostContentRenderer.tsx`               | Rendu tags/mentions stylisés                    |

Les services, routes, hooks et composants de base ont été étendus pour
supporter `search`, `imageUrl`, `tags`, `mentions`.

## Intégration profil

- `PlayerProfileTabs.tsx` — onglet `posts`, icône `MessageSquare`
- `PlayerTabContent.tsx` — case `"posts"` → `PostsFeed`
- `PlayerDetailsContent.tsx` — onglet par défaut `"posts"`

i18n : clés `players.posts.*` et `players.tabs.posts` dans
`src/messages/{fr,en}.json`.

## Tests

- **Unitaires** : routes API, service client, `PostComposer`, `PostCard`,
  `PostsFeed`, `SearchBar`, `PostContentRenderer`
- **Property-based** (fast-check) :
  - **Base (12 propriétés)** : round-trip création, validation longueur, rejet
    whitespace, tri par date, pagination, suppression, visibilité composer et
    bouton supprimer, compteur caractères, bouton publier désactivé, insertion
    en tête, propagation d'erreurs
  - **Enrichissements (6 propriétés)** : extraction correcte des tags,
    invariants `extractTags`, extraction correcte des mentions, invariants
    `extractMentions`, validation d'URL image, filtrage de recherche
