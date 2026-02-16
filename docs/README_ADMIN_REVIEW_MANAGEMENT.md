# Gestion des Avis - Interface d'Administration

## Description

Interface d'administration permettant aux administrateurs de consulter, modifier
et supprimer les avis (reviews) soumis par les joueurs sur les jeux dans
GameUniverse. La fonctionnalité s'intègre dans le panneau d'administration
existant et suit les mêmes patterns que les autres entités admin (jeux,
personnages, genres).

La liste des avis offre recherche par nom de joueur ou titre de jeu, tri par
colonnes (date, note, joueur, jeu) et pagination. L'édition réutilise les
composants existants du système de reviews (éditeur de texte enrichi, saisie de
note, points positifs/négatifs).

## Accès

- **Route liste** : `/[locale]/admin/reviews` (ex : `/fr/admin/reviews`)
- **Route édition** : `/[locale]/admin/reviews/[id]/edit`
- **Navigation** : Lien « Avis » dans le menu latéral de l'administration
- **Routes API** :
  - `GET /api/admin/reviews` — Liste paginée avec recherche, tri et pagination
  - `GET /api/admin/reviews/[id]` — Détail d'un avis pour édition
  - `PUT /api/admin/reviews/[id]` — Mise à jour d'un avis
  - `DELETE /api/admin/reviews/[id]` — Suppression d'un avis

## Prérequis

- **Rôle administrateur** : Seuls les utilisateurs avec le rôle admin peuvent
  accéder à cette fonctionnalité. Les requêtes non autorisées reçoivent une
  erreur 403.
- **Politiques RLS** : La migration
  `supabase/migrations/20240218000001_admin_review_rls.sql` ajoute les
  politiques permettant aux admins de modifier et supprimer toute review.
- **Tables Supabase** : La table `game_reviews` doit exister, ainsi que
  `profiles` (nom joueur) et `game_translations` (titre jeu) pour les jointures.

## Utilisation

- **Consulter** : La page affiche un tableau paginé avec le nom du joueur, le
  titre du jeu, la note sur 20, un extrait du contenu et la date de création.
  Utiliser la barre de recherche pour filtrer par nom de joueur ou titre de jeu,
  et cliquer sur les en-têtes de colonnes pour trier.
- **Modifier** : Cliquer sur le bouton d'édition d'un avis pour accéder au
  formulaire pré-rempli. Le formulaire permet de modifier la note, le contenu
  enrichi, les points positifs et les points négatifs. La validation est
  identique à celle côté joueur (note entre 0 et 20, contenu non vide, max 5000
  caractères, points max 200 caractères chacun).
- **Supprimer** : Cliquer sur le bouton de suppression pour ouvrir la boîte de
  dialogue de confirmation affichant le nom du joueur et le titre du jeu. La
  suppression est définitive.
