# Requirements Document

## Introduction

Intégration des plateformes de jeux vidéo (PS5, Xbox One, PC, Nintendo Switch,
etc.) dans le site Game Universe. Les plateformes seront associées aux jeux via
une relation many-to-many, visibles sur les fiches jeux et personnages,
utilisables comme filtre sur les pages de listing, intégrées dans les
statistiques joueur, et importées automatiquement depuis l'API IGDB.

## Glossaire

- **Platform_Service** : Module applicatif (API routes + services) responsable
  de la gestion des plateformes (CRUD, associations, requêtes).
- **Platform** : Entité représentant une plateforme de jeu vidéo (ex : PS5, Xbox
  Series X, PC, Nintendo Switch). Stockée dans la table `platforms` avec un slug
  unique et des traductions i18n.
- **Game_Platform** : Table de liaison many-to-many entre un jeu et ses
  plateformes disponibles.
- **IGDB_Importer** : Script d'import bulk (`scripts/igdb-import/`) qui récupère
  les jeux depuis l'API IGDB et les insère dans Supabase.
- **Games_Listing** : Page publique affichant la liste paginée des jeux avec
  filtres (genres, éditeurs, et désormais plateformes).
- **Characters_Listing** : Page publique affichant la liste des personnages avec
  filtres.
- **Dashboard_Stats** : Page de statistiques d'un joueur affichant ses métriques
  (genres, complétion, temps de jeu, etc.).
- **Admin_Panel** : Interface d'administration permettant la gestion CRUD des
  entités du site.

## Requirements

### Requirement 1 : Table et modèle de données des plateformes

**User Story :** En tant que développeur, je veux une table `platforms` avec
traductions i18n, afin de stocker les plateformes de manière cohérente avec le
modèle existant (genres, companies).

#### Acceptance Criteria

1. THE Platform_Service SHALL stocker chaque plateforme dans une table
   `platforms` contenant un identifiant UUID, un slug unique, un champ optionnel
   `igdb_id` (integer unique), un champ optionnel `icon_url` (text), et des
   timestamps `created_at` / `updated_at`.
2. THE Platform_Service SHALL stocker les traductions de chaque plateforme dans
   une table `platform_translations` contenant un `platform_id`, un
   `language_code`, un `name` et une `abbreviation` optionnelle, avec une
   contrainte d'unicité sur `(platform_id, language_code)`.
3. THE Platform_Service SHALL stocker les associations jeu-plateforme dans une
   table `game_platforms` avec une clé primaire composite
   `(game_id, platform_id)` et des suppressions en cascade.
4. THE Platform_Service SHALL créer des index sur `game_platforms.game_id` et
   `game_platforms.platform_id` pour optimiser les requêtes de filtrage.
5. THE Platform_Service SHALL appliquer des politiques RLS autorisant la lecture
   publique sur `platforms`, `platform_translations` et `game_platforms`, et
   restreignant l'écriture aux administrateurs.

### Requirement 2 : Association plateformes ↔ jeux

**User Story :** En tant qu'utilisateur, je veux voir les plateformes
disponibles sur la fiche d'un jeu, afin de savoir sur quelles plateformes le jeu
est jouable.

#### Acceptance Criteria

1. WHEN un jeu est affiché sur sa page de détail, THE Platform_Service SHALL
   retourner la liste des plateformes associées au jeu, incluant le nom traduit
   dans la locale courante et l'icône de la plateforme.
2. WHEN un jeu possède zéro plateforme associée, THE Platform_Service SHALL
   retourner une liste vide sans erreur.
3. THE Platform_Service SHALL inclure les plateformes dans le type `GameDetails`
   via un champ `platforms` de type tableau contenant `id`, `slug`, `name`,
   `abbreviation` et `iconUrl`.
4. THE Platform_Service SHALL inclure les plateformes dans le type `GameSummary`
   via un champ `platforms` de type tableau contenant `name` et `slug`.

### Requirement 3 : Association plateformes ↔ personnages (via les jeux)

**User Story :** En tant qu'utilisateur, je veux voir les plateformes associées
à un personnage (déduites de ses jeux), afin de savoir sur quelles plateformes
ce personnage apparaît.

#### Acceptance Criteria

1. WHEN un personnage est affiché sur sa page de détail, THE Platform_Service
   SHALL retourner la liste dédupliquée des plateformes issues de tous les jeux
   associés au personnage.
2. THE Platform_Service SHALL inclure les plateformes dans le type
   `CharacterDetails` via un champ `platforms` de type tableau contenant `id`,
   `slug`, `name` et `iconUrl`.
3. WHEN un personnage n'a aucun jeu associé, THE Platform_Service SHALL
   retourner une liste de plateformes vide sans erreur.

### Requirement 4 : Filtrage par plateforme sur les listings

**User Story :** En tant qu'utilisateur, je veux filtrer les jeux et les
personnages par plateforme, afin de trouver rapidement le contenu disponible sur
ma plateforme préférée.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne une ou plusieurs plateformes dans le filtre de
   la Games_Listing, THE Platform_Service SHALL retourner uniquement les jeux
   disponibles sur au moins une des plateformes sélectionnées.
2. WHEN l'utilisateur sélectionne une ou plusieurs plateformes dans le filtre de
   la Characters_Listing, THE Platform_Service SHALL retourner uniquement les
   personnages dont au moins un jeu associé est disponible sur une des
   plateformes sélectionnées.
3. WHEN l'utilisateur combine un filtre plateforme avec un filtre genre, THE
   Platform_Service SHALL retourner les résultats satisfaisant les deux critères
   simultanément (intersection).
4. WHEN aucun filtre plateforme n'est sélectionné, THE Platform_Service SHALL
   retourner tous les résultats sans restriction de plateforme.
5. THE Games_Listing SHALL afficher les filtres de plateforme dans un composant
   visuel cohérent avec les filtres de genre existants, utilisant le style
   glassmorphism du projet.
6. THE Characters_Listing SHALL afficher les filtres de plateforme dans un
   composant visuel cohérent avec les filtres existants (jeux, rôles), utilisant
   le style glassmorphism du projet.

### Requirement 5 : Statistiques joueur — répartition par plateforme

**User Story :** En tant que joueur, je veux voir la répartition de ma
bibliothèque par plateforme dans mes statistiques, afin de connaître mes
habitudes de jeu par plateforme.

#### Acceptance Criteria

1. THE Dashboard_Stats SHALL afficher une section "Répartition par plateforme"
   montrant le nombre de jeux par plateforme et le pourcentage correspondant,
   calculés à partir de la bibliothèque du joueur (`user_library`).
2. WHEN un joueur n'a aucun jeu dans sa bibliothèque, THE Dashboard_Stats SHALL
   afficher un état vide avec un message explicatif pour la section plateforme.
3. THE Platform_Service SHALL retourner les données de répartition par
   plateforme via l'API de statistiques du dashboard, incluant le nom de la
   plateforme, le nombre de jeux et le pourcentage.
4. THE Dashboard_Stats SHALL afficher la répartition par plateforme dans un
   composant visuel cohérent avec la répartition par genre existante
   (`GenreDistributionEntry`), utilisant le style glassmorphism du projet.

### Requirement 6 : Import IGDB — récupération des plateformes

**User Story :** En tant que développeur, je veux que le script d'import IGDB
récupère automatiquement les plateformes des jeux importés, afin de maintenir
les données de plateformes à jour sans intervention manuelle.

#### Acceptance Criteria

1. WHEN un jeu est importé depuis IGDB, THE IGDB_Importer SHALL récupérer les
   plateformes associées au jeu depuis le champ `platforms` de l'API IGDB.
2. WHEN une plateforme IGDB n'existe pas encore dans la table `platforms`, THE
   IGDB_Importer SHALL créer la plateforme avec son `igdb_id`, son slug, et une
   traduction anglaise du nom.
3. WHEN une plateforme IGDB existe déjà dans la table `platforms` (identifiée
   par `igdb_id`), THE IGDB_Importer SHALL réutiliser la plateforme existante
   sans créer de doublon.
4. THE IGDB_Importer SHALL créer les associations `game_platforms` entre le jeu
   importé et ses plateformes.
5. WHEN un jeu existant est synchronisé (sync), THE IGDB_Importer SHALL mettre à
   jour les associations de plateformes du jeu en ajoutant les nouvelles et en
   conservant les existantes.
6. WHEN l'API IGDB ne retourne aucune plateforme pour un jeu, THE IGDB_Importer
   SHALL continuer l'import du jeu sans erreur et sans créer d'association
   plateforme.

### Requirement 7 : Administration des plateformes (CRUD)

**User Story :** En tant qu'administrateur, je veux gérer les plateformes
(créer, modifier, supprimer) depuis le panneau d'administration, afin de
maintenir le référentiel de plateformes à jour.

#### Acceptance Criteria

1. THE Admin_Panel SHALL fournir une page listant toutes les plateformes avec
   leur nom traduit, leur slug, leur icône et le nombre de jeux associés.
2. WHEN un administrateur crée une plateforme, THE Admin_Panel SHALL exiger un
   slug unique et au moins une traduction (nom en français ou anglais).
3. WHEN un administrateur modifie une plateforme, THE Admin_Panel SHALL
   permettre la modification du nom (FR/EN), de l'abréviation, de l'icône et du
   slug.
4. WHEN un administrateur supprime une plateforme, THE Admin_Panel SHALL
   supprimer la plateforme et toutes ses associations en cascade, après
   confirmation.
5. IF un administrateur tente de créer une plateforme avec un slug déjà
   existant, THEN THE Admin_Panel SHALL afficher un message d'erreur explicite
   sans créer de doublon.
6. THE Admin_Panel SHALL respecter le style glassmorphism et les patterns de
   composants existants dans les autres pages d'administration (genres,
   companies, languages).

### Requirement 8 : Traductions i18n (FR/EN)

**User Story :** En tant qu'utilisateur, je veux voir les noms de plateformes
dans ma langue (français ou anglais), afin de naviguer confortablement sur le
site.

#### Acceptance Criteria

1. THE Platform_Service SHALL retourner le nom de la plateforme traduit dans la
   locale courante de l'utilisateur (`fr` ou `en`).
2. WHEN une traduction n'existe pas dans la locale demandée, THE
   Platform_Service SHALL retourner la traduction anglaise comme fallback.
3. THE Platform_Service SHALL fournir les clés de traduction i18n nécessaires
   dans les fichiers `src/messages/fr.json` et `src/messages/en.json` pour tous
   les libellés UI liés aux plateformes (filtres, labels, titres de section,
   états vides).
4. THE Platform_Service SHALL ajouter les clés de traduction simultanément dans
   les deux fichiers de langue (`fr.json` et `en.json`).
