# Game Deletion System

## Overview

The enhanced game deletion system ensures complete cleanup and consistency when
games are removed from the Game Universe platform. This system addresses
**Requirement 6.3**: "WHEN deleting a game, THE Game_Library SHALL remove it
from all search results."

## Features

### 1. Complete Cascade Deletion

The database schema uses `ON DELETE CASCADE` constraints to automatically remove
all related data when a game is deleted:

- `game_translations` - All translations for the game
- `game_genres` - Genre associations
- `game_companies` - Developer/publisher relationships
- `game_screenshots` - Screenshot media
- `game_artwork` - Artwork media
- `game_videos` - Video media
- `game_prices` - Pricing information across stores

### 2. Deletion Verification

After deletion, the system verifies that all related data has been properly
removed:

```typescript
const consistencyCheck = await verifyGameDeletionConsistency(
  [gameId],
  supabase
);
```

This function checks:

- Main games table (should be empty)
- All related tables (should have no references to the deleted game)
- Returns detailed inconsistency reports if any data remains

### 3. Enhanced Cache Invalidation

The system invalidates multiple cache layers to ensure consistency:

```typescript
await invalidateGameCache(gameId);
```

This includes:

- Game detail caches
- Game list caches (pagination, search results, filters)
- Genre-specific caches
- Company-specific caches
- Media caches
- Pricing caches
- Search index updates

### 4. Real-time Notifications

Deletion events are broadcast to connected clients:

```typescript
await notifyGameDeleted(gameId, gameSlug);
```

This ensures that any open browser tabs or applications are immediately updated
to reflect the deletion.

## API Endpoints

### Single Game Deletion

```
DELETE /api/admin/games/[id]
```

**Enhanced Response:**

```json
{
  "message": "Game deleted successfully with complete cleanup",
  "gameId": "uuid",
  "slug": "game-slug",
  "deletionSummary": {
    "relatedDataCounts": {
      "translations": 2,
      "genres": 3,
      "companies": 2,
      "screenshots": 5,
      "artwork": 3,
      "videos": 2,
      "prices": 4
    },
    "consistencyCheck": {
      "isConsistent": true,
      "inconsistencies": []
    },
    "timestamp": "2024-01-09T10:30:00.000Z"
  }
}
```

### Bulk Game Deletion

```
PATCH /api/admin/games
```

**Request Body:**

```json
{
  "operation": "delete",
  "game_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Enhanced Response:**

```json
{
  "message": "Successfully deleted 3 games with complete cleanup",
  "deletedIds": ["uuid1", "uuid2", "uuid3"],
  "deletionSummary": [
    {
      "id": "uuid1",
      "slug": "game-1",
      "relatedDataCounts": { ... }
    }
  ],
  "consistencyCheck": {
    "isConsistent": true,
    "inconsistencies": []
  },
  "timestamp": "2024-01-09T10:30:00.000Z"
}
```

### Deletion Verification

```
POST /api/admin/games/verify-deletion
```

**Request Body:**

```json
{
  "game_ids": ["uuid1", "uuid2"]
}
```

**Response:**

```json
{
  "message": "Deletion consistency verification completed",
  "gameIds": ["uuid1", "uuid2"],
  "result": {
    "isConsistent": true,
    "inconsistencies": []
  },
  "timestamp": "2024-01-09T10:30:00.000Z"
}
```

## Implementation Details

### Database Constraints

All related tables use CASCADE deletion:

```sql
CREATE TABLE public.game_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  -- other columns...
);
```

### Consistency Verification Function

```typescript
export async function verifyGameDeletionConsistency(
  gameIds: string[],
  supabaseClient?: any
): Promise<{
  isConsistent: boolean;
  inconsistencies: string[];
}>;
```

This function:

1. Checks if games still exist in the main table
2. Verifies all related tables are clean
3. Returns detailed inconsistency reports
4. Handles errors gracefully

### Cache Invalidation Strategy

The enhanced cache invalidation covers:

1. **Direct caches**: Game-specific data
2. **List caches**: Search results, filters, pagination
3. **Aggregation caches**: Genre counts, company listings
4. **Search indexes**: Full-text search, faceted search

## Error Handling

The system handles various error scenarios:

1. **Game not found**: Returns 404 with clear message
2. **Database errors**: Logs detailed error information
3. **Partial deletion**: Warns about inconsistencies
4. **Permission errors**: Returns 403 for non-admin users

## Testing

The system includes comprehensive tests:

- Unit tests for validation schemas
- Integration tests for deletion consistency
- Mock tests for cache invalidation
- Error scenario testing

## Monitoring and Auditing

All deletions are logged with:

- Game information (ID, slug)
- Related data counts before deletion
- Consistency verification results
- Timestamps for audit trails
- Admin user information

## Performance Considerations

- Batch operations for bulk deletions
- Async cache invalidation to avoid blocking
- Efficient database queries with proper indexing
- Graceful degradation if cache systems are unavailable

## Security

- Admin-only access with proper authentication
- Input validation for all parameters
- SQL injection protection through parameterized queries
- Audit logging for compliance
