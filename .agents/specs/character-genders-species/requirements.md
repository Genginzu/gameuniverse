# Requirements Document

## Introduction

Ce document décrit les exigences pour l'ajout des concepts de **genre** (gender)
et **espèce** (species) aux personnages de Game Universe. Cela inclut la
création des tables en base de données, les pages d'administration CRUD,
l'intégration dans le formulaire d'édition de personnage, l'affichage côté
public, et la mise à jour du script d'import IGDB pour importer ces données.

## Glossaire

- **System** : L'application Game Universe dans son ensemble
- **Gender_Table** : Table de base de données stockant les genres de personnages
  (ex : Male, Female, Other)
- **Species_Table** : Table de base de données stockant les espèces de
  personnages (ex : Human, Alien, Robot)
- **Admin_Gender_Page** : Page d'administration pour la gestion CRUD des genres
- **Admin_Species_Page** : Page d'administration pour la gestion CRUD des
  espèces
- **Character_Form** : Formulaire d'édition/création de personnage dans
  l'administration
- **Character_Detail_Page** : Page publique affichant les détails d'un
  personnage
- **Character_Importer** : Script d'import bulk des personnages depuis l'API
  IGDB
- **Translation_Table** : Table de traductions associée (gender_translations,
  species_translations)
- **IGDB_API** : API externe Internet Game Database fournissant les données de
  personnages
- **Character_Sync_Tab** : Onglet de synchronisation IGDB dans le formulaire
  d'édition de personnage, similaire au GameFormSyncTab existant pour les jeux
- **Character_Field_Override** : Enregistrement indiquant qu'un champ d'un
  personnage a été modifié manuellement par un administrateur et diffère de la
  valeur IGDB d'origine

## Requirements

### Requirement 1: Tables de base de données pour les genres

**User Story:** En tant qu'administrateur, je veux que les genres de personnages
soient stockés dans une table dédiée avec traductions, afin de pouvoir les gérer
indépendamment et les réutiliser sur plusieurs personnages.

#### Acceptance Criteria

1. THE System SHALL créer une table `genders` avec les colonnes `id` (UUID, PK),
   `igdb_id` (INTEGER, UNIQUE, nullable), `slug` (VARCHAR, UNIQUE, NOT NULL),
   `created_at` et `updated_at` (TIMESTAMP)
2. THE System SHALL créer une table `gender_translations` avec les colonnes `id`
   (UUID, PK), `gender_id` (FK vers genders), `language_code` (FK vers
   languages), `name` (VARCHAR, NOT NULL), avec contrainte UNIQUE sur
   (gender_id, language_code)
3. THE System SHALL ajouter une colonne `gender_id` (UUID, FK vers genders,
   nullable) à la table `characters`
4. THE System SHALL créer des index sur `genders.slug`,
   `gender_translations.gender_id` et `gender_translations.language_code`
5. THE System SHALL activer RLS sur les tables `genders` et
   `gender_translations` avec lecture publique et écriture réservée aux
   administrateurs
6. THE System SHALL créer la migration dans `supabase/migrations/` en suivant la
   convention de nommage existante

### Requirement 2: Tables de base de données pour les espèces

**User Story:** En tant qu'administrateur, je veux que les espèces de
personnages soient stockées dans une table dédiée avec traductions, afin de
pouvoir les gérer indépendamment et les réutiliser sur plusieurs personnages.

#### Acceptance Criteria

1. THE System SHALL créer une table `species` avec les colonnes `id` (UUID, PK),
   `igdb_id` (INTEGER, UNIQUE, nullable), `slug` (VARCHAR, UNIQUE, NOT NULL),
   `created_at` et `updated_at` (TIMESTAMP)
2. THE System SHALL créer une table `species_translations` avec les colonnes
   `id` (UUID, PK), `species_id` (FK vers species), `language_code` (FK vers
   languages), `name` (VARCHAR, NOT NULL), avec contrainte UNIQUE sur
   (species_id, language_code)
3. THE System SHALL ajouter une colonne `species_id` (UUID, FK vers species,
   nullable) à la table `characters`
4. THE System SHALL créer des index sur `species.slug`,
   `species_translations.species_id` et `species_translations.language_code`
5. THE System SHALL activer RLS sur les tables `species` et
   `species_translations` avec lecture publique et écriture réservée aux
   administrateurs
6. THE System SHALL créer la migration dans `supabase/migrations/` en suivant la
   convention de nommage existante

### Requirement 3: Pages d'administration CRUD pour les genres

**User Story:** En tant qu'administrateur, je veux pouvoir créer, lire, modifier
et supprimer des genres depuis l'interface d'administration, afin de maintenir
un référentiel propre de genres de personnages.

#### Acceptance Criteria

1. THE Admin_Gender_Page SHALL afficher la liste des genres existants dans un
   tableau avec colonnes : nom, slug, date de mise à jour, et actions (modifier,
   supprimer)
2. WHEN l'administrateur clique sur "Nouveau genre", THE Admin_Gender_Page SHALL
   afficher un formulaire avec les champs slug et traductions (nom en FR et EN)
3. WHEN l'administrateur soumet le formulaire de création avec des données
   valides, THE System SHALL créer le genre et ses traductions en base de
   données
4. WHEN l'administrateur clique sur "Modifier" pour un genre, THE
   Admin_Gender_Page SHALL afficher le formulaire pré-rempli avec les données
   existantes
5. WHEN l'administrateur soumet le formulaire de modification avec des données
   valides, THE System SHALL mettre à jour le genre et ses traductions en base
   de données
6. WHEN l'administrateur clique sur "Supprimer" pour un genre, THE System SHALL
   afficher une boîte de dialogue de confirmation avant suppression
7. WHEN l'administrateur confirme la suppression, THE System SHALL supprimer le
   genre et ses traductions, et mettre à NULL le `gender_id` des personnages
   associés
8. THE Admin_Gender_Page SHALL utiliser le design system glassmorphism avec
   support du dark mode
9. THE Admin_Gender_Page SHALL fournir les traductions i18n en français et en
   anglais

### Requirement 4: Pages d'administration CRUD pour les espèces

**User Story:** En tant qu'administrateur, je veux pouvoir créer, lire, modifier
et supprimer des espèces depuis l'interface d'administration, afin de maintenir
un référentiel propre d'espèces de personnages.

#### Acceptance Criteria

1. THE Admin_Species_Page SHALL afficher la liste des espèces existantes dans un
   tableau avec colonnes : nom, slug, date de mise à jour, et actions (modifier,
   supprimer)
2. WHEN l'administrateur clique sur "Nouvelle espèce", THE Admin_Species_Page
   SHALL afficher un formulaire avec les champs slug et traductions (nom en FR
   et EN)
3. WHEN l'administrateur soumet le formulaire de création avec des données
   valides, THE System SHALL créer l'espèce et ses traductions en base de
   données
4. WHEN l'administrateur clique sur "Modifier" pour une espèce, THE
   Admin_Species_Page SHALL afficher le formulaire pré-rempli avec les données
   existantes
5. WHEN l'administrateur soumet le formulaire de modification avec des données
   valides, THE System SHALL mettre à jour l'espèce et ses traductions en base
   de données
6. WHEN l'administrateur clique sur "Supprimer" pour une espèce, THE System
   SHALL afficher une boîte de dialogue de confirmation avant suppression
7. WHEN l'administrateur confirme la suppression, THE System SHALL supprimer
   l'espèce et ses traductions, et mettre à NULL le `species_id` des personnages
   associés
8. THE Admin_Species_Page SHALL utiliser le design system glassmorphism avec
   support du dark mode
9. THE Admin_Species_Page SHALL fournir les traductions i18n en français et en
   anglais

### Requirement 5: Onglets genre et espèce dans le formulaire de personnage admin

**User Story:** En tant qu'administrateur, je veux pouvoir assigner un genre et
une espèce à un personnage depuis le formulaire d'édition, afin de catégoriser
les personnages de manière structurée.

#### Acceptance Criteria

1. THE Character_Form SHALL inclure un onglet "Genre" permettant de sélectionner
   un genre parmi la liste des genres existants
2. THE Character_Form SHALL inclure un onglet "Espèce" permettant de
   sélectionner une espèce parmi la liste des espèces existantes
3. WHEN l'administrateur sélectionne un genre dans l'onglet "Genre", THE
   Character_Form SHALL stocker le `gender_id` sélectionné dans les données du
   formulaire
4. WHEN l'administrateur sélectionne une espèce dans l'onglet "Espèce", THE
   Character_Form SHALL stocker le `species_id` sélectionné dans les données du
   formulaire
5. WHEN le formulaire est soumis, THE System SHALL enregistrer le `gender_id` et
   le `species_id` dans la table `characters`
6. WHEN le formulaire est en mode édition, THE Character_Form SHALL
   pré-sélectionner le genre et l'espèce actuels du personnage
7. THE Character_Form SHALL permettre de désélectionner un genre ou une espèce
   (valeur nullable)
8. THE Character_Form SHALL fournir les traductions i18n en français et en
   anglais pour les labels des onglets et champs

### Requirement 6: Affichage du genre et de l'espèce sur la page publique du personnage

**User Story:** En tant qu'utilisateur, je veux voir le genre et l'espèce d'un
personnage sur sa page de détails, afin de mieux connaître ses caractéristiques.

#### Acceptance Criteria

1. WHEN un personnage possède un genre assigné, THE Character_Detail_Page SHALL
   afficher le nom traduit du genre dans la section d'aperçu du personnage
2. WHEN un personnage possède une espèce assignée, THE Character_Detail_Page
   SHALL afficher le nom traduit de l'espèce dans la section d'aperçu du
   personnage
3. WHEN un personnage ne possède ni genre ni espèce, THE Character_Detail_Page
   SHALL ne pas afficher les champs genre et espèce (pas de valeur vide visible)
4. THE Character_Detail_Page SHALL afficher le genre et l'espèce dans la langue
   courante de l'utilisateur (FR ou EN)
5. THE Character_Detail_Page SHALL utiliser le design system glassmorphism
   existant pour l'affichage de ces informations

### Requirement 7: Mise à jour du Character Importer pour les genres et espèces

**User Story:** En tant qu'administrateur, je veux que le script d'import IGDB
importe automatiquement les genres et espèces des personnages, afin de ne pas
avoir à les saisir manuellement.

#### Acceptance Criteria

1. WHEN le Character_Importer traite un personnage IGDB avec un
   `character_gender`, THE Character_Importer SHALL créer le genre dans la table
   `genders` (avec `igdb_id` et traduction EN) si le genre n'existe pas déjà
2. WHEN le Character_Importer traite un personnage IGDB avec un
   `character_species`, THE Character_Importer SHALL créer l'espèce dans la
   table `species` (avec `igdb_id` et traduction EN) si l'espèce n'existe pas
   déjà
3. WHEN le genre ou l'espèce existe déjà en base (identifié par `igdb_id`), THE
   Character_Importer SHALL réutiliser l'entrée existante sans créer de doublon
4. THE Character_Importer SHALL assigner le `gender_id` et le `species_id`
   correspondants lors de l'insertion du personnage dans la table `characters`
5. WHEN un personnage IGDB ne possède pas de `character_gender` ou
   `character_species`, THE Character_Importer SHALL laisser les colonnes
   `gender_id` et `species_id` à NULL
6. THE Character_Importer SHALL conserver la compatibilité avec le mode dry-run
   existant en affichant les informations de genre et espèce dans les logs

### Requirement 8: Routes API pour les genres et espèces

**User Story:** En tant que développeur front-end, je veux disposer de routes
API RESTful pour les genres et espèces, afin de pouvoir les consommer depuis les
composants d'administration et les pages publiques.

#### Acceptance Criteria

1. THE System SHALL exposer une route GET `/api/admin/genders` retournant la
   liste des genres avec leurs traductions
2. THE System SHALL exposer une route POST `/api/admin/genders` pour créer un
   nouveau genre avec ses traductions
3. THE System SHALL exposer une route GET `/api/admin/genders/[id]` retournant
   un genre spécifique avec ses traductions
4. THE System SHALL exposer une route PUT `/api/admin/genders/[id]` pour
   modifier un genre et ses traductions
5. THE System SHALL exposer une route DELETE `/api/admin/genders/[id]` pour
   supprimer un genre
6. THE System SHALL exposer les mêmes routes (GET liste, POST, GET détail, PUT,
   DELETE) pour les espèces sous `/api/admin/species`
7. IF une requête API échoue en raison de données invalides, THEN THE System
   SHALL retourner un code HTTP 400 avec un message d'erreur descriptif
8. IF une requête API cible un genre ou une espèce inexistant, THEN THE System
   SHALL retourner un code HTTP 404

### Requirement 9: Onglet de synchronisation IGDB dans le formulaire de personnage admin

**User Story:** En tant qu'administrateur, je veux disposer d'un onglet de
synchronisation IGDB dans la page d'édition de personnage, similaire à celui
existant pour les jeux (GameFormSyncTab), afin de visualiser les données IGDB et
de synchroniser les informations du personnage depuis IGDB.

#### Acceptance Criteria

1. WHEN le personnage possède un `igdb_id`, THE Character_Sync_Tab SHALL
   afficher la liste des champs synchronisables avec leur statut (synchronisé ou
   modifié manuellement)
2. WHEN le personnage ne possède pas de `igdb_id`, THE Character_Sync_Tab SHALL
   afficher un message indiquant que le personnage n'est pas lié à IGDB
3. WHEN l'administrateur clique sur le bouton de synchronisation d'un champ
   individuel, THE Character_Sync_Tab SHALL récupérer la valeur IGDB et mettre à
   jour le champ correspondant en base de données
4. WHEN l'administrateur clique sur le bouton "Tout synchroniser", THE
   Character_Sync_Tab SHALL synchroniser tous les champs non protégés par un
   override manuel
5. WHEN la synchronisation d'un champ réussit, THE Character_Sync_Tab SHALL
   mettre à jour l'affichage du statut du champ sans rechargement complet de la
   page
6. IF la synchronisation échoue, THEN THE Character_Sync_Tab SHALL afficher un
   message d'erreur descriptif
7. THE Character_Sync_Tab SHALL utiliser le design system glassmorphism avec
   support du dark mode
8. THE Character_Sync_Tab SHALL fournir les traductions i18n en français et en
   anglais

### Requirement 10: Mise en évidence des champs personnage modifiés manuellement par un administrateur

**User Story:** En tant qu'administrateur, je veux que les champs d'un
personnage provenant d'IGDB et modifiés manuellement soient visuellement mis en
évidence, afin d'éviter qu'un import IGDB écrase par erreur une modification
manuelle.

#### Acceptance Criteria

1. THE System SHALL créer une table `character_field_overrides` avec les
   colonnes `id` (UUID, PK), `character_id` (FK vers characters), `field_name`
   (VARCHAR, NOT NULL), `overridden_at` (TIMESTAMP), `overridden_by` (UUID, FK
   vers profiles, nullable), avec contrainte UNIQUE sur (character_id,
   field_name)
2. WHEN un administrateur modifie manuellement un champ d'un personnage lié à
   IGDB via le Character_Form, THE System SHALL créer ou mettre à jour
   l'enregistrement correspondant dans `character_field_overrides`
3. WHEN un champ possède un enregistrement dans `character_field_overrides`, THE
   Character_Form SHALL afficher un indicateur visuel (badge ambre) à côté du
   label du champ pour signaler la modification manuelle
4. WHEN un champ ne possède pas d'enregistrement dans
   `character_field_overrides` et que le personnage possède un `igdb_id`, THE
   Character_Form SHALL afficher un badge IGDB (bleu) à côté du label du champ,
   similaire au composant IgdbFieldIndicator existant pour les jeux
5. WHEN l'administrateur synchronise un champ via le Character_Sync_Tab, THE
   System SHALL supprimer l'enregistrement correspondant dans
   `character_field_overrides`
6. THE System SHALL activer RLS sur la table `character_field_overrides` avec
   lecture et écriture réservées aux administrateurs
7. THE System SHALL créer la migration pour `character_field_overrides` dans
   `supabase/migrations/` en suivant la convention de nommage existante
8. THE System SHALL exposer une route GET `/api/admin/characters/[id]/overrides`
   retournant la liste des champs modifiés manuellement pour un personnage donné
