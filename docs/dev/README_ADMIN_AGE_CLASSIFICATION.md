# Classifications d'Âge - Interface d'Administration

## Description

Interface d'administration pour le CRUD complet des classifications d'âge des
jeux vidéo dans GameUniverse. La fonctionnalité s'organise autour de trois
entités hiérarchiques :

1. **Systèmes de classification** (PEGI, ESRB, CERO, USK…) — entité racine
   identifiée par un code unique, avec nom, pays et URL du site web.
2. **Notes** (PEGI 3, ESRB E, CERO A…) — niveaux d'âge au sein d'un système,
   avec âge minimum, couleur, ordre de tri et traductions multilingues de la
   description (par langue supportée).
3. **Descripteurs de contenu** (Violence, Langage, Peur…) — types de contenu
   associés à un système, avec traductions multilingues (nom + description par
   langue supportée).

La fonctionnalité permet de :

- **Lister** les systèmes de classification avec pagination, recherche et tri
- **Créer / Modifier / Supprimer** un système de classification
- **Gérer les notes** d'un système via des pages dédiées de création et
  d'édition, avec traductions multilingues de la description (CRUD complet)
- **Gérer les descripteurs de contenu** avec traductions multilingues (CRUD
  complet via onglet dédié)

Le module suit les mêmes patterns que la gestion des langues et des genres
admin.

## Accès

- **Route principale** : `/[locale]/admin/age-classifications` (ex :
  `/fr/admin/age-classifications`)
- **Création** : `/[locale]/admin/age-classifications/new`
- **Édition** : `/[locale]/admin/age-classifications/[id]/edit` (avec onglets
  pour les notes et descripteurs)
- **Création d'une note** :
  `/[locale]/admin/age-classifications/[id]/ratings/new`
- **Édition d'une note** :
  `/[locale]/admin/age-classifications/[id]/ratings/[ratingId]/edit`
- **Navigation** : Lien « Classifications d'âge » dans le menu latéral de
  l'administration, catégorie « Jeux » (icône FaShieldAlt)
- **Routes API** :
  - `GET /api/admin/age-classifications` — Liste paginée des systèmes
  - `POST /api/admin/age-classifications` — Création d'un système
  - `GET /api/admin/age-classifications/[id]` — Détail d'un système
  - `PUT /api/admin/age-classifications/[id]` — Modification d'un système
  - `DELETE /api/admin/age-classifications/[id]` — Suppression d'un système
  - `GET /api/admin/age-classifications/[id]/ratings` — Liste des notes
  - `POST /api/admin/age-classifications/[id]/ratings` — Création d'une note
  - `GET /api/admin/age-classifications/[id]/ratings/[ratingId]` — Détail
  - `PUT /api/admin/age-classifications/[id]/ratings/[ratingId]` — Modification
  - `DELETE /api/admin/age-classifications/[id]/ratings/[ratingId]` —
    Suppression
  - `GET /api/admin/age-classifications/[id]/descriptors` — Liste des
    descripteurs
  - `POST /api/admin/age-classifications/[id]/descriptors` — Création
  - `GET /api/admin/age-classifications/[id]/descriptors/[descriptorId]` —
    Détail
  - `PUT /api/admin/age-classifications/[id]/descriptors/[descriptorId]` —
    Modification
  - `DELETE /api/admin/age-classifications/[id]/descriptors/[descriptorId]` —
    Suppression

## Prérequis

- **Rôle administrateur** : Seuls les utilisateurs avec le rôle admin peuvent
  accéder à cette fonctionnalité. Les routes API sont protégées par
  `requireAdmin()` (403 si non admin).
- **Tables en base** : `rating_systems`, `ratings`, `rating_translations`,
  `content_descriptors`, `content_descriptor_translations`, `game_ratings` et
  `game_rating_descriptors` doivent exister dans Supabase.
- **Langues supportées** : Au moins une langue doit être présente dans
  `supported_languages` pour que le formulaire de descripteur affiche les champs
  de traduction.

## Utilisation

### Systèmes de classification

- **Consulter** : La page principale affiche un tableau paginé avec le code, le
  nom, les pays et le site web de chaque système. Utiliser la barre de recherche
  pour filtrer par code ou nom, et cliquer sur les en-têtes de colonnes pour
  trier.
- **Créer** : Cliquer sur « Nouveau système » pour accéder au formulaire.
  Renseigner le code (1-10 caractères, majuscules, commence par une lettre), le
  nom (obligatoire, max 100 caractères), la description (optionnelle), les codes
  pays et l'URL du site web (optionnelle).
- **Modifier** : Cliquer sur « Modifier » pour éditer les informations du
  système. Le code n'est pas modifiable en mode édition.
- **Supprimer** : Cliquer sur « Supprimer » pour ouvrir la modale de
  confirmation. Si le système possède des notes ou descripteurs associés, la
  suppression est bloquée avec un message explicatif.

### Notes (pages dédiées depuis l'onglet dans la page d'édition)

- **Consulter** : L'onglet « Notes » affiche la liste des notes du système avec
  code, nom d'affichage, âge minimum, couleur et ordre de tri. Recherche par
  code ou nom d'affichage.
- **Créer** : Cliquer sur « Nouvelle note » pour accéder à la page dédiée de
  création (`/admin/age-classifications/[id]/ratings/new`). Renseigner le code
  (unique dans le système), le nom d'affichage, l'âge minimum (≥ 0), la couleur
  hexadécimale (optionnelle), l'URL d'icône (optionnelle), l'ordre de tri et les
  traductions de description (code de langue + description, max 500 caractères).
  Un toast de succès s'affiche et redirige vers la page d'édition du système.
- **Modifier** : Cliquer sur une ligne du tableau ou sur le bouton d'édition
  pour accéder à la page dédiée d'édition
  (`/admin/age-classifications/[id]/ratings/[ratingId]/edit`). Les traductions
  existantes sont pré-remplies. Si la note est introuvable, un message d'erreur
  s'affiche avec un bouton de retour.
- **Supprimer** : Confirmation requise via la boîte de dialogue dans l'onglet.
  Si la note est associée à des jeux via `game_ratings`, la suppression est
  bloquée.
- **Traductions** : La section « Traductions » du formulaire permet d'ajouter,
  modifier et supprimer des descriptions traduites. Chaque traduction associe un
  code de langue et une description. Le tableau vide est accepté (pas de
  traduction obligatoire).

### Descripteurs de contenu (onglet dans la page d'édition)

- **Consulter** : L'onglet « Descripteurs » affiche la liste des descripteurs
  avec leur code et les traductions disponibles. Recherche par code ou nom
  traduit.
- **Créer** : Renseigner le code (unique dans le système), l'URL d'icône
  (optionnelle) et les traductions (nom obligatoire, description optionnelle)
  pour chaque langue supportée.
- **Modifier** : Éditer le code, l'icône et les traductions d'un descripteur.
- **Supprimer** : Confirmation requise. Si le descripteur est associé à des jeux
  via `game_rating_descriptors`, la suppression est bloquée.
