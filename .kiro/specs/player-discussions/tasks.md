# Implementation Plan: Player Discussions

## Overview

Implémentation incrémentale du module de messagerie privée entre joueurs amis.
Chaque tâche construit sur la précédente : schéma DB → types/validation → services → API routes → composants UI → intégration sidebar. Les tests property-based et unitaires sont intégrés au plus près de chaque étape.

## Tasks

- [x] 1. Migration base de données et schéma
  - [x] 1.1 Créer la migration Supabase pour les tables `conversations` et `messages`
    - Créer `supabase/migrations/20240314000001_player_discussions.sql`
    - Table `conversations` : id, participant_1, participant_2, created_at, updated_at
    - Contraintes : CHECK participant_1 < participant_2, UNIQUE(participant_1, participant_2), CHECK participant_1 != participant_2
    - Table `messages` : id, conversation_id, sender_id, content (1–2000 chars), created_at, read_at nullable
    - Index : idx_messages_conversation_created, idx_messages_conversation_read, idx_conversations_participant_1, idx_conversations_participant_2
    - Politiques RLS pour conversations (SELECT, INSERT, UPDATE) et messages (SELECT, INSERT, UPDATE read_at)
    - Trigger pour mettre à jour `updated_at` sur conversations lors d'un nouveau message
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 2. Types, validation et utilitaires
  - [x] 2.1 Créer les types TypeScript partagés
    - Créer `src/types/discussion.ts` avec Conversation, ConversationSummary, Message, et les types de requête/réponse API
    - _Requirements: 6.1, 6.2_

  - [x] 2.2 Créer les schémas de validation Zod
    - Créer `src/lib/validations/discussion.ts` avec sendMessageSchema et createConversationSchema
    - sendMessageSchema : contenu non vide, non whitespace-only, max 2000 caractères
    - createConversationSchema : friendId UUID valide
    - _Requirements: 4.4, 4.5, 4.6, 3.2_

  - [x] 2.3 Écrire les tests property-based pour la validation Zod
    - **Property 7 : Message validation rejects invalid content**
    - Créer `test/unit/lib/validations/discussion.property.test.ts`
    - Utiliser fast-check pour générer des chaînes vides, whitespace-only, > 2000 chars (rejet) et des chaînes valides 1–2000 chars non-whitespace (acceptation)
    - **Validates: Requirements 4.4, 4.5, 4.6**

  - [x] 2.4 Créer les fonctions utilitaires de discussion
    - Créer `src/lib/utils/discussion-utils.ts`
    - Fonction `truncatePreview(content: string, maxLength: number)` : tronque à 80 chars avec ellipsis
    - Fonction `sortConversationsByRecent(conversations: ConversationSummary[])` : tri décroissant par date dernier message
    - Fonction `formatMessageDate(dateString: string)` : date relative
    - Fonction `canonicalParticipants(a: string, b: string)` : retourne [min, max] pour l'ordre canonique
    - _Requirements: 2.1, 2.2, 6.3_

  - [x] 2.5 Écrire les tests property-based pour les utilitaires
    - Créer `test/unit/lib/utils/discussion-utils.property.test.ts`
    - **Property 2 : Conversations are sorted by most recent message**
    - **Property 3 : Last message preview is truncated at 80 characters**
    - **Property 8 : Messages are ordered chronologically**
    - **Property 11 : Canonical participant ordering**
    - **Validates: Requirements 2.1, 2.2, 4.2, 6.3**

- [x] 3. Checkpoint — Vérifier la base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Service serveur et API routes
  - [x] 4.1 Créer le service serveur Supabase
    - Créer `src/lib/services/discussionServerService.ts`
    - Fonctions : getConversations, createConversation, getMessages (pagination cursor-based), sendMessage, markAsRead, getUnreadCount
    - Vérification d'amitié acceptée avant création de conversation
    - Gestion de l'idempotence : retourner la conversation existante si elle existe déjà
    - Ordre canonique des participants pour les requêtes
    - _Requirements: 3.2, 3.3, 3.4, 4.1, 5.1, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 4.2 Écrire les tests unitaires pour le service serveur
    - Créer `test/unit/lib/services/discussionServerService.test.ts`
    - Tester : getConversations retourne les conversations triées, createConversation vérifie l'amitié, idempotence de création, markAsRead ne touche que les messages du destinataire, getUnreadCount
    - Mock Supabase client
    - **Validates: Properties 4, 5, 10, 12, 14, 15**
    - _Requirements: 3.2, 3.3, 5.1, 5.3, 6.4_

  - [x] 4.3 Créer les API routes discussions
    - Créer `src/app/api/discussions/route.ts` : GET (liste conversations) + POST (créer conversation)
    - Créer `src/app/api/discussions/unread-count/route.ts` : GET (compteur non lus)
    - Créer `src/app/api/discussions/[conversationId]/messages/route.ts` : GET (messages paginés) + POST (envoyer message)
    - Créer `src/app/api/discussions/[conversationId]/read/route.ts` : PATCH (marquer comme lus)
    - Vérification d'authentification sur toutes les routes (401 si non authentifié)
    - Validation Zod sur les entrées
    - Gestion d'erreurs avec codes HTTP appropriés (400, 401, 403, 404, 500)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 4.4 Écrire les tests unitaires pour les API routes
    - Créer `test/unit/api/discussions/route.test.ts`
    - Tester : authentification 401, validation des entrées, codes de retour corrects
    - **Property 13 : Unauthenticated API calls return 401**
    - _Requirements: 7.7_

- [x] 5. Service client et hooks
  - [x] 5.1 Créer le service client API
    - Créer `src/lib/services/discussionService.ts`
    - Fonctions fetch vers les API routes : fetchConversations, createConversation, fetchMessages, sendMessage, markAsRead, fetchUnreadCount
    - Gestion des erreurs réseau
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.2 Créer le hook useDiscussions
    - Créer `src/hooks/useDiscussions.ts`
    - État : conversations, selectedConversation, messages, isLoading, error
    - Actions : selectConversation, sendMessage, createConversation, loadMoreMessages
    - Appel automatique de markAsRead lors de la sélection d'une conversation
    - _Requirements: 2.1, 2.4, 3.3, 3.4, 4.1, 5.1_

  - [x] 5.3 Créer le hook useUnreadCount
    - Créer `src/hooks/useUnreadCount.ts`
    - Polling ou rafraîchissement à l'action pour le compteur global
    - Fallback à 0 en cas d'erreur (pattern existant usePendingRequestCount)
    - _Requirements: 1.4, 5.2_

  - [x] 5.4 Écrire les tests unitaires pour les hooks
    - Créer `test/unit/hooks/useDiscussions.test.ts` et `test/unit/hooks/useUnreadCount.test.ts`
    - Tester : chargement initial, gestion d'erreurs, appels API mockés, markAsRead automatique
    - _Requirements: 2.1, 5.1, 5.2_

- [x] 6. Checkpoint — Vérifier services et hooks
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Composants UI discussions
  - [x] 7.1 Créer le composant UnreadBadge
    - Créer `src/components/discussions/UnreadBadge.tsx`
    - Affiche le nombre exact si ≤ 99, "99+" si > 99, masqué si 0
    - Couleurs d'accent néon (violet/cyan), coins arrondis
    - _Requirements: 1.4, 1.5, 9.4_

  - [x] 7.2 Écrire le test property-based pour UnreadBadge
    - Créer `test/unit/components/discussions/UnreadBadge.property.test.ts`
    - **Property 1 : Unread badge displays correct count**
    - **Validates: Requirements 1.4, 1.5, 2.3**

  - [x] 7.3 Créer les composants MessageBubble et MessageInput
    - Créer `src/components/discussions/MessageBubble.tsx` : alignement droite (envoyé) / gauche (reçu), style glassmorphism
    - Créer `src/components/discussions/MessageInput.tsx` : champ de saisie .glass-input, validation locale (vide, > 2000 chars), bouton envoi
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 9.2, 9.5_

  - [x] 7.4 Écrire les tests unitaires pour MessageBubble et MessageInput
    - Créer `test/unit/components/discussions/MessageBubble.test.tsx` et `test/unit/components/discussions/MessageInput.test.tsx`
    - Tester : alignement selon senderId (Property 9), blocage envoi message vide, affichage erreur > 2000 chars
    - **Property 9 : Message alignment depends on sender**
    - _Requirements: 4.3, 4.4, 4.6_

  - [x] 7.5 Créer les composants ConversationItem et ConversationList
    - Créer `src/components/discussions/ConversationItem.tsx` : avatar, nom, aperçu tronqué (80 chars), date relative, badge non lus
    - Créer `src/components/discussions/ConversationList.tsx` : liste triée, bouton nouvelle conversation, état vide
    - Style .glass-card, dark mode, transitions fluides
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 9.1, 9.3, 9.5_

  - [x] 7.6 Créer les composants MessageThread et EmptyConversationState
    - Créer `src/components/discussions/MessageThread.tsx` : affichage chronologique des messages, scroll infini (load more), style .glass-card
    - Créer `src/components/discussions/EmptyConversationState.tsx` : message invitant à démarrer une conversation
    - _Requirements: 2.5, 4.2, 9.1, 9.3_

  - [x] 7.7 Créer le composant NewConversationDialog
    - Créer `src/components/discussions/NewConversationDialog.tsx` : modal de recherche d'amis, filtrage par nom en temps réel
    - Créer `src/components/discussions/FriendSearchItem.tsx` : ligne d'un ami dans la recherche
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 7.8 Écrire les tests unitaires pour ConversationList et MessageThread
    - Créer `test/unit/components/discussions/ConversationList.test.tsx` et `test/unit/components/discussions/MessageThread.test.tsx`
    - Tester : rendu de la liste, état vide, sélection de conversation, affichage des messages
    - _Requirements: 2.1, 2.5, 4.2_

- [x] 8. Page principale et intégration
  - [x] 8.1 Créer la page discussions et le composant orchestrateur
    - Créer `src/app/[locale]/discussions/page.tsx` : page serveur, délègue au composant
    - Créer `src/components/discussions/DiscussionsPage.tsx` : layout split (ConversationList à gauche, MessageThread à droite), utilise useDiscussions
    - Style glassmorphism, responsive, dark mode
    - _Requirements: 2.4, 9.1, 9.3, 9.5_

  - [x] 8.2 Intégrer le lien Discussions dans la sidebar
    - Modifier `src/lib/utils/navigation-utils.ts` : ajouter le lien "Discussions" dans NAV_LINKS (section "Mon espace") avec icône MessageSquare
    - Modifier `src/components/layout/dashboard/SidebarNav.tsx` : intégrer le composant UnreadBadge à côté du lien Discussions, utiliser useUnreadCount
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 8.3 Ajouter les traductions i18n
    - Ajouter le namespace `discussions` dans `src/messages/fr.json` : titre page, placeholder saisie, état vide, labels boutons, messages d'erreur, texte badge
    - Ajouter le namespace `discussions` dans `src/messages/en.json` : traductions anglaises correspondantes
    - Sidebar : "Discussions" (fr) / "Messages" (en)
    - _Requirements: 1.3, 8.1, 8.2, 8.3_

- [x] 9. Checkpoint final — Vérification complète
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Lint du code
  - [x] 10.1 Exécuter `bun run lint`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 10.3 Corriger les erreurs et warnings de lint si nécessaire

- [ ] 11. Build de production
  - [x] 11.1 Exécuter `bun run build`
  - [x] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 11.3 Corriger les erreurs de build si nécessaire

- [ ] 12. README de la fonctionnalité
  - [x] 12.1 Créer `docs/README_player-discussions.md`
  - [x] 12.2 Documenter : description, accès (route /discussions, sidebar), prérequis (amitié acceptée), utilisation (conversations, envoi de messages, badge non lus)

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les tests property-based utilisent fast-check avec Vitest (fichiers `*.property.test.ts`)
- Tous les tests sont dans `test/` (pas de `__tests__/` dans `src/`)
- Les checkpoints permettent de valider l'avancement incrémental
- Le polling/rafraîchissement remplace le temps réel (WebSocket) dans cette itération
