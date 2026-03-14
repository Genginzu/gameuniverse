# Document d'Exigences — Onglet Posts du Profil Joueur

## Introduction

L'onglet « Aperçu » (overview) du profil joueur est remplacé par un onglet «
Posts » qui fonctionne comme un fil d'actualité de réseau social. Chaque joueur
dispose d'un mur de posts affichés par ordre chronologique inversé (du plus
récent au plus ancien). Le propriétaire du profil peut publier de nouveaux posts
depuis cet onglet. Les visiteurs (authentifiés ou non) peuvent consulter les
posts d'un joueur. Cet onglet devient l'onglet par défaut du profil joueur, en
remplacement de l'ancien « Aperçu ».

## Glossaire

- **Posts_Tab** : Composant principal qui affiche le fil de posts d'un joueur
  dans l'onglet « Posts » de son profil.
- **Posts_API** : Endpoint API qui gère la lecture et la création des posts d'un
  joueur.
- **Posts_Service** : Service côté client qui communique avec la Posts_API.
- **Post_Card** : Composant d'affichage d'un post individuel dans le fil,
  incluant le contenu textuel, la date de publication et l'auteur.
- **Post_Composer** : Composant de formulaire permettant au propriétaire du
  profil de rédiger et publier un nouveau post.
- **Player_Profile** : Page de profil d'un joueur existante, contenant les
  onglets de navigation.
- **Joueur_Cible** : Le joueur dont le profil est consulté.
- **Propriétaire** : Le joueur authentifié qui consulte son propre profil.
- **Visiteur** : Tout utilisateur (authentifié ou non) qui consulte le profil
  d'un Joueur_Cible.
- **Post** : Publication textuelle créée par un joueur sur son profil, horodatée
  et affichée dans le fil.

## Exigences

### Exigence 1 : Table de base de données pour les posts

**User Story :** En tant que développeur, je veux une table dédiée aux posts des
joueurs dans Supabase, afin de stocker et requêter les publications de manière
performante.

#### Critères d'acceptation

1. THE Posts_API SHALL stocker chaque Post avec les champs suivants :
   identifiant unique (UUID), identifiant du joueur auteur (UUID, clé étrangère
   vers profiles), contenu textuel, date de création et date de mise à jour.
2. THE Posts_API SHALL indexer la table des posts sur la colonne joueur auteur
   et la date de création pour garantir des requêtes performantes.
3. THE Posts_API SHALL appliquer des politiques RLS (Row Level Security)
   autorisant la lecture publique de tous les posts et la création, modification
   et suppression uniquement par le joueur auteur du post.
4. THE Posts_API SHALL limiter le contenu textuel d'un Post à 2000 caractères
   maximum.

### Exigence 2 : Endpoint API de lecture des posts

**User Story :** En tant que développeur front-end, je veux un endpoint API qui
retourne les posts d'un joueur avec pagination, afin d'alimenter l'onglet Posts
de son profil.

#### Critères d'acceptation

1. WHEN un Visiteur requête les posts d'un Joueur_Cible, THE Posts_API SHALL
   retourner les posts triés par date de création décroissante (du plus récent
   au plus ancien).
2. THE Posts_API SHALL retourner pour chaque post : l'identifiant, le contenu
   textuel, la date de création et la date de mise à jour.
3. WHEN un paramètre `page` est fourni, THE Posts_API SHALL retourner la page
   correspondante avec un maximum de 20 posts par page.
4. THE Posts_API SHALL inclure les informations de pagination dans la réponse
   (page courante, nombre total de pages, nombre total de posts, indicateur de
   page suivante).
5. IF le Joueur_Cible n'existe pas, THEN THE Posts_API SHALL retourner une
   erreur 404 avec un message descriptif.

### Exigence 3 : Endpoint API de création d'un post

**User Story :** En tant que joueur, je veux pouvoir publier un nouveau post
depuis mon profil, afin de partager du contenu avec les visiteurs de mon profil.

#### Critères d'acceptation

1. WHEN le Propriétaire soumet un nouveau post, THE Posts_API SHALL créer le
   post et retourner le post créé avec son identifiant et sa date de création.
2. IF le contenu du post est vide ou ne contient que des espaces, THEN THE
   Posts_API SHALL retourner une erreur 400 avec un message indiquant que le
   contenu est requis.
3. IF le contenu du post dépasse 2000 caractères, THEN THE Posts_API SHALL
   retourner une erreur 400 avec un message indiquant la limite de caractères.
4. IF l'utilisateur n'est pas authentifié, THEN THE Posts_API SHALL retourner
   une erreur 401.
5. THE Posts_API SHALL enregistrer automatiquement la date de création et la
   date de mise à jour lors de la création du post.

### Exigence 4 : Endpoint API de suppression d'un post

**User Story :** En tant que joueur, je veux pouvoir supprimer un de mes posts,
afin de retirer du contenu que je ne souhaite plus afficher.

#### Critères d'acceptation

1. WHEN le Propriétaire demande la suppression d'un post, THE Posts_API SHALL
   supprimer le post et retourner un statut de succès.
2. IF le post n'existe pas, THEN THE Posts_API SHALL retourner une erreur 404.
3. IF l'utilisateur tente de supprimer un post dont il n'est pas l'auteur, THEN
   THE Posts_API SHALL retourner une erreur 403.
4. IF l'utilisateur n'est pas authentifié, THEN THE Posts_API SHALL retourner
   une erreur 401.

### Exigence 5 : Remplacement de l'onglet Aperçu par Posts

**User Story :** En tant que visiteur, je veux que l'onglet par défaut du profil
joueur soit « Posts » au lieu de « Aperçu », afin de voir directement le fil
d'actualité du joueur.

#### Critères d'acceptation

1. THE Player_Profile SHALL remplacer l'onglet « Aperçu » (overview) par
   l'onglet « Posts » dans la barre de navigation par onglets.
2. THE Player_Profile SHALL afficher l'onglet « Posts » comme onglet actif par
   défaut lors du chargement du profil d'un joueur.
3. THE Player_Profile SHALL utiliser l'icône `MessageSquare` (ou équivalent de
   lucide-react) pour l'onglet « Posts » à la place de l'icône `User` utilisée
   pour « Aperçu ».
4. THE Player_Profile SHALL supprimer le composant OverviewTab et le code
   associé à l'ancien onglet « Aperçu ».

### Exigence 6 : Affichage du fil de posts

**User Story :** En tant que visiteur, je veux voir le fil de posts d'un joueur
dans l'onglet Posts, afin de consulter ses publications récentes.

#### Critères d'acceptation

1. WHEN le Visiteur sélectionne l'onglet « Posts », THE Posts_Tab SHALL afficher
   le fil de posts du Joueur_Cible par ordre chronologique inversé.
2. THE Post_Card SHALL afficher pour chaque post : le contenu textuel, la date
   de publication formatée de manière relative (ex : « il y a 2 heures », « il y
   a 3 jours ») et l'avatar du joueur auteur.
3. WHEN le Visiteur fait défiler la liste jusqu'en bas, THE Posts_Tab SHALL
   charger automatiquement la page suivante de posts (scroll infini).
4. WHILE les posts sont en cours de chargement, THE Posts_Tab SHALL afficher un
   indicateur de chargement (skeleton).
5. IF le Joueur_Cible n'a publié aucun post, THEN THE Posts_Tab SHALL afficher
   un message indiquant l'absence de posts avec une illustration appropriée.

### Exigence 7 : Formulaire de création de post

**User Story :** En tant que joueur, je veux un formulaire de composition de
post en haut de mon fil, afin de publier rapidement du nouveau contenu.

#### Critères d'acceptation

1. WHILE le Propriétaire consulte son propre profil sur l'onglet « Posts », THE
   Post_Composer SHALL être affiché en haut du fil de posts.
2. THE Post_Composer SHALL afficher un champ de saisie de texte multiligne avec
   un placeholder invitant à écrire.
3. THE Post_Composer SHALL afficher un compteur de caractères indiquant le
   nombre de caractères restants sur 2000.
4. THE Post_Composer SHALL afficher un bouton « Publier » qui est désactivé
   lorsque le champ de saisie est vide ou ne contient que des espaces.
5. WHEN le Propriétaire clique sur « Publier », THE Post_Composer SHALL envoyer
   le post à la Posts_API et ajouter le nouveau post en tête du fil sans
   rechargement de page.
6. WHILE la publication est en cours d'envoi, THE Post_Composer SHALL désactiver
   le bouton « Publier » et afficher un indicateur de chargement.
7. IF la publication échoue, THEN THE Post_Composer SHALL afficher un message
   d'erreur via le système de toast existant.
8. WHEN le Visiteur consulte le profil d'un autre joueur, THE Post_Composer
   SHALL être masqué.

### Exigence 8 : Suppression d'un post depuis le fil

**User Story :** En tant que joueur, je veux pouvoir supprimer un de mes posts
directement depuis le fil, afin de gérer facilement mon contenu.

#### Critères d'acceptation

1. WHILE le Propriétaire consulte son propre profil, THE Post_Card SHALL
   afficher un bouton de suppression sur chaque post.
2. WHEN le Propriétaire clique sur le bouton de suppression, THE Post_Card SHALL
   afficher une demande de confirmation avant de procéder à la suppression.
3. WHEN le Propriétaire confirme la suppression, THE Post_Card SHALL supprimer
   le post via la Posts_API et retirer le post du fil sans rechargement de page.
4. IF la suppression échoue, THEN THE Post_Card SHALL afficher un message
   d'erreur via le système de toast existant.
5. WHEN le Visiteur consulte le profil d'un autre joueur, THE Post_Card SHALL
   masquer le bouton de suppression.

### Exigence 9 : Service client des posts

**User Story :** En tant que développeur front-end, je veux un service client
qui encapsule les appels à l'API des posts, afin de centraliser la logique de
communication.

#### Critères d'acceptation

1. THE Posts_Service SHALL exposer une méthode pour récupérer les posts d'un
   joueur avec pagination.
2. THE Posts_Service SHALL exposer une méthode pour créer un nouveau post.
3. THE Posts_Service SHALL exposer une méthode pour supprimer un post.
4. IF un appel API échoue, THEN THE Posts_Service SHALL propager une erreur avec
   un message descriptif.
5. THE Posts_Service SHALL utiliser les alias de chemins (`@/`) pour les
   imports, conformément à la configuration du projet.

### Exigence 10 : Internationalisation

**User Story :** En tant que visiteur francophone ou anglophone, je veux que
l'onglet Posts soit traduit dans ma langue, afin de comprendre le contenu
affiché.

#### Critères d'acceptation

1. THE Posts_Tab SHALL utiliser les clés de traduction `next-intl` pour tous les
   libellés affichés (titre de l'onglet, placeholder du formulaire, bouton
   publier, messages vides, confirmation de suppression, compteur de
   caractères).
2. THE Posts_Tab SHALL formater les dates de publication de manière relative
   selon la locale courante du Visiteur.
3. THE Posts_Tab SHALL ajouter les nouvelles clés de traduction dans les deux
   fichiers de langue (`fr.json` et `en.json`) simultanément.
4. THE Player_Profile SHALL remplacer la clé de traduction de l'onglet « Aperçu
   » par « Posts » dans les deux fichiers de langue.

### Exigence 11 : Design et accessibilité

**User Story :** En tant que visiteur, je veux que l'onglet Posts respecte le
design glassmorphism du site et soit accessible, afin d'avoir une expérience
cohérente et inclusive.

#### Critères d'acceptation

1. THE Posts_Tab SHALL utiliser les classes glassmorphism existantes
   (`.glass-card`, fonds semi-transparents, `backdrop-blur-xl`) pour les cartes
   de posts et le formulaire de composition.
2. THE Posts_Tab SHALL supporter le dark mode via les préfixes Tailwind `dark:`.
3. THE Posts_Tab SHALL utiliser des attributs ARIA appropriés pour le fil de
   posts (`role="feed"`, `aria-busy`, `aria-label`).
4. THE Post_Composer SHALL associer le champ de saisie à un label accessible via
   `aria-label`.
5. THE Posts_Tab SHALL être navigable au clavier (le bouton publier et les
   boutons de suppression sont focusables et activables via Entrée).
6. WHILE une page supplémentaire est en cours de chargement, THE Posts_Tab SHALL
   indiquer l'état de chargement via `aria-busy="true"`.
