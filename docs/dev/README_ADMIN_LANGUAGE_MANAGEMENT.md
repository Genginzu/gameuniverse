# Gestion des Langues - Interface d'Administration

## Description

Interface d'administration unifiée pour la gestion des langues dans
GameUniverse. Cette fonctionnalité regroupe deux aspects au même endroit :

1. **Langues des jeux** : CRUD complet sur la table `supported_languages`
   (langues dans lesquelles un jeu peut être disponible : audio, sous-titres,
   interface). Permet de lister, créer, modifier et supprimer des langues avec
   pagination, recherche et tri.

2. **Locales du site** : Consultation en lecture seule des locales configurées
   pour l'interface web (français et anglais), avec le nombre de clés de
   traduction par locale.

L'interface est entièrement traduite en français et en anglais.

## Accès

- **Route** : `/[locale]/admin/languages` (ex: `/fr/admin/languages`)
- **Navigation** : Lien « Langues » dans le menu latéral de l'administration
  (AdminSidebar)
- **Routes API** :
  - `GET /api/admin/languages` — Liste paginée des langues
  - `POST /api/admin/languages` — Création d'une langue
  - `GET /api/admin/languages/[code]` — Détail d'une langue
  - `PUT /api/admin/languages/[code]` — Modification d'une langue
  - `DELETE /api/admin/languages/[code]` — Suppression d'une langue

## Prérequis

- **Rôle administrateur** : Seuls les utilisateurs avec le rôle admin peuvent
  accéder à cette fonctionnalité. Les utilisateurs non authentifiés reçoivent
  une erreur 401, les utilisateurs sans rôle admin une erreur 403.
- **Table `supported_languages`** : Doit exister dans Supabase (pré-seedée avec
  ~40 langues).
- **RLS** : Les politiques Row Level Security doivent être configurées sur la
  table `supported_languages` (SELECT pour tous, ALL pour admins via
  `public.is_admin()`).

## Utilisation

### Langues des jeux

- **Consulter** : La page affiche un tableau paginé avec code, nom anglais et
  nom natif de chaque langue. Utiliser la barre de recherche pour filtrer par
  code ou nom, et cliquer sur les en-têtes de colonnes pour trier.
- **Créer** : Cliquer sur « Nouvelle langue » pour accéder au formulaire de
  création. Renseigner le code (2-10 caractères, lettres minuscules et tirets),
  le nom anglais (obligatoire) et le nom natif (optionnel).
- **Modifier** : Cliquer sur le bouton « Modifier » d'une langue pour éditer son
  nom anglais et son nom natif. Le code n'est pas modifiable.
- **Supprimer** : Cliquer sur « Supprimer » pour ouvrir la modale de
  confirmation. Si la langue est utilisée par des jeux, un avertissement
  supplémentaire indique le nombre de jeux concernés.

### Locales du site

- La section « Locales du site » affiche les langues de traduction configurées
  (fr, en) avec leur code, nom, indicateur de locale par défaut et nombre de
  clés de traduction.
- Ces locales sont gérées via la configuration du code source et ne sont pas
  modifiables depuis l'interface.
