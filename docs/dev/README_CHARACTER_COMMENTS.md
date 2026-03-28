# Commentaires sur les personnages

## Description

Système de commentaires textuels sur les personnages de jeux vidéo. Les joueurs
authentifiés peuvent laisser un commentaire par personnage (texte simple, max
1000 caractères). Les administrateurs peuvent consulter, modifier et supprimer
tous les commentaires depuis le panneau d'administration.

### Côté joueur

- Onglet « Commentaires » sur la page de détails d'un personnage
- Formulaire de soumission/édition avec compteur de caractères
- Liste des commentaires triés par date décroissante
- Un seul commentaire par joueur par personnage

### Côté admin

- Liste paginée de tous les commentaires avec recherche et tri
- Édition du contenu d'un commentaire
- Suppression avec dialogue de confirmation

## Accès

### Joueur

- Naviguer vers la page d'un personnage : `/{locale}/characters/{slug}`
- Cliquer sur l'onglet « Commentaires »

### Admin

- Liste des commentaires : `/{locale}/admin/comments`
- Édition d'un commentaire : `/{locale}/admin/comments/{id}/edit`
- Lien « Commentaires » dans la navigation admin

### API

- `GET /api/comments?characterId=<uuid>` — Liste des commentaires d'un
  personnage
- `POST /api/comments` — Créer un commentaire (auth requise)
- `PUT /api/comments` — Modifier son commentaire (auth requise)
- `GET /api/admin/comments` — Liste paginée admin (admin requis)
- `GET /api/admin/comments/[id]` — Détail d'un commentaire (admin requis)
- `PUT /api/admin/comments/[id]` — Modifier un commentaire (admin requis)
- `DELETE /api/admin/comments/[id]` — Supprimer un commentaire (admin requis)

## Prérequis

- Migrations Supabase appliquées :
  - `20240219000001_character_comments.sql` — Table, index, RLS de base
  - `20240219000002_admin_comment_rls.sql` — Politiques RLS admin
- Utilisateur authentifié pour soumettre un commentaire
- Rôle `admin` dans `user_metadata` pour accéder aux endpoints admin

## Utilisation

### Soumettre un commentaire

1. Se connecter
2. Ouvrir la page d'un personnage
3. Aller sur l'onglet « Commentaires »
4. Rédiger le commentaire (1–1000 caractères) et soumettre

### Modifier son commentaire

Le formulaire affiche automatiquement le commentaire existant en mode édition.

### Administration

1. Accéder à `/{locale}/admin/comments`
2. Rechercher par nom de joueur ou de personnage
3. Cliquer sur l'icône d'édition pour modifier le contenu
4. Cliquer sur l'icône de suppression pour supprimer (avec confirmation)
