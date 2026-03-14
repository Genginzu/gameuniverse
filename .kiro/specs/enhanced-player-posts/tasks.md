# Plan d'Implémentation : Posts Enrichis (Images, Tags, Mentions, Recherche)

## Vue d'ensemble

Étendre le système de posts joueurs existant (`player-posts-tab`) avec quatre nouvelles capacités : image URL, tags (#hashtags), mentions (@joueur), et recherche. L'implémentation s'appuie sur les fichiers existants (table `player_posts`, API, composants, services, hook, types) sans les recréer. Seuls les fichiers modifiés ou créés sont décrits.

## Tasks

- [x] 1. Migration base de données
  - [x] 1.1 Créer `supabase/migrations/20240311000001_enhanced_player_posts.sql`
    - Ajouter colonne `image_url TEXT` nullable sur `player_posts`
    - Créer table `post_tags` (id UUID PK, post_id UUID FK CASCADE, tag TEXT CHECK `^[a-z0-9_-]+$`), UNIQUE(post_id, tag), RLS lecture publique / écriture propriétaire du post parent
    - Créer table `post_mentions` (id UUID PK, post_id UUID FK CASCADE, mentioned_player_id UUID FK CASCADE vers profiles), UNIQUE(post_id, mentioned_player_id), RLS lecture publique / écriture propriétaire du post parent
    - Créer extension `pg_trgm` et index GIN sur `player_posts.content`
    - COMMENT ON pour chaque colonne/table
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 2. Types et utilitaire de parsing
  - [x] 2.1 Modifier `src/types/post.ts`
    - Ajouter interface `PostMention` (`playerId`, `username`)
    - Ajouter `imageUrl: string | null`, `tags: string[]`, `mentions: PostMention[]` sur `Post`
    - Ajouter `imageUrl?: string` sur `CreatePostPayload`
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 2.2 Créer `src/lib/utils/postContentParser.ts`
    - `extractTags(content: string): string[]` — extrait max 10 tags normalisés en minuscules, sans doublons, pattern `[a-z0-9_-]+`
    - `extractMentions(content: string): string[]` — extrait max 10 pseudos uniques (sans le `@`)
    - `isValidImageUrl(url: string): boolean` — valide que l'URL commence par `https://` et est syntaxiquement valide
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 3.1, 3.6, 3.7, 1.4_

- [x] 3. Tests du parser
  - [x] 3.1 Créer `test/unit/lib/utils/postContentParser.test.ts`
    - Tests unitaires : contenu sans tags, un tag, tags avec tirets/underscores, tags en majuscules → minuscules, doublons, >10 tags, mentions basiques, mentions >10, URL valides/invalides, chaîne vide, URL http:// rejetée
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 3.1, 3.6, 3.7, 1.4_
  - [x] 3.2 Écrire test property-based : Extraction correcte des tags
    - **Property 1 : Extraction correcte des tags**
    - `// Feature: enhanced-player-posts, Property 1: Extraction correcte des tags`
    - **Validates: Requirements 2.1**
  - [x] 3.3 Écrire test property-based : Invariants de sortie de extractTags
    - **Property 2 : Invariants de sortie de extractTags**
    - `// Feature: enhanced-player-posts, Property 2: Invariants de sortie de extractTags`
    - **Validates: Requirements 2.2, 2.4, 2.5, 2.6**
  - [x] 3.4 Écrire test property-based : Extraction correcte des mentions
    - **Property 3 : Extraction correcte des mentions**
    - `// Feature: enhanced-player-posts, Property 3: Extraction correcte des mentions`
    - **Validates: Requirements 3.1**
  - [x] 3.5 Écrire test property-based : Invariants de sortie de extractMentions
    - **Property 4 : Invariants de sortie de extractMentions**
    - `// Feature: enhanced-player-posts, Property 4: Invariants de sortie de extractMentions`
    - **Validates: Requirements 3.6, 3.7**
  - [x] 3.6 Écrire test property-based : Validation d'URL image
    - **Property 5 : Validation d'URL image**
    - `// Feature: enhanced-player-posts, Property 5: Validation d'URL image`
    - **Validates: Requirements 1.4**

- [x] 4. Checkpoint — Vérifier que le parser et ses tests compilent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Service serveur et route API
  - [x] 5.1 Modifier `src/lib/services/playerPostsServerService.ts`
    - `fetchPosts` : accepter paramètre `search?`, appliquer filtre ILIKE sur `content` si présent, joindre `post_tags` et `post_mentions` (avec `profiles` pour le pseudo), enrichir `transformRow` avec `imageUrl`, `tags`, `mentions`
    - `createPost` : accepter `imageUrl?`, insérer dans `player_posts` avec `image_url`, appeler `extractTags`/`extractMentions` du parser, résoudre les mentions contre `profiles.full_name`, insérer dans `post_tags` et `post_mentions`, retourner le post enrichi
    - _Requirements: 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 7.1, 2.1, 2.2, 3.1, 3.2, 3.3, 3.8, 5.5_
  - [x] 5.2 Modifier `src/app/api/players/[id]/posts/route.ts`
    - GET : lire paramètre `search` depuis l'URL, le passer au service serveur
    - POST : lire champ `imageUrl` du body, valider avec `isValidImageUrl` si présent (400 si invalide), passer au service serveur
    - _Requirements: 4.4, 6.1, 1.4_
  - [x] 5.3 Modifier `src/lib/services/playerPostsService.ts`
    - `fetchPosts` : accepter paramètre `search?`, l'ajouter en query string
    - `createPost` : accepter `imageUrl?` dans le payload
    - _Requirements: 4.4, 6.1_

- [x] 6. Checkpoint — Vérifier que les services et routes compilent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Hook et composants UI
  - [x] 7.1 Modifier `src/hooks/usePlayerPosts.ts`
    - Ajouter état `searchTerm` et `setSearchTerm` avec debounce 300ms
    - Passer `searchTerm` à `fetchPosts` quand il change
    - Réinitialiser la pagination quand `searchTerm` change
    - Modifier `createPost` pour accepter `imageUrl?`
    - _Requirements: 4.3, 4.6, 4.7_
  - [x] 7.2 Créer `src/components/players/SearchBar.tsx`
    - Props : `value`, `onChange`
    - Champ de saisie avec icône recherche, classe `glass-input`, dark mode
    - Placeholder i18n, `aria-label` i18n
    - _Requirements: 4.1, 4.2, 4.6, 9.2, 9.6_
  - [x] 7.3 Créer `src/components/players/PostContentRenderer.tsx`
    - Props : `content`, `tags`, `mentions`, `locale`
    - Parser le contenu pour rendre les `#tags` en badges cliquables (couleurs néon violet/cyan) et les `@mentions` valides en liens vers le profil
    - Mentions invalides rendues en texte brut
    - Tags et mentions navigables au clavier, `aria-label` sur chaque élément
    - _Requirements: 2.3, 2.7, 3.4, 3.5, 9.3, 9.4_
  - [x] 7.4 Modifier `src/components/players/PostComposer.tsx`
    - Ajouter bouton toggle (icône image) pour afficher/masquer le champ URL d'image
    - Champ de saisie URL avec placeholder i18n, `aria-label`, validation `https://`
    - Message d'erreur i18n si URL invalide, soumission bloquée
    - Passer `imageUrl` à `createPost`
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7, 8.1, 9.5_
  - [x] 7.5 Modifier `src/components/players/PostCard.tsx`
    - Afficher l'image sous le contenu si `imageUrl` présent (coins arrondis `rounded-xl`, transition fluide, ratio préservé)
    - Masquer l'image via `onError` si URL cassée (pas d'erreur visible)
    - Remplacer le rendu texte brut par `PostContentRenderer` pour les tags/mentions
    - _Requirements: 1.3, 1.5, 9.1_
  - [x] 7.6 Modifier `src/components/players/PostsFeed.tsx`
    - Intégrer `SearchBar` entre `PostComposer` et la liste des posts
    - Connecter `searchTerm`/`setSearchTerm` du hook
    - Afficher message i18n si aucun résultat avec le terme recherché
    - _Requirements: 4.1, 4.7, 4.9_

- [x] 8. Internationalisation
  - [x] 8.1 Ajouter les nouvelles clés dans `src/messages/fr.json` sous `players.posts`
    - Clés : placeholder URL image, bouton toggle image, erreur URL invalide, placeholder recherche, message aucun résultat, aria-labels (champ image, champ recherche, lien mention, badge tag)
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 8.2 Ajouter les clés correspondantes dans `src/messages/en.json` sous `players.posts`
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. Checkpoint — Vérifier que tous les composants s'intègrent correctement
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Tests unitaires des composants
  - [x] 10.1 Créer `test/unit/components/players/SearchBar.test.tsx`
    - Rendu initial avec placeholder, debounce 300ms, effacement, aria-label
    - _Requirements: 4.1, 4.2, 4.6, 9.6_
  - [x] 10.2 Créer `test/unit/components/players/PostContentRenderer.test.tsx`
    - Rendu tags en badges cliquables, mentions valides en liens, mentions invalides en texte brut, texte mixte, navigation clavier
    - _Requirements: 2.3, 2.7, 3.4, 3.5, 9.3, 9.4_
  - [x] 10.3 Écrire test property-based : Filtrage de recherche par contenu
    - **Property 6 : Filtrage de recherche par contenu**
    - `// Feature: enhanced-player-posts, Property 6: Filtrage de recherche par contenu`
    - Fichier : `test/unit/lib/utils/postContentParser.property.test.ts` (ajout)
    - **Validates: Requirements 4.3, 4.5**

- [x] 11. Checkpoint final — Vérifier que tous les tests passent
  - Exécuter `bun run test:all`
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
  - [x] 14.1 Créer `docs/README_enhanced-player-posts.md`
  - [x] 14.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les 6 propriétés de correction du design (Properties 1–6)
- Les tests unitaires couvrent les cas concrets, cas limites et composants UI
- Tous les tests utilisent Vitest avec fast-check pour les property-based, placés dans `test/`
- Fichiers property-based : `test/unit/lib/utils/postContentParser.property.test.ts` (Properties 1–6)
- TypeScript est le langage d'implémentation
- L'implémentation s'appuie sur les fichiers existants de `player-posts-tab` — pas de recréation
- Les nouvelles tables (`post_tags`, `post_mentions`) et la colonne `image_url` nécessitent une seule migration
