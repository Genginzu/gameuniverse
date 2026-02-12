# Gestion des Genres - Interface d'Administration

## Description

Interface d'administration pour le CRUD complet des genres de jeux vidéo dans
GameUniverse. Chaque genre est identifié par un slug unique et possède des
traductions (nom + description) dans chaque langue supportée, stockées dans la
table `genre_translations`.

La fonctionnalité permet de :

- **Lister** les genres avec pagination, recherche et tri
- **Créer** un genre avec son slug et ses traductions multilingues
- **Modifier** les traductions d'un genre existant (slug immuable)
- **Supprimer** un genre, avec vérification d'usage et suppression forcée

Le module suit les mêmes patterns que la gestion des langues admin
(`useAdminLanguages`, `LanguageForm`, etc.).

## Accès

- **Route** : `/[locale]/admin/genres` (ex : `/fr/admin/genres`)
- **Navigation** : Lien « Genres » dans le menu latéral de l'administration
- **Routes API** :
  - `GET /api/admin/genres` — Liste paginée des genres (recherche, tri, locale)
  - `POST /api/admin/genres` — Création d'un genre avec traductions
  - `GET /api/admin/genres/[slug]` — Détail d'un genre avec traductions
  - `PUT /api/admin/genres/[slug]` — Mise à jour des traductions d'un genre
  - `DELETE /api/admin/genres/[slug]` — Suppression d'un genre (`?force=true`
    pour forcer)

## Prérequis

- **Rôle administrateur** : Seuls les utilisateurs avec le rôle admin peuvent
  accéder à cette fonctionnalité. Les routes API sont protégées par
  `requireAdmin()` (403 si non admin).
- **Tables en base** : `genres`, `genre_translations`, `game_genres` et
  `supported_languages` doivent exister dans Supabase.
- **Langues supportées** : Au moins une langue doit être présente dans
  `supported_languages` pour que le formulaire affiche les champs de traduction.

## Utilisation

- **Consulter** : La page affiche un tableau paginé avec le slug, le nom traduit
  dans la locale courante et le nombre de jeux associés. Utiliser la barre de
  recherche pour filtrer par slug ou nom, et cliquer sur les en-têtes de
  colonnes pour trier.
- **Créer** : Cliquer sur « Nouveau genre » pour accéder au formulaire de
  création. Renseigner le slug (2-50 caractères, lettres minuscules, chiffres et
  tirets, commence par une lettre) et les traductions (nom obligatoire, max 100
  caractères ; description optionnelle, max 500 caractères) pour chaque langue
  supportée.
- **Modifier** : Cliquer sur le bouton « Modifier » d'un genre pour éditer ses
  traductions. Le slug n'est pas modifiable.
- **Supprimer** : Cliquer sur « Supprimer » pour ouvrir la modale de
  confirmation. Si le genre est utilisé par des jeux, un avertissement indique
  le nombre de jeux concernés et propose une suppression forcée.
