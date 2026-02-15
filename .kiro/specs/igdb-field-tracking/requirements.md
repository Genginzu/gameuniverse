# Document de Requirements

## Introduction

Ce document définit les exigences pour un système de suivi des modifications
manuelles des champs de jeux après un import IGDB. L'objectif est d'empêcher
qu'une synchronisation ou un nouvel import écrase les modifications faites
manuellement par un administrateur. Le système inclut également un nouvel onglet
dans le formulaire d'édition d'un jeu permettant de forcer la synchronisation
d'un ou de tous les champs depuis IGDB.

## Glossaire

- **Système_Tracking** : Le module qui enregistre et consulte les champs
  modifiés manuellement pour chaque jeu
- **Champ_Suivi** : Un champ ou groupe de données d'un jeu pouvant être
  synchronisé depuis IGDB (ex : titre, description, cover, genres, companies,
  screenshots, artworks, langues, age ratings, versions, metascore, date de
  sortie, playtime)
- **Modification_Manuelle** : Une modification effectuée par un administrateur
  via le formulaire d'édition admin, par opposition à une donnée provenant d'un
  import IGDB
- **Onglet_Sync** : Le nouvel onglet dans le formulaire d'édition d'un jeu
  permettant de visualiser l'état de synchronisation et de forcer la
  re-synchronisation
- **Import_IGDB** : Le processus d'import ou de synchronisation des données
  depuis l'API IGDB vers la base de données Supabase
- **Administrateur** : Un utilisateur ayant les droits d'administration sur le
  site

## Requirements

### Requirement 1 : Enregistrement des modifications manuelles

**User Story:** En tant qu'administrateur, je veux que le système enregistre
automatiquement quels champs j'ai modifiés manuellement, afin que ces
modifications soient protégées lors d'un futur import IGDB.

#### Critères d'Acceptation

1. WHEN un administrateur modifie un Champ_Suivi via le formulaire d'édition
   admin, THE Système_Tracking SHALL enregistrer le nom du champ modifié, la
   date de modification et l'identifiant de l'administrateur dans la table de
   suivi
2. WHEN un administrateur modifie plusieurs Champs_Suivis dans une même
   sauvegarde, THE Système_Tracking SHALL enregistrer chaque champ modifié
   individuellement
3. WHEN un Champ_Suivi est déjà marqué comme modifié manuellement et que
   l'administrateur le modifie à nouveau, THE Système_Tracking SHALL mettre à
   jour la date de modification sans créer de doublon
4. THE Système_Tracking SHALL suivre les catégories de champs suivantes :
   translations (titre/description par langue), cover_image, background_image,
   release_date, metascore, genres, companies, screenshots, artworks,
   age_ratings, versions, languages, playtime

### Requirement 2 : Protection des champs lors de la synchronisation

**User Story:** En tant qu'administrateur, je veux que les champs modifiés
manuellement soient protégés lors d'un import ou d'une synchronisation IGDB,
afin de ne pas perdre mes modifications.

#### Critères d'Acceptation

1. WHEN l'Import_IGDB synchronise un jeu existant, THE Système_Tracking SHALL
   vérifier quels champs sont marqués comme modifiés manuellement
2. WHEN un Champ_Suivi est marqué comme modifié manuellement, THE Import_IGDB
   SHALL ignorer la valeur IGDB pour ce champ et conserver la valeur actuelle
3. WHEN un Champ_Suivi est absent de la table de suivi (jamais modifié
   manuellement), THE Import_IGDB SHALL mettre à jour ce champ avec la valeur
   IGDB
4. WHEN l'Import_IGDB synchronise un jeu, THE Import_IGDB SHALL mettre à jour le
   champ last_synced_at du jeu

### Requirement 3 : Onglet de synchronisation dans le formulaire admin

**User Story:** En tant qu'administrateur, je veux un onglet dédié dans le
formulaire d'édition d'un jeu pour visualiser l'état de synchronisation et
forcer la re-synchronisation depuis IGDB, afin de pouvoir contrôler précisément
quelles données proviennent d'IGDB.

#### Critères d'Acceptation

1. WHEN un administrateur ouvre le formulaire d'édition d'un jeu ayant un
   igdb_id, THE Onglet_Sync SHALL afficher la liste de tous les Champs_Suivis
   avec leur état (modifié manuellement ou synchronisé IGDB)
2. WHEN un administrateur ouvre le formulaire d'édition d'un jeu sans igdb_id,
   THE Onglet_Sync SHALL afficher un message indiquant que le jeu n'est pas lié
   à IGDB
3. WHEN un administrateur clique sur le bouton de synchronisation d'un
   Champ_Suivi individuel, THE Onglet_Sync SHALL récupérer la valeur actuelle
   depuis IGDB et mettre à jour ce champ dans la base de données
4. WHEN un administrateur clique sur le bouton de synchronisation globale, THE
   Onglet_Sync SHALL récupérer toutes les données depuis IGDB et mettre à jour
   tous les champs du jeu
5. WHEN un Champ_Suivi est synchronisé de force (individuel ou global), THE
   Système_Tracking SHALL supprimer le marqueur de modification manuelle pour ce
   champ
6. WHEN la synchronisation d'un champ est en cours, THE Onglet_Sync SHALL
   afficher un indicateur de chargement et désactiver les boutons de
   synchronisation

### Requirement 4 : API de synchronisation

**User Story:** En tant que développeur, je veux une API dédiée pour la
synchronisation des champs depuis IGDB, afin de séparer la logique de
synchronisation de la logique d'édition standard.

#### Critères d'Acceptation

1. WHEN une requête de synchronisation est reçue pour un champ spécifique, THE
   API_Sync SHALL récupérer la donnée depuis IGDB, mettre à jour le champ dans
   la base de données et supprimer le marqueur de modification manuelle
2. WHEN une requête de synchronisation globale est reçue, THE API_Sync SHALL
   récupérer toutes les données depuis IGDB et mettre à jour tous les champs non
   protégés
3. IF une requête de synchronisation est reçue pour un jeu sans igdb_id, THEN
   THE API_Sync SHALL retourner une erreur 400 avec un message explicatif
4. IF la récupération des données IGDB échoue, THEN THE API_Sync SHALL retourner
   une erreur 502 avec le détail de l'échec
5. WHEN la synchronisation réussit, THE API_Sync SHALL retourner les données
   mises à jour du jeu

### Requirement 5 : Schéma de base de données

**User Story:** En tant que développeur, je veux une table dédiée pour stocker
les informations de suivi des modifications, afin de pouvoir interroger
efficacement l'état de chaque champ.

#### Critères d'Acceptation

1. THE Système_Tracking SHALL stocker les données de suivi dans une table
   game_field_overrides avec les colonnes : id, game_id, field_name,
   modified_by, modified_at
2. THE Système_Tracking SHALL garantir l'unicité de la combinaison (game_id,
   field_name) via une contrainte unique
3. THE Système_Tracking SHALL appliquer une politique RLS autorisant uniquement
   les administrateurs à lire et modifier les données de suivi
4. WHEN un jeu est supprimé, THE Système_Tracking SHALL supprimer
   automatiquement les entrées de suivi associées via une contrainte ON DELETE
   CASCADE
