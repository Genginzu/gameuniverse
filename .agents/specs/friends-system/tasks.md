# Implementation Plan: Friends System

## Overview

Implement a social friends system for Game Universe: a `friendships` database table, REST API endpoints under `/api/players/[id]/friends/`, a client service, a `useFriends` hook, and UI components (friend list, friend requests, action button) integrated into the existing player profile. The friend count in `PlayerProfileBanner` (currently hardcoded to 0) will reflect the real count.

## Tasks

- [x] 1. Database migration and types
  - [x] 1.1 Create `supabase/migrations/20240307000001_friendships_table.sql` with the `friendships` table, constraints (unique pair, no self-friend, status CHECK), indexes, RLS policies for public read of accepted friendships, pending requests visible only to involved players, insert by sender, update by receiver, delete by involved players
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Create `src/types/friendship.ts` with types `FriendshipStatus`, `RelationshipStatus`, `FriendSummary`, `FriendRequest`, `FriendsListResponse`, `RelationshipStatusResponse`, `FriendsQueryParams` as defined in the design
    - _Requirements: 3.2, 8.1_

- [x] 2. Server service and API routes
  - [x] 2.1 Create `src/lib/services/friendServerService.ts` with methods: `getFriends(playerId, page, limit)`, `getPendingRequests(receiverId)`, `getRelationshipStatus(userId, targetId)`, `sendRequest(senderId, receiverId)`, `acceptRequest(friendshipId, receiverId)`, `deleteRequest(friendshipId, userId)`, `getFriendCount(playerId)` — all using Supabase server client
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.2 Create `src/app/api/players/[id]/friends/route.ts` with GET handler (list friends + pending requests for owner, pagination) and POST handler (send friend request with validation: auth, self-request, duplicate, target exists)
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8, 3.1, 3.3, 3.4, 3.5_
  - [x] 2.3 Create `src/app/api/players/[id]/friends/status/route.ts` with GET handler returning the relationship status between the authenticated user and the target player
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  - [x] 2.4 Create `src/app/api/players/[id]/friends/[friendshipId]/route.ts` with PATCH handler (accept request — receiver only) and DELETE handler (decline request or remove friend — involved players only)
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

- [x] 3. Checkpoint — Ensure API routes work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Client service
  - [x] 4.1 Create `src/lib/services/friendService.ts` with methods: `getFriends(playerId, params)`, `getRelationshipStatus(playerId)`, `sendFriendRequest(playerId)`, `acceptFriendRequest(playerId, friendshipId)`, `declineFriendRequest(playerId, friendshipId)`, `removeFriend(playerId, friendshipId)` — using fetch with `@/` alias imports, propagating errors with descriptive messages
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 4.2 Write unit tests for `friendService` in `test/unit/lib/services/friendService.test.ts` — test URL construction, successful calls, error propagation with descriptive messages
    - _Requirements: 8.1, 8.2_
  - [x] 4.3 Create pure utility functions in `src/lib/services/friendService.ts` (or a separate `src/lib/utils/friendUtils.ts` if needed for file size): `computePagination(totalCount, page, limit)`, `filterFriendsByName(friends, query)`, `getButtonState(status, isAuthenticated)`, `getAriaLabel(action, playerName)`, `countAcceptedFriends(friendships)`, `sortFriendsByDate(friends)`
    - _Requirements: 3.3, 3.4, 4.6, 6.1, 6.3, 6.4, 6.5, 6.6, 10.2_
  - [x] 4.4 Write property test: Pagination correctness in `test/unit/lib/services/friendService.property.test.ts`
    - **Property 7: Correction de la pagination**
    - **Validates: Requirements 3.3, 3.4**
  - [x] 4.5 Write property test: Client-side friend search filtering
    - **Property 9: Filtrage de recherche côté client**
    - **Validates: Requirement 4.6**
  - [x] 4.6 Write property test: Relationship status → button state mapping
    - **Property 10: Mapping statut → état du bouton**
    - **Validates: Requirements 6.1, 6.3, 6.4, 6.5, 6.6**
  - [x] 4.7 Write property test: Aria-label includes player name
    - **Property 13: Aria-label inclut le nom du joueur**
    - **Validates: Requirement 10.2**
  - [x] 4.8 Write property test: Chronological descending sort
    - **Property 5: Tri chronologique décroissant**
    - **Validates: Requirement 3.1**
  - [x] 4.9 Write property test: Friend data completeness
    - **Property 6: Complétude des données d'un ami**
    - **Validates: Requirements 3.2, 4.2**
  - [x] 4.10 Write property test: Friend count equals accepted friendships
    - **Property 11: Compteur = nombre d'amis acceptés**
    - **Validates: Requirement 7.1**
  - [x] 4.11 Write property test: Error propagation with descriptive message
    - **Property 12: Propagation d'erreur avec message descriptif**
    - **Validates: Requirement 8.2**

- [x] 5. Hook `useFriends`
  - [x] 5.1 Create `src/hooks/useFriends.ts` exposing: `friends`, `pendingRequests`, `friendCount`, `relationshipStatus`, `isLoading`, `isLoadingMore`, `hasNextPage`, `sendRequest()`, `acceptRequest(friendshipId)`, `declineRequest(friendshipId)`, `removeFriend(friendshipId)`, `loadMore()` — with optimistic updates for the friend count
    - _Requirements: 3.5, 4.5, 5.3, 5.4, 7.2_

- [x] 6. UI Components
  - [x] 6.1 Create `src/components/players/FriendCard.tsx` — card displaying avatar, display name, level, link to profile; focusable and keyboard-activable
    - _Requirements: 4.2, 10.4_
  - [x] 6.2 Create `src/components/players/FriendSearchBar.tsx` — search input filtering friends by display name (client-side, case-insensitive)
    - _Requirements: 4.6_
  - [x] 6.3 Create `src/components/players/FriendList.tsx` — grid of `FriendCard` with infinite scroll via `IntersectionObserver`, skeleton loading state, empty state message, ARIA attributes (`role="list"`, `aria-label`)
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 10.1, 10.4_
  - [x] 6.4 Create `src/components/players/FriendRequestCard.tsx` — card with sender avatar, name, date, Accept/Decline buttons with `aria-label` including player name, disabled state with spinner during operation
    - _Requirements: 5.2, 5.6, 10.2, 10.3_
  - [x] 6.5 Create `src/components/players/FriendRequestList.tsx` — section showing pending received requests above friend list, hidden if none, `aria-busy="true"` during operations
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 10.3_
  - [x] 6.6 Create `src/components/players/FriendsTab.tsx` — orchestrator rendering `FriendRequestList` (if owner with pending requests), `FriendSearchBar`, and `FriendList`; uses `useFriends` hook
    - _Requirements: 4.1, 5.1_
  - [x] 6.7 Create `src/components/players/FriendActionButton.tsx` — contextual button in profile: "Add friend" / "Request sent" (disabled) / "Accept"+"Decline" / "Remove friend" (with confirmation); hidden if not authenticated or own profile; `aria-live` feedback
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 10.5_

- [x] 7. Integration into existing components
  - [x] 7.1 Modify `src/components/players/PlayerTabContent.tsx` — add `case "friends"` rendering `<FriendsTab>` with required props
    - _Requirements: 4.1_
  - [x] 7.2 Modify `src/components/players/PlayerDetailsContent.tsx` — replace hardcoded `friendCount={0}` with dynamic count from `useFriends` hook, render `FriendActionButton` next to the banner
    - _Requirements: 7.1, 7.2, 6.1_

- [x] 8. Internationalization
  - [x] 8.1 Add `friends.*` translation keys in `src/messages/fr.json` — titles, buttons (Ajouter en ami, Demande envoyée, Accepter, Refuser, Retirer des amis), empty states, loading states, confirmation messages, ARIA labels
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 8.2 Add corresponding `friends.*` translation keys in `src/messages/en.json`
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 9. Checkpoint — Ensure all components render and integrate correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Unit tests for API and components
  - [x] 10.1 Create `test/unit/api/players/friends.test.ts` — test GET list (pagination, owner vs visitor), POST send request (201, 409, 400, 401, 404), PATCH accept (200, 401, 403), DELETE decline/remove (200, 401, 404)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.3, 3.5_
  - [x] 10.2 Create `test/unit/components/players/FriendList.test.tsx` — render with friends, empty state, skeleton, ARIA attributes, infinite scroll trigger
    - _Requirements: 4.1, 4.3, 4.4, 10.1_
  - [x] 10.3 Create `test/unit/components/players/FriendRequestList.test.tsx` — render requests, accept/decline buttons, loading states, hidden when empty
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 10.2, 10.3_
  - [x] 10.4 Create `test/unit/components/players/FriendActionButton.test.tsx` — button states per relationship status, hidden when not authenticated
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 10.5_

- [x] 11. Pending requests visibility property (owner-only)
  - [x] 11.1 Write property test: Pending requests visible only to owner in `test/unit/lib/services/friendService.property.test.ts`
    - **Property 8: Demandes en attente visibles uniquement par le propriétaire**
    - **Validates: Requirement 3.5**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Lint du code
  - [x] 13.1 Exécuter `bun run lint`
  - [x] 13.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 13.3 Corriger les erreurs de lint si nécessaire

- [x] 14. Build de production
  - [x] 14.1 Exécuter `bun run build`
  - [x] 14.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 14.3 Corriger les erreurs de build si nécessaire

- [x] 15. README de la fonctionnalité
  - [x] 15.1 Créer `docs/README_friends-system.md`
  - [x] 15.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design (Properties 5–13)
- Properties 1–4 (duplicate prevention, self-friendship, state transitions) depend on SQL constraints and RLS policies — covered by API integration tests
- All tests use Vitest with fast-check for property-based tests, placed in `test/` directory
- TypeScript is the implementation language throughout
