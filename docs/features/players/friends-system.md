# Friends System

## Description

Social friends system for Game Universe allowing players to connect via friend
requests. An authenticated player can send a friend request to another player,
who can accept or decline it. Confirmed friends appear in the "Friends" tab of
the player profile (previously empty) and the friend count in
`PlayerProfileBanner` (previously hardcoded to 0) now reflects the real count.

The system includes:

- **Friend requests**: send, accept, decline requests
- **Friends list**: paginated list with infinite scroll and client-side search
- **Friend action button**: contextual button on player profiles (add, pending,
  accept/decline, remove)
- **Pending requests**: owner-only section showing received requests
- **Real-time counter**: friend count in the profile banner updates
  optimistically
- **i18n**: full French and English translations

## Access

### Navigation

1. Open a player profile: `/{locale}/players/{id}`
2. Click the "Friends" tab to see the friends list and pending requests (if
   owner)
3. The friend count is displayed in the player banner stats
4. The friend action button appears on other players' profiles when
   authenticated

### API Endpoints

| Method | Route                                      | Auth | Description                              |
| ------ | ------------------------------------------ | ---- | ---------------------------------------- |
| GET    | `/api/players/{id}/friends`                | No\* | List friends + pending requests (owner)  |
| POST   | `/api/players/{id}/friends`                | Yes  | Send friend request                      |
| GET    | `/api/players/{id}/friends/status`         | Yes  | Relationship status with target player   |
| PATCH  | `/api/players/{id}/friends/{friendshipId}` | Yes  | Accept a pending request (receiver only) |
| DELETE | `/api/players/{id}/friends/{friendshipId}` | Yes  | Decline request or remove friend         |

\* GET list is public for accepted friends; pending requests are only included
when the requester is the profile owner.

**GET parameters:**

- `page` (int, default 1) — page number
- `limit` (int, default 20) — friends per page

## Prerequisites

1. **Database migration**: the migration
   `supabase/migrations/20240307000001_friendships_table.sql` must be applied.
   It creates the `friendships` table with constraints (unique pair, no
   self-friend, status CHECK), indexes, and RLS policies.

2. **Authentication**: users must be authenticated (via Supabase Auth) to send,
   accept, decline requests or remove friends.

3. **i18n keys**: translations must be present in `src/messages/fr.json` and
   `src/messages/en.json` under the `friends.*` keys.

## Usage

### Sending a friend request

Click "Add friend" on another player's profile. The button changes to "Request
sent" (disabled) once the request is sent.

### Accepting / declining requests

Navigate to your own profile → "Friends" tab. Pending received requests appear
above the friends list with "Accept" and "Decline" buttons.

### Removing a friend

On a confirmed friend's profile, click "Remove friend". A confirmation dialog
appears before deletion.

### Searching friends

Use the search bar in the "Friends" tab to filter friends by display name
(client-side, case-insensitive).

### Infinite scroll

The friends list loads more friends automatically as you scroll down.

## Architecture

### Services

| File                                      | Role                                   |
| ----------------------------------------- | -------------------------------------- |
| `src/lib/services/friendServerService.ts` | Server service (Supabase queries)      |
| `src/lib/services/friendService.ts`       | Client service (fetch API) + utilities |

### Types

| File                      | Content                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/types/friendship.ts` | `FriendshipStatus`, `RelationshipStatus`, `FriendSummary`, `FriendRequest`, `FriendsListResponse` |

### Hook

| File                      | Role                                             |
| ------------------------- | ------------------------------------------------ |
| `src/hooks/useFriends.ts` | State management, pagination, optimistic updates |

### Components

| Component            | File                                            | Role                                      |
| -------------------- | ----------------------------------------------- | ----------------------------------------- |
| `FriendsTab`         | `src/components/players/FriendsTab.tsx`         | Orchestrator for the Friends tab          |
| `FriendList`         | `src/components/players/FriendList.tsx`         | Grid of friend cards with infinite scroll |
| `FriendCard`         | `src/components/players/FriendCard.tsx`         | Single friend card (avatar, name, level)  |
| `FriendSearchBar`    | `src/components/players/FriendSearchBar.tsx`    | Search input for filtering friends        |
| `FriendRequestList`  | `src/components/players/FriendRequestList.tsx`  | Pending requests section (owner only)     |
| `FriendRequestCard`  | `src/components/players/FriendRequestCard.tsx`  | Single request card with actions          |
| `FriendActionButton` | `src/components/players/FriendActionButton.tsx` | Contextual button on player profiles      |

### API Routes

| File                                                       | Endpoint                                     |
| ---------------------------------------------------------- | -------------------------------------------- |
| `src/app/api/players/[id]/friends/route.ts`                | GET + POST /api/players/:id/friends          |
| `src/app/api/players/[id]/friends/status/route.ts`         | GET /api/players/:id/friends/status          |
| `src/app/api/players/[id]/friends/[friendshipId]/route.ts` | PATCH + DELETE /api/players/:id/friends/:fId |

### Accessibility

- `role="list"` and `aria-label` on the friends list
- `aria-label` on accept/decline buttons includes the player name
- `aria-busy="true"` during pending operations
- `aria-live` feedback on the friend action button
- Keyboard-navigable friend cards (focusable links)

## Tests

| File                                                       | Type           | Content                                   |
| ---------------------------------------------------------- | -------------- | ----------------------------------------- |
| `test/unit/api/players/friends.test.ts`                    | Unit           | API routes (CRUD, errors, pagination)     |
| `test/unit/components/players/FriendList.test.tsx`         | Unit           | Friend list (render, empty, ARIA, scroll) |
| `test/unit/components/players/FriendRequestList.test.tsx`  | Unit           | Request list (render, actions, loading)   |
| `test/unit/components/players/FriendActionButton.test.tsx` | Unit           | Button states per relationship status     |
| `test/unit/lib/services/friendService.test.ts`             | Unit           | Client service (URLs, calls, errors)      |
| `test/unit/lib/services/friendService.property.test.ts`    | Property-based | 9 correctness properties (fast-check)     |

```bash
# Run all tests
bun run test:all

# Run only friend service tests
bunx vitest run test/unit/lib/services/friendService.test.ts

# Run property-based tests
bunx vitest run test/unit/lib/services/friendService.property.test.ts

# Run API route tests
bunx vitest run test/unit/api/players/friends.test.ts
```
