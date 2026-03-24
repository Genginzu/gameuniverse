# Design Document — Character Genders & Species

## Overview

Ce design décrit l'ajout des entités **genre** (gender) et **espèce** (species)
au système de personnages de Game Universe. Les deux entités suivent un pattern
identique : table principale + table de traductions, avec FK nullable sur
`characters`. Le design s'appuie sur les patterns existants du projet (genres de
jeux, field overrides, IGDB sync) pour garantir la cohérence.

### Périmètre

- 3 migrations SQL (genders + species, character FK columns,
  character_field_overrides)
- 2 pages admin CRUD (genders, species) calquées sur le pattern `admin/genres`
- 2 nouveaux onglets dans le CharacterForm (sélection gender/species)
- 1 onglet de synchronisation IGDB (CharacterFormSyncTab) calqué sur
  GameFormSyncTab
- Mise à jour du Character Importer pour importer gender/species depuis IGDB
- Routes API RESTful pour genders et species
- Affichage public sur la page de détails du personnage
- Table `character_field_overrides` + indicateurs visuels (badges IGDB/override)

### Décisions clés

| Décision        | Choix                                                                | Justification                                                                        |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Structure DB    | Tables séparées genders/species avec translations                    | Réutilisabilité, cohérence avec le pattern genres de jeux                            |
| API routing     | `/api/admin/genders` et `/api/admin/species`                         | Cohérence avec les routes admin existantes (`/api/admin/genres`, `/api/admin/roles`) |
| Sync pattern    | Calqué sur `useGameSync` + `igdb-sync.ts`                            | Pattern éprouvé, même UX pour l'admin                                                |
| Field overrides | Table `character_field_overrides` identique à `game_field_overrides` | Cohérence, même logique de protection des modifications manuelles                    |
| Validation      | Zod schemas dans `src/lib/validations/`                              | Pattern existant du projet                                                           |

## Architecture

```mermaid
graph TD
    subgraph Database
        G[genders] --> GT[gender_translations]
        S[species] --> ST[species_translations]
        C[characters] -->|gender_id FK| G
        C -->|species_id FK| S
        CFO[character_field_overrides] -->|character_id FK| C
    end

    subgraph "Admin UI"
        AGP[Admin Gender Page] -->|CRUD| GAPI[/api/admin/genders]
        ASP[Admin Species Page] -->|CRUD| SAPI[/api/admin/species]
        CF[CharacterForm] -->|gender_id, species_id| CAPI[/api/admin/characters]
        CST[CharacterFormSyncTab] -->|sync| CSAPI[/api/admin/characters/id/sync]
        CST -->|overrides| COAPI[/api/admin/characters/id/overrides]
    end

    subgraph "Public UI"
        CDP[Character Detail Page] -->|fetch| PCA[/api/characters/slug]
    end

    subgraph "Import Script"
        CI[Character Importer] -->|upsert| G
        CI -->|upsert| S
        CI -->|insert| C
    end

    GAPI --> G
    SAPI --> S
    CAPI --> C
    CSAPI -->|igdb-character-sync.ts| IGDB[IGDB API]
```

## Components and Interfaces

### Database Migrations

**Migration 1 : `20240323000001_genders_species_tables.sql`**

Crée les tables `genders`, `gender_translations`, `species`,
`species_translations`, ajoute les colonnes `gender_id` et `species_id` à
`characters`, avec index et RLS.

**Migration 2 : `20240324000001_character_field_overrides.sql`**

Crée la table `character_field_overrides` calquée sur `game_field_overrides`.

### Zod Validation Schemas

**`src/lib/validations/admin-gender-form.ts`** — Schéma pour le formulaire
gender (slug + translations FR/EN). Calqué sur `admin-genre-form.ts`.

**`src/lib/validations/admin-species-form.ts`** — Schéma identique pour species.

### Type Definitions

**`src/types/admin-genders.ts`** — Types pour l'admin gender CRUD :

```typescript
export interface AdminGender {
  id: string;
  slug: string;
  igdbId: number | null;
  name: string;
  updatedAt: string;
}

export interface GenderPayload {
  slug: string;
  igdb_id?: number | null;
  translations: Array<{ language_code: string; name: string }>;
}
```

**`src/types/admin-species.ts`** — Types identiques pour species.

**Mise à jour de `src/types/admin-characters.ts`** — Ajout de `gender_id` et
`species_id` dans `CharacterPayload`, ajout de `CharacterTabId` pour les
nouveaux onglets (`gender`, `species`, `sync`), ajout de
`CharacterTrackableField` et `CharacterFieldOverride`.

**Mise à jour de `src/types/character.ts`** — Ajout de `gender` et `species`
(objets `{ id, slug, name }`) dans `CharacterDetails` et `CharacterSummary`.

### API Routes

| Route                                  | Méthode | Description                                |
| -------------------------------------- | ------- | ------------------------------------------ |
| `/api/admin/genders`                   | GET     | Liste des genders avec traductions         |
| `/api/admin/genders`                   | POST    | Création d'un gender                       |
| `/api/admin/genders/[id]`              | GET     | Détail d'un gender                         |
| `/api/admin/genders/[id]`              | PUT     | Modification d'un gender                   |
| `/api/admin/genders/[id]`              | DELETE  | Suppression d'un gender                    |
| `/api/admin/species`                   | GET     | Liste des species avec traductions         |
| `/api/admin/species`                   | POST    | Création d'une species                     |
| `/api/admin/species/[id]`              | GET     | Détail d'une species                       |
| `/api/admin/species/[id]`              | PUT     | Modification d'une species                 |
| `/api/admin/species/[id]`              | DELETE  | Suppression d'une species                  |
| `/api/admin/characters/[id]/overrides` | GET     | Liste des field overrides d'un personnage  |
| `/api/admin/characters/[id]/sync`      | POST    | Synchronisation IGDB d'un champ personnage |

Les routes genders/species suivent le même pattern que
`/api/admin/genres/[slug]` mais utilisent l'`id` UUID comme identifiant de route
(cohérence avec les FK).

### Admin UI Components

**Pages admin genders** (`src/app/[locale]/admin/genders/`) :

- `page.tsx` — Liste avec `AdminGendersTable`
- `new/page.tsx` — Formulaire de création
- `[id]/edit/page.tsx` — Formulaire d'édition

**Pages admin species** (`src/app/[locale]/admin/species/`) :

- Même structure que genders

**Composants admin genders** (`src/components/admin/genders/`) :

- `AdminGendersTable.tsx` — Tableau de liste (calqué sur `AdminGenresTable`)
- `GenderForm.tsx` — Formulaire CRUD (calqué sur `GenreForm`)
- `DeleteGenderDialog.tsx` — Dialogue de confirmation de suppression

**Composants admin species** (`src/components/admin/species/`) :

- Même structure que genders

**Nouveaux onglets CharacterForm** (`src/components/admin/characters/`) :

- `CharacterFormGenderTab.tsx` — Select dropdown pour choisir un gender
- `CharacterFormSpeciesTab.tsx` — Select dropdown pour choisir une species
- `CharacterFormSyncTab.tsx` — Onglet de synchronisation IGDB (calqué sur
  `GameFormSyncTab`)

### Character Importer Updates

**`scripts/igdb-import/characters/character-importer.ts`** :

- Nouvelle fonction `ensureGender(igdbGender)` : upsert dans `genders` +
  `gender_translations` par `igdb_id`
- Nouvelle fonction `ensureSpecies(igdbSpecies)` : upsert dans `species` +
  `species_translations` par `igdb_id`
- Modification de `importCharacterFromIGDB()` : appel à
  `ensureGender`/`ensureSpecies` avant l'insert du personnage, passage de
  `gender_id`/`species_id` dans l'insert

### Character IGDB Sync Service

**`src/lib/services/igdb-character-sync.ts`** — Service de synchronisation
calqué sur `igdb-sync.ts` mais pour les personnages. Champs synchronisables :
`translations`, `main_image`, `gender`, `species`, `games`.

**`src/hooks/useCharacterSync.ts`** — Hook client calqué sur `useGameSync.ts`.

### Public Display

Mise à jour de la section d'aperçu dans la page de détails du personnage
(`src/app/[locale]/characters/[slug]/`) pour afficher le genre et l'espèce
traduits, avec le design glassmorphism existant. Les champs ne s'affichent que
s'ils ont une valeur (pas de label vide).

## Data Models

### Table `genders`

| Colonne    | Type         | Contraintes                   |
| ---------- | ------------ | ----------------------------- |
| id         | UUID         | PK, DEFAULT gen_random_uuid() |
| igdb_id    | INTEGER      | UNIQUE, nullable              |
| slug       | VARCHAR(255) | UNIQUE, NOT NULL              |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()                 |
| updated_at | TIMESTAMPTZ  | DEFAULT NOW()                 |

### Table `gender_translations`

| Colonne       | Type         | Contraintes                                  |
| ------------- | ------------ | -------------------------------------------- |
| id            | UUID         | PK, DEFAULT gen_random_uuid()                |
| gender_id     | UUID         | FK → genders(id) ON DELETE CASCADE, NOT NULL |
| language_code | VARCHAR(2)   | FK → languages(code), NOT NULL               |
| name          | VARCHAR(255) | NOT NULL                                     |
|               |              | UNIQUE(gender_id, language_code)             |

### Table `species`

Structure identique à `genders`.

### Table `species_translations`

Structure identique à `gender_translations` avec `species_id` au lieu de
`gender_id`.

### Table `character_field_overrides`

| Colonne       | Type        | Contraintes                                      |
| ------------- | ----------- | ------------------------------------------------ |
| id            | UUID        | PK, DEFAULT gen_random_uuid()                    |
| character_id  | UUID        | FK → characters(id) ON DELETE CASCADE, NOT NULL  |
| field_name    | TEXT        | NOT NULL                                         |
| overridden_by | UUID        | FK → auth.users(id) ON DELETE SET NULL, nullable |
| overridden_at | TIMESTAMPTZ | DEFAULT NOW()                                    |
|               |             | UNIQUE(character_id, field_name)                 |

### Modifications à `characters`

| Colonne ajoutée | Type | Contraintes                                   |
| --------------- | ---- | --------------------------------------------- |
| gender_id       | UUID | FK → genders(id) ON DELETE SET NULL, nullable |
| species_id      | UUID | FK → species(id) ON DELETE SET NULL, nullable |

### RLS Policies

- `genders`, `gender_translations`, `species`, `species_translations` : SELECT
  public, ALL pour admins
- `character_field_overrides` : ALL pour admins uniquement (pas de lecture
  publique)

### Index

- `genders.slug`, `species.slug`
- `gender_translations.gender_id`, `gender_translations.language_code`
- `species_translations.species_id`, `species_translations.language_code`
- `characters.gender_id`, `characters.species_id`
- `character_field_overrides.character_id`

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system — essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Gender/Species CRUD round-trip

_For any_ valid gender (or species) payload containing a slug and translations
(FR + EN), creating the entity via POST then reading it via GET should return
the same slug and translation names. Updating via PUT then reading again should
return the updated values.

**Validates: Requirements 3.3, 3.5, 4.3, 4.5, 8.1, 8.2, 8.3, 8.4, 8.6**

### Property 2: Gender/Species deletion cascades correctly

_For any_ gender (or species) that has associated characters, deleting the
entity should remove all its translation rows and set the corresponding FK
(`gender_id` or `species_id`) to NULL on every previously-associated character.
After deletion, a GET request for that entity should return 404.

**Validates: Requirements 3.7, 4.7, 8.5, 8.6**

### Property 3: API validation rejects invalid data

_For any_ gender (or species) creation/update payload that violates the Zod
schema (empty slug, missing translations, slug with invalid characters), the API
should return HTTP 400. _For any_ non-existent UUID used in a GET, PUT, or
DELETE request, the API should return HTTP 404.

**Validates: Requirements 8.7, 8.8**

### Property 4: Character gender/species save round-trip

_For any_ character and any valid gender and species selection (including NULL),
saving the character form and then reloading it should display the same gender
and species selections. Deselecting (setting to NULL) and saving should also
round-trip correctly.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 5: Character detail displays translated gender/species in current locale

_For any_ character with an assigned gender and/or species, and _for any_
supported locale (FR or EN), the character detail API response should include
the gender and species names matching the translations stored for that locale.
When neither gender nor species is assigned, the response should omit those
fields entirely.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 6: Importer creates gender/species and assigns correct FKs

_For any_ IGDB character that has a `character_gender` and/or
`character_species`, after import the `genders` (or `species`) table should
contain a row with the matching `igdb_id` and English translation, and the
imported character row should have `gender_id` (or `species_id`) pointing to
that row. When the IGDB character has no gender/species, the FK columns should
be NULL.

**Validates: Requirements 7.1, 7.2, 7.4, 7.5**

### Property 7: Importer gender/species upsert is idempotent

_For any_ IGDB gender (or species), importing it twice (via two different
characters referencing the same `igdb_id`) should result in exactly one row in
the `genders` (or `species`) table. The second import should reuse the existing
row without creating a duplicate.

**Validates: Requirements 7.3**

### Property 8: Manual field edit creates override record

_For any_ IGDB-linked character and _for any_ trackable field, when an admin
manually edits that field, the `character_field_overrides` table should contain
exactly one record for that (character_id, field_name) pair. The GET overrides
API should return this record.

**Validates: Requirements 10.2, 10.8**

### Property 9: Sync removes override and updates value

_For any_ character field that has an override record, syncing that field from
IGDB should update the field value in the database and remove the corresponding
override record from `character_field_overrides`.

**Validates: Requirements 9.3, 10.5**

### Property 10: Sync-all respects overridden fields

_For any_ IGDB-linked character with a set of overridden fields, invoking
sync-all should synchronize only the non-overridden fields and leave the
overridden fields unchanged. The override records for protected fields should
remain intact.

**Validates: Requirements 9.4**

### Property 11: Override state determines badge display

_For any_ trackable field on an IGDB-linked character, if the field has an
override record the UI helper should return "overridden" (amber badge), and if
it does not have an override record the helper should return "igdb" (blue
badge). For characters without an `igdb_id`, no badge should be shown.

**Validates: Requirements 10.3, 10.4**

## Error Handling

### API Error Responses

| Situation                                              | HTTP Code | Response Body                           |
| ------------------------------------------------------ | --------- | --------------------------------------- |
| Payload invalide (Zod validation failure)              | 400       | `{ error: string, details?: ZodError }` |
| Entité non trouvée (GET/PUT/DELETE avec ID inexistant) | 404       | `{ error: "Not found" }`                |
| Utilisateur non authentifié                            | 401       | `{ error: "Unauthorized" }`             |
| Utilisateur non admin                                  | 403       | `{ error: "Forbidden" }`                |
| Erreur serveur (DB, réseau)                            | 500       | `{ error: string }`                     |
| Slug déjà existant (conflit UNIQUE)                    | 409       | `{ error: "Slug already exists" }`      |

### Importer Error Handling

- Les erreurs d'upsert gender/species sont loguées mais ne bloquent pas l'import
  du personnage (le FK reste NULL en cas d'échec)
- Le mode dry-run affiche les informations gender/species dans les logs sans
  toucher à la DB
- Les erreurs réseau IGDB sont gérées par le mécanisme de retry existant

### Sync Error Handling

- Si l'API IGDB est indisponible, le sync retourne une erreur descriptive sans
  modifier les données locales
- Si un champ individuel échoue pendant sync-all, l'erreur est reportée mais les
  autres champs continuent à être synchronisés
- Les erreurs de sync sont affichées dans un bandeau rouge dans le
  CharacterFormSyncTab (même pattern que GameFormSyncTab)

### UI Error Handling

- Les formulaires CRUD affichent les erreurs de validation inline sous chaque
  champ (pattern react-hook-form existant)
- Les erreurs réseau sont affichées via toast notifications
- Le dialogue de suppression gère l'échec avec un message d'erreur et permet de
  réessayer

## Testing Strategy

### Approche duale : tests unitaires + tests property-based

Les deux types de tests sont complémentaires et nécessaires :

- **Tests unitaires** : exemples spécifiques, cas limites, conditions d'erreur,
  vérifications structurelles (schéma DB, rendu UI)
- **Tests property-based** : propriétés universelles vérifiées sur des entrées
  générées aléatoirement

### Bibliothèque property-based testing

Le projet utilise **fast-check** (`fast-check`) avec Vitest. Chaque test
property-based doit exécuter un minimum de **100 itérations**.

### Convention de nommage des tests

- Tests unitaires : `test/unit/**/*.test.ts`
- Tests property-based : `test/unit/**/*.property.test.ts`

### Tagging des tests property-based

Chaque test property-based doit inclure un commentaire référençant la propriété
du design document :

```typescript
// Feature: character-genders-species, Property 1: Gender/Species CRUD round-trip
```

### Plan de tests unitaires

| Fichier test                                                          | Cible              | Couverture                                 |
| --------------------------------------------------------------------- | ------------------ | ------------------------------------------ |
| `test/unit/lib/validations/admin-gender-form.test.ts`                 | Zod schema gender  | Validation slug, translations, cas limites |
| `test/unit/lib/validations/admin-species-form.test.ts`                | Zod schema species | Idem                                       |
| `test/unit/api/admin/genders.test.ts`                                 | Routes API genders | CRUD, erreurs 400/404                      |
| `test/unit/api/admin/species.test.ts`                                 | Routes API species | CRUD, erreurs 400/404                      |
| `test/unit/components/admin/characters/CharacterFormSyncTab.test.tsx` | Sync tab UI        | Rendu avec/sans igdb_id, badges            |
| `test/unit/components/admin/genders/GenderForm.test.tsx`              | Formulaire gender  | Rendu, soumission, validation              |
| `test/unit/scripts/character-importer.test.ts`                        | Character importer | Import avec/sans gender/species            |

### Plan de tests property-based

| Fichier test                                                    | Propriété  | Description                                                                                    |
| --------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `test/unit/lib/validations/admin-gender-form.property.test.ts`  | P1, P3     | Round-trip validation : toute donnée valide passe le schéma, toute donnée invalide est rejetée |
| `test/unit/lib/validations/admin-species-form.property.test.ts` | P1, P3     | Idem pour species                                                                              |
| `test/unit/api/admin/genders.property.test.ts`                  | P1, P2, P3 | CRUD round-trip, cascade deletion, error codes                                                 |
| `test/unit/scripts/character-importer.property.test.ts`         | P6, P7     | Import crée les entités, idempotence de l'upsert                                               |
| `test/unit/lib/services/igdb-character-sync.property.test.ts`   | P9, P10    | Sync supprime les overrides, sync-all respecte les overrides                                   |

### Chaque propriété du design est couverte par un SEUL test property-based

- Property 1 → `admin-gender-form.property.test.ts` (+ species equivalent)
- Property 2 → `genders.property.test.ts` (+ species equivalent)
- Property 3 → `admin-gender-form.property.test.ts` (validation) +
  `genders.property.test.ts` (API errors)
- Property 4 → `admin-character-form.property.test.ts`
- Property 5 → `character-detail.property.test.ts`
- Property 6 → `character-importer.property.test.ts`
- Property 7 → `character-importer.property.test.ts`
- Property 8 → `igdb-character-sync.property.test.ts`
- Property 9 → `igdb-character-sync.property.test.ts`
- Property 10 → `igdb-character-sync.property.test.ts`
- Property 11 → `igdb-character-sync.property.test.ts`
