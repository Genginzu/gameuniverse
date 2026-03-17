# Player Discussions

## Description

Messagerie privée entre joueurs amis dans Game Universe. Un joueur authentifié
peut envoyer des messages privés à ses amis confirmés, consulter ses
conversations et être notifié des messages non lus via un badge dans la sidebar.

Le système inclut :

- **Conversations** : liste triée par dernier message, aperçu tronqué, badge non
  lus par conversation
- **Messages** : envoi de messages texte (1–2000 caractères), affichage
  chronologique avec bulles envoyé/reçu
- **Nouvelle conversation** : recherche d'amis confirmés, création idempotente
  (pas de doublon)
- **Badge non lus** : compteur global dans la sidebar (affiche "99+" au-delà
  de 99)
- **Marquage automatique** : les messages sont marqués comme lus à l'ouverture
  de la conversation
- **i18n** : traductions complètes français et anglais

> **Note** : pas de temps réel (WebSocket) dans cette itération. Le
> rafraîchissement se fait par action utilisateur.

## Accès

### Navigation

1. Cliquer sur **"Discussions"** (fr) / **"Messages"** (en) dans la section "Mon
   espace" de la sidebar
2. La page s'ouvre sur `/{locale}/discussions`
3. Layout split : liste des conversations à gauche, fil de messages à droite
4. Le badge non lus apparaît à côté du lien sidebar quand il y a des messages
   non lus

### API Endpoints

| Méthode | Route                            | Auth | Description                         |
| ------- | -------------------------------- | ---- | ----------------------------------- |
| GET     | `/api/discussions`               | Oui  | Liste des conversations             |
| POST    | `/api/discussions`               | Oui  | Créer une conversation avec un ami  |
| GET     | `/api/discussions/[id]/messages` | Oui  | Messages paginés (cursor-based)     |
| POST    | `/api/discussions/[id]/messages` | Oui  | Envoyer un message                  |
| PATCH   | `/api/discussions/[id]/read`     | Oui  | Marquer les messages comme lus      |
| GET     | `/api/discussions/unread-count`  | Oui  | Compteur global de messages non lus |

Toutes les routes requièrent une authentification (401 si non authentifié).

## Prérequis

1. **Migration base de données** : la migration
   `supabase/migrations/20240314000001_player_discussions.sql` doit être
   appliquée. Elle crée les tables `conversations` et `messages` avec
   contraintes (unicité ordonnée, pas d'auto-conversation), index et politiques
   RLS.

2. **Amitié acceptée** : seuls les joueurs ayant un statut d'amitié `accepted`
   peuvent échanger des messages. Le système d'amis (`friendships` table) doit
   être en place.

3. **Authentification** : les joueurs doivent être authentifiés via Supabase
   Auth pour accéder aux discussions.

4. **Clés i18n** : les traductions doivent être présentes dans
   `src/messages/fr.json` et `src/messages/en.json` sous le namespace
   `discussions`.

## Utilisation

### Démarrer une conversation

Cliquer sur le bouton "Nouvelle conversation" dans la liste des conversations.
Une modale affiche les amis confirmés avec recherche par nom. Sélectionner un
ami ouvre la conversation existante ou en crée une nouvelle.

### Envoyer un message

Taper le message dans le champ de saisie en bas du fil de messages et cliquer
sur le bouton d'envoi (ou Entrée). Le message doit contenir entre 1 et 2000
caractères (les messages vides ou composés uniquement d'espaces sont bloqués).

### Messages non lus

Les messages non lus sont automatiquement marqués comme lus à l'ouverture de la
conversation. Le badge dans la sidebar et dans la liste des conversations se met
à jour en conséquence.

### Historique des messages

Les messages sont affichés chronologiquement (plus ancien en haut). Le scroll
infini permet de charger les messages plus anciens via pagination cursor-based.

## Architecture

### Services

| Fichier                                       | Rôle                                |
| --------------------------------------------- | ----------------------------------- |
| `src/lib/services/discussionServerService.ts` | Service serveur (requêtes Supabase) |
| `src/lib/services/discussionService.ts`       | Service client (fetch API)          |

### Types et validation

| Fichier                             | Contenu                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `src/types/discussion.ts`           | `Conversation`, `ConversationSummary`, `Message`, types API   |
| `src/lib/validations/discussion.ts` | Schémas Zod (`sendMessageSchema`, `createConversationSchema`) |

### Hooks

| Fichier                       | Rôle                                      |
| ----------------------------- | ----------------------------------------- |
| `src/hooks/useDiscussions.ts` | État conversations + messages + mutations |
| `src/hooks/useUnreadCount.ts` | Compteur global non lus pour la sidebar   |

### Composants

| Composant                | Fichier                                                 | Rôle                                     |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------- |
| `DiscussionsPage`        | `src/components/discussions/DiscussionsPage.tsx`        | Orchestrateur layout split               |
| `ConversationList`       | `src/components/discussions/ConversationList.tsx`       | Liste des conversations (panneau gauche) |
| `ConversationItem`       | `src/components/discussions/ConversationItem.tsx`       | Ligne d'une conversation                 |
| `MessageThread`          | `src/components/discussions/MessageThread.tsx`          | Fil de messages (panneau droit)          |
| `MessageBubble`          | `src/components/discussions/MessageBubble.tsx`          | Bulle message (envoyé/reçu)              |
| `MessageInput`           | `src/components/discussions/MessageInput.tsx`           | Champ de saisie + bouton envoi           |
| `NewConversationDialog`  | `src/components/discussions/NewConversationDialog.tsx`  | Modale sélection d'ami                   |
| `FriendSearchItem`       | `src/components/discussions/FriendSearchItem.tsx`       | Ligne d'un ami dans la recherche         |
| `EmptyConversationState` | `src/components/discussions/EmptyConversationState.tsx` | État vide (aucune conversation)          |
| `UnreadBadge`            | `src/components/discussions/UnreadBadge.tsx`            | Badge compteur non lus                   |

### API Routes

| Fichier                                                      | Endpoint                                   |
| ------------------------------------------------------------ | ------------------------------------------ |
| `src/app/api/discussions/route.ts`                           | GET + POST `/api/discussions`              |
| `src/app/api/discussions/unread-count/route.ts`              | GET `/api/discussions/unread-count`        |
| `src/app/api/discussions/[conversationId]/messages/route.ts` | GET + POST `/api/discussions/:id/messages` |
| `src/app/api/discussions/[conversationId]/read/route.ts`     | PATCH `/api/discussions/:id/read`          |

### Utilitaires

| Fichier                             | Contenu                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/lib/utils/discussion-utils.ts` | `truncatePreview`, `sortConversationsByRecent`, `formatMessageDate`, `canonicalParticipants` |

## Tests

| Fichier                                                         | Type           | Contenu                                                                  |
| --------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------ |
| `test/unit/lib/validations/discussion.property.test.ts`         | Property-based | Validation Zod messages (Property 7)                                     |
| `test/unit/lib/utils/discussion-utils.property.test.ts`         | Property-based | Tri, troncature, ordre chronologique, canonique (Properties 2, 3, 8, 11) |
| `test/unit/components/discussions/UnreadBadge.property.test.ts` | Property-based | Affichage badge non lus (Property 1)                                     |
| `test/unit/lib/services/discussionServerService.test.ts`        | Unit           | Service serveur (Properties 4, 5, 10, 12, 14, 15)                        |
| `test/unit/api/discussions/route.test.ts`                       | Unit           | API routes, auth 401 (Property 13)                                       |
| `test/unit/hooks/useDiscussions.test.ts`                        | Unit           | Hook discussions (chargement, erreurs)                                   |
| `test/unit/hooks/useUnreadCount.test.ts`                        | Unit           | Hook compteur non lus                                                    |
| `test/unit/components/discussions/MessageBubble.test.tsx`       | Unit           | Alignement messages (Property 9)                                         |
| `test/unit/components/discussions/MessageInput.test.tsx`        | Unit           | Validation saisie, blocage envoi vide                                    |
| `test/unit/components/discussions/ConversationList.test.tsx`    | Unit           | Rendu liste, état vide, sélection                                        |
| `test/unit/components/discussions/MessageThread.test.tsx`       | Unit           | Affichage messages, scroll                                               |

```bash
# Lancer tous les tests
bun run test:all

# Tests property-based discussions
bunx vitest run test/unit/lib/validations/discussion.property.test.ts
bunx vitest run test/unit/lib/utils/discussion-utils.property.test.ts
bunx vitest run test/unit/components/discussions/UnreadBadge.property.test.ts

# Tests unitaires discussions
bunx vitest run test/unit/lib/services/discussionServerService.test.ts
bunx vitest run test/unit/api/discussions/route.test.ts
```
