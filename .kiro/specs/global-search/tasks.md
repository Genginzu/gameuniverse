# Implementation Plan: Global Search

## Overview

Extend the existing game-only hybrid search into a multi-entity global search (games, characters, players) with a grouped dropdown, keyboard navigation, and i18n support. Reuses existing services and replaces `GameSearchBar` with `GlobalSearchBar` in the layout.

## Tasks

- [ ] 1. Create shared types and API response models
  - [ ] 1.1 Create `src/types/global-search.ts` with `GlobalSearchRequest`, `GlobalSearchResponse`, `GlobalSearchGameItem`, `GlobalSearchCharacterItem`, `GlobalSearchPlayerItem`, and `GlobalSearchResult` interfaces
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 2. Implement GlobalSearchService
  - [ ] 2.1 Create `src/lib/services/globalSearchService.ts` with `GlobalSearchService.search()` method
    - Execute searches on `HybridSearchService`, `CharacterService`, and `PlayerService` in parallel using `Promise.allSettled`
    - Handle partial failures: return results from successful sources, empty arrays for failed sources
    - Log errors from failed sources without throwing
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ] 2.2 Implement `GlobalSearchService.toGlobalSearchResponse()` transformation method
    - Transform `GameSummary`/`IGDBSearchResult` to `GlobalSearchGameItem`
    - Transform `CharacterSummary` to `GlobalSearchCharacterItem`
    - Transform `PlayerSummary` to `GlobalSearchPlayerItem`
    - Compute counts from array lengths
    - _Requirements: 6.1, 6.2, 6.3, 8.2, 8.3_
  - [ ]* 2.3 Write property tests for GlobalSearchService
    - **Property 1: Multi-entity search aggregation**
    - **Validates: Requirements 1.1**
    - **Property 3: Fault tolerance with partial results**
    - **Validates: Requirements 1.5**
    - **Property 4: Per-category limit enforcement**
    - **Validates: Requirements 2.5**
    - **Property 7: Entity transformation completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - **Property 8: Response counts consistency**
    - **Validates: Requirements 8.2**
    - **Property 9: Response serialization round-trip**
    - **Validates: Requirements 8.4**

- [ ] 3. Create Global Search API route
  - [ ] 3.1 Create `src/app/api/search/global/route.ts` GET endpoint
    - Parse query params: `query`, `locale`, `gamesLimit`, `charactersLimit`, `playersLimit`
    - Validate query length >= 2 (return 400 otherwise)
    - Call `GlobalSearchService.search()` and return `GlobalSearchResponse`
    - _Requirements: 1.1, 1.4, 2.5, 8.1_
  - [ ]* 3.2 Write property test for short query rejection
    - **Property 2: Short query rejection**
    - **Validates: Requirements 1.4**

- [ ] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement useGlobalSearch hook
  - [ ] 5.1 Create `src/hooks/useGlobalSearch.ts`
    - Manage search state: query, results, isLoading, isOpen, activeIndex
    - Implement debounce (300ms) with AbortController for request cancellation
    - Implement keyboard navigation logic: Arrow Up/Down index management, Enter to select, Escape to close
    - Implement `getResultUrl(item, locale)` helper for URL generation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 5.4_
  - [ ]* 5.2 Write property tests for useGlobalSearch utilities
    - **Property 5: Keyboard navigation index management**
    - **Validates: Requirements 4.1, 4.2**
    - **Property 6: Result-to-URL mapping**
    - **Validates: Requirements 4.3, 5.1, 5.3, 5.4**

- [ ] 6. Implement GlobalSearchBar and dropdown components
  - [ ] 6.1 Create `src/components/shared/GlobalSearchGameItem.tsx`
    - Render game result: cover image, title, developer, release year, source badge (local/IGDB)
    - Accept `isActive` prop for keyboard highlight
    - _Requirements: 6.1_
  - [ ] 6.2 Create `src/components/shared/GlobalSearchCharacterItem.tsx`
    - Render character result: main image, name, role, primary game
    - Accept `isActive` prop for keyboard highlight
    - _Requirements: 6.2_
  - [ ] 6.3 Create `src/components/shared/GlobalSearchPlayerItem.tsx`
    - Render player result: avatar, username
    - Accept `isActive` prop for keyboard highlight
    - _Requirements: 6.3_
  - [ ] 6.4 Create `src/components/shared/GlobalSearchDropdown.tsx`
    - Render grouped results by category with section headers
    - Hide empty categories
    - Show "no results" message when all categories are empty
    - Highlight active item based on `activeIndex`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 6.5 Create `src/components/shared/GlobalSearchBar.tsx`
    - Search input with clear button
    - Use `useGlobalSearch` hook for all logic
    - Render `GlobalSearchDropdown` when open
    - Handle click outside to close
    - Handle IGDB game import on selection (reuse existing import logic from GameSearchBar)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Add i18n translations and integrate into layout
  - [ ] 7.1 Add `globalSearch` keys to `src/messages/fr.json` and `src/messages/en.json`
    - Add placeholder, noResults, loading, category headers, source labels
    - _Requirements: 7.3_
  - [ ] 7.2 Replace `GameSearchBar` with `GlobalSearchBar` in `DashboardHeader`
    - Update import in `src/components/layout/dashboard/DashboardHeader.tsx`
    - Replace both desktop and mobile search bar instances
    - _Requirements: 7.1, 7.2_

- [ ] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Lint du code
  - [ ] 9.1 Exécuter `bun run lint`
  - [ ] 9.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [ ] 9.3 Corriger les erreurs de lint si nécessaire

- [ ] 10. Build de production
  - [ ] 10.1 Exécuter `bun run build`
  - [ ] 10.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 10.3 Corriger les erreurs de build si nécessaire

- [ ] 11. README de la fonctionnalité
  - [ ] 11.1 Créer `docs/README_GLOBAL_SEARCH.md`
  - [ ] 11.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with Bun test runner
- No database migration needed — uses existing tables and indexes
- The `GameSearchBar` component is preserved for backward compatibility on pages that only need game search
