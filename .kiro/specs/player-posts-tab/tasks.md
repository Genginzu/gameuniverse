# Implementation Plan: Onglet Posts du Profil Joueur

## Overview

Remplacer l'onglet « Aperçu » (overview) du profil joueur par un onglet « Posts » fonctionnant comme un fil d'actualité. Implémenter une table `player_posts` avec RLS, des routes API (GET paginé, POST, DELETE), un service client, un hook custom, et 3 composants UI glassmorphism (PostsFeed, PostComposer, PostCard) avec scroll infini via IntersectionObserver. Suivre le pattern existant de `PlayerReviewsFeed`. Traductions FR/EN via next-intl.

## Tasks

- [x] 1. Migration base de données
  - [x] 1.1 Créer `supabase/migrations/20240310000001_player_posts.sql` avec la table `player_posts` (id UUID PK default gen_random_uuid(), player_id UUID FK → profiles(id) ON DELETE CASCADE NOT NULL, content TEXT NOT NULL CHECK char_length(content) <= 2000, created_at TIMESTAMPTZ NOT NULL default now(), updated_at TIMESTAMPTZ NOT NULL default now()), index `idx_player_posts_player_created` sur (player_id, created_at DESC), RLS activé avec politiques : `player_posts_select_all` SELECT true, `player_posts_insert_own` INSERT auth.uid() = player_id, `player_posts_delete_own` DELETE auth.uid() = player_id, COMMENT ON TABLE et colonnes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Types et service client
  - [x] 2.1 Créer `src/types/post.ts` avec les interfaces `Post` (id, playerId, content, createdAt, updatedAt), `PostsResponse` (posts, pagination avec currentPage, totalPages, totalCount, hasNextPage), `CreatePostPayload` (content)
    - _Requirements: 2.2, 2.4, 3.1_
  - [x] 2.2 Créer `src/lib/services/playerPostsService.ts` avec la classe `PlayerPostsService` exposant : `fetchPosts(playerId, page?)` → GET /api/players/:id/posts?page=N, `createPost(playerId, content)` → POST /api/players/:id/posts, `deletePost(playerId, postId)` → DELETE /api/players/:id/posts/:postId. Propager les erreurs avec messages descriptifs pour les réponses non-2xx
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Service serveur et routes API
  - [x] 3.1 Créer `src/lib/services/playerPostsServerService.ts` avec les méthodes serveur Supabase : `fetchPosts(playerId, page)` — requête paginée triée par created_at DESC, 20 posts par page, retourne posts + métadonnées pagination ; `createPost(playerId, content)` — insertion et retour du post créé ; `deletePost(postId)` — suppression du post ; `playerExists(playerId)` — vérification existence joueur
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5, 4.1_
  - [x] 3.2 Créer `src/app/api/players/[id]/posts/route.ts` avec handlers GET et POST : GET — valider UUID, vérifier existence joueur (404), récupérer posts paginés via service serveur ; POST — vérifier authentification (401), valider contenu non-vide/non-whitespace (400), valider longueur ≤ 2000 (400), créer post et retourner 201
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.3 Créer `src/app/api/players/[id]/posts/[postId]/route.ts` avec handler DELETE : vérifier authentification (401), vérifier existence du post (404), vérifier que l'auteur est l'utilisateur authentifié (403), supprimer et retourner 204
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint — Vérifier que les types, services et routes compilent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Hook et composants UI
  - [x] 5.1 Créer `src/hooks/usePlayerPosts.ts` — hook custom gérant l'état du fil : posts[], isLoading, isLoadingMore, isCreating, hasNextPage, error, loadMore(), createPost(content), deletePost(postId). Utilise PlayerPostsService, gère la pagination incrémentale, l'insertion optimiste en tête de liste après création, et le retrait après suppression
    - _Requirements: 6.1, 6.3, 7.5, 8.3_
  - [x] 5.2 Créer `src/components/players/PostCard.tsx` — carte glassmorphism (.glass-card) affichant le contenu du post, la date relative formatée selon la locale (useTranslations), l'avatar du joueur. Bouton de suppression visible uniquement si isOwner, avec dialogue de confirmation avant suppression. Attributs ARIA, dark mode, navigable au clavier
    - _Requirements: 6.2, 8.1, 8.2, 8.3, 8.4, 8.5, 11.1, 11.2, 11.5_
  - [x] 5.3 Créer `src/components/players/PostComposer.tsx` — formulaire glassmorphism (.glass-card, .glass-input) avec textarea multiligne, placeholder i18n, compteur de caractères restants sur 2000, bouton « Publier » désactivé si contenu vide/whitespace-only, indicateur de chargement pendant l'envoi, toast d'erreur en cas d'échec. aria-label sur le textarea, dark mode
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 11.1, 11.2, 11.4_
  - [x] 5.4 Créer `src/components/players/PostsFeed.tsx` — composant principal du fil : affiche PostComposer si isOwner, liste de PostCard, scroll infini via IntersectionObserver sur élément sentinelle (pattern PlayerReviewsFeed), skeleton loading, état vide avec message i18n, role="feed" et aria-busy. Dark mode, glassmorphism
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 7.1, 7.8, 11.1, 11.2, 11.3, 11.6_

- [x] 6. Intégration dans le profil joueur
  - [x] 6.1 Modifier `src/components/players/PlayerProfileTabs.tsx` — remplacer `overview` par `posts` dans le type `ProfileTab` et `TAB_DEFINITIONS`, utiliser l'icône `MessageSquare` de lucide-react, mettre à jour la clé de traduction vers `players.tabs.posts`
    - _Requirements: 5.1, 5.3, 10.4_
  - [x] 6.2 Modifier `src/components/players/PlayerTabContent.tsx` — remplacer le case `overview` par `posts` rendant `PostsFeed` avec les props playerId, locale, isOwner. Supprimer l'import de OverviewTab
    - _Requirements: 5.1, 5.4_
  - [x] 6.3 Modifier `src/components/players/PlayerDetailsContent.tsx` — changer l'état initial de `activeTab` de `"overview"` à `"posts"`
    - _Requirements: 5.2_

- [x] 7. Internationalisation
  - [x] 7.1 Ajouter les clés de traduction dans `src/messages/fr.json` : namespace `players.posts` avec les clés pour le titre de l'onglet (Posts), placeholder du formulaire, bouton publier, message état vide, confirmation de suppression, compteur de caractères, messages d'erreur. Remplacer `players.tabs.overview` par `players.tabs.posts`
    - _Requirements: 10.1, 10.3, 10.4_
  - [x] 7.2 Ajouter les clés de traduction correspondantes dans `src/messages/en.json`
    - _Requirements: 10.1, 10.3, 10.4_

- [x] 8. Checkpoint — Vérifier l'intégration complète et le rendu
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Tests unitaires
  - [x] 9.1 Créer `test/unit/api/players/posts.test.ts` — tests des routes API : GET retourne posts paginés triés (Req 2.1, 2.2, 2.3, 2.4), GET 404 joueur inexistant (Req 2.5), POST crée un post et retourne 201 (Req 3.1, 3.5), POST 400 contenu vide/whitespace (Req 3.2), POST 400 contenu > 2000 chars (Req 3.3), POST 401 non authentifié (Req 3.4), DELETE 204 succès (Req 4.1), DELETE 404 post inexistant (Req 4.2), DELETE 403 pas l'auteur (Req 4.3), DELETE 401 non authentifié (Req 4.4)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_
  - [x] 9.2 Créer `test/unit/lib/services/playerPostsService.test.ts` — tests du service client : fetchPosts retourne PostsResponse (Req 9.1), createPost retourne Post (Req 9.2), deletePost succès (Req 9.3), erreurs propagées avec message (Req 9.4)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 9.3 Créer `test/unit/components/players/PostComposer.test.tsx` — tests du formulaire : rendu avec placeholder (Req 7.2), bouton désactivé si vide (Req 7.4), compteur de caractères (Req 7.3), soumission appelle onPostCreated (Req 7.5), bouton désactivé pendant envoi (Req 7.6), aria-label présent (Req 11.4)
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 11.4_
  - [x] 9.4 Créer `test/unit/components/players/PostCard.test.tsx` — tests de la carte : rendu contenu et date relative (Req 6.2), bouton supprimer visible si isOwner (Req 8.1), bouton masqué si pas isOwner (Req 8.5), confirmation affichée au clic (Req 8.2), suppression appelle onDelete (Req 8.3)
    - _Requirements: 6.2, 8.1, 8.2, 8.3, 8.5_
  - [x] 9.5 Créer `test/unit/components/players/PostsFeed.test.tsx` — tests du fil : état vide affiché (Req 6.5), skeleton pendant chargement (Req 6.4), PostComposer visible si isOwner (Req 7.1), PostComposer masqué si pas isOwner (Req 7.8), role="feed" et aria-busy présents (Req 11.3, 11.6)
    - _Requirements: 6.4, 6.5, 7.1, 7.8, 11.3, 11.6_

- [x] 10. Tests property-based
  - [x] 10.1 Écrire le test property-based pour le service — Property 1: Post creation round-trip
    - **Property 1: Post creation round-trip**
    - `// Feature: player-posts-tab, Property 1: Post creation round-trip`
    - **Validates: Requirements 1.1, 2.2, 3.1, 3.5**
  - [x] 10.2 Écrire le test property-based pour le service — Property 2: Content length validation
    - **Property 2: Content length validation**
    - `// Feature: player-posts-tab, Property 2: Content length validation`
    - **Validates: Requirements 1.4, 3.3**
  - [x] 10.3 Écrire le test property-based pour le service — Property 3: Whitespace content rejection
    - **Property 3: Whitespace content rejection**
    - `// Feature: player-posts-tab, Property 3: Whitespace content rejection`
    - **Validates: Requirements 3.2**
  - [x] 10.4 Écrire le test property-based pour le service — Property 4: Posts sorted by date descending
    - **Property 4: Posts sorted by date descending**
    - `// Feature: player-posts-tab, Property 4: Posts sorted by date descending`
    - **Validates: Requirements 2.1**
  - [x] 10.5 Écrire le test property-based pour le service — Property 5: Pagination invariants
    - **Property 5: Pagination invariants**
    - `// Feature: player-posts-tab, Property 5: Pagination invariants`
    - **Validates: Requirements 2.3, 2.4**
  - [x] 10.6 Écrire le test property-based pour le service — Property 6: Post deletion removes post
    - **Property 6: Post deletion removes post**
    - `// Feature: player-posts-tab, Property 6: Post deletion removes post`
    - **Validates: Requirements 4.1**
  - [x] 10.7 Écrire le test property-based pour le service — Property 12: Service error propagation
    - **Property 12: Service error propagation**
    - `// Feature: player-posts-tab, Property 12: Service error propagation`
    - **Validates: Requirements 9.4**
  - [x] 10.8 Écrire le test property-based pour les composants — Property 7: Composer visibility based on ownership
    - **Property 7: Composer visibility based on ownership**
    - `// Feature: player-posts-tab, Property 7: Composer visibility based on ownership`
    - **Validates: Requirements 7.1, 7.8**
  - [x] 10.9 Écrire le test property-based pour les composants — Property 8: Character counter accuracy
    - **Property 8: Character counter accuracy**
    - `// Feature: player-posts-tab, Property 8: Character counter accuracy`
    - **Validates: Requirements 7.3**
  - [x] 10.10 Écrire le test property-based pour les composants — Property 9: Publish button disabled for whitespace input
    - **Property 9: Publish button disabled for whitespace input**
    - `// Feature: player-posts-tab, Property 9: Publish button disabled for whitespace input`
    - **Validates: Requirements 7.4**
  - [x] 10.11 Écrire le test property-based pour les composants — Property 10: Delete button visibility based on ownership
    - **Property 10: Delete button visibility based on ownership**
    - `// Feature: player-posts-tab, Property 10: Delete button visibility based on ownership`
    - **Validates: Requirements 8.1, 8.5**
  - [x] 10.12 Écrire le test property-based pour les composants — Property 11: New post prepended to list
    - **Property 11: New post prepended to list**
    - `// Feature: player-posts-tab, Property 11: New post prepended to list`
    - **Validates: Requirements 7.5**

- [x] 11. Checkpoint final — Vérifier que tous les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Lint du code
  - [x] 12.1 Exécuter `bun run lint`
  - [x] 12.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 12.3 Corriger les erreurs de lint si nécessaire

- [x] 13. Build de production
  - [x] 13.1 Exécuter `bun run build`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 13.3 Corriger les erreurs de build si nécessaire

- [x] 14. README de la fonctionnalité
  - [x] 14.1 Créer `docs/README_player-posts-tab.md`
  - [x] 14.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les 12 propriétés universelles de correction du design (Properties 1-12)
- Les tests unitaires couvrent les cas concrets, les cas limites et les intégrations API
- Tous les tests utilisent Vitest avec fast-check pour les property-based, placés dans `test/`
- Fichiers property-based : `test/unit/lib/services/playerPostsService.property.test.ts` (Properties 1-6, 12), `test/unit/components/players/posts.property.test.ts` (Properties 7-11)
- TypeScript est le langage d'implémentation
- Le pattern de scroll infini suit celui de `PlayerReviewsFeed` (IntersectionObserver)
- L'onglet « Aperçu » (overview) est supprimé et remplacé par « Posts »
- La table `player_posts` utilise RLS pour la sécurité (lecture publique, écriture propriétaire)
