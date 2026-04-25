# Navigation par tag des posts

## Description

Les #tags dans les posts sont désormais cliquables et mènent vers une page
dédiée listant tous les posts publics (cross-joueurs) ayant ce tag. Les pills de
tags statiques sous le contenu ont été supprimées — les tags sont visibles
inline dans le texte, à l'endroit où le joueur les a écrits.

## Accès

- Cliquer sur un #tag dans n'importe quel post → `/[locale]/posts/tags/[tag]`
- URL directe : `/fr/posts/tags/gaming`, `/en/posts/tags/rpg`, etc.
- API : `GET /api/posts/tags/[tag]?page=1`

## Prérequis

- Migration `20260421000001_index_post_tags_tag.sql` appliquée (index sur
  `post_tags.tag`)
- Table `post_tags` existante avec RLS SELECT public

## Utilisation

- Les #tags apparaissent en violet dans le contenu des posts et sont cliquables
- La page de tag affiche tous les posts publics avec ce tag, paginés (20 par
  page)
- Chaque post affiche l'auteur (nom + avatar) puisque les posts proviennent de
  différents joueurs
- Bouton retour en haut de page pour revenir à la navigation
- Support complet FR/EN via les traductions `posts.tags.*`

## Fichiers créés/modifiés

| Fichier                                                      | Action                                               |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `supabase/migrations/20260421000001_index_post_tags_tag.sql` | Créé — index DB                                      |
| `src/app/api/posts/tags/[tag]/route.ts`                      | Créé — route API                                     |
| `src/app/[locale]/posts/tags/[tag]/page.tsx`                 | Créé — page Next.js                                  |
| `src/components/posts/TagPostsContent.tsx`                   | Créé — composant client                              |
| `src/types/post.ts`                                          | Modifié — types `PostWithAuthor`, `TagPostsResponse` |
| `src/components/players/posts/PostContentRenderer.tsx`       | Modifié — tags cliquables                            |
| `src/components/players/posts/PostCard.tsx`                  | Modifié — pills supprimées                           |
| `src/messages/fr.json`                                       | Modifié — traductions FR                             |
| `src/messages/en.json`                                       | Modifié — traductions EN                             |
