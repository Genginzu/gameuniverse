# Implementation Plan: Admin Character Management

## Tasks

- [x] 1. Create types and validation schema
  - [x] 1.1 Create types file `src/types/admin-characters.ts`
  - [x] 1.2 Create Zod schema `src/lib/validations/admin-character-form.ts`
  - [x] 1.3 Create serialization utils `src/lib/utils/character-form-utils.ts`
  - [x] 1.4 Write property-based tests for schema validation
  - [x] 1.5 Write property-based test for round-trip serialization

- [x] 2. Create admin API routes
  - [x] 2.1 Create `src/app/api/admin/characters/route.ts` (GET + POST)
  - [x] 2.2 Create `src/app/api/admin/characters/[id]/route.ts` (GET+PUT+DELETE)
  - [x] 2.3 Write property-based test for search filter
  - [x] 2.4 Write unit tests for API routes

- [x] 3. Checkpoint - Verify types, validations and API work

- [x] 4. Create admin hooks
  - [x] 4.1 Create `src/hooks/useAdminCharacters.ts`
  - [x] 4.2 Create `src/hooks/useCharacterForm.ts`

- [x] 5. Create table and delete dialog components
  - [x] 5.1 Create `src/components/admin/characters/AdminCharactersTable.tsx`
  - [x] 5.2 Create `src/components/admin/characters/DeleteCharacterDialog.tsx`

- [x] 6. Create multi-tab form components
  - [x] 6.1 Create `src/components/admin/characters/CharacterForm.tsx`
  - [x] 6.2 Create `src/components/admin/characters/CharacterFormGeneralTab.tsx`
  - [x] 6.3 Create `src/components/admin/characters/CharacterFormImagesTab.tsx`
  - [x] 6.4 Create
        `src/components/admin/characters/CharacterFormTranslationsTab.tsx`
  - [x] 6.5 Create `src/components/admin/characters/CharacterFormGamesTab.tsx`
  - [x] 6.6 Create `src/components/admin/characters/CharacterFormMediaTab.tsx`

- [x] 7. Create admin pages
  - [x] 7.1 Create `src/app/[locale]/admin/characters/page.tsx`
  - [x] 7.2 Create `src/app/[locale]/admin/characters/new/page.tsx`
  - [x] 7.3 Create `src/app/[locale]/admin/characters/[id]/edit/page.tsx`

- [x] 8. Integrate navigation and i18n
  - [x] 8.1 Add Characters link in AdminSidebar
  - [x] 8.2 Add i18n keys in fr.json and en.json

- [x] 9. Run full test suite
  - [x] 9.1 Run `bun run test:all`
  - [x] 9.2 Verify all tests pass
  - [x] 9.3 Fix failing tests if needed

- [x] 10. Lint code
  - [x] 10.1 Run `bun run lint`
  - [x] 10.2 Verify no lint errors
  - [x] 10.3 Fix lint errors if needed

- [x] 11. Production build
  - [x] 11.1 Run `bun run build`
  - [x] 11.2 Verify no build errors
  - [x] 11.3 Fix build errors if needed

- [x] 12. Feature README
  - [x] 12.1 Create `docs/README_ADMIN_CHARACTER_MANAGEMENT.md`
  - [x] 12.2 Document implementation, access, prerequisites and usage
