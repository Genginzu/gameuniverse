# Implementation Plan: Code Refactoring

## Overview

This implementation plan breaks down the code refactoring into discrete,
testable tasks organized by phase. Each task builds on previous work and
includes property-based tests where applicable. The refactoring maintains
backward compatibility throughout.

## Tasks

- [x] 1. Phase 1: Cleanup and Service Layer Consolidation
  - [x] 1.1 Delete unused backup file
    - Delete `src/components/games/GameDetailsContent.tsx.backup`
    - Verify no files reference the backup file
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create BaseService abstract class
    - Create `src/lib/services/baseService.ts`
    - Implement `getBaseUrl()` static method
    - Implement generic `fetchDetails(identifier, locale)` method
    - Implement generic `fetchList(options)` method
    - Implement generic `exists(identifier, locale)` method
    - Implement generic `generateMetadata(identifier, locale)` method
    - Use TypeScript generics for type safety
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 1.3 Write property tests for BaseService
    - **Property 1: Service Backward Compatibility**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 1.4 Refactor GameService to extend BaseService
    - Modify `src/lib/services/gameService.ts` to extend BaseService
    - Remove duplicated methods (fetchGameDetails, fetchGames, gameExists,
      generateGameMetadata)
    - Ensure backward compatibility with existing API
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 1.5 Refactor PlayerService to extend BaseService
    - Modify `src/lib/services/playerService.ts` to extend BaseService
    - Remove duplicated methods while retaining entity-specific methods
    - Keep `calculateStats`, `validatePlayerId`, `fetchPlayersFromDB`,
      `fetchPlayerDetailsFromDB`
    - Ensure backward compatibility
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.6 Refactor CharacterService to extend BaseService
    - Modify `src/lib/services/characterService.ts` to extend BaseService
    - Remove duplicated methods while retaining entity-specific methods
    - Keep `fetchCharactersFromDB`, `fetchCharacterDetailsFromDB`
    - Ensure backward compatibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Checkpoint - Phase 1 Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Phase 2: UI Component Consolidation
  - [x] 3.1 Create EntityCard generic component
    - Create `src/components/shared/EntityCard.tsx`
    - Implement configurable aspect ratio (3:4 or 1:1)
    - Implement configurable badge rendering
    - Implement configurable hover overlay
    - Implement optional action buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.2 Create EntityCard preset configurations
    - Create `src/components/shared/entityCardPresets.ts`
    - Define `gameCardConfig` matching current GameCard behavior
    - Define `playerCardConfig` matching current PlayerCard behavior
    - Define `characterCardConfig` matching current CharacterCard behavior
    - _Requirements: 6.6, 6.7, 6.8_

  - [x] 3.3 Write property tests for EntityCard
    - **Property 2: EntityCard Configuration Rendering**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

  - [x] 3.4 Create EntitySkeleton component
    - Create `src/components/shared/EntitySkeleton.tsx`
    - Implement configurable aspect ratio
    - Implement optional badge skeleton
    - Implement optional info section skeleton
    - Create preset configurations for games, players, characters
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 3.5 Write property tests for EntitySkeleton
    - **Property 3: EntitySkeleton Configuration Rendering**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [x] 3.6 Create GridSkeleton component
    - Create `src/components/shared/GridSkeleton.tsx`
    - Accept skeleton component configuration
    - Accept configurable item count (default 20)
    - Use responsive grid layout matching current implementations
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 3.7 Write property tests for GridSkeleton
    - **Property 4: GridSkeleton Item Count**
    - **Validates: Requirements 8.1, 8.2**

- [x] 4. Checkpoint - Phase 2 Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Phase 3: Shared Components
  - [x] 5.1 Create generic Pagination component
    - Create `src/components/shared/Pagination.tsx`
    - Accept currentPage, totalPages, totalCount, onPageChange props
    - Accept optional loading state
    - Accept configurable translation namespace
    - Implement page navigation buttons (first, previous, next, last)
    - Implement page numbers with ellipsis for large page counts
    - Implement mobile-friendly page selector dropdown
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 5.2 Write property tests for Pagination
    - **Property 5: Pagination State Management**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5, 9.7**

  - [x] 5.3 Create generic SearchBar component
    - Create `src/components/shared/SearchBar.tsx`
    - Accept onSearch callback for debounced search
    - Accept optional hybrid search configuration
    - Accept configurable placeholder text
    - Accept configurable debounce delay (default 300ms)
    - Implement clear button when query is not empty
    - Support simple mode (debounced callback)
    - Support hybrid mode (dropdown results)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 5.4 Write property tests for SearchBar
    - **Property 6: SearchBar Debouncing**
    - **Validates: Requirements 10.1, 10.3, 10.4, 10.5, 10.6**

  - [x] 5.5 Create generic FilterPanel component
    - Create `src/components/shared/FilterPanel.tsx`
    - Accept generic filter configuration array
    - Implement checkbox-based multi-select filters
    - Display active filters with remove buttons
    - Implement clear all filters button
    - Support expandable/collapsible filter sections
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 5.6 Write property tests for FilterPanel
    - **Property 7: FilterPanel State Consistency**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [x] 6. Checkpoint - Phase 3 Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Phase 4: API Route Utilities and Type Centralization
  - [ ] 7.1 Create API utilities module
    - Create `src/lib/api-utils.ts`
    - Implement `parsePaginationParams(searchParams)` function
    - Implement `parseArrayParam(value)` function
    - Implement `createPaginatedResponse(data, pagination, filters)` function
    - Implement `handleApiError(error)` function
    - Ensure safe defaults for invalid pagination parameters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 7.2 Write property tests for API utilities
    - **Property 8: API Utilities Parameter Parsing**
    - **Property 9: API Response Formatting**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

  - [ ] 7.3 Create shared Supabase types file
    - Create `src/lib/types/supabase-queries.ts`
    - Define GameRow, GameTranslationRow, GenreTranslationRow types
    - Define GameGenreRow, GameCompanyRow types
    - Define CharacterRow, CharacterTranslationRow, CharacterGameRow types
    - Define ProfileRow, LibraryEntryRow types
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 7.4 Update API routes to use shared utilities and types
    - Update `/api/games` routes to import from shared types
    - Update `/api/players` routes to import from shared types
    - Update `/api/characters` routes to import from shared types
    - Use API utilities for parameter parsing and response formatting
    - _Requirements: 13.5_

- [ ] 8. Checkpoint - Phase 4 Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Phase 5: GameDetailsContent Decomposition
  - [ ] 9.1 Extract shared game utilities
    - Create `src/lib/utils/game-utils.ts`
    - Extract `getGameColors(gameTitle, genres)` function
    - Extract `formatReleaseDate(dateString, locale)` function
    - Extract `formatPrice(price, currency, locale)` function
    - Extract `getMetascoreColor(score)` function
    - _Requirements: 14.6, 14.7_

  - [ ] 9.2 Write property tests for game utilities
    - **Property 10: Game Color Scheme Generation**
    - **Property 11: Formatting Utilities Correctness**
    - **Validates: Requirements 14.6, 14.7**

  - [ ] 9.3 Create GameHeroSection component
    - Create `src/components/games/details/GameHeroSection.tsx`
    - Extract hero section with background image
    - Extract floating navigation buttons
    - Extract cover image with metascore badge
    - _Requirements: 14.1_

  - [ ] 9.4 Create GameOverviewSection component
    - Create `src/components/games/details/GameOverviewSection.tsx`
    - Extract overview info cards (developer, publisher, release date,
      metascore, platforms, genres)
    - _Requirements: 14.4_

  - [ ] 9.5 Create GameMediaGallery component
    - Create `src/components/games/details/GameMediaGallery.tsx`
    - Extract screenshots gallery with navigation
    - Extract artwork gallery with navigation
    - Extract videos gallery with navigation
    - _Requirements: 14.2_

  - [ ] 9.6 Create GameDetailsTabs component
    - Create `src/components/games/details/GameDetailsTabs.tsx`
    - Extract tab navigation
    - Integrate with existing GameAgeRatings, GameVersions, GamePlaytime
      components
    - _Requirements: 14.3_

  - [ ] 9.7 Create GamePricingSection component
    - Create `src/components/games/details/GamePricingSection.tsx`
    - Extract pricing cards with store links
    - _Requirements: 14.5_

  - [ ] 9.8 Refactor GameDetailsContent to compose sub-components
    - Update `src/components/games/GameDetailsContent.tsx`
    - Import and compose all extracted sub-components
    - Ensure visual output is identical to original
    - Verify component is under 200 lines
    - _Requirements: 14.8, 14.9_

- [ ] 10. Checkpoint - Phase 5 Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Final Integration and Backward Compatibility Verification
  - [ ] 11.1 Update existing pages to use new shared components
    - Update Games page to use EntityCard with gameCardConfig
    - Update Players page to use EntityCard with playerCardConfig
    - Update Characters page to use EntityCard with characterCardConfig
    - Update all pages to use shared Pagination component
    - _Requirements: 15.2_

  - [ ] 11.2 Write visual regression tests
    - Compare EntityCard output with original card components
    - Compare refactored GameDetailsContent with original
    - **Validates: Requirements 15.2**

  - [ ] 11.3 Write API response compatibility tests
    - Verify all API routes return unchanged response formats
    - **Validates: Requirements 15.3**

- [ ] 12. Final Checkpoint - All Phases Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 16 requirements are satisfied
  - _Requirements: 16.7_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each phase
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The refactoring maintains backward compatibility throughout all phases
