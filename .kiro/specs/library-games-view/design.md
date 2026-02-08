# Design Document: Library Games View

## Overview

This feature transforms the user library page to use the same rich interface as
the `/games` catalog page, including search, genre/publisher filters, and
pagination. The key difference is that only games in the user's library are
displayed. This provides a consistent user experience across the application
while allowing users to efficiently browse and search their personal game
collection.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Library Page Component                    │
│                  (src/app/[locale]/library)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              LibraryGamesContent Component                   │
│         (Reuses AllGamesContent logic/structure)             │
└────────┬────────────────────────────────────┬───────────────┘
         │                                    │
         ▼                                    ▼
┌────────────────────┐            ┌──────────────────────────┐
│  Reused UI         │            │  Library Stats Cards     │
│  Components:       │            │  (from existing          │
│  - GameSearchBar   │            │   UserLibraryContent)    │
│  - GameFilters     │            └──────────────────────────┘
│  - GameCard        │
│  - GamePagination  │
│  - Skeletons       │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
│              GET /api/games?inLibrary=true                   │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Database                           │
│  - games table                                               │
│  - user_library table (JOIN)                                 │
│  - game_translations table                                   │
│  - game_genres table                                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
LibraryPage
├── DashboardLayout
└── ErrorBoundary
    └── LibraryGamesContent
        ├── LibraryStatsCards (4 cards: total, completed, playtime, rating)
        ├── GameSearchBar
        ├── GameFilterButton
        ├── GameFilters
        ├── ResultsInfo
        ├── GameGrid
        │   └── GameCard (repeated)
        └── GamePagination
```

## Components and Interfaces

### 1. LibraryGamesContent Component

**Purpose**: Main component that orchestrates the library games view with
search, filters, and pagination.

**Props**:

```typescript
interface LibraryGamesContentProps {
  locale?: string; // Default: "fr"
}
```

**State Management**:

```typescript
interface LibraryGamesState {
  games: GameSummary[];
  stats: LibraryStats;
  genres: Genre[];
  pagination: Pagination | null;
  loading: boolean;
  initialLoading: boolean;
  searchQuery: string;
  selectedGenres: string[];
  selectedPublishers: string[];
}
```

**Key Behaviors**:

- Fetches library games with filters applied
- Manages search, genre, and publisher filter state
- Handles pagination
- Displays library statistics at the top
- Shows empty state when library is empty
- Reuses existing UI components from AllGamesContent

### 2. API Modification: GET /api/games

**New Query Parameter**:

- `inLibrary`: boolean (optional) - When true, filters results to only games in
  the authenticated user's library

**Modified Query Logic**:

```typescript
// Pseudocode for API modification
if (inLibrary === "true") {
  // Add JOIN with user_library table
  query = query
    .select(
      `
      ...,
      user_library!inner(user_id, status, added_at, play_time_hours, rating)
    `
    )
    .eq("user_library.user_id", user.id);
}
```

**Response Format** (unchanged):

```typescript
{
  games: GameSummary[],
  pagination: {
    currentPage: number,
    totalPages: number,
    totalCount: number,
    limit: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean,
    offset: number
  },
  filters: {
    search: string,
    genres: string[],
    locale: string,
    inLibrary?: boolean
  }
}
```

### 3. Library Statistics Component

**Purpose**: Display overview statistics of the user's library

**Interface**:

```typescript
interface LibraryStats {
  totalGames: number;
  completedGames: number;
  totalPlayTime: number;
  averageRating?: number;
}
```

**Component**: Reuse existing stats cards from UserLibraryContent

## Data Models

### GameSummary (existing, no changes)

```typescript
interface GameSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: Array<{ name: string }>;
  developer: string;
  publisher: string;
  metascore?: number;
}
```

### Pagination (existing, no changes)

```typescript
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  offset: number;
}
```

### Genre (existing, no changes)

```typescript
interface Genre {
  id: string;
  slug: string;
  name: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system—essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Library-only filtering

_For any_ API request with the library filter enabled and any authenticated
user, all returned games should be present in that user's library. **Validates:
Requirements 1.2, 4.2**

### Property 2: Filter composition correctness

_For any_ combination of search query, genre filters, publisher filters, and
library filter, all returned games should satisfy ALL applied filter conditions
simultaneously (title matches search AND has selected genre AND has selected
publisher AND is in library). **Validates: Requirements 1.3, 1.4, 1.5, 4.3**

### Property 3: Result count accuracy

_For any_ combination of filters applied to the library, the displayed count
should equal the actual number of games that match all those filters.
**Validates: Requirements 1.6**

### Property 4: Pagination page size consistency

_For any_ library with more than 20 games, each page except the last should
contain exactly 20 games, and the last page should contain the remainder (1-20
games). **Validates: Requirements 2.1**

### Property 5: Pagination range correctness

_For any_ valid page number N and pagination state, the games returned for page
N should be the correct subset based on offset calculation (offset = (N-1) \*
pageSize). **Validates: Requirements 2.2**

### Property 6: Filter change resets pagination

_For any_ change to search query, genre filters, or publisher filters, the
current page should reset to page 1. **Validates: Requirements 2.3**

### Property 7: Pagination metadata consistency

_For any_ pagination state, the displayed current page and total pages should
match the actual pagination state values. **Validates: Requirements 2.4**

### Property 8: Statistics calculation correctness

_For any_ user library, the calculated statistics (total games, completed games,
total play time, average rating) should accurately reflect the sum/average of
the corresponding values across all library entries. **Validates: Requirements
3.1**

### Property 9: Statistics invariance under filtering

_For any_ filter state (search, genres, publishers), the library statistics
should remain constant and reflect the entire library, not the filtered subset.
**Validates: Requirements 3.2**

### Property 10: Authentication requirement

_For any_ request to the library page without valid authentication, the system
should redirect to the authentication page. **Validates: Requirements 4.4**

## Error Handling

### 1. Authentication Errors

**Scenario**: User is not authenticated when accessing library page
**Handling**:

- Redirect to `/auth` page
- Preserve intended destination for post-login redirect
- Display appropriate message about authentication requirement

### 2. API Request Failures

**Scenario**: Network error or server error when fetching games/stats
**Handling**:

- Display error message with retry button
- Preserve current filter state
- Log error details for debugging
- Use toast notification for transient errors

### 3. Empty Library State

**Scenario**: User has no games in their library **Handling**:

- Display friendly empty state message
- Show call-to-action button to explore games catalog
- Display stats as zeros (not error state)

### 4. Invalid Filter Combinations

**Scenario**: User applies filters that result in no matches **Handling**:

- Display "no results" message
- Show current filter state
- Provide "clear filters" button
- Keep library stats visible

### 5. Pagination Errors

**Scenario**: User navigates to invalid page number **Handling**:

- Clamp page number to valid range [1, totalPages]
- Redirect to nearest valid page
- Log warning for debugging

### 6. Database Migration Not Applied

**Scenario**: user_library table doesn't exist yet **Handling**:

- Return empty library gracefully
- Log warning about missing table
- Display message to contact administrator

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on:

- **Component rendering**: Verify LibraryGamesContent renders with correct props
- **Filter state management**: Test search, genre, and publisher filter state
  updates
- **Pagination calculations**: Test offset and page range calculations
- **Statistics calculations**: Test stats aggregation logic
- **Empty states**: Test rendering when library is empty
- **Error states**: Test error message display and retry functionality

### Property-Based Testing Approach

Property-based tests will verify universal correctness properties using
**fast-check** (TypeScript property testing library). Each test will run a
minimum of 100 iterations with randomized inputs.

**Property Test Configuration**:

```typescript
import fc from "fast-check";

// Minimum 100 iterations per property test
const testConfig = { numRuns: 100 };
```

**Test Tags**: Each property test must include a comment tag:

```typescript
// Feature: library-games-view, Property 1: Library-only filtering
```

**Property Tests to Implement**:

1. **Property 1: Library-only filtering**
   - Generate: Random user ID, random set of games, random library membership
   - Test: All returned games are in user's library
   - Tag: `Feature: library-games-view, Property 1: Library-only filtering`

2. **Property 2: Filter composition correctness**
   - Generate: Random search query, random genre/publisher selections, random
     game set
   - Test: Results satisfy all filter conditions
   - Tag:
     `Feature: library-games-view, Property 2: Filter composition correctness`

3. **Property 3: Result count accuracy**
   - Generate: Random filter combinations, random game set
   - Test: Displayed count equals actual filtered result count
   - Tag: `Feature: library-games-view, Property 3: Result count accuracy`

4. **Property 4: Pagination page size consistency**
   - Generate: Random library sizes > 20
   - Test: All pages except last have 20 games, last has remainder
   - Tag:
     `Feature: library-games-view, Property 4: Pagination page size consistency`

5. **Property 5: Pagination range correctness**
   - Generate: Random page numbers, random game sets
   - Test: Returned games match expected offset range
   - Tag:
     `Feature: library-games-view, Property 5: Pagination range correctness`

6. **Property 6: Filter change resets pagination**
   - Generate: Random initial page, random filter changes
   - Test: Page resets to 1 after filter change
   - Tag:
     `Feature: library-games-view, Property 6: Filter change resets pagination`

7. **Property 7: Pagination metadata consistency**
   - Generate: Random pagination states
   - Test: Displayed metadata matches actual state
   - Tag:
     `Feature: library-games-view, Property 7: Pagination metadata consistency`

8. **Property 8: Statistics calculation correctness**
   - Generate: Random library entries with play time, ratings, completion status
   - Test: Calculated stats match manual aggregation
   - Tag:
     `Feature: library-games-view, Property 8: Statistics calculation correctness`

9. **Property 9: Statistics invariance under filtering**
   - Generate: Random filter states, random library
   - Test: Stats remain constant regardless of filters
   - Tag:
     `Feature: library-games-view, Property 9: Statistics invariance under filtering`

10. **Property 10: Authentication requirement**
    - Generate: Random unauthenticated states
    - Test: System redirects to auth page
    - Tag:
      `Feature: library-games-view, Property 10: Authentication requirement`

### Integration Testing

Integration tests will verify:

- **API integration**: Test that LibraryGamesContent correctly calls
  `/api/games?inLibrary=true`
- **Component integration**: Test that all reused components work together
  correctly
- **State synchronization**: Test that filter changes trigger correct API calls
- **Navigation integration**: Test that pagination updates URL and triggers data
  fetch

### Test File Organization

```
src/components/library/
├── LibraryGamesContent.tsx
├── LibraryGamesContent.test.tsx          # Unit tests
└── LibraryGamesContent.property.test.ts  # Property-based tests

src/app/api/games/
├── route.ts
└── route.test.ts                         # API unit + property tests
```

### Testing Tools

- **Unit Testing**: Bun Test + React Testing Library
- **Property Testing**: fast-check
- **API Testing**: Bun Test with mocked Supabase client
- **Integration Testing**: Bun Test with test database

### Coverage Goals

- **Unit Test Coverage**: 80%+ for component logic
- **Property Test Coverage**: All 10 correctness properties implemented
- **Integration Test Coverage**: All critical user flows (search, filter,
  paginate)
- **Edge Case Coverage**: Empty library, single page, authentication failures
