# Implementation Plan: Character Pages

## Overview

Ce plan d'implémentation décompose la fonctionnalité de pages de personnages en
tâches discrètes et incrémentales. Chaque tâche construit sur les précédentes et
se termine par l'intégration du code. L'approche suit strictement les patterns
établis par les pages de jeux existantes.

## Tasks

- [x] 1. Create database schema and migrations
  - Create migration file for characters table (id, slug, main_image,
    background_image, background_color, timestamps) - following games pattern
  - Create migration file for character_translations table (id, character_id,
    language_code, name, role, description, biography) with UNIQUE constraint
  - Create migration file for character_games junction table with foreign keys
    and is_primary flag
  - Create migration file for character_media table with type constraints
  - Add indexes for performance (slug, character_id, language_code, game_id)
  - Add full-text search indexes on character_translations.name (French and
    English)
  - Add trigger for updated_at on characters table
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 2. Define TypeScript types and interfaces
  - Create src/types/character.ts file
  - Define CharacterMedia interface with screenshots, artwork, and videos arrays
  - Define CharacterGame interface for game relations
  - Define CharacterDetails interface for full character data
  - Define CharacterSummary interface for list view
  - Define Pagination interface
  - Define CharacterFilters interface
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 3. Implement CharacterService
  - [x] 3.1 Create src/lib/services/characterService.ts
    - Implement fetchCharacterDetails(slug, locale) method with error handling
    - Implement fetchCharacters(options) method with pagination and filters
    - Implement characterExists(slug, locale) helper method
    - Implement generateCharacterMetadata(slug, locale) for SEO
    - Follow the exact pattern from GameService
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.2 Write property test for CharacterService
    - **Property 11: API Filter Application**
    - **Validates: Requirements 8.3**

- [x] 4. Implement API routes
  - [x] 4.1 Create GET /api/characters route
    - Create src/app/api/characters/route.ts
    - Parse and validate query parameters (locale, page, limit, search, games,
      roles)
    - Call CharacterService.fetchCharacters with parameters
    - Return paginated JSON response with proper error handling
    - Handle 400 for invalid parameters, 500 for server errors
    - _Requirements: 8.1, 8.3, 8.4_

  - [x] 4.2 Write unit tests for /api/characters route
    - Test successful response with pagination metadata
    - Test query parameter parsing
    - Test error responses (400, 500)
    - _Requirements: 8.1, 8.4_

  - [x] 4.3 Create GET /api/characters/[slug] route
    - Create src/app/api/characters/[slug]/route.ts
    - Parse slug and locale parameters
    - Call CharacterService.fetchCharacterDetails
    - Return 404 if character not found
    - Return character JSON with proper error handling
    - _Requirements: 8.2, 8.5_

  - [x] 4.4 Write unit tests for /api/characters/[slug] route
    - Test successful character retrieval
    - Test 404 for invalid slug
    - Test error handling
    - _Requirements: 8.2, 8.5_

  - [x] 4.5 Write property test for API pagination metadata
    - **Property 7: API Pagination Metadata Completeness**
    - **Validates: Requirements 4.4, 8.4**

- [ ] 5. Checkpoint - Verify API layer
  - Ensure all API routes are functional and return correct data formats
  - Verify database queries work correctly
  - Ask the user if questions arise

- [x] 6. Create base UI components
  - [x] 6.1 Create CharacterCard component
    - Create src/components/characters/CharacterCard.tsx
    - Implement card with image, name, primary game, role badge, games count
    - Use LazyImage for optimized loading
    - Add hover effects and Link to details page
    - Follow GameCard pattern exactly
    - _Requirements: 1.2, 12.1_

  - [x] 6.2 Write unit tests for CharacterCard
    - Test all required fields are displayed
    - Test missing role is handled gracefully
    - Test link navigation
    - _Requirements: 1.2_

  - [x] 6.3 Write property test for CharacterCard rendering
    - **Property 1: Character Card Rendering Completeness**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 6.4 Create CharacterSearchBar component
    - Create src/components/characters/CharacterSearchBar.tsx
    - Implement search input with debounce (300ms)
    - Add clear button when value is present
    - Use i18n for placeholder text
    - Follow GameSearchBar pattern exactly
    - _Requirements: 2.1, 9.2_

  - [x] 6.5 Write unit tests for CharacterSearchBar
    - Test debounce functionality
    - Test clear button
    - Test onSearch callback
    - _Requirements: 2.1_

  - [x] 6.6 Create CharacterGridSkeleton component
    - Create src/components/characters/CharacterGridSkeleton.tsx
    - Implement skeleton cards matching CharacterCard layout
    - Accept count prop for number of skeletons
    - Follow GameGridSkeleton pattern
    - _Requirements: 1.4, 10.1_

- [x] 7. Create filter components
  - [x] 7.1 Create CharacterFilterButton component
    - Create src/components/characters/CharacterFilterButton.tsx
    - Implement toggle button with filter count badge
    - Show active state when filters are applied
    - Follow GameFilterButton pattern
    - _Requirements: 3.1, 3.2_

  - [x] 7.2 Create CharacterFilters component
    - Create src/components/characters/CharacterFilters.tsx
    - Implement game filter section with Badge chips
    - Implement role filter section with predefined roles
    - Add clear filters button
    - Handle show/hide based on showAllFilters prop
    - Follow GameFilters pattern exactly
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.3 Write property test for multi-filter conjunction
    - **Property 3: Multi-Filter Conjunction**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 7.4 Write property test for filter clear round-trip
    - **Property 4: Filter Clear Round-Trip**
    - **Validates: Requirements 3.4**

  - [x] 7.5 Create CharacterPagination component
    - Create src/components/characters/CharacterPagination.tsx
    - Implement page number buttons with current page highlight
    - Add previous/next buttons
    - Show total count and page info
    - Follow GamePagination pattern
    - _Requirements: 4.1, 4.2_

  - [x] 7.6 Write property test for pagination visibility
    - **Property 5: Pagination Visibility Threshold**
    - **Validates: Requirements 4.1**

- [x] 8. Implement AllCharactersContent component
  - [x] 8.1 Create AllCharactersContent component
    - Create src/components/characters/AllCharactersContent.tsx
    - Set up state management (characters, pagination, loading, filters)
    - Implement useApiClient and useAsyncError hooks
    - Implement fetchCharacters function with error handling
    - Implement fetchGames function for filter options
    - Implement search, filter, and pagination handlers
    - Follow AllGamesContent pattern exactly
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.2, 10.2_

  - [x] 8.2 Add hero section to AllCharactersContent
    - Implement gradient hero with title and description
    - Display total character count from pagination
    - Add decorative elements
    - Match AllGamesContent hero styling
    - _Requirements: 1.1, 9.2_

  - [x] 8.3 Add search and filters section
    - Integrate CharacterSearchBar component
    - Integrate CharacterFilterButton component
    - Integrate CharacterFilters component
    - Implement responsive layout (flex-col on mobile, flex-row on desktop)
    - _Requirements: 2.1, 3.1, 3.2_

  - [x] 8.4 Add results display section
    - Show results info with count and active filters
    - Implement loading state with CharacterGridSkeleton
    - Implement character grid with CharacterCard components
    - Implement empty state with clear filters button
    - Add CharacterPagination component
    - _Requirements: 1.1, 1.2, 1.4, 2.3, 4.1_

  - [x] 8.5 Write property test for case-insensitive search
    - **Property 2: Case-Insensitive Search Filtering**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 8.6 Write property test for pagination state preservation
    - **Property 6: Pagination State Preservation**
    - **Validates: Requirements 4.3**

  - [x] 8.7 Write integration tests for AllCharactersContent
    - Test initial load of characters
    - Test search updates results
    - Test filters update results
    - Test pagination works
    - Test combination of search + filters + pagination
    - _Requirements: 1.1, 1.3, 2.1, 3.1, 4.2_

- [x] 9. Create character list page
  - [x] 9.1 Create /[locale]/characters/page.tsx
    - Create src/app/[locale]/characters/page.tsx
    - Import and render AllCharactersContent component
    - Pass locale from params
    - Add metadata for SEO
    - Wrap with DashboardLayout
    - _Requirements: 1.1, 1.5, 9.2_

  - [x] 9.2 Create error.tsx for character list page
    - Create src/app/[locale]/characters/error.tsx
    - Implement error UI with retry button
    - Follow existing error page patterns
    - _Requirements: 10.2_

- [ ] 10. Checkpoint - Verify character list page
  - Test character list page loads correctly
  - Test search functionality works
  - Test filters work
  - Test pagination works
  - Ensure all tests pass
  - Ask the user if questions arise

- [x] 11. Implement CharacterDetailsContent component
  - [x] 11.1 Create CharacterDetailsContent component structure
    - Create src/components/characters/CharacterDetailsContent.tsx
    - Set up state management (selected media indexes, active tab, favorites)
    - Implement getCharacterColors utility function
    - Implement formatDate utility function
    - Follow GameDetailsContent pattern exactly
    - _Requirements: 5.1, 5.5_

  - [x] 11.2 Add sticky header to CharacterDetailsContent
    - Implement sticky header with back button
    - Add share and favorite buttons
    - Match GameDetailsContent header styling
    - _Requirements: 5.1_

  - [x] 11.3 Add hero section with background image
    - Implement hero section with background image and gradient overlays
    - Use character backgroundColor for theming
    - Add responsive grid layout (4 columns left, 8 columns right)
    - _Requirements: 5.2, 5.5_

  - [x] 11.4 Add character cover and info section
    - Implement left column with main character image
    - Add role badges
    - Display character name as h1
    - Show metadata (games, role)
    - Display description
    - _Requirements: 5.2, 5.3_

  - [x] 11.5 Add overview cards section
    - Create overview grid with cards for primary game, role, appearances count
    - Use dynamic colors from getCharacterColors
    - Match GameDetailsContent overview styling
    - _Requirements: 5.3_

  - [x] 11.6 Add tabs navigation
    - Implement tabs for Media, Games, Biography
    - Add active state styling
    - Handle tab switching
    - _Requirements: 5.4, 6.1_

  - [x] 11.7 Add media tab content
    - Implement screenshots gallery with navigation and thumbnails
    - Implement artwork gallery with navigation and thumbnails
    - Implement videos section with player and list
    - Use LazyImage for all images
    - Handle empty media gracefully
    - _Requirements: 6.1, 6.3_

  - [x] 11.8 Add games tab content
    - Display list of games featuring the character
    - Show game cards with cover images
    - Highlight primary game
    - _Requirements: 5.3_

  - [x] 11.9 Add biography tab content
    - Display character biography text
    - Format with proper typography
    - Handle missing biography gracefully
    - _Requirements: 5.4_

  - [x] 11.10 Write property test for character details completeness
    - **Property 8: Character Details Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 11.11 Write property test for media gallery completeness
    - **Property 9: Media Gallery Completeness**
    - **Validates: Requirements 6.1**

  - [x] 11.12 Write unit tests for CharacterDetailsContent
    - Test all sections render correctly
    - Test tab switching
    - Test media navigation
    - Test empty states
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.3_

- [x] 12. Create character details page
  - [x] 12.1 Create /[locale]/characters/[slug]/page.tsx
    - Create src/app/[locale]/characters/[slug]/page.tsx
    - Fetch character details using CharacterService.fetchCharacterDetails
    - Handle 404 with notFound() for invalid slugs
    - Render CharacterDetailsContent component
    - Pass character data and locale
    - _Requirements: 5.1, 8.2, 10.3_

  - [x] 12.2 Add metadata generation for character details page
    - Use CharacterService.generateCharacterMetadata
    - Export generateMetadata function
    - Include OpenGraph tags
    - _Requirements: 5.1_

  - [x] 12.3 Create not-found.tsx for character details
    - Create src/app/[locale]/characters/[slug]/not-found.tsx
    - Implement 404 UI with back to list button
    - Follow existing 404 page patterns
    - _Requirements: 10.3_

  - [x] 12.4 Create error.tsx for character details page
    - Create src/app/[locale]/characters/[slug]/error.tsx
    - Implement error UI with retry button
    - Follow existing error page patterns
    - _Requirements: 10.2_

  - [x] 12.5 Write integration tests for character details page
    - Test character details load correctly
    - Test 404 handling for invalid slug
    - Test media gallery navigation
    - Test tab switching
    - _Requirements: 5.1, 6.1, 10.3_

- [x] 13. Add internationalization
  - [x] 13.1 Add French translations
    - Add character-related keys to messages/fr.json
    - Include: searchPlaceholder, filters, roles, tabs, empty states, errors
    - _Requirements: 9.1, 9.2_

  - [x] 13.2 Add English translations
    - Add character-related keys to messages/en.json
    - Ensure parity with French translations
    - _Requirements: 9.1, 9.2_

  - [x] 13.3 Write property test for locale-based content
    - **Property 12: Locale-Based Content Display**
    - **Validates: Requirements 9.2**

- [x] 14. Add database query implementation
  - [x] 14.1 Implement character list query in CharacterService
    - Add SQL query with filters (search, games, roles)
    - Add pagination with LIMIT and OFFSET
    - Add locale-based field selection
    - Include games count subquery
    - _Requirements: 7.4, 8.3_

  - [x] 14.2 Implement character details query in CharacterService
    - Add SQL query with all relations (games, media)
    - Use JSON aggregation for nested data
    - Add locale-based field selection
    - Handle missing character (return null)
    - _Requirements: 7.4, 8.2_

  - [x] 14.3 Write property test for database relation loading
    - **Property 10: Database Query Relation Loading**
    - **Validates: Requirements 7.4**

- [ ] 15. Final integration and testing
  - [ ] 15.1 Test complete user flow
    - Navigate to /characters page
    - Search for characters
    - Apply filters
    - Navigate through pages
    - Click on character card
    - View character details
    - Navigate media gallery
    - Switch between tabs
    - Return to list
    - _Requirements: 1.1, 2.1, 3.1, 4.2, 5.1, 6.1_

  - [ ] 15.2 Test error scenarios
    - Test API errors with retry
    - Test 404 character not found
    - Test empty search results
    - Test network errors
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 15.3 Test responsive design
    - Test on mobile viewport
    - Test on tablet viewport
    - Test on desktop viewport
    - Verify all layouts work correctly
    - _Requirements: 1.1, 5.1_

  - [x] 15.4 Run all property-based tests
    - Execute all property tests with 100+ iterations
    - Verify all properties pass
    - Fix any failing properties
    - _All property requirements_

  - [x] 15.5 Run all unit tests
    - Execute complete unit test suite
    - Verify 80%+ code coverage
    - Fix any failing tests
    - _All unit test requirements_

- [ ] 16. Final checkpoint
  - Ensure all features work as expected
  - Verify all tests pass (unit and property-based)
  - Confirm UI matches design patterns from game pages
  - Ask the user if questions arise or if ready for deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Follow existing patterns from game pages exactly to ensure consistency
