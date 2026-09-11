# Requirements Document

## Introduction

Système de discussions (messagerie) entre joueurs. Les joueurs authentifiés
peuvent envoyer des messages privés à leurs amis confirmés, consulter l'ensemble
de leurs conversations et être notifiés des messages non lus via un badge dans
la sidebar.

## Glossaire

- **Discussion_System** : Module de messagerie privée entre joueurs
- **Conversation** : Fil de messages entre deux joueurs amis
- **Message** : Unité de texte envoyée par un joueur dans une conversation
- **Sidebar** : Barre de navigation latérale du dashboard (`SidebarNav`)
- **Unread_Badge** : Indicateur visuel affichant le nombre de messages non lus
- **Friend** : Joueur ayant un statut d'amitié `accepted` avec le joueur courant
- **Conversation_List** : Vue affichant toutes les conversations du joueur
  courant
- **Message_Thread** : Vue affichant les messages d'une conversation
  sélectionnée

## Requirements

### Requirement 1 : Accès aux discussions via la sidebar

**User Story :** En tant que joueur authentifié, je veux accéder à mes
discussions depuis la sidebar, afin de pouvoir consulter mes conversations
rapidement.

#### Acceptance Criteria

1. WHILE le joueur est authentifié, THE Sidebar SHALL afficher un lien
   "Discussions" dans la section "Mon espace" avec une icône dédiée
2. WHEN le joueur clique sur le lien "Discussions", THE Discussion_System SHALL
   naviguer vers la page `/discussions`
3. THE Sidebar SHALL afficher le lien "Discussions" en français ("Discussions")
   et en anglais ("Messages") selon la locale active
4. WHILE le joueur a des messages non lus, THE Unread_Badge SHALL afficher le
   nombre total de messages non lus à côté du lien "Discussions" dans la Sidebar
5. WHEN le nombre de messages non lus dépasse 99, THE Unread_Badge SHALL
   afficher "99+"

### Requirement 2 : Liste des conversations

**User Story :** En tant que joueur authentifié, je veux voir toutes mes
conversations, afin de pouvoir choisir avec quel ami discuter.

#### Acceptance Criteria

1. WHEN le joueur accède à la page des discussions, THE Conversation_List SHALL
   afficher toutes les conversations du joueur triées par date du dernier
   message (la plus récente en premier)
2. THE Conversation_List SHALL afficher pour chaque conversation : l'avatar de
   l'ami, le nom d'affichage de l'ami, un aperçu du dernier message (tronqué à
   80 caractères) et la date relative du dernier message
3. WHILE une conversation contient des messages non lus, THE Conversation_List
   SHALL afficher un Unread_Badge avec le nombre de messages non lus sur cette
   conversation
4. WHEN le joueur sélectionne une conversation, THE Discussion_System SHALL
   afficher le Message_Thread correspondant
5. WHEN le joueur n'a aucune conversation, THE Conversation_List SHALL afficher
   un message invitant le joueur à démarrer une conversation avec un ami

### Requirement 3 : Démarrer une nouvelle conversation

**User Story :** En tant que joueur authentifié, je veux démarrer une
conversation avec un ami, afin de pouvoir communiquer avec les joueurs de ma
liste d'amis.

#### Acceptance Criteria

1. WHEN le joueur clique sur le bouton "Nouvelle conversation", THE
   Discussion_System SHALL afficher une liste de recherche parmi les amis
   confirmés du joueur
2. THE Discussion_System SHALL limiter la création de conversations aux joueurs
   ayant un statut d'amitié `accepted` avec le joueur courant
3. WHEN le joueur sélectionne un ami avec lequel une conversation existe déjà,
   THE Discussion_System SHALL ouvrir la conversation existante au lieu d'en
   créer une nouvelle
4. WHEN le joueur sélectionne un ami sans conversation existante, THE
   Discussion_System SHALL créer une nouvelle conversation et afficher le
   Message_Thread vide
5. WHEN le joueur recherche un ami, THE Discussion_System SHALL filtrer la liste
   des amis par nom d'affichage en temps réel

### Requirement 4 : Envoi et affichage des messages

**User Story :** En tant que joueur authentifié, je veux envoyer et lire des
messages dans une conversation, afin de communiquer avec mon ami.

#### Acceptance Criteria

1. WHEN le joueur envoie un message, THE Discussion_System SHALL enregistrer le
   message avec le contenu texte, l'identifiant de l'expéditeur, l'identifiant
   de la conversation et l'horodatage
2. THE Message_Thread SHALL afficher les messages dans l'ordre chronologique (du
   plus ancien au plus récent)
3. THE Message_Thread SHALL distinguer visuellement les messages envoyés par le
   joueur courant (alignés à droite) des messages reçus (alignés à gauche)
4. WHEN le joueur envoie un message vide ou composé uniquement d'espaces, THE
   Discussion_System SHALL empêcher l'envoi et conserver le focus sur le champ
   de saisie
5. THE Discussion_System SHALL limiter la longueur d'un message à 2000
   caractères
6. IF le joueur tente d'envoyer un message dépassant 2000 caractères, THEN THE
   Discussion_System SHALL afficher un message d'erreur indiquant la limite

### Requirement 5 : Marquage des messages comme lus

**User Story :** En tant que joueur authentifié, je veux que mes messages soient
marqués comme lus automatiquement, afin que le badge de messages non lus reflète
correctement mon activité.

#### Acceptance Criteria

1. WHEN le joueur ouvre une conversation contenant des messages non lus, THE
   Discussion_System SHALL marquer tous les messages non lus de cette
   conversation comme lus
2. WHEN les messages d'une conversation sont marqués comme lus, THE Unread_Badge
   SHALL mettre à jour le compteur de messages non lus dans la Conversation_List
   et dans la Sidebar
3. THE Discussion_System SHALL ne marquer comme lus que les messages dont le
   joueur courant est le destinataire

### Requirement 6 : Stockage des données

**User Story :** En tant que développeur, je veux un schéma de base de données
robuste pour les discussions, afin de garantir l'intégrité et la performance des
données.

#### Acceptance Criteria

1. THE Discussion_System SHALL stocker les conversations dans une table
   `conversations` avec les colonnes : `id` (UUID), `participant_1` (UUID, FK
   vers profiles), `participant_2` (UUID, FK vers profiles), `created_at`
   (timestamptz), `updated_at` (timestamptz)
2. THE Discussion_System SHALL stocker les messages dans une table `messages`
   avec les colonnes : `id` (UUID), `conversation_id` (UUID, FK vers
   conversations), `sender_id` (UUID, FK vers profiles), `content` (text),
   `created_at` (timestamptz), `read_at` (timestamptz nullable)
3. THE Discussion_System SHALL appliquer une contrainte d'unicité sur la paire
   (`participant_1`, `participant_2`) dans la table `conversations` en imposant
   `participant_1 < participant_2`
4. THE Discussion_System SHALL appliquer des politiques RLS (Row Level Security)
   garantissant qu'un joueur accède uniquement aux conversations et messages
   auxquels le joueur participe
5. THE Discussion_System SHALL créer un index sur
   `messages(conversation_id, created_at)` pour optimiser le chargement des
   messages par conversation
6. THE Discussion_System SHALL créer un index sur
   `messages(conversation_id, read_at)` pour optimiser le comptage des messages
   non lus

### Requirement 7 : API Routes

**User Story :** En tant que développeur, je veux des routes API dédiées aux
discussions, afin de séparer la logique métier de l'interface utilisateur.

#### Acceptance Criteria

1. THE Discussion_System SHALL exposer une route `GET /api/discussions`
   retournant la liste des conversations du joueur authentifié avec le dernier
   message et le compteur de messages non lus
2. THE Discussion_System SHALL exposer une route `POST /api/discussions`
   permettant de créer une nouvelle conversation avec un ami confirmé
3. THE Discussion_System SHALL exposer une route
   `GET /api/discussions/[conversationId]/messages` retournant les messages
   d'une conversation avec pagination
4. THE Discussion_System SHALL exposer une route
   `POST /api/discussions/[conversationId]/messages` permettant d'envoyer un
   message dans une conversation
5. THE Discussion_System SHALL exposer une route
   `PATCH /api/discussions/[conversationId]/read` permettant de marquer les
   messages non lus comme lus
6. THE Discussion_System SHALL exposer une route
   `GET /api/discussions/unread-count` retournant le nombre total de messages
   non lus pour le joueur authentifié
7. IF un joueur non authentifié appelle une route de l'API discussions, THEN THE
   Discussion_System SHALL retourner une erreur 401

### Requirement 8 : Traductions i18n

**User Story :** En tant que joueur, je veux que l'interface des discussions
soit disponible en français et en anglais, afin de naviguer dans ma langue
préférée.

#### Acceptance Criteria

1. THE Discussion_System SHALL fournir toutes les chaînes de texte visibles dans
   les fichiers de traduction `fr.json` et `en.json` sous le namespace
   `discussions`
2. THE Discussion_System SHALL utiliser `useTranslations("discussions")` pour
   les composants client et `getTranslations("discussions")` pour les composants
   serveur
3. THE Discussion_System SHALL traduire les éléments suivants : titre de la
   page, placeholder du champ de saisie, message d'état vide, labels des
   boutons, messages d'erreur, texte du badge non lu

### Requirement 9 : Design glassmorphism

**User Story :** En tant que joueur, je veux que la page des discussions
respecte le style visuel du site, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. THE Discussion_System SHALL utiliser les classes `.glass-card` pour les
   conteneurs de la liste de conversations et du fil de messages
2. THE Discussion_System SHALL utiliser la classe `.glass-input` pour le champ
   de saisie des messages
3. THE Discussion_System SHALL supporter le dark mode via les préfixes Tailwind
   `dark:`
4. THE Discussion_System SHALL utiliser les couleurs d'accent néon (violet/cyan)
   pour les éléments interactifs et le badge de messages non lus
5. THE Discussion_System SHALL appliquer des coins arrondis (`rounded-xl` ou
   `rounded-2xl`) et des transitions fluides (`transition-all duration-300`) sur
   les éléments interactifs
