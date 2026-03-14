# Document d'Exigences — Posts Enrichis (Images, Tags, Mentions, Recherche)

## Introduction

Ce document décrit les améliorations apportées au système de posts existant des
profils joueurs. Quatre nouvelles capacités sont ajoutées : l'affichage d'images
via URL, les tags (hashtags avec `#`), les mentions de joueurs (avec `@`), et la
recherche dans les posts d'un joueur. Ces fonctionnalités s'appuient sur la base
existante (table `player_posts`, API, composants
PostsFeed/PostComposer/PostCard, service client/serveur, hook `usePlayerPosts`)
sans la recréer.

## Glossaire

- **Posts_API** : Endpoints API existants (`/api/players/:id/posts`) enrichis
  pour supporter les nouvelles fonctionnalités.
- **Posts_Service** : Service client existant (`PlayerPostsService`) étendu pour
  les nouvelles fonctionnalités.
- **Posts_Server_Service** : Service serveur existant
  (`PlayerPostsServerService`) étendu pour les nouvelles requêtes.
- **Post_Composer** : Composant formulaire existant enrichi pour saisir une URL
  d'image, des tags et des mentions.
- **Post_Card** : Composant d'affichage existant enrichi pour rendre les images,
  tags cliquables et mentions cliquables.
- **Posts_Feed** : Composant fil de posts existant enrichi avec une barre de
  recherche.
- **Search_Bar** : Nouveau composant de recherche textuelle dans les posts d'un
  joueur.
- **Tag** : Mot-clé préfixé par `#` dans le contenu d'un post (ex : `#rpg`,
  `#speedrun`). Stocké en base dans une table dédiée.
- **Mention** : Référence à un joueur préfixée par `@` dans le contenu d'un post
  (ex : `@pseudo`). Stockée en base dans une table dédiée.
- **Image_URL** : URL d'une image externe associée à un post, affichée sous le
  contenu textuel.
- **Joueur_Cible** : Le joueur dont le profil est consulté.
- **Propriétaire** : Le joueur authentifié qui consulte son propre profil.
- **Visiteur** : Tout utilisateur (authentifié ou non) qui consulte le profil
  d'un Joueur_Cible.

## Exigences

### Exigence 1 : Image dans un post via URL

**User Story :** En tant que joueur, je veux pouvoir ajouter l'URL d'une image à
mon post, afin d'illustrer mes publications avec du contenu visuel.

#### Critères d'acceptation

1. THE Post_Composer SHALL afficher un champ de saisie optionnel pour une URL
   d'image, distinct du champ de contenu textuel.
2. WHEN le Propriétaire fournit une URL d'image valide et publie le post, THE
   Posts_API SHALL stocker l'URL d'image dans la colonne `image_url` du post.
3. WHEN un post contient une URL d'image, THE Post_Card SHALL afficher l'image
   sous le contenu textuel avec un ratio d'aspect préservé et des coins
   arrondis.
4. IF l'URL d'image fournie ne correspond pas à un format URL valide (protocole
   `https://`), THEN THE Post_Composer SHALL afficher un message d'erreur de
   validation et empêcher la soumission.
5. IF l'image ne peut pas être chargée (URL cassée, 404), THEN THE Post_Card
   SHALL masquer le conteneur d'image sans afficher d'erreur visible.
6. THE Posts_API SHALL accepter un post sans URL d'image (champ optionnel,
   valeur `null` par défaut).
7. THE Post_Composer SHALL afficher un bouton toggle (icône image) pour
   afficher/masquer le champ URL d'image.

### Exigence 2 : Tags (hashtags) dans les posts

**User Story :** En tant que joueur, je veux pouvoir ajouter des tags avec `#`
dans mes posts, afin de catégoriser mes publications et les rendre découvrables.

#### Critères d'acceptation

1. WHEN le Propriétaire inclut un ou plusieurs mots préfixés par `#` dans le
   contenu du post (ex : `#rpg #speedrun`), THE Posts_API SHALL extraire ces
   tags et les stocker dans la table `post_tags`.
2. THE Posts_API SHALL normaliser les tags en minuscules et supprimer les
   doublons avant stockage.
3. THE Post_Card SHALL afficher les tags sous forme de badges cliquables
   stylisés avec les couleurs d'accent du projet (néon violet/cyan).
4. THE Posts_API SHALL limiter le nombre de tags par post à 10 maximum.
5. IF le contenu contient plus de 10 tags distincts, THEN THE Posts_API SHALL
   conserver uniquement les 10 premiers tags rencontrés dans le texte.
6. THE Posts*API SHALL accepter les tags composés de caractères alphanumériques,
   tirets et underscores (regex : `#[a-zA-Z0-9*-]+`).
7. THE Post_Card SHALL afficher les tags dans le contenu textuel avec un style
   distinctif (couleur d'accent) par rapport au texte normal.

### Exigence 3 : Mentions de joueurs dans les posts

**User Story :** En tant que joueur, je veux pouvoir mentionner d'autres joueurs
avec `@` dans mes posts, afin de les référencer dans mes publications.

#### Critères d'acceptation

1. WHEN le Propriétaire inclut un ou plusieurs pseudos préfixés par `@` dans le
   contenu du post (ex : `@pseudo`), THE Posts_API SHALL extraire ces mentions
   et les stocker dans la table `post_mentions`.
2. THE Posts_API SHALL vérifier que chaque joueur mentionné existe dans la table
   `profiles` (correspondance sur le champ `full_name`).
3. IF un pseudo mentionné ne correspond à aucun joueur existant, THEN THE
   Posts_API SHALL ignorer cette mention (pas de stockage en base) et la traiter
   comme du texte normal.
4. THE Post_Card SHALL afficher les mentions valides sous forme de liens
   cliquables pointant vers le profil du joueur mentionné.
5. THE Post_Card SHALL afficher les mentions invalides (joueur inexistant) comme
   du texte normal sans lien.
6. THE Posts_API SHALL limiter le nombre de mentions par post à 10 maximum.
7. IF le contenu contient plus de 10 mentions valides distinctes, THEN THE
   Posts_API SHALL conserver uniquement les 10 premières mentions rencontrées
   dans le texte.
8. THE Posts_API SHALL retourner les informations des joueurs mentionnés (id,
   pseudo) dans la réponse de chaque post.

### Exigence 4 : Recherche dans les posts d'un joueur

**User Story :** En tant que visiteur, je veux pouvoir rechercher dans les posts
d'un joueur, afin de retrouver rapidement un contenu spécifique.

#### Critères d'acceptation

1. THE Search_Bar SHALL être affichée en haut du fil de posts, entre le
   Post_Composer (si visible) et la liste des posts.
2. THE Search_Bar SHALL afficher un champ de saisie avec une icône de recherche
   et un placeholder invitant à rechercher.
3. WHEN le Visiteur saisit un terme de recherche, THE Posts_Feed SHALL filtrer
   les posts du Joueur_Cible dont le contenu contient le terme recherché
   (recherche insensible à la casse).
4. THE Posts_API SHALL accepter un paramètre de requête `search` optionnel pour
   filtrer les posts côté serveur.
5. WHEN un terme de recherche est actif, THE Posts_API SHALL retourner
   uniquement les posts dont le contenu contient le terme recherché, avec la
   même pagination que la requête standard.
6. THE Search_Bar SHALL appliquer un délai de debounce de 300ms avant de
   déclencher la recherche, afin d'éviter les requêtes excessives.
7. WHEN le Visiteur efface le terme de recherche, THE Posts_Feed SHALL afficher
   à nouveau tous les posts du Joueur_Cible.
8. THE Search_Bar SHALL permettre la recherche par tag en saisissant `#tag` et
   par mention en saisissant `@pseudo`.
9. IF aucun post ne correspond au terme de recherche, THEN THE Posts_Feed SHALL
   afficher un message indiquant l'absence de résultats avec le terme recherché.

### Exigence 5 : Schéma de base de données pour les enrichissements

**User Story :** En tant que développeur, je veux des tables dédiées pour les
tags et mentions, et une colonne image_url sur les posts, afin de stocker les
nouvelles données de manière structurée.

#### Critères d'acceptation

1. THE Posts_API SHALL ajouter une colonne `image_url` de type `TEXT` nullable à
   la table `player_posts`.
2. THE Posts_API SHALL créer une table `post_tags` avec les colonnes : `id`
   (UUID, PK), `post_id` (UUID, FK vers `player_posts`), `tag` (TEXT, le tag
   normalisé sans le `#`), et un index unique sur `(post_id, tag)`.
3. THE Posts_API SHALL créer une table `post_mentions` avec les colonnes : `id`
   (UUID, PK), `post_id` (UUID, FK vers `player_posts`), `mentioned_player_id`
   (UUID, FK vers `profiles`), et un index unique sur
   `(post_id, mentioned_player_id)`.
4. THE Posts_API SHALL appliquer des politiques RLS sur `post_tags` et
   `post_mentions` : lecture publique, écriture réservée à l'auteur du post
   parent.
5. THE Posts_API SHALL supprimer en cascade les tags et mentions lorsqu'un post
   est supprimé (FK avec `ON DELETE CASCADE`).
6. THE Posts_API SHALL créer un index GIN sur la colonne `content` de
   `player_posts` pour optimiser la recherche textuelle.

### Exigence 6 : Enrichissement du payload de création

**User Story :** En tant que développeur front-end, je veux que l'API de
création de post accepte les nouvelles données (image_url), afin de transmettre
les enrichissements depuis le formulaire.

#### Critères d'acceptation

1. THE Posts_API SHALL accepter un champ optionnel `imageUrl` dans le body de la
   requête POST de création de post.
2. WHEN un post est créé avec des tags dans le contenu, THE Posts_API SHALL
   extraire et stocker les tags automatiquement (pas de champ séparé dans le
   body).
3. WHEN un post est créé avec des mentions dans le contenu, THE Posts_API SHALL
   extraire et stocker les mentions automatiquement (pas de champ séparé dans le
   body).
4. THE Posts_API SHALL retourner le post créé avec les tags extraits, les
   mentions résolues et l'URL d'image dans la réponse.

### Exigence 7 : Enrichissement de la réponse API

**User Story :** En tant que développeur front-end, je veux que l'API retourne
les tags, mentions et image_url avec chaque post, afin de les afficher dans le
fil.

#### Critères d'acceptation

1. THE Posts_API SHALL retourner pour chaque post : l'URL d'image (si présente),
   la liste des tags, et la liste des mentions avec l'id et le pseudo du joueur
   mentionné.
2. THE Posts_API SHALL retourner les tags sous forme de tableau de chaînes (ex :
   `["rpg", "speedrun"]`).
3. THE Posts_API SHALL retourner les mentions sous forme de tableau d'objets
   contenant `playerId` et `username` (ex :
   `[{"playerId": "uuid", "username": "pseudo"}]`).

### Exigence 8 : Internationalisation des nouvelles fonctionnalités

**User Story :** En tant que visiteur francophone ou anglophone, je veux que les
nouvelles fonctionnalités soient traduites dans ma langue.

#### Critères d'acceptation

1. THE Post_Composer SHALL utiliser des clés de traduction `next-intl` pour le
   placeholder du champ URL d'image, le bouton toggle image, et les messages
   d'erreur de validation d'URL.
2. THE Search_Bar SHALL utiliser des clés de traduction `next-intl` pour le
   placeholder de recherche et le message d'absence de résultats.
3. THE Posts_Feed SHALL ajouter les nouvelles clés de traduction dans les deux
   fichiers de langue (`fr.json` et `en.json`) simultanément.

### Exigence 9 : Design et accessibilité des enrichissements

**User Story :** En tant que visiteur, je veux que les nouvelles fonctionnalités
respectent le design glassmorphism et soient accessibles.

#### Critères d'acceptation

1. THE Post_Card SHALL afficher l'image avec les classes glassmorphism (coins
   arrondis `rounded-xl`, transition fluide au chargement).
2. THE Search_Bar SHALL utiliser la classe `glass-input` pour le champ de
   recherche et supporter le dark mode.
3. THE Post_Card SHALL rendre les tags et mentions navigables au clavier
   (focusables et activables via Entrée).
4. THE Post_Card SHALL fournir des attributs `aria-label` sur les liens de
   mention et les badges de tag.
5. THE Post_Composer SHALL fournir un `aria-label` sur le champ URL d'image.
6. THE Search_Bar SHALL fournir un `aria-label` sur le champ de recherche.
