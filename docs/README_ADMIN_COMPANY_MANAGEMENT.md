# Gestion des Entreprises - Interface d'Administration

## Description

Interface d'administration pour le CRUD complet des entreprises (développeurs et
éditeurs de jeux vidéo) dans GameUniverse. Chaque entreprise est identifiée par
un slug unique et possède des champs descriptifs riches : nom, description, site
web, logo, année de fondation, siège social et type (developer/publisher/both).
Les entreprises sont liées aux jeux via la table de jonction `game_companies`.

La fonctionnalité permet de :

- **Lister** les entreprises avec pagination, recherche et tri
- **Créer** une entreprise avec ses informations détaillées
- **Modifier** les informations d'une entreprise existante (slug immuable)
- **Supprimer** une entreprise, avec vérification d'usage et suppression forcée

Le module suit les mêmes patterns que la gestion des genres admin
(`useAdminGenres`, `AdminGenresTable`, etc.).

## Accès

- **Route** : `/[locale]/admin/companies` (ex : `/fr/admin/companies`)
- **Navigation** : Lien « Entreprises » dans le menu latéral de l'administration
- **Routes API** :
  - `GET /api/admin/companies` — Liste paginée des entreprises (recherche, tri)
  - `POST /api/admin/companies` — Création d'une entreprise
  - `GET /api/admin/companies/[slug]` — Détail d'une entreprise
  - `PUT /api/admin/companies/[slug]` — Mise à jour d'une entreprise
  - `DELETE /api/admin/companies/[slug]` — Suppression d'une entreprise
    (`?force=true` pour forcer)

## Prérequis

- **Rôle administrateur** : Seuls les utilisateurs avec le rôle admin peuvent
  accéder à cette fonctionnalité. Les routes API sont protégées par
  `requireAdmin()` (403 si non admin).
- **Tables en base** : `companies` et `game_companies` doivent exister dans
  Supabase.

## Utilisation

- **Consulter** : La page affiche un tableau paginé avec le nom, le slug, le
  type et le nombre de jeux associés. Utiliser la barre de recherche pour
  filtrer par nom ou slug, et cliquer sur les en-têtes de colonnes pour trier.
- **Créer** : Cliquer sur « Nouvelle entreprise » pour accéder au formulaire de
  création. Renseigner le slug (2-100 caractères, lettres minuscules, chiffres
  et tirets, commence par une lettre), le nom (obligatoire, max 255 caractères),
  le type (developer, publisher ou both), et optionnellement la description (max
  2000 caractères), le site web, le logo URL, l'année de fondation (1800 à
  l'année courante) et le siège social (max 255 caractères).
- **Modifier** : Cliquer sur le bouton « Modifier » d'une entreprise pour éditer
  ses informations. Le slug n'est pas modifiable.
- **Supprimer** : Cliquer sur « Supprimer » pour ouvrir la modale de
  confirmation. Si l'entreprise est utilisée par des jeux, un avertissement
  indique le nombre de jeux concernés et propose une suppression forcée.
