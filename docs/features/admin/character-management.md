# Gestion des Personnages - Interface d'Administration

## Description

Interface d'administration CRUD complète pour les personnages de jeux vidéo dans
GameUniverse. Cette fonctionnalité permet aux administrateurs de lister, créer,
modifier et supprimer des personnages via un formulaire multi-onglets avec
support multilingue (FR/EN).

Le formulaire est organisé en 5 onglets :

1. **Général** : Slug et couleur de fond
2. **Images** : Image principale et image d'arrière-plan
3. **Traductions** : Nom, rôle, description et biographie par langue (FR/EN)
4. **Jeux** : Association aux jeux avec indicateur de jeu principal
5. **Médias** : Screenshots, artworks et vidéos associés

La liste des personnages offre recherche par nom, tri par colonnes et
pagination. L'interface est entièrement traduite en français et en anglais.

## Accès

- **Route** : `/[locale]/admin/characters` (ex : `/fr/admin/characters`)
- **Navigation** : Lien « Personnages » dans le menu latéral de l'administration
  (AdminSidebar)
- **Routes API** :
  - `GET /api/admin/characters` — Liste paginée avec recherche, tri et locale
  - `POST /api/admin/characters` — Création d'un personnage avec relations
  - `GET /api/admin/characters/[id]` — Détail d'un personnage pour édition
  - `PUT /api/admin/characters/[id]` — Mise à jour complète d'un personnage
  - `DELETE /api/admin/characters/[id]` — Suppression d'un personnage

## Prérequis

- **Rôle administrateur** : Seuls les utilisateurs avec le rôle admin peuvent
  accéder à cette fonctionnalité. Les requêtes non authentifiées reçoivent une
  erreur 403.
- **Tables Supabase** : Les tables suivantes doivent exister dans la base de
  données :
  - `characters` — Table principale des personnages
  - `character_translations` — Traductions FR/EN (nom, rôle, description,
    biographie)
  - `character_games` — Liaison personnage-jeu avec indicateur de jeu principal
  - `character_media` — Médias associés (screenshots, artworks, vidéos)

## Utilisation

- **Consulter** : La page affiche un tableau paginé avec nom, image, rôle, jeu
  principal et date de mise à jour. Utiliser la barre de recherche pour filtrer
  par nom et cliquer sur les en-têtes de colonnes pour trier.
- **Créer** : Cliquer sur « Nouveau personnage » pour accéder au formulaire
  multi-onglets. Le slug (lettres minuscules, chiffres et tirets) et au moins
  une traduction avec un nom sont obligatoires.
- **Modifier** : Cliquer sur un personnage dans la liste pour éditer ses
  informations. Le formulaire charge les données existantes avec toutes les
  relations.
- **Supprimer** : Cliquer sur le bouton de suppression pour ouvrir la modale de
  confirmation. La suppression retire le personnage et toutes ses données
  associées (traductions, jeux, médias) grâce aux cascades en base.
