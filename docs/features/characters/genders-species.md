# Character Genders & Species

## Description

Ajout des entités **genre** (gender) et **espèce** (species) au système de
personnages. Chaque entité dispose de traductions FR/EN, d'un CRUD admin
complet, d'une synchronisation IGDB, et d'un affichage public sur la fiche
personnage.

Les genres et espèces sont optionnels : un personnage peut n'avoir ni genre ni
espèce assigné(e).

## Accès

### Pages admin

- **Genders** : `/admin/genders` — liste, création (`/new`), édition
  (`/[id]/edit`)
- **Species** : `/admin/species` — liste, création (`/new`), édition
  (`/[id]/edit`)
- **Character form** : onglets « Genre » et « Espèce » dans le formulaire
  d'édition de personnage, plus un onglet « Sync IGDB » pour les personnages
  liés à IGDB

### API routes

| Route                                  | Méthodes         | Description                         |
| -------------------------------------- | ---------------- | ----------------------------------- |
| `/api/admin/genders`                   | GET, POST        | Liste et création de genres         |
| `/api/admin/genders/[id]`              | GET, PUT, DELETE | Détail, édition, suppression        |
| `/api/admin/species`                   | GET, POST        | Liste et création d'espèces         |
| `/api/admin/species/[id]`              | GET, PUT, DELETE | Détail, édition, suppression        |
| `/api/admin/characters/[id]/sync`      | POST             | Sync IGDB d'un champ                |
| `/api/admin/characters/[id]/overrides` | GET              | Liste des overrides manuels         |
| `/api/characters/[slug]`               | GET              | Détail public (inclut genre/espèce) |

### Affichage public

La fiche personnage (`/characters/[slug]`) affiche le genre et l'espèce traduits
dans la locale courante, dans l'onglet description.

## Prérequis

- Migrations Supabase appliquées :
  - `20240323000001_genders_species_tables.sql` — tables genders, species,
    traductions, FK sur characters
  - `20240324000001_character_field_overrides.sql` — table des overrides manuels
- Rôle admin requis pour les pages et API admin

## Base de données

### Nouvelles tables

- `genders` (id, slug, igdb_id, created_at, updated_at)
- `gender_translations` (gender_id, language_code, name)
- `species` (id, slug, igdb_id, created_at, updated_at)
- `species_translations` (species_id, language_code, name)
- `character_field_overrides` (id, character_id, field_name, overridden_by,
  overridden_at)

### Colonnes ajoutées

- `characters.gender_id` (FK → genders, ON DELETE SET NULL)
- `characters.species_id` (FK → species, ON DELETE SET NULL)

## Utilisation

### Admin — Genders / Species

1. Naviguer vers `/admin/genders` ou `/admin/species`
2. Créer une entrée avec un slug et des traductions FR/EN
3. Modifier ou supprimer via les actions du tableau

### Admin — Assigner à un personnage

1. Ouvrir le formulaire d'édition d'un personnage
2. Onglet « Genre » → sélectionner un genre (ou vider la sélection)
3. Onglet « Espèce » → sélectionner une espèce (ou vider la sélection)
4. Sauvegarder

### Sync IGDB

1. Onglet « Sync IGDB » dans le formulaire personnage (visible si `igdb_id`
   existe)
2. Synchroniser un champ individuel ou tous les champs
3. Les champs modifiés manuellement sont marqués comme « override » (badge
   ambre) et ne sont pas écrasés par un sync-all

### Importeur de personnages

L'importeur IGDB (`scripts/igdb-import/characters/`) crée automatiquement les
genres et espèces lors de l'import, avec déduplication par `igdb_id`.
