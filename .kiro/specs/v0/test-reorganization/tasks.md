z# Implementation Plan: Test Reorganization

## Overview

This implementation plan details the coding tasks required to reorganize the
GameUniverse test suite from scattered locations to a centralized `test/`
directory, and improve code coverage from 81.55% to 95%. All tasks use Bun's
built-in test runner and fast-check for property-based testing.

## Tasks

- [x] 1. Create target directory structure
  - [x] 1.1 Create `test/unit/` directory with subdirectories
    - Create `test/unit/hooks/`
    - Create `test/unit/lib/`
    - Create `test/unit/lib/services/`
    - Create `test/unit/lib/utils/`
    - Create `test/unit/components/`
    - Create `test/unit/components/characters/`
    - Create `test/unit/components/games/`
    - Create `test/unit/components/library/`
    - Create `test/unit/components/players/`
    - Create `test/unit/components/settings/`
    - Create `test/unit/components/shared/`
    - _Requirements: 2.1, 2.4_

  - [x] 1.2 Create `test/integration/` directory with subdirectories
    - Create `test/integration/auth/`
    - Create `test/integration/i18n/`
    - Create `test/integration/middleware/`
    - _Requirements: 2.2_

  - [x] 1.3 Create `test/scripts/` directory
    - Create `test/scripts/igdb-import/`
    - _Requirements: 2.3_

- [x] 2. Migrate hook tests
  - [x] 2.1 Move `src/hooks/__tests__/useAuth.test.ts` to
        `test/unit/hooks/useAuth.test.ts`
    - Update relative imports to use `../../../src/hooks/` prefix
    - Preserve `bun:test` and `fast-check` imports unchanged
    - _Requirements: 1.1, 1.5, 3.1, 3.3_

  - [x] 2.2 Move `src/hooks/__tests__/useProfile.test.ts` to
        `test/unit/hooks/useProfile.test.ts`
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 2.3 Move `src/hooks/__tests__/useUserLibrary.test.ts` to
        `test/unit/hooks/useUserLibrary.test.ts`
    - Update relative imports
    - _Requirements: 1.1, 1.5_

- [x] 3. Migrate library tests
  - [x] 3.1 Move `src/lib/promotions.test.ts` to
        `test/unit/lib/promotions.test.ts`
    - Update relative imports to use `../../src/lib/` prefix
    - _Requirements: 1.3, 1.5_

  - [x] 3.2 Move `src/lib/__tests__/api-response-compatibility.test.ts` to
        `test/unit/lib/api-response-compatibility.test.ts`
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 3.3 Move `src/lib/__tests__/api-utils.property.test.ts` to
        `test/unit/lib/api-utils.property.test.ts`
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 3.4 Move all files from `src/lib/services/__tests__/` to
        `test/unit/lib/services/`
    - Move `baseService.property.test.ts`
    - Move `characterService.property.test.ts`
    - Move `gameImportService.property.test.ts`
    - Move `hybridSearchService.property.test.ts`
    - Move `igdbService.property.test.ts`
    - Move `playerService.stats.property.test.ts`
    - Update all relative imports to use `../../../../src/lib/services/` prefix
    - _Requirements: 1.1, 1.5_

  - [x] 3.5 Move `src/lib/utils/__tests__/game-utils.property.test.ts` to
        `test/unit/lib/utils/game-utils.property.test.ts`
    - Update relative imports
    - _Requirements: 1.1, 1.5_

- [x] 4. Migrate component tests
  - [x] 4.1 Move `src/components/__tests__/` files to `test/unit/components/`
    - Move `AuthForm.test.tsx`
    - Move `GameLibrary.property.test.ts`
    - Move `Navigation.test.tsx`
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 4.2 Move all files from `src/components/characters/__tests__/` to
        `test/unit/components/characters/`
    - Move all 11 character test files
    - Update relative imports to use `../../../../src/components/characters/`
      prefix
    - _Requirements: 1.1, 1.5_

  - [x] 4.3 Move all files from `src/components/games/__tests__/` to
        `test/unit/components/games/`
    - Move all 7 game test files
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 4.4 Move all files from `src/components/library/__tests__/` to
        `test/unit/components/library/`
    - Move all 6 library test files
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 4.5 Move all files from `src/components/players/__tests__/` to
        `test/unit/components/players/`
    - Move all 3 player test files
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 4.6 Move all files from `src/components/settings/__tests__/` to
        `test/unit/components/settings/`
    - Move all 4 settings test files
    - Update relative imports
    - _Requirements: 1.1, 1.5_

  - [x] 4.7 Move all files from `src/components/shared/__tests__/` to
        `test/unit/components/shared/`
    - Move all 7 shared test files
    - Update relative imports
    - _Requirements: 1.1, 1.5_

- [x] 5. Migrate integration tests
  - [x] 5.1 Move `src/test/auth-integration.test.ts` to
        `test/integration/auth/auth-integration.test.ts`
    - Update relative imports
    - _Requirements: 1.2, 1.5_

  - [x] 5.2 Move `src/test/i18n.test.ts` to `test/integration/i18n/i18n.test.ts`
    - Update relative imports
    - _Requirements: 1.2, 1.5_

  - [x] 5.3 Move `src/test/middleware.test.ts` to
        `test/integration/middleware/middleware.test.ts`
    - Update relative imports
    - _Requirements: 1.2, 1.5_

  - [x] 5.4 Move `src/test/navigation-redirections.test.tsx` to
        `test/integration/middleware/navigation-redirections.test.tsx`
    - Update relative imports
    - _Requirements: 1.2, 1.5_

- [x] 6. Migrate script tests
  - [x] 6.1 Move all files from `scripts/igdb-import/__tests__/` to
        `test/scripts/igdb-import/`
    - Move all 8 IGDB import test files
    - Update relative imports to use `../../../scripts/igdb-import/` prefix
    - _Requirements: 1.4, 1.5_

- [x] 7. Checkpoint - Verify migration
  - Ensure all tests pass with `bun test`
  - Verify test count matches pre-migration count
  - Ask the user if questions arise
  - _Requirements: 9.1, 4.2_

- [x] 8. Cleanup old test directories
  - [x] 8.1 Remove empty `__tests__/` directories from `src/`
    - Remove `src/hooks/__tests__/`
    - Remove `src/lib/__tests__/`
    - Remove `src/lib/services/__tests__/`
    - Remove `src/lib/utils/__tests__/`
    - Remove `src/components/__tests__/`
    - Remove `src/components/characters/__tests__/`
    - Remove `src/components/games/__tests__/`
    - Remove `src/components/library/__tests__/`
    - Remove `src/components/players/__tests__/`
    - Remove `src/components/settings/__tests__/`
    - Remove `src/components/shared/__tests__/`
    - _Requirements: 10.1_

  - [x] 8.2 Remove `src/test/` directory
    - _Requirements: 10.2_

  - [x] 8.3 Remove `scripts/igdb-import/__tests__/` directory
    - _Requirements: 10.3_

- [x] 9. Checkpoint - Verify cleanup and tests
  - Ensure all tests still pass after cleanup
  - Verify no orphaned test files remain
  - Ask the user if questions arise
  - _Requirements: 9.1_

- [x] 10. Improve hook test coverage
  - [x] 10.1 Create comprehensive tests for `useAuth` hook
    - Create `test/unit/hooks/useAuth.comprehensive.test.ts`
    - Mock Supabase client with `mock.module()`
    - Test signIn, signUp, signOut, resetPassword functions
    - Test loading states and error handling
    - Target: 95% coverage
    - _Requirements: 5.2, 5.3_

  - [x] 10.2 Write property test for useAuth state transitions
    - **Property: State Transitions**
    - _For any_ valid credentials, auth operations should transition state
      correctly
    - **Validates: Requirements 5.4**

  - [x] 10.3 Create comprehensive tests for `useGameLibraryStatus` hook
    - Create `test/unit/hooks/useGameLibraryStatus.test.ts`
    - Mock Supabase client responses
    - Test status fetching and caching
    - Target: 95% coverage
    - _Requirements: 5.2, 5.3_

  - [x] 10.4 Create comprehensive tests for `useImageLoading` hook
    - Create `test/unit/hooks/useImageLoading.test.ts`
    - Test loading states, error states, success states
    - Target: 95% coverage
    - _Requirements: 5.2_

  - [x] 10.5 Create comprehensive tests for `use-toast` hook
    - Create `test/unit/hooks/use-toast.test.ts`
    - Test toast creation, dismissal, and state management
    - Target: 95% coverage
    - _Requirements: 5.2_

- [x] 11. Improve library utility test coverage
  - [x] 11.1 Create comprehensive tests for `supabase.ts`
    - Create `test/unit/lib/supabase.test.ts`
    - Mock browser environment
    - Test client creation and configuration
    - Target: 95% coverage
    - _Requirements: 6.2, 6.3_

  - [x] 11.2 Create comprehensive tests for `supabase-server.ts`
    - Create `test/unit/lib/supabase-server.test.ts`
    - Mock cookies and server environment
    - Test server client creation
    - Target: 95% coverage
    - _Requirements: 6.2, 6.3_

  - [x] 11.3 Create comprehensive tests for `auth-utils.ts`
    - Create `test/unit/lib/auth-utils.test.ts`
    - Test all authentication utility functions
    - Target: 95% coverage
    - _Requirements: 6.2_

  - [x] 11.4 Create comprehensive tests for `api-client.ts`
    - Create `test/unit/lib/api-client.test.ts`
    - Mock fetch responses
    - Test all API client methods
    - Target: 95% coverage
    - _Requirements: 6.2_

  - [x] 11.5 Create comprehensive tests for `error-handling.ts`
    - Create `test/unit/lib/error-handling.test.ts`
    - Test error transformation and logging
    - Target: 95% coverage
    - _Requirements: 6.2_

  - [x] 11.6 Write property test for error transformation
    - **Property: Error Transformation Consistency**
    - _For any_ error type, transformation should produce valid error response
    - **Validates: Requirements 6.4**

  - [x] 11.7 Create comprehensive tests for `realtime-updates.ts`
    - Create `test/unit/lib/realtime-updates.test.ts`
    - Mock Supabase realtime subscriptions
    - Test subscription management
    - Target: 95% coverage
    - _Requirements: 6.2_

- [x] 12. Improve service test coverage
  - [x] 12.1 Create comprehensive tests for `gameService.ts`
    - Create `test/unit/lib/services/gameService.test.ts`
    - Mock database responses
    - Test all service methods
    - Target: 95% coverage
    - _Requirements: 7.2, 7.3_

  - [x] 12.2 Write property test for gameService data transformation
    - **Property: Data Transformation Consistency**
    - _For any_ valid game data, transformation should preserve essential fields
    - **Validates: Requirements 7.4**

  - [x] 12.3 Create comprehensive tests for `playerService.ts`
    - Create `test/unit/lib/services/playerService.test.ts`
    - Mock database responses
    - Test all service methods
    - Target: 95% coverage
    - _Requirements: 7.2, 7.3_

  - [x] 12.4 Create comprehensive tests for `characterService.ts` - Create
        `test/unit/lib/services/characterService.test.ts` - Mock database
        responses - Test all service methods - Target: 95% coverage -
        _Requirements: 7.2, 7.3_ zzz- [x] 13. Checkpoint - Verify service
        coverage
  - Run `bun test --coverage` and verify service coverage > 95%
  - Ask the user if questions arise
  - _Requirements: 9.2_

- [x] 14. Improve component test coverage
  - [x] 14.1 Create comprehensive tests for `ErrorBoundary.tsx`
    - Create `test/unit/components/shared/ErrorBoundary.test.tsx`
    - Test error catching and fallback rendering
    - Test error recovery
    - Target: 95% coverage
    - _Requirements: 8.2_

  - [x] 14.2 Create comprehensive tests for `SearchBar.tsx`
    - Create `test/unit/components/shared/SearchBar.comprehensive.test.tsx`
    - Test input handling, debouncing, clear functionality
    - Target: 95% coverage
    - _Requirements: 8.2_

  - [x] 14.3 Create comprehensive tests for `FilterPanel.tsx`
    - Create `test/unit/components/shared/FilterPanel.comprehensive.test.tsx`
    - Test filter selection, reset, and state management
    - Target: 95% coverage
    - _Requirements: 8.2_

  - [x] 14.4 Create comprehensive tests for `GameSearchBar.tsx`
    - Create `test/unit/components/games/GameSearchBar.comprehensive.test.tsx`
    - Test search input, suggestions, and selection
    - Target: 95% coverage
    - _Requirements: 8.2_

  - [x] 14.5 Create comprehensive tests for `SearchResultsDropdown.tsx`
    - Create
      `test/unit/components/games/SearchResultsDropdown.comprehensive.test.tsx`
    - Test result rendering, selection, and keyboard navigation
    - Target: 95% coverage
    - _Requirements: 8.2_

  - [x] 14.6 Write property test for component prop rendering
    - **Property: Prop Rendering Consistency**
    - _For any_ valid prop combination, component should render without errors
    - **Validates: Requirements 8.4**

- [x] 15. Final checkpoint - Verify overall coverage
  - Run `bun test --coverage`
  - Verify overall coverage > 95%
  - Generate coverage report summary
  - Ask the user if questions arise
  - _Requirements: 9.2, 9.4_

- [x] 16. Exécution des tests complets
  - [x] 16.1 Exécuter `bun test --run`
  - [x] 16.2 Vérifier que tous les tests passent
  - [x] 16.3 Corriger les tests en échec si nécessaire

- [x] 17. Lint du code
  - [x] 17.1 Exécuter `bun run lint`
  - [x] 17.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 17.3 Corriger les erreurs de lint si nécessaire

- [x] 18. Build de production
  - [x] 18.1 Exécuter `bun run build`
  - [x] 18.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 18.3 Corriger les erreurs de build si nécessaire

- [x] 19. Créer le steering pour la structure des tests
  - [x] 19.1 Créer le fichier `.kiro/steering/test-structure.md`
    - Définir la règle obligatoire de placer tous les tests dans `test/`
    - Documenter la structure des sous-dossiers (`unit/`, `integration/`,
      `scripts/`)
    - Interdire la création de dossiers `__tests__/` dans `src/`
    - Spécifier les conventions de nommage des fichiers de test
    - Inclure des exemples de chemins corrects et incorrects

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped
  for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- All tests use `bun:test` imports exclusively (no Vitest)
- Property tests use fast-check library with minimum 100 iterations
- Mocking uses Bun's `mock()`, `spyOn()`, and `mock.module()` utilities
