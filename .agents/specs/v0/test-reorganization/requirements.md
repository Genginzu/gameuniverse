# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive audit and
reorganization of the GameUniverse project's test suite. The goal is to
centralize all tests in a single `test/` directory at the project root, improve
test organization with a clear folder structure mirroring the source code, and
increase code coverage from the current 81.55% to over 95%.

## Glossary

- **Test_Reorganizer**: The system responsible for moving, organizing, and
  updating test files
- **Coverage_Analyzer**: The system responsible for identifying files with low
  test coverage
- **Test_Runner**: Bun's built-in test runner used exclusively for running tests
- **Property_Test**: A test using fast-check library to verify properties across
  many generated inputs
- **Unit_Test**: A test verifying specific examples, edge cases, and error
  conditions
- **Test_Setup**: The global configuration file (`test/setup.ts`) loaded before
  all tests

## Requirements

### Requirement 1: Test File Centralization

**User Story:** As a developer, I want all tests centralized in a single `test/`
directory, so that I can easily find and manage all project tests in one
location.

#### Acceptance Criteria

1. WHEN the reorganization is complete, THE Test_Reorganizer SHALL have moved
   all test files from `src/**/__tests__/` to `test/unit/`
2. WHEN the reorganization is complete, THE Test_Reorganizer SHALL have moved
   all test files from `src/test/` to `test/integration/`
3. WHEN the reorganization is complete, THE Test_Reorganizer SHALL have moved
   `src/lib/promotions.test.ts` to `test/unit/lib/`
4. WHEN the reorganization is complete, THE Test_Reorganizer SHALL have moved
   all test files from `scripts/igdb-import/__tests__/` to
   `test/scripts/igdb-import/`
5. WHEN a test file is moved, THE Test_Reorganizer SHALL update all import paths
   to reflect the new location
6. WHEN a test file is moved, THE Test_Reorganizer SHALL preserve the original
   test functionality without modification

### Requirement 2: Directory Structure Organization

**User Story:** As a developer, I want the test directory structure to mirror
the source code structure, so that I can easily locate tests for any given
source file.

#### Acceptance Criteria

1. THE Test_Reorganizer SHALL create a `test/unit/` directory for all unit tests
2. THE Test_Reorganizer SHALL create a `test/integration/` directory for all
   integration tests
3. THE Test_Reorganizer SHALL create a `test/scripts/` directory for
   script-related tests
4. WHEN organizing unit tests, THE Test_Reorganizer SHALL create subdirectories
   matching the source structure:
   - `test/unit/hooks/` for hook tests
   - `test/unit/lib/` for library tests
   - `test/unit/lib/services/` for service tests
   - `test/unit/lib/utils/` for utility tests
   - `test/unit/components/` for component tests with subdirectories for each
     component category
5. THE Test_Reorganizer SHALL maintain the existing `test/setup.ts` and
   `test/setup.test.ts` at the root of the test directory

### Requirement 3: Import Path Updates

**User Story:** As a developer, I want all import paths in test files to be
correctly updated after reorganization, so that all tests continue to pass.

#### Acceptance Criteria

1. WHEN a test file imports from a relative path, THE Test_Reorganizer SHALL
   update the path to correctly reference the source file from the new test
   location
2. WHEN a test file imports from `@/` alias, THE Test_Reorganizer SHALL preserve
   the alias import unchanged
3. WHEN a test file imports from `bun:test`, THE Test_Reorganizer SHALL preserve
   the import unchanged
4. WHEN a test file imports from `fast-check`, THE Test_Reorganizer SHALL
   preserve the import unchanged
5. IF an import path update fails, THEN THE Test_Reorganizer SHALL report the
   error and continue with remaining files

### Requirement 4: Test Configuration Update

**User Story:** As a developer, I want the test configuration to work with the
new directory structure, so that all tests can be discovered and run correctly.

#### Acceptance Criteria

1. THE Test_Reorganizer SHALL verify that `bunfig.toml` preload path remains
   valid (`./test/setup.ts`)
2. WHEN all tests are reorganized, THE Test_Runner SHALL discover and execute
   all tests from the new `test/` directory
3. WHEN running `bun test`, THE Test_Runner SHALL execute tests with the same
   configuration (timeout, coverage, parallel)

### Requirement 5: Coverage Improvement for Hooks

**User Story:** As a developer, I want comprehensive tests for all hooks, so
that hook behavior is verified and coverage exceeds 95%.

#### Acceptance Criteria

1. THE Coverage_Analyzer SHALL identify hooks with coverage below 50%:
   - `src/hooks/useAuth.ts` (2.37%)
   - `src/hooks/useGameLibraryStatus.ts` (2.88%)
   - `src/hooks/useImageLoading.ts` (2.33%)
   - `src/hooks/use-toast.ts` (14.39%)
2. WHEN new tests are written for hooks, THE Test_Reorganizer SHALL place them
   in `test/unit/hooks/`
3. WHEN testing hooks, THE Unit_Test SHALL mock external dependencies (Supabase,
   Next.js router)
4. WHEN testing hooks, THE Property_Test SHALL verify state transitions for all
   valid inputs

### Requirement 6: Coverage Improvement for Library Utilities

**User Story:** As a developer, I want comprehensive tests for all library
utilities, so that utility behavior is verified and coverage exceeds 95%.

#### Acceptance Criteria

1. THE Coverage_Analyzer SHALL identify library files with coverage below 30%:
   - `src/lib/supabase.ts` (15%)
   - `src/lib/supabase-server.ts` (11.63%)
   - `src/lib/auth-utils.ts` (4.76%)
   - `src/lib/api-client.ts` (9.22%)
   - `src/lib/error-handling.ts` (19.72%)
   - `src/lib/realtime-updates.ts` (26.23%)
2. WHEN new tests are written for library utilities, THE Test_Reorganizer SHALL
   place them in `test/unit/lib/`
3. WHEN testing Supabase utilities, THE Unit_Test SHALL mock Supabase client
   responses
4. WHEN testing error handling, THE Property_Test SHALL verify error
   transformation for all error types

### Requirement 7: Coverage Improvement for Services

**User Story:** As a developer, I want comprehensive tests for all services, so
that service behavior is verified and coverage exceeds 95%.

#### Acceptance Criteria

1. THE Coverage_Analyzer SHALL identify services with coverage below 15%:
   - `src/lib/services/gameService.ts` (9.78%)
   - `src/lib/services/playerService.ts` (9.01%)
   - `src/lib/services/characterService.ts` (6.82%)
2. WHEN new tests are written for services, THE Test_Reorganizer SHALL place
   them in `test/unit/lib/services/`
3. WHEN testing services, THE Unit_Test SHALL mock database responses
4. WHEN testing services, THE Property_Test SHALL verify data transformation
   consistency

### Requirement 8: Coverage Improvement for Components

**User Story:** As a developer, I want comprehensive tests for UI components
with low coverage, so that component behavior is verified and coverage exceeds
95%.

#### Acceptance Criteria

1. THE Coverage_Analyzer SHALL identify components with coverage below 50%:
   - `src/components/shared/ErrorBoundary.tsx` (9.68%)
   - `src/components/shared/SearchBar.tsx` (7.42%)
   - `src/components/shared/FilterPanel.tsx` (9.74%)
   - `src/components/games/GameSearchBar.tsx` (40.81%)
   - `src/components/games/SearchResultsDropdown.tsx` (2.99%)
2. WHEN new tests are written for components, THE Test_Reorganizer SHALL place
   them in the appropriate `test/unit/components/` subdirectory
3. WHEN testing React components, THE Unit_Test SHALL use @testing-library/react
4. WHEN testing component props, THE Property_Test SHALL verify rendering for
   all valid prop combinations

### Requirement 9: Test Execution Verification

**User Story:** As a developer, I want to verify that all tests pass after
reorganization, so that I can be confident the reorganization was successful.

#### Acceptance Criteria

1. WHEN reorganization is complete, THE Test_Runner SHALL execute all tests
   successfully
2. WHEN running `bun test --coverage`, THE Coverage_Analyzer SHALL report
   overall coverage above 95%
3. IF any test fails after reorganization, THEN THE Test_Reorganizer SHALL
   report the failure with details
4. WHEN all tests pass, THE Test_Reorganizer SHALL generate a summary of moved
   files and coverage improvements

### Requirement 10: Cleanup of Old Test Directories

**User Story:** As a developer, I want old test directories removed after
reorganization, so that there is no confusion about test locations.

#### Acceptance Criteria

1. WHEN all tests are successfully moved and verified, THE Test_Reorganizer
   SHALL remove empty `__tests__/` directories from `src/`
2. WHEN all tests are successfully moved and verified, THE Test_Reorganizer
   SHALL remove the `src/test/` directory
3. WHEN all tests are successfully moved and verified, THE Test_Reorganizer
   SHALL remove the `scripts/igdb-import/__tests__/` directory
4. IF a directory still contains non-test files, THEN THE Test_Reorganizer SHALL
   preserve the directory and report the remaining files
