# Implementation Plan: Library Games View

## Overview

This implementation plan transforms the library page to use the same rich
interface as the games catalog, with search, filters, and pagination. The
approach focuses on reusing existing components while adding library-specific
filtering to the API and creating a new LibraryGamesContent component that
mirrors AllGamesContent but with library context.

## Tasks

- [x] 1. Modify games API to support library filtering
  - Add `inLibrary` query parameter support to `/api/games` route
  - Add JOIN with `user_library` table when `inLibrary=true`
  - Filter results by authenticated user's library
  - Ensure all existing filters (search, genres, publishers) work with library
    filter
  - _Requirements: 1.2, 4.1, 4.2, 4.3_

- [x] 1.1 Write property test for library-only filtering
  - **Property 1: Library-only filtering**
  - **Validates: Requirements 1.2, 4.2**

- [x] 1.2 Write property test for filter composition
  - **Property 2: Filter composition correctness**
  - **Validates: Requirements 1.3, 1.4, 1.5, 4.3**

- [x] 2. Create LibraryGamesContent component
  - Create new component in `src/components/library/LibraryGamesContent.tsx`
  - Implement state management for games, stats, filters, and pagination
  - Add search query state and handler
  - Add genre/publisher filter state and handlers
  - Add pagination state and handler
  - Fetch library stats on component mount
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.1_

- [x] 2.1 Write property test for result count accuracy
  - **Property 3: Result count accuracy**
  - **Validates: Requirements 1.6**

- [x] 2.2 Write property test for filter change resets pagination
  - **Property 6: Filter change resets pagination**
  - **Validates: Requirements 2.3**

- [x] 2.3 Write property test for statistics invariance
  - **Property 9: Statistics invariance under filtering**
  - **Validates: Requirements 3.2**

- [x] 3. Implement library games fetching logic
  - Create `fetchLibraryGames` function that calls `/api/games?inLibrary=true`
  - Add support for search, genre, publisher, and pagination parameters
  - Implement debounced filter changes (300ms)
  - Handle loading states (initial and filter updates)
  - Handle error states with retry capability
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 4.1, 5.2, 5.3_

- [x] 3.1 Write unit tests for fetchLibraryGames
  - Test API call with correct parameters
  - Test debouncing behavior
  - Test error handling and retry

- [x] 4. Implement pagination logic
  - Add page change handler
  - Ensure pagination resets to page 1 on filter changes
  - Calculate and display pagination metadata (current page, total pages)
  - Implement page size of 20 games per page
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4.1 Write property test for pagination page size
  - **Property 4: Pagination page size consistency**
  - **Validates: Requirements 2.1**

- [x] 4.2 Write property test for pagination range correctness
  - **Property 5: Pagination range correctness**
  - **Validates: Requirements 2.2**

- [x] 4.3 Write property test for pagination metadata
  - **Property 7: Pagination metadata consistency**
  - **Validates: Requirements 2.4**

- [x] 5. Add library statistics display
  - Reuse stats cards from existing UserLibraryContent
  - Display total games, completed games, play time, and average rating
  - Ensure stats remain constant when filters are applied
  - Fetch stats from `/api/library/stats` endpoint
  - _Requirements: 3.1, 3.2_

- [x] 5.1 Write property test for statistics calculation
  - **Property 8: Statistics calculation correctness**
  - **Validates: Requirements 3.1**

- [x] 6. Implement UI layout and component integration
  - Add hero section with library title and game count
  - Integrate GameSearchBar component
  - Integrate GameFilterButton component
  - Integrate GameFilters component with genres from API
  - Add results info section showing filtered count
  - Integrate GameCard components in responsive grid
  - Integrate GamePagination component
  - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4_

- [x] 6.1 Write unit tests for component rendering
  - Test that all UI components render correctly
  - Test responsive grid layout
  - Test filter button state

- [x] 7. Implement loading and empty states
  - Add SearchSkeleton for initial loading
  - Add GameGridSkeleton for filter updates
  - Add empty library state with call-to-action
  - Add "no results" state for filtered searches
  - _Requirements: 3.3, 5.1, 5.2, 5.4_

- [x] 7.1 Write unit tests for empty states
  - Test empty library rendering
  - Test no results state
  - Test loading states

- [ ] 8. Implement error handling
  - Add error boundary integration
  - Display error messages with retry button
  - Handle authentication errors with redirect
  - Preserve filter state on errors
  - Add toast notifications for transient errors
  - _Requirements: 4.4, 5.3_

- [x] 8.1 Write property test for authentication requirement
  - **Property 10: Authentication requirement**
  - **Validates: Requirements 4.4**

- [x] 8.2 Write unit tests for error handling
  - Test error message display
  - Test retry functionality
  - Test authentication redirect

- [x] 9. Update library page to use new component
  - Replace UserLibraryContent with LibraryGamesContent in
    `/app/[locale]/library/page.tsx`
  - Ensure DashboardLayout and ErrorBoundary remain
  - Pass locale prop to LibraryGamesContent
  - _Requirements: 1.1_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify API integration works correctly
  - Test search, filter, and pagination functionality manually
  - Ensure authentication redirect works
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation reuses existing components from AllGamesContent for
  consistency
- API modification is minimal - just adding library filter support to existing
  endpoint
