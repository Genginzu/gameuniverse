# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive code refactoring of
the Next.js Game Universe application. The goal is to simplify the codebase,
improve maintainability, reduce code duplication, and establish consistent
patterns across features. The refactoring targets approximately 2,700 lines of
duplicate or unnecessary code while maintaining all existing functionality and
TypeScript type safety.

## Glossary

- **Entity**: A domain object in the system (Game, Player, or Character)
- **Service_Layer**: The abstraction layer that handles data fetching and
  business logic for entities
- **Base_Service**: A generic service class that provides common CRUD operations
  for all entities
- **Entity_Card**: A reusable UI component that displays summary information for
  an entity
- **Entity_Grid**: A responsive grid layout component that displays multiple
  Entity_Cards
- **Entity_Skeleton**: A loading placeholder component that mimics the shape of
  an Entity_Card
- **Grid_Skeleton**: A loading placeholder component that displays multiple
  Entity_Skeletons
- **Filter_Panel**: A UI component that allows users to filter entity lists by
  various criteria
- **Search_Bar**: A UI component that provides search functionality with
  debouncing
- **Pagination_Component**: A UI component that handles page navigation for
  paginated lists
- **API_Route_Handler**: A Next.js API route that handles HTTP requests for
  entity operations
- **GameDetailsContent**: The main component for displaying detailed game
  information

## Requirements

### Requirement 1: Delete Unused Backup File

**User Story:** As a developer, I want to remove unused backup files, so that
the codebase remains clean and free of dead code.

#### Acceptance Criteria

1. THE System SHALL delete the file
   `src/components/games/GameDetailsContent.tsx.backup`
2. WHEN the backup file is deleted, THE System SHALL verify no other files
   reference it

---

### Requirement 2: Create Base Service Layer

**User Story:** As a developer, I want a unified service layer with shared
functionality, so that I can reduce code duplication across entity services.

#### Acceptance Criteria

1. THE Base_Service SHALL provide a generic `getBaseUrl()` method that returns
   the application base URL
2. THE Base_Service SHALL provide a generic `fetchDetails(identifier, locale)`
   method for fetching entity details via API
3. THE Base_Service SHALL provide a generic `fetchList(options)` method for
   fetching paginated entity lists via API
4. THE Base_Service SHALL provide a generic `exists(identifier, locale)` method
   for checking entity existence
5. THE Base_Service SHALL provide a generic
   `generateMetadata(identifier, locale)` method for SEO metadata generation
6. WHEN an entity service extends Base_Service, THE entity service SHALL only
   implement entity-specific logic
7. THE Base_Service SHALL use TypeScript generics to ensure type safety across
   all entity types

---

### Requirement 3: Refactor Game Service

**User Story:** As a developer, I want the GameService to extend the
Base_Service, so that common functionality is inherited rather than duplicated.

#### Acceptance Criteria

1. THE GameService SHALL extend Base_Service with Game-specific type parameters
2. THE GameService SHALL inherit `fetchDetails`, `fetchList`, `exists`, and
   `generateMetadata` from Base_Service
3. THE GameService SHALL maintain backward compatibility with existing API
   consumers
4. WHEN GameService methods are called, THE System SHALL return the same data
   structures as before refactoring

---

### Requirement 4: Refactor Player Service

**User Story:** As a developer, I want the PlayerService to extend the
Base_Service, so that common functionality is inherited rather than duplicated.

#### Acceptance Criteria

1. THE PlayerService SHALL extend Base_Service with Player-specific type
   parameters
2. THE PlayerService SHALL inherit common methods from Base_Service
3. THE PlayerService SHALL retain Player-specific methods like `calculateStats`
   and `validatePlayerId`
4. THE PlayerService SHALL retain the `fetchPlayersFromDB` and
   `fetchPlayerDetailsFromDB` methods for direct database access
5. WHEN PlayerService methods are called, THE System SHALL return the same data
   structures as before refactoring

---

### Requirement 5: Refactor Character Service

**User Story:** As a developer, I want the CharacterService to extend the
Base_Service, so that common functionality is inherited rather than duplicated.

#### Acceptance Criteria

1. THE CharacterService SHALL extend Base_Service with Character-specific type
   parameters
2. THE CharacterService SHALL inherit common methods from Base_Service
3. THE CharacterService SHALL retain the `fetchCharactersFromDB` and
   `fetchCharacterDetailsFromDB` methods for direct database access
4. WHEN CharacterService methods are called, THE System SHALL return the same
   data structures as before refactoring

---

### Requirement 6: Create Generic Entity Card Component

**User Story:** As a developer, I want a generic card component that can render
any entity type, so that I can reduce UI component duplication.

#### Acceptance Criteria

1. THE Entity_Card SHALL accept a generic entity prop with configurable display
   fields
2. THE Entity_Card SHALL support customizable image aspect ratios (3:4 for
   games/characters, 1:1 for players)
3. THE Entity_Card SHALL support optional badge rendering (metascore, role, game
   count)
4. THE Entity_Card SHALL support optional hover overlay content
5. THE Entity_Card SHALL support optional action buttons (library toggle for
   games)
6. WHEN rendering a Game entity, THE Entity_Card SHALL display the same visual
   output as the current GameCard
7. WHEN rendering a Player entity, THE Entity_Card SHALL display the same visual
   output as the current PlayerCard
8. WHEN rendering a Character entity, THE Entity_Card SHALL display the same
   visual output as the current CharacterCard

---

### Requirement 7: Create Generic Card Skeleton Component

**User Story:** As a developer, I want a generic skeleton component for loading
states, so that I can reduce skeleton component duplication.

#### Acceptance Criteria

1. THE Entity_Skeleton SHALL accept configurable aspect ratio (3:4 or 1:1)
2. THE Entity_Skeleton SHALL accept optional badge skeleton configuration
3. THE Entity_Skeleton SHALL accept optional info section skeleton configuration
4. WHEN configured for games, THE Entity_Skeleton SHALL match the current
   GameCardSkeleton appearance
5. WHEN configured for players, THE Entity_Skeleton SHALL match the current
   PlayerCardSkeleton appearance
6. WHEN configured for characters, THE Entity_Skeleton SHALL match the current
   CharacterCardSkeleton appearance

---

### Requirement 8: Create Generic Grid Skeleton Component

**User Story:** As a developer, I want a generic grid skeleton component, so
that I can reduce grid skeleton duplication.

#### Acceptance Criteria

1. THE Grid_Skeleton SHALL accept a skeleton component type parameter
2. THE Grid_Skeleton SHALL accept a configurable item count (default 20)
3. THE Grid_Skeleton SHALL use the same responsive grid layout as current
   implementations
4. WHEN rendering, THE Grid_Skeleton SHALL produce the same visual output as
   current entity-specific grid skeletons

---

### Requirement 9: Create Generic Pagination Component

**User Story:** As a developer, I want a single pagination component that works
for all entity types, so that I can eliminate pagination duplication.

#### Acceptance Criteria

1. THE Pagination_Component SHALL accept currentPage, totalPages, totalCount,
   and onPageChange props
2. THE Pagination_Component SHALL accept an optional loading state prop
3. THE Pagination_Component SHALL accept a configurable translation namespace
   for localized labels
4. THE Pagination_Component SHALL display page navigation with first, previous,
   next, and last buttons
5. THE Pagination_Component SHALL display page numbers with ellipsis for large
   page counts
6. THE Pagination_Component SHALL provide a mobile-friendly page selector
   dropdown
7. WHEN used for games, players, or characters, THE Pagination_Component SHALL
   produce identical functionality to current implementations

---

### Requirement 10: Create Generic Search Bar Component

**User Story:** As a developer, I want a unified search bar component, so that I
can reduce search bar duplication while supporting different search modes.

#### Acceptance Criteria

1. THE Search_Bar SHALL accept an onSearch callback for simple debounced search
2. THE Search_Bar SHALL accept optional hybrid search configuration for advanced
   search with dropdown results
3. THE Search_Bar SHALL accept configurable placeholder text
4. THE Search_Bar SHALL accept configurable debounce delay (default 300ms)
5. THE Search_Bar SHALL provide a clear button when search query is not empty
6. WHEN in simple mode, THE Search_Bar SHALL debounce search queries and call
   the onSearch callback
7. WHEN in hybrid mode, THE Search_Bar SHALL display search results in a
   dropdown with import functionality

---

### Requirement 11: Create Generic Filter Panel Component

**User Story:** As a developer, I want a flexible filter panel component, so
that I can reduce filter component duplication while supporting different filter
types.

#### Acceptance Criteria

1. THE Filter_Panel SHALL accept a generic filter configuration array
2. THE Filter_Panel SHALL support checkbox-based multi-select filters
3. THE Filter_Panel SHALL display active filters with remove buttons
4. THE Filter_Panel SHALL provide a clear all filters button
5. THE Filter_Panel SHALL support expandable/collapsible filter sections
6. WHEN configured for game genres, THE Filter_Panel SHALL display genre
   checkboxes with game counts
7. WHEN configured for player game counts, THE Filter_Panel SHALL display game
   count range options
8. WHEN configured for character filters, THE Filter_Panel SHALL display game
   and role filter options

---

### Requirement 12: Create Shared API Route Utilities

**User Story:** As a developer, I want shared utilities for API route handlers,
so that I can reduce duplication in parameter validation and response
formatting.

#### Acceptance Criteria

1. THE API utilities SHALL provide a `parsePaginationParams(searchParams)`
   function that extracts and validates page and limit parameters
2. THE API utilities SHALL provide a `parseArrayParam(value)` function that
   parses comma-separated string values into arrays
3. THE API utilities SHALL provide a
   `createPaginatedResponse(data, pagination, filters)` function for consistent
   response formatting
4. THE API utilities SHALL provide a `handleApiError(error)` function for
   consistent error response formatting
5. WHEN pagination parameters are invalid, THE `parsePaginationParams` function
   SHALL return safe default values

---

### Requirement 13: Centralize Supabase Type Definitions

**User Story:** As a developer, I want centralized type definitions for Supabase
query results, so that I can eliminate duplicate type definitions across API
routes.

#### Acceptance Criteria

1. THE System SHALL create a shared types file for Supabase query result types
2. THE shared types SHALL include GameRow, CharacterRow, and profile-related
   types
3. THE shared types SHALL include translation row types (GameTranslation,
   CharacterTranslation, GenreTranslation)
4. THE shared types SHALL include relationship types (GameGenre, GameCompany,
   CharacterGame)
5. WHEN API routes need Supabase result types, THE routes SHALL import from the
   shared types file

---

### Requirement 14: Split GameDetailsContent Component

**User Story:** As a developer, I want the GameDetailsContent component split
into smaller, focused components, so that the code is more maintainable and
testable.

#### Acceptance Criteria

1. THE System SHALL extract the hero section into a separate `GameHeroSection`
   component
2. THE System SHALL extract the media gallery (screenshots, artwork, videos)
   into a separate `GameMediaGallery` component
3. THE System SHALL extract the tab navigation into a separate `GameDetailsTabs`
   component
4. THE System SHALL extract the overview/info cards into a separate
   `GameOverviewSection` component
5. THE System SHALL extract the pricing section into a separate
   `GamePricingSection` component
6. THE System SHALL extract the color system logic into a separate utility
   function `getGameColors`
7. THE System SHALL extract formatting functions (formatReleaseDate,
   formatPrice, getMetascoreColor) into shared utilities
8. WHEN all sub-components are composed, THE GameDetailsContent SHALL render
   identically to the current implementation
9. THE refactored GameDetailsContent SHALL be under 200 lines of code

---

### Requirement 15: Maintain Backward Compatibility

**User Story:** As a developer, I want all refactoring to maintain backward
compatibility, so that existing functionality continues to work without changes
to consuming code.

#### Acceptance Criteria

1. WHEN entity services are refactored, THE public API signatures SHALL remain
   unchanged
2. WHEN UI components are replaced with generic versions, THE visual output
   SHALL be identical
3. WHEN API routes are refactored, THE response formats SHALL remain unchanged
4. IF any breaking changes are necessary, THEN THE System SHALL provide
   migration documentation

---

### Requirement 16: Incremental Refactoring Phases

**User Story:** As a developer, I want the refactoring to be done in phases, so
that I can validate each phase before proceeding to the next.

#### Acceptance Criteria

1. THE refactoring SHALL be organized into distinct phases that can be
   implemented and tested independently
2. Phase 1 SHALL focus on cleanup (deleting backup file) and service layer
   consolidation
3. Phase 2 SHALL focus on UI component consolidation (cards, skeletons, grids)
4. Phase 3 SHALL focus on shared components (pagination, search, filters)
5. Phase 4 SHALL focus on API route utilities and type centralization
6. Phase 5 SHALL focus on GameDetailsContent decomposition
7. WHEN each phase is complete, THE System SHALL pass all existing tests
