# Notifications & Commentaires de Posts

## Description

Système de notifications en temps réel et commentaires sur les posts de joueurs.
Les joueurs reçoivent des notifications lorsqu'un autre joueur commente leur
post ou leur envoie un message dans les discussions. Les commentaires permettent
d'interagir directement sous les posts des joueurs.

## Accès

- **Notifications** : icône cloche dans le header global (TopBar +
  LandingHeader), à gauche du sélecteur de langue. Visible uniquement pour les
  joueurs authentifiés.
- **Commentaires** : section sous chaque post dans l'onglet Posts du profil
  joueur.

## Prérequis

- Authentification requise pour recevoir des notifications, commenter des posts,
  et voir l'icône de cloche.
- Migration SQL `20260413000001_notifications_and_post_comments.sql` appliquée.

## Utilisation

### Notifications

- Cliquer sur la cloche pour voir les 5 dernières notifications non lues
- Badge compteur : nombre exact (1-9) ou "9+" (>9), absent si 0
- Cliquer sur la croix d'une notification pour la marquer comme lue
- "Tout marquer comme lu" pour effacer toutes les notifications
- Polling automatique toutes les 30 secondes pour détecter les nouvelles
  notifications

### Commentaires de posts

- Écrire un commentaire (1-500 caractères) sous un post
- Supprimer ses propres commentaires ou les commentaires sur ses propres posts
- Le nombre de commentaires est affiché à côté de chaque post

### Types de notifications

- **Commentaire de post** : "X a commenté votre post"
- **Message de discussion** : "X vous a envoyé un message"

## API

| Route                                      | Méthode | Description              |
| ------------------------------------------ | ------- | ------------------------ |
| `/api/notifications`                       | GET     | Notifications non lues   |
| `/api/notifications/count`                 | GET     | Compteur non lues        |
| `/api/notifications/[id]/read`             | PATCH   | Marquer comme lue        |
| `/api/notifications/read-all`              | PATCH   | Tout marquer comme lu    |
| `/api/posts/[postId]/comments`             | GET     | Commentaires d'un post   |
| `/api/posts/[postId]/comments`             | POST    | Créer un commentaire     |
| `/api/posts/[postId]/comments/[commentId]` | DELETE  | Supprimer un commentaire |
