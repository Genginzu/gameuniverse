# Document de Spécifications — Système de Notifications

## Introduction

Ce document décrit les exigences pour un système de notifications en temps réel
intégré au site Gamers Universe. Le système permet aux joueurs d'être informés
lorsqu'un autre joueur commente leur post ou leur envoie un message dans la
section discussions. Ce document couvre également la création du système de
commentaires sur les posts de joueurs, qui n'existe pas encore et doit être
construit dans le cadre de cette fonctionnalité. Les notifications sont
accessibles via une icône de cloche placée dans le header global du site, à
gauche du sélecteur de langue.

## Glossaire

- **Notification_System** : Le système complet de gestion des notifications,
  incluant la création, le stockage, l'affichage et la suppression des
  notifications.
- **Notification_Bell** : Le composant UI représentant l'icône de cloche dans le
  header global, servant de point d'accès au dropdown de notifications.
- **Notification_Dropdown** : Le panneau déroulant qui s'ouvre au clic sur la
  cloche et affiche les 5 dernières notifications non lues.
- **Notification** : Un enregistrement en base de données représentant un
  événement destiné à un joueur (commentaire sur post, message reçu).
- **Post_Comment_System** : Le système complet de commentaires sur les posts de
  joueurs, incluant la table `post_comments`, les endpoints API, et
  l'intégration UI dans la page de profil.
- **Post_Comment** : Un commentaire rédigé par un joueur sur le post d'un autre
  joueur, stocké dans la table `post_comments`.
- **Joueur** : Un utilisateur authentifié du site Gamers Universe, identifié par
  son profil Supabase.
- **Post** : Une publication rédigée par un joueur sur son profil, stockée dans
  la table `player_posts`.
- **Discussion** : Une conversation privée entre deux joueurs amis, stockée dans
  la table `conversations` et `messages`.
- **Badge_Compteur** : L'indicateur visuel numérique affiché sur l'icône de
  cloche, indiquant le nombre de notifications non lues.
- **TopBar** : Le composant header global du site (`TopBar.tsx`) utilisé dans le
  layout dashboard.
- **LandingHeader** : Le composant header de la page d'accueil
  (`LandingHeader.tsx`).

## Exigences

### Exigence 1 : Système de commentaires sur les posts de joueurs

**User Story :** En tant que joueur, je veux pouvoir commenter les posts
d'autres joueurs, afin d'interagir avec leur contenu et participer aux échanges
sur leur profil.

#### Critères d'acceptation

1. THE Post_Comment_System SHALL stocker chaque commentaire dans une table
   `post_comments` avec les champs suivants : `id` (UUID), `post_id` (UUID,
   référence à `player_posts.id` avec `ON DELETE CASCADE`), `player_id` (UUID,
   référence à `profiles.id` avec `ON DELETE CASCADE`), `content` (texte, max
   500 caractères), `created_at` (timestamp), `updated_at` (timestamp).
2. THE Post_Comment_System SHALL appliquer des politiques RLS (Row Level
   Security) sur la table `post_comments` : lecture ouverte à tous les
   utilisateurs authentifiés, insertion limitée à l'auteur du commentaire,
   suppression limitée à l'auteur du commentaire ou au propriétaire du post.
3. THE Post_Comment_System SHALL créer un index sur la colonne `post_id` pour
   optimiser les requêtes de récupération des commentaires d'un post.
4. WHEN une requête GET est envoyée à `/api/posts/:postId/comments`, THE
   Post_Comment_System SHALL retourner les commentaires du post spécifié, triés
   par date de création croissante, avec les informations du joueur auteur
   (username, avatar_url).
5. WHEN une requête POST est envoyée à `/api/posts/:postId/comments` avec un
   champ `content`, THE Post_Comment_System SHALL créer un nouveau commentaire
   associé au post et au joueur authentifié.
6. WHEN une requête DELETE est envoyée à
   `/api/posts/:postId/comments/:commentId`, THE Post_Comment_System SHALL
   supprimer le commentaire si le joueur authentifié est l'auteur du commentaire
   ou le propriétaire du post.
7. IF un joueur non authentifié tente d'accéder aux endpoints de commentaires de
   posts, THEN THE Post_Comment_System SHALL retourner une erreur HTTP 401.
8. IF un joueur tente de supprimer un commentaire dont il n'est ni l'auteur ni
   le propriétaire du post, THEN THE Post_Comment_System SHALL retourner une
   erreur HTTP 403.
9. THE Post_Comment_System SHALL valider que le champ `content` contient entre 1
   et 500 caractères avant de créer un commentaire.
10. THE Post_Comment_System SHALL afficher les commentaires sous chaque post
    dans l'onglet Posts du profil joueur, avec un formulaire de saisie pour
    ajouter un commentaire.
11. THE Post_Comment_System SHALL afficher le nombre de commentaires à côté de
    chaque post.
12. THE Post_Comment_System SHALL fournir un fichier de migration SQL dans
    `supabase/migrations/` pour la création de la table `post_comments`, les
    index, les politiques RLS, et les commentaires SQL documentant les colonnes.

### Exigence 2 : Stockage des notifications en base de données

**User Story :** En tant que développeur, je veux stocker les notifications dans
une table dédiée en base de données, afin de pouvoir les gérer de manière fiable
et persistante.

#### Critères d'acceptation

1. THE Notification_System SHALL stocker chaque notification dans une table
   `notifications` avec les champs suivants : `id` (UUID), `recipient_id` (UUID,
   référence au joueur destinataire), `sender_id` (UUID, référence au joueur
   émetteur), `type` (enum : `post_comment`, `discussion_message`),
   `reference_id` (UUID, identifiant de la ressource liée), `content_preview`
   (texte, aperçu du contenu), `is_read` (booléen, défaut `false`), `created_at`
   (timestamp).
2. THE Notification_System SHALL appliquer des politiques RLS (Row Level
   Security) sur la table `notifications` afin que chaque joueur puisse
   uniquement lire et modifier ses propres notifications.
3. THE Notification_System SHALL créer un index sur les colonnes `recipient_id`
   et `is_read` pour optimiser les requêtes de récupération des notifications
   non lues.

### Exigence 3 : Création automatique des notifications

**User Story :** En tant que joueur, je veux recevoir une notification lorsqu'un
autre joueur interagit avec mon contenu, afin de rester informé des activités
liées à mon profil.

#### Critères d'acceptation

1. WHEN un joueur commente le post d'un autre joueur, THE Notification_System
   SHALL créer une notification de type `post_comment` pour le propriétaire du
   post.
2. WHEN un joueur envoie un message dans une conversation de discussion, THE
   Notification_System SHALL créer une notification de type `discussion_message`
   pour le destinataire du message.
3. WHEN un joueur commente son propre post, THE Notification_System SHALL ne pas
   créer de notification pour ce joueur (pas d'auto-notification).
4. THE Notification_System SHALL inclure dans le champ `content_preview` un
   extrait du commentaire ou du message limité à 100 caractères.

### Exigence 4 : API de gestion des notifications

**User Story :** En tant que développeur frontend, je veux disposer d'endpoints
API pour récupérer et gérer les notifications, afin d'alimenter l'interface
utilisateur.

#### Critères d'acceptation

1. WHEN une requête GET est envoyée à `/api/notifications`, THE
   Notification_System SHALL retourner les notifications non lues du joueur
   authentifié, triées par date de création décroissante, avec une limite
   configurable (défaut : 20).
2. WHEN une requête GET est envoyée à `/api/notifications/count`, THE
   Notification_System SHALL retourner le nombre total de notifications non lues
   du joueur authentifié.
3. WHEN une requête PATCH est envoyée à `/api/notifications/:id/read`, THE
   Notification_System SHALL marquer la notification spécifiée comme lue
   (`is_read = true`).
4. WHEN une requête PATCH est envoyée à `/api/notifications/read-all`, THE
   Notification_System SHALL marquer toutes les notifications non lues du joueur
   authentifié comme lues.
5. IF un joueur non authentifié tente d'accéder aux endpoints de notifications,
   THEN THE Notification_System SHALL retourner une erreur HTTP 401.
6. IF un joueur tente de modifier une notification qui ne lui appartient pas,
   THEN THE Notification_System SHALL retourner une erreur HTTP 403.

### Exigence 5 : Icône de cloche dans le header global

**User Story :** En tant que joueur, je veux voir une icône de cloche dans le
header du site, afin d'accéder rapidement à mes notifications.

#### Critères d'acceptation

1. WHILE un joueur est authentifié, THE Notification_Bell SHALL être visible
   dans le header global (TopBar et LandingHeader), positionnée à gauche du
   composant LanguageSwitcher.
2. WHILE un joueur a des notifications non lues, THE Notification_Bell SHALL
   afficher un Badge_Compteur indiquant le nombre de notifications non lues.
3. WHEN le nombre de notifications non lues dépasse 9, THE Badge_Compteur SHALL
   afficher "9+".
4. WHILE un joueur n'a aucune notification non lue, THE Notification_Bell SHALL
   ne pas afficher de Badge_Compteur.
5. WHILE un joueur n'est pas authentifié, THE Notification_Bell SHALL ne pas
   être visible dans le header.
6. THE Notification_Bell SHALL respecter le design system glassmorphism du site
   et utiliser une icône Iconify (`mdi:bell-outline` ou équivalent).
7. THE Notification_Bell SHALL avoir une zone cliquable minimale de 44x44 pixels
   pour respecter les standards d'accessibilité tactile.

### Exigence 6 : Dropdown de notifications

**User Story :** En tant que joueur, je veux voir un dropdown avec mes dernières
notifications lorsque je clique sur la cloche, afin de consulter rapidement les
interactions récentes.

#### Critères d'acceptation

1. WHEN un joueur clique sur la Notification_Bell, THE Notification_Dropdown
   SHALL s'ouvrir et afficher les 5 dernières notifications non lues, triées par
   date de création décroissante.
2. THE Notification_Dropdown SHALL utiliser le style `glass-dropdown` du design
   system glassmorphism et avoir une largeur d'environ 360px sur desktop.
3. THE Notification_Dropdown SHALL afficher pour chaque notification : le nom du
   joueur émetteur, le type d'interaction (icône distincte par type), l'aperçu
   du contenu (`content_preview`), et la date relative (ex : "il y a 5 min").
4. WHEN un joueur clique sur le bouton de fermeture (icône croix) d'une
   notification, THE Notification_System SHALL marquer cette notification comme
   lue et la retirer de la liste affichée.
5. WHEN une notification est retirée de la liste, THE Notification_Dropdown
   SHALL faire apparaître la notification non lue suivante en file d'attente (si
   elle existe) pour maintenir un maximum de 5 notifications visibles.
6. WHEN un joueur clique en dehors du Notification_Dropdown, THE
   Notification_Dropdown SHALL se fermer.
7. THE Notification_Dropdown SHALL afficher un message "Aucune notification"
   lorsque le joueur n'a aucune notification non lue.
8. THE Notification_Dropdown SHALL être responsive et s'adapter aux écrans
   mobiles (largeur plein écran ou quasi plein écran sous le breakpoint `sm`).

### Exigence 7 : Internationalisation (i18n)

**User Story :** En tant que joueur, je veux que les notifications et les
commentaires de posts soient affichés dans ma langue (français ou anglais), afin
de comprendre le contenu sans barrière linguistique.

#### Critères d'acceptation

1. THE Notification_System SHALL fournir toutes les chaînes de texte de
   l'interface de notifications (libellés, messages vides, types de
   notification, dates relatives) en français et en anglais via les fichiers
   `fr.json` et `en.json`.
2. THE Notification_System SHALL utiliser les fonctions `useTranslations`
   (client) et `getTranslations` (serveur) de `next-intl` pour afficher les
   textes traduits.
3. THE Notification_System SHALL traduire les libellés de type de notification :
   "a commenté votre post" / "commented on your post", "vous a envoyé un
   message" / "sent you a message".
4. THE Post_Comment_System SHALL fournir toutes les chaînes de texte de
   l'interface de commentaires de posts (libellés, placeholder du formulaire,
   messages vides, boutons) en français et en anglais via les fichiers `fr.json`
   et `en.json`.

### Exigence 8 : Récupération des données côté client

**User Story :** En tant que développeur, je veux utiliser SWR pour récupérer et
mettre à jour les notifications côté client, afin de bénéficier du cache et de
la revalidation automatique.

#### Critères d'acceptation

1. THE Notification_System SHALL utiliser un hook SWR (`useNotifications`) pour
   récupérer les notifications non lues et le compteur depuis les endpoints API.
2. THE Notification_System SHALL configurer SWR avec un intervalle de
   revalidation de 30 secondes pour le compteur de notifications non lues, afin
   de détecter les nouvelles notifications sans rechargement de page.
3. WHEN une notification est marquée comme lue via le dropdown, THE
   Notification_System SHALL effectuer une mutation optimiste SWR pour mettre à
   jour immédiatement l'interface sans attendre la réponse serveur.
4. THE Notification_System SHALL créer un service client `NotificationService`
   dans `src/lib/services/notificationService.ts` pour centraliser les appels
   API vers les endpoints de notifications.
5. THE Post_Comment_System SHALL utiliser un hook SWR (`usePostComments`) pour
   récupérer les commentaires d'un post et gérer les mutations (ajout,
   suppression) avec revalidation automatique.
6. THE Post_Comment_System SHALL créer un service client `PostCommentService`
   dans `src/lib/services/postCommentService.ts` pour centraliser les appels API
   vers les endpoints de commentaires de posts.

### Exigence 9 : Migration de base de données

**User Story :** En tant que développeur, je veux que les changements de schéma
soient gérés via une migration Supabase, afin de maintenir la traçabilité et la
reproductibilité des modifications.

#### Critères d'acceptation

1. THE Notification_System SHALL fournir un fichier de migration SQL dans
   `supabase/migrations/` suivant la convention de nommage du projet
   (`YYYYMMDD00000N_description.sql`).
2. THE Notification_System SHALL inclure dans la migration : la création de la
   table `notifications`, la création de la table `post_comments`, les index,
   les politiques RLS, et les commentaires SQL documentant les colonnes.
3. THE Notification_System SHALL utiliser `IF NOT EXISTS` pour garantir
   l'idempotence de la migration.

### Exigence 10 : Accessibilité

**User Story :** En tant que joueur utilisant des technologies d'assistance, je
veux que le système de notifications et les commentaires de posts soient
accessibles, afin de pouvoir interagir de manière équivalente.

#### Critères d'acceptation

1. THE Notification_Bell SHALL posséder un attribut `aria-label` décrivant son
   rôle et le nombre de notifications non lues (ex : "Notifications, 3 non
   lues").
2. THE Notification_Dropdown SHALL être navigable au clavier
   (ouverture/fermeture avec Entrée/Échap, navigation entre notifications avec
   Tab).
3. THE Notification_Dropdown SHALL utiliser les rôles ARIA appropriés
   (`role="menu"`, `role="menuitem"`) pour les éléments de la liste.
4. WHEN le Notification_Dropdown s'ouvre, THE Notification_System SHALL déplacer
   le focus sur le premier élément de la liste.
5. THE Notification_System SHALL respecter la préférence
   `prefers-reduced-motion` en désactivant les animations du dropdown pour les
   utilisateurs qui le demandent.
6. THE Post_Comment_System SHALL rendre le formulaire de commentaire et la liste
   des commentaires accessibles au clavier et aux lecteurs d'écran.

### Exigence 11 : Intégration avec les systèmes existants

**User Story :** En tant que développeur, je veux que le système de
notifications s'intègre avec le système de commentaires de posts et le service
de discussions, afin de déclencher les notifications au bon moment.

#### Critères d'acceptation

1. WHEN un commentaire est créé via `POST /api/posts/:postId/comments`, THE
   Notification_System SHALL créer automatiquement une notification de type
   `post_comment` pour le propriétaire du post.
2. THE Notification_System SHALL s'intégrer avec le service de discussion
   existant (`DiscussionService`) pour déclencher les notifications de type
   `discussion_message` lors de l'envoi d'un message via
   `POST /api/discussions/:id/messages`.
