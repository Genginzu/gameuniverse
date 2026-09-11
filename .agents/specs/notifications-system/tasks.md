# Plan d'implémentation : Système de Notifications

## Vue d'ensemble

Implémentation du système de commentaires sur les posts de joueurs et du système de notifications en temps réel. L'approche est incrémentale : d'abord la couche données (migration, types), puis les services serveur, les routes API, les services client, les hooks SWR, et enfin les composants UI avec intégration dans les headers existants.

## Tâches

- [ ] 1. Migration de base de données et types TypeScript
  - [x] 1.1 Créer le fichier de migration SQL `supabase/migrations/20260413000001_notifications_and_post_comments.sql`
    - Créer la table `post_comments` avec les champs `id`, `post_id`, `player_id`, `content` (CHECK 1-500), `created_at`, `updated_at`
    - Créer la table `notifications` avec les champs `id`, `recipient_id`, `sender_id`, `type` (CHECK post_comment/discussion_message), `reference_id`, `content_preview`, `is_read`, `created_at`
    - Ajouter les index : `idx_post_comments_post_id`, `idx_notifications_recipient_unread` (partiel WHERE is_read = false)
    - Appliquer les politiques RLS sur les deux tables
    - Ajouter les `COMMENT ON` pour documenter les colonnes
    - Utiliser `IF NOT EXISTS` pour l'idempotence
    - _Exigences : 1.1, 1.2, 1.3, 1.12, 2.1, 2.2, 2.3, 9.1, 9.2, 9.3_

  - [x] 1.2 Créer les types TypeScript `src/types/notification.ts` et `src/types/post-comment.ts`
    - Définir `NotificationType`, `Notification`, `NotificationsResponse`, `NotificationCountResponse`
    - Définir `PostComment`, `PostCommentsResponse`
    - Suivre les interfaces définies dans le design document
    - _Exigences : 2.1, 1.1_

- [ ] 2. Services serveur
  - [x] 2.1 Implémenter `src/lib/services/notificationServerService.ts`
    - Méthode `create(recipientId, senderId, type, referenceId, contentPreview)` — créer une notification avec `content_preview` tronqué à 100 caractères, ne pas créer si `recipientId === senderId`
    - Méthode `getUnread(recipientId, limit?)` — notifications non lues triées par `created_at` DESC, avec infos sender (username, avatar_url)
    - Méthode `getUnreadCount(recipientId)` — compteur de notifications non lues
    - Méthode `markAsRead(notificationId, recipientId)` — marquer une notification comme lue, vérifier ownership
    - Méthode `markAllAsRead(recipientId)` — marquer toutes les notifications non lues comme lues
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 2.2 Écrire le test property-based pour la validation du contenu des commentaires
    - **Propriété 1 : Validation du contenu des commentaires**
    - Vérifier que la création réussit ssi la longueur est entre 1 et 500 caractères (après trim)
    - **Valide : Exigences 1.9**

  - [x] 2.3 Implémenter `src/lib/services/postCommentServerService.ts`
    - Méthode `getComments(postId)` — commentaires triés par `created_at` ASC, avec infos joueur (username, avatar_url), retourner aussi `totalCount`
    - Méthode `createComment(postId, playerId, content)` — valider contenu 1-500 chars, créer le commentaire, déclencher notification via `NotificationServerService.create()` (sauf auto-notification)
    - Méthode `deleteComment(commentId, playerId, postOwnerId)` — supprimer si auteur du commentaire ou propriétaire du post, sinon erreur 403
    - _Exigences : 1.4, 1.5, 1.6, 1.8, 1.9, 3.1, 3.3, 11.1_

  - [x] 2.4 Écrire le test property-based pour la création de notification sur commentaire
    - **Propriété 4 : Création de notification sur commentaire de post**
    - Vérifier que la notification est créée avec les bons champs et que l'auto-notification est bloquée
    - **Valide : Exigences 3.1, 3.3, 3.4**

  - [x] 2.5 Écrire le test property-based pour la création de notification sur message de discussion
    - **Propriété 5 : Création de notification sur message de discussion**
    - Vérifier que la notification est créée avec `content_preview` tronqué à 100 caractères
    - **Valide : Exigences 3.2, 3.4**

- [x] 3. Checkpoint — Vérifier les services serveur
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Routes API
  - [x] 4.1 Créer la route `src/app/api/notifications/route.ts` (GET)
    - Retourner les notifications non lues du joueur authentifié, triées par `created_at` DESC, limite configurable (défaut 20)
    - Retourner 401 si non authentifié
    - _Exigences : 4.1, 4.5_

  - [x] 4.2 Créer la route `src/app/api/notifications/count/route.ts` (GET)
    - Retourner le compteur de notifications non lues
    - Retourner 401 si non authentifié
    - _Exigences : 4.2, 4.5_

  - [x] 4.3 Créer la route `src/app/api/notifications/[id]/read/route.ts` (PATCH)
    - Marquer la notification comme lue, vérifier ownership (403 si autre joueur)
    - Retourner 401 si non authentifié, 404 si notification introuvable
    - _Exigences : 4.3, 4.5, 4.6_

  - [x] 4.4 Créer la route `src/app/api/notifications/read-all/route.ts` (PATCH)
    - Marquer toutes les notifications non lues du joueur comme lues
    - Retourner 401 si non authentifié
    - _Exigences : 4.4, 4.5_

  - [x] 4.5 Créer la route `src/app/api/posts/[postId]/comments/route.ts` (GET + POST)
    - GET : retourner les commentaires du post triés par `created_at` ASC avec infos joueur
    - POST : créer un commentaire + déclencher notification (sauf auto-notification)
    - Retourner 401 si non authentifié, 400 si contenu invalide, 404 si post introuvable
    - _Exigences : 1.4, 1.5, 1.7, 1.9, 3.1, 3.3, 11.1_

  - [x] 4.6 Créer la route `src/app/api/posts/[postId]/comments/[commentId]/route.ts` (DELETE)
    - Supprimer le commentaire si auteur ou propriétaire du post
    - Retourner 401 si non authentifié, 403 si non autorisé
    - _Exigences : 1.6, 1.7, 1.8_

  - [x] 4.7 Écrire les tests property-based pour les routes API notifications
    - **Propriété 6 : Notifications triées par date décroissante avec limite**
    - **Propriété 7 : Compteur de notifications non lues**
    - **Propriété 8 : Transition d'état — marquer comme lue**
    - **Propriété 9 : Transition d'état — marquer toutes comme lues**
    - **Valide : Exigences 4.1, 4.2, 4.3, 4.4, 6.1**

  - [x] 4.8 Écrire les tests property-based pour les routes API commentaires
    - **Propriété 2 : Tri des commentaires par date croissante**
    - **Propriété 3 : Autorisation de suppression de commentaire**
    - **Valide : Exigences 1.4, 1.6, 1.8**

  - [x] 4.9 Écrire les tests unitaires pour les routes API
    - Tester les cas 401 non authentifié, 404 post/notification introuvable, 403 accès interdit
    - Tester la création et suppression de commentaires
    - Tester la récupération et le marquage des notifications
    - _Exigences : 1.7, 1.8, 4.5, 4.6_

- [x] 5. Checkpoint — Vérifier les routes API
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Intégration avec le système de discussions existant
  - [x] 6.1 Modifier la route `POST /api/discussions/:id/messages` pour déclencher une notification `discussion_message`
    - Après l'envoi du message, appeler `NotificationServerService.create()` avec le destinataire de la conversation
    - L'erreur de notification ne doit pas bloquer l'envoi du message (try/catch + log)
    - _Exigences : 3.2, 11.2_

- [ ] 7. Services client et hooks SWR
  - [x] 7.1 Créer le service client `src/lib/services/notificationService.ts`
    - Méthodes statiques : `fetchNotifications(limit?)`, `fetchUnreadCount()`, `markAsRead(id)`, `markAllAsRead()`
    - Suivre le pattern de `DiscussionService` et `PlayerPostsService`
    - _Exigences : 8.4_

  - [x] 7.2 Créer le service client `src/lib/services/postCommentService.ts`
    - Méthodes statiques : `fetchComments(postId)`, `createComment(postId, content)`, `deleteComment(postId, commentId)`
    - _Exigences : 8.6_

  - [x] 7.3 Créer le hook `src/hooks/useNotifications.ts`
    - Utiliser SWR pour récupérer les notifications non lues et le compteur
    - Configurer un intervalle de revalidation de 30 secondes pour le compteur
    - Implémenter les mutations optimistes pour `markAsRead` et `markAllAsRead`
    - Exposer l'interface `UseNotificationsReturn` définie dans le design
    - _Exigences : 8.1, 8.2, 8.3_

  - [x] 7.4 Créer le hook `src/hooks/usePostComments.ts`
    - Utiliser SWR pour récupérer les commentaires d'un post
    - Implémenter `addComment` et `deleteComment` avec revalidation automatique
    - Exposer l'interface `UsePostCommentsReturn` définie dans le design
    - _Exigences : 8.5_

  - [x] 7.5 Écrire les tests unitaires pour les services client
    - Tester les appels API corrects de `NotificationService` et `PostCommentService`
    - _Exigences : 8.4, 8.6_

  - [x] 7.6 Écrire les tests unitaires pour les hooks
    - Tester le chargement, la revalidation 30s, les mutations optimistes de `useNotifications`
    - Tester le chargement, l'ajout et la suppression de `usePostComments`
    - _Exigences : 8.1, 8.2, 8.3, 8.5_

- [x] 8. Checkpoint — Vérifier les services client et hooks
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Composants UI — Commentaires de posts
  - [x] 9.1 Créer `src/components/players/PostCommentItem.tsx`
    - Afficher le commentaire avec avatar, username, contenu, date relative
    - Bouton de suppression visible pour l'auteur du commentaire ou le propriétaire du post
    - Accessible au clavier et aux lecteurs d'écran
    - _Exigences : 1.10, 10.6_

  - [x] 9.2 Créer `src/components/players/PostCommentForm.tsx`
    - Formulaire avec textarea (max 500 caractères), bouton d'envoi
    - Validation côté client avant soumission
    - Accessible au clavier, `text-base` pour éviter le zoom iOS
    - _Exigences : 1.9, 1.10, 10.6_

  - [x] 9.3 Créer `src/components/players/PostCommentSection.tsx`
    - Intégrer `PostCommentForm` et la liste de `PostCommentItem`
    - Afficher le nombre de commentaires à côté du post
    - Utiliser le hook `usePostComments`
    - _Exigences : 1.10, 1.11_

  - [x] 9.4 Écrire le test property-based pour le compteur de commentaires
    - **Propriété 12 : Compteur de commentaires affiché**
    - Vérifier que le nombre affiché correspond exactement au nombre total de commentaires
    - **Valide : Exigences 1.11**

  - [x] 9.5 Écrire les tests unitaires pour les composants de commentaires
    - Tester l'affichage des commentaires, le formulaire, l'accessibilité
    - _Exigences : 1.10, 10.6_

- [ ] 10. Composants UI — Notifications
  - [x] 10.1 Créer `src/components/shared/NotificationItem.tsx`
    - Afficher le nom du joueur émetteur, icône distincte par type, `content_preview`, date relative
    - Bouton de fermeture (icône croix) pour marquer comme lue
    - Style glassmorphism, `role="menuitem"`
    - _Exigences : 6.3, 6.4, 10.3_

  - [x] 10.2 Créer `src/components/shared/NotificationDropdown.tsx`
    - Afficher les 5 dernières notifications non lues triées par date décroissante
    - Style `glass-dropdown`, largeur ~360px desktop, responsive plein écran mobile
    - Message "Aucune notification" si vide
    - Fermeture au clic extérieur et avec Échap
    - Navigation clavier (Tab entre items), `role="menu"`, focus sur le premier élément à l'ouverture
    - Quand une notification est retirée, faire apparaître la suivante en file d'attente
    - Respecter `prefers-reduced-motion`
    - _Exigences : 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 10.2, 10.3, 10.4, 10.5_

  - [x] 10.3 Créer `src/components/shared/NotificationBell.tsx`
    - Icône cloche Iconify (`mdi:bell-outline`), zone cliquable min 44x44px
    - Badge compteur : pas de badge si 0, nombre exact si 1-9, "9+" si > 9
    - `aria-label` dynamique avec le nombre exact de notifications non lues
    - Toggle du `NotificationDropdown` au clic
    - Visible uniquement si authentifié
    - Style glassmorphism cohérent avec le header
    - _Exigences : 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.1_

  - [x] 10.4 Écrire le test property-based pour le badge et aria-label
    - **Propriété 10 : Affichage du badge et aria-label**
    - Vérifier les règles d'affichage du badge (0, 1-9, 9+) et l'aria-label avec le nombre exact
    - **Valide : Exigences 5.2, 5.3, 5.4, 10.1**

  - [x] 10.5 Écrire le test property-based pour l'affichage des éléments de notification
    - **Propriété 11 : Affichage complet des éléments de notification**
    - Vérifier que chaque notification contient le nom, l'icône par type, le content_preview et la date relative
    - **Valide : Exigences 6.3**

  - [x] 10.6 Écrire les tests unitaires pour les composants de notifications
    - Tester la visibilité auth/non-auth de `NotificationBell`, le clic ouvre le dropdown
    - Tester l'état vide, la fermeture clic extérieur, la navigation clavier, les rôles ARIA du dropdown
    - _Exigences : 5.1, 5.5, 6.6, 6.7, 10.2, 10.3_

- [ ] 11. Intégration dans les headers et traductions i18n
  - [x] 11.1 Intégrer `NotificationBell` dans `TopBar.tsx` et `LandingHeader.tsx`
    - Positionner à gauche du `LanguageSwitcher`, conditionné à l'authentification
    - _Exigences : 5.1, 5.5_

  - [x] 11.2 Ajouter les traductions FR et EN dans `src/messages/fr.json` et `src/messages/en.json`
    - Namespace `notifications` : libellés, messages vides, types ("a commenté votre post" / "commented on your post", "vous a envoyé un message" / "sent you a message"), dates relatives
    - Namespace `postComments` : libellés, placeholder formulaire, messages vides, boutons
    - _Exigences : 7.1, 7.2, 7.3, 7.4_

  - [x] 11.3 Écrire le test unitaire pour la synchronisation des clés i18n
    - Vérifier que toutes les clés `notifications` et `postComments` existent dans les deux fichiers FR et EN
    - _Exigences : 7.1, 7.4_

- [ ] 12. Exécution des tests complets
  - [x] 12.1 Exécuter `bun run test:all`
  - [x] 12.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 12.3 Corriger les tests en échec si nécessaire

- [ ] 13. Lint du code
  - [x] 13.1 Exécuter `bun run lint`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 13.3 Corriger les erreurs et warnings de lint si nécessaire

- [ ] 14. Build de production
  - [x] 14.1 Exécuter `bun run build`
  - [x] 14.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 14.3 Corriger les erreurs de build si nécessaire

- [ ] 15. Documentation de la fonctionnalité
  - [x] 15.1 Créer `docs/features/players/notifications.md`
    - Description de ce qui a été implémenté (système de notifications + commentaires de posts)
    - Accès : icône cloche dans le header, commentaires sous les posts
    - Prérequis : authentification requise
    - Utilisation : guide rapide des principales actions disponibles
  - [x] 15.2 Mettre à jour `docs/README.md` pour référencer la nouvelle documentation

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques du document de requirements pour la traçabilité
- Les checkpoints permettent une validation incrémentale à chaque étape clé
- Les tests property-based valident les propriétés de correction universelles définies dans le design
- Les erreurs de création de notification ne bloquent pas l'opération principale (commentaire ou message)
