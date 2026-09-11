C'est bien # Implementation Plan: Character Genders & Species

## Overview

Ajout des entités genre (gender) et espèce (species) au système de personnages, incluant les migrations DB, les routes API CRUD, les pages admin, l'intégration dans le formulaire de personnage, la synchronisation IGDB, l'affichage public, et la mise à jour de l'importeur. Toutes les tâches utilisent TypeScript/Next.js et suivent les patterns existants du projet.

## Tasks

- [x] 1. Database migrations
  - [x] 1.1 Create migration for genders and species tables
    - Create `supabase/migrations/20240323000001_genders_species_tables.sql`
    - Tables: `genders`, `gender_translations`, `species`, `species_translations`
    - Add `gender_id` and `species_id` FK columns to `characters`
    - Create indexes on slugs, translation FKs, and character FKs
    - Enable RLS: public SELECT, admin ALL on all four tables
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.2 Create migration for character_field_overrides table
    - Create `supabase/migrations/20240324000001_character_field_overrides.sql`
    - Table: `character_field_overrides` with `id`, `character_id`, `field_name`, `overridden_by`, `overridden_at`
    - UNIQUE constraint on (character_id, field_name)
    - RLS: admin-only read/write
    - Index on `character_field_overrides.character_id`
    - _Requirements: 10.1, 10.6, 10.7_

- [x] 2. Type definitions and validation schemas
  - [x] 2.1 Create type definitions for admin genders and species
    - Create `src/types/admin-genders.ts` with `AdminGender`, `GenderPayload` interfaces
    - Create `src/types/admin-species.ts` with `AdminSpecies`, `SpeciesPayload` interfaces
    - Update `src/types/admin-characters.ts`: add `gender_id`, `species_id` to `CharacterPayload`, add `CharacterTabId` entries for `gender`, `species`, `sync`, add `CharacterTrackableField` and `CharacterFieldOverride` types
    - Update `src/types/character.ts`: add `gender` and `species` objects (`{ id, slug, name }`) to `CharacterDetails` and `CharacterSummary`
    - _Requirements: 1.3, 2.3, 5.3, 5.4, 6.1, 6.2_

  - [x] 2.2 Create Zod validation schemas for gender and species forms
    - Create `src/lib/validations/admin-gender-form.ts` (slug + translations FR/EN), modeled on `admin-genre-form.ts`
    - Create `src/lib/validations/admin-species-form.ts` (same structure)
    - _Requirements: 3.3, 3.5, 4.3, 4.5, 8.7_

  - [x] 2.3 Write property tests for gender validation schema
    - **Property 1: Gender/Species CRUD round-trip** (validation part)
    - **Property 3: API validation rejects invalid data** (validation part)
    - Create `test/unit/lib/validations/admin-gender-form.property.test.ts`
    - Use fast-check with 100+ iterations to verify valid payloads pass and invalid payloads are rejected
    - **Validates: Requirements 3.3, 3.5, 8.7**

  - [x] 2.4 Write property tests for species validation schema
    - **Property 1: Gender/Species CRUD round-trip** (validation part)
    - **Property 3: API validation rejects invalid data** (validation part)
    - Create `test/unit/lib/validations/admin-species-form.property.test.ts`
    - Use fast-check with 100+ iterations
    - **Validates: Requirements 4.3, 4.5, 8.7**

- [x] 3. API routes for genders and species
  - [x] 3.1 Create admin genders API routes
    - Create `src/app/api/admin/genders/route.ts` (GET list, POST create)
    - Create `src/app/api/admin/genders/[id]/route.ts` (GET detail, PUT update, DELETE)
    - Follow pattern from `src/app/api/admin/genres/` routes
    - Handle 400 (Zod validation), 404 (not found), 409 (slug conflict)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.8_

  - [x] 3.2 Create admin species API routes
    - Create `src/app/api/admin/species/route.ts` (GET list, POST create)
    - Create `src/app/api/admin/species/[id]/route.ts` (GET detail, PUT update, DELETE)
    - Same pattern as genders routes
    - _Requirements: 8.6, 8.7, 8.8_

  - [x] 3.3 Create character overrides API route
    - Create `src/app/api/admin/characters/[id]/overrides/route.ts` (GET list of overrides)
    - _Requirements: 10.8_

  - [x] 3.4 Create character sync API route
    - Create `src/app/api/admin/characters/[id]/sync/route.ts` (POST sync a field from IGDB)
    - _Requirements: 9.3, 9.4_

  - [x] 3.5 Write property tests for genders API
    - **Property 1: Gender/Species CRUD round-trip** (API part)
    - **Property 2: Gender/Species deletion cascades correctly**
    - **Property 3: API validation rejects invalid data** (API error codes)
    - Create `test/unit/api/admin/genders.property.test.ts`
    - Use fast-check with 100+ iterations
    - **Validates: Requirements 3.3, 3.5, 3.7, 8.1–8.5, 8.7, 8.8**

  - [x] 3.6 Write unit tests for genders and species API routes
    - Create `test/unit/api/admin/genders.test.ts`
    - Create `test/unit/api/admin/species.test.ts`
    - Test CRUD operations, 400/404 error responses
    - _Requirements: 8.1–8.8_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Admin CRUD pages and components for genders
  - [x] 5.1 Create admin genders SWR hook
    - Create `src/hooks/useAdminGenders.ts` with SWR fetching, create, update, delete mutations
    - Follow pattern from `useAdminGenres.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.2 Create admin genders components
    - Create `src/components/admin/genders/AdminGendersTable.tsx` — list table (modeled on `AdminGenresTable`)
    - Create `src/components/admin/genders/GenderForm.tsx` — CRUD form (modeled on `GenreForm`)
    - Create `src/components/admin/genders/DeleteGenderDialog.tsx` — confirmation dialog
    - Glassmorphism design, dark mode, Iconify icons
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.8_

  - [x] 5.3 Create admin genders pages
    - Create `src/app/[locale]/admin/genders/page.tsx` — list page
    - Create `src/app/[locale]/admin/genders/new/page.tsx` — create page
    - Create `src/app/[locale]/admin/genders/[id]/edit/page.tsx` — edit page
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 5.4 Add i18n translations for admin genders
    - Add `admin.genders` namespace keys in `src/messages/fr.json` and `src/messages/en.json`
    - Labels: title, table columns, form fields, buttons, delete dialog, toasts
    - _Requirements: 3.9_

  - [x] 5.5 Write unit tests for GenderForm component
    - Create `test/unit/components/admin/genders/GenderForm.test.tsx`
    - Test rendering, form submission, validation display
    - _Requirements: 3.2, 3.3, 3.5_

- [x] 6. Admin CRUD pages and components for species
  - [x] 6.1 Create admin species SWR hook
    - Create `src/hooks/useAdminSpecies.ts` with SWR fetching, create, update, delete mutations
    - _Requirements: 8.6_

  - [x] 6.2 Create admin species components
    - Create `src/components/admin/species/AdminSpeciesTable.tsx`
    - Create `src/components/admin/species/SpeciesForm.tsx`
    - Create `src/components/admin/species/DeleteSpeciesDialog.tsx`
    - Glassmorphism design, dark mode, Iconify icons
    - _Requirements: 4.1, 4.2, 4.4, 4.6, 4.8_

  - [x] 6.3 Create admin species pages
    - Create `src/app/[locale]/admin/species/page.tsx` — list page
    - Create `src/app/[locale]/admin/species/new/page.tsx` — create page
    - Create `src/app/[locale]/admin/species/[id]/edit/page.tsx` — edit page
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.4 Add i18n translations for admin species
    - Add `admin.species` namespace keys in `src/messages/fr.json` and `src/messages/en.json`
    - Labels: title, table columns, form fields, buttons, delete dialog, toasts
    - _Requirements: 4.9_

  - [x] 6.5 Write unit tests for SpeciesForm component
    - Create `test/unit/components/admin/species/SpeciesForm.test.tsx`
    - Test rendering, form submission, validation display
    - _Requirements: 4.2, 4.3, 4.5_

- [x] 7. Character form gender, species, and sync tabs
  - [x] 7.1 Create CharacterFormGenderTab component
    - Create `src/components/admin/characters/CharacterFormGenderTab.tsx`
    - Select dropdown fetching genders via SWR, stores `gender_id`
    - Support nullable selection (deselect)
    - _Requirements: 5.1, 5.3, 5.6, 5.7_

  - [x] 7.2 Create CharacterFormSpeciesTab component
    - Create `src/components/admin/characters/CharacterFormSpeciesTab.tsx`
    - Select dropdown fetching species via SWR, stores `species_id`
    - Support nullable selection (deselect)
    - _Requirements: 5.2, 5.4, 5.6, 5.7_

  - [x] 7.3 Wire gender and species tabs into CharacterForm
    - Update `src/components/admin/characters/CharacterForm.tsx` to add gender and species tab entries
    - Update `src/components/admin/characters/CharacterFormTabContent.tsx` to render the new tabs
    - Update `src/hooks/useCharacterForm.ts` to include `gender_id` and `species_id` in form state and submission
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [x] 7.4 Add i18n translations for character form tabs
    - Add keys for gender tab, species tab, and sync tab labels in `src/messages/fr.json` and `src/messages/en.json`
    - _Requirements: 5.8_

  - [x] 7.5 Write property test for character gender/species save round-trip
    - **Property 4: Character gender/species save round-trip**
    - Create `test/unit/api/admin/character-form.property.test.ts`
    - Use fast-check to verify saving gender_id/species_id (including NULL) round-trips correctly
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. IGDB sync service and character sync tab
  - [x] 9.1 Create IGDB character sync service
    - Create `src/lib/services/igdb-character-sync.ts` modeled on `igdb-sync.ts`
    - Syncable fields: `translations`, `main_image`, `gender`, `species`, `games`
    - Handle override creation on manual edit, override removal on sync
    - _Requirements: 9.3, 9.4, 10.2, 10.5_

  - [x] 9.2 Create useCharacterSync hook
    - Create `src/hooks/useCharacterSync.ts` modeled on `useGameSync.ts`
    - SWR-based, handles single-field sync and sync-all
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 9.3 Create useCharacterOverrides hook
    - Create `src/hooks/useCharacterOverrides.ts` modeled on `useGameOverrides.ts`
    - Fetches override records for a character, provides badge state helper
    - _Requirements: 10.3, 10.4, 10.8_

  - [x] 9.4 Create CharacterFormSyncTab component
    - Create `src/components/admin/characters/CharacterFormSyncTab.tsx` modeled on `GameFormSyncTab.tsx`
    - Display syncable fields with status badges (IGDB blue / override amber)
    - Sync individual field button, sync-all button
    - Message when character has no `igdb_id`
    - Glassmorphism design, dark mode, Iconify icons
    - _Requirements: 9.1, 9.2, 9.5, 9.6, 9.7_

  - [x] 9.5 Wire sync tab into CharacterForm
    - Add sync tab entry in `CharacterForm.tsx` and `CharacterFormTabContent.tsx`
    - Only show sync tab for characters with `igdb_id`
    - _Requirements: 9.1, 9.2_

  - [x] 9.6 Add i18n translations for sync tab
    - Add `admin.characters.sync` namespace keys in `src/messages/fr.json` and `src/messages/en.json`
    - Labels: tab title, field names, sync buttons, status badges, error messages
    - _Requirements: 9.8_

  - [x] 9.7 Write property tests for IGDB character sync service
    - **Property 8: Manual field edit creates override record**
    - **Property 9: Sync removes override and updates value**
    - **Property 10: Sync-all respects overridden fields**
    - **Property 11: Override state determines badge display**
    - Create `test/unit/lib/services/igdb-character-sync.property.test.ts`
    - Use fast-check with 100+ iterations
    - **Validates: Requirements 9.3, 9.4, 10.2, 10.3, 10.4, 10.5, 10.8**

  - [x] 9.8 Write unit tests for CharacterFormSyncTab component
    - Create `test/unit/components/admin/characters/CharacterFormSyncTab.test.tsx`
    - Test rendering with/without igdb_id, badge display, sync button interactions
    - _Requirements: 9.1, 9.2, 9.7, 10.3, 10.4_

- [x] 10. Character importer updates
  - [x] 10.1 Add ensureGender and ensureSpecies functions to character importer
    - Update `scripts/igdb-import/characters/character-importer.ts`
    - Add `ensureGender(igdbGender)`: upsert into `genders` + `gender_translations` by `igdb_id`
    - Add `ensureSpecies(igdbSpecies)`: upsert into `species` + `species_translations` by `igdb_id`
    - Modify `importCharacterFromIGDB()` to call `ensureGender`/`ensureSpecies` before character insert, pass `gender_id`/`species_id`
    - Handle NULL gender/species gracefully (FK stays NULL)
    - Maintain dry-run compatibility (log gender/species info without DB writes)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.2 Write property tests for character importer gender/species
    - **Property 6: Importer creates gender/species and assigns correct FKs**
    - **Property 7: Importer gender/species upsert is idempotent**
    - Create `test/unit/scripts/character-importer.property.test.ts`
    - Use fast-check with 100+ iterations
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x] 10.3 Write unit tests for character importer
    - Create `test/unit/scripts/character-importer.test.ts`
    - Test import with gender/species, without gender/species, idempotent upsert
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Public display of gender and species
  - [x] 11.1 Update character detail API to include gender and species
    - Update `src/app/api/characters/[slug]/route.ts` (or equivalent) to join genders/species with translations for current locale
    - Return `gender: { id, slug, name }` and `species: { id, slug, name }` when assigned, omit when NULL
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 11.2 Update character detail page to display gender and species
    - Update character overview section in `src/app/[locale]/characters/[slug]/` to render gender and species names
    - Only display when values are present (no empty labels)
    - Glassmorphism design, dark mode
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 11.3 Add i18n translations for public character gender/species display
    - Add `characters.details.gender` and `characters.details.species` keys in `src/messages/fr.json` and `src/messages/en.json`
    - _Requirements: 6.4_

  - [x] 11.4 Write property test for character detail locale display
    - **Property 5: Character detail displays translated gender/species in current locale**
    - Create `test/unit/api/characters/character-detail.property.test.ts`
    - Use fast-check with 100+ iterations to verify locale-correct translations and omission when NULL
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Lint du code
  - [x] 13.1 Exécuter `bun run lint`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 13.3 Corriger les erreurs et warnings de lint si nécessaire

- [x] 14. Build de production
  - [x] 14.1 Exécuter `bun run build`
  - [x] 14.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 14.3 Corriger les erreurs de build si nécessaire

- [x] 15. README de la fonctionnalité
  - [x] 15.1 Créer `docs/README_character-genders-species.md`
  - [x] 15.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1–11)
- Unit tests validate specific examples and edge cases
- All components use glassmorphism design with dark mode support
- All user-facing text uses i18n via next-intl (FR + EN)
- Database changes via supabase migrations only
- Tests in `test/` directory using Vitest + fast-check
