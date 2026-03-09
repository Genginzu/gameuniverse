# Implementation Plan: Friends Management Page

## Overview

Implement a dedicated friends management page (`/[locale]/friends`) that reuses the existing friends-system infrastructure. Add a navigation link with a notification badge for pending requests, a pending-count API endpoint, and a page orchestrator composing existing components with a new friend card variant supporting removal. All code is TypeScript/Next.js.

## Tasks

- [ ] 1. Add navigation link and NotificationBadge
  - [ ] 1.1 Add the `/friends` entry in `NAV_LINKS` in `src/lib/utils/navigation-utils.ts`, positioned between "Collections" and "Profil", with icon and `labelKey: "friends"`
    - Add `dashboard.friends` i18n key in `src/messages/en.json` and `src/messages/fr.json`
    - _Requirements: 2.1, 2.2, 2.3, 9.2_
  - [ ] 1.2 Create `src/components/friends/NotificationBadge.tsx` — pure presentational component displaying a numeric badge; returns `null` when `count === 0`, displays `"9+"` when `count > 9`, includes `aria-label` describing the pending count
    - Extract `formatBadgeCount(count: number): string | null` as a pure exported function for property testing
    - _Requirements: 3.1, 3.2, 3.3, 10.5_
  - [ ] 1.3 Create `src/hooks/usePendingRequestCount.ts` — hook calling `FriendService.getPendingCount()` on mount, returning `{ count, isLoading, decrement, refresh }`; only fetches when authenticated; falls back to 0 on error
    - _Requirements: 3.1, 3.4, 4.1_
  - [ ] 1.4 Modify `src/components/layout/dashboard/SidebarNav.tsx` to render `NotificationBadge` on the `/friends` link using `usePendingRequestCount`
    - _Requirements: 2.1, 3.1_
  - [ ] 1.5 Modify `src/components/layout/dashboard/MobileNavOverlay.tsx` to render `NotificationBadge` on the `/friends` link using `usePendingRequestCount`
    - _Requirements: 2.1, 3.1_

- [ ] 2. Pending-count API endpoint and service method
  - [ ] 2.1 Add `getPendingCount()` static method to `src/lib/services/friendService.ts` — `GET /api/players/me/friends/pending-count` returning `{ count: number }`
    - _Requirements: 4.1, 8.1_
  - [ ] 2.2 Create `src/app/api/players/me/friends/pending-count/route.ts` — GET handler using `createRouteHandlerClient`, `auth.getUser()`, and `SELECT COUNT(*)` on `friendships` where `receiver_id = userId AND status = 'pending'`; returns 401 if unauthenticated, 500 on server error
    - Add `PendingCountResponse` type in `src/types/friendship.ts`
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Checkpoint — Ensure navigation and API work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Page and orchestrator component
  - [ ] 4.1 Create `src/app/[locale]/friends/page.tsx` — page component wrapping `FriendsPageContent` in `DashboardLayout` + `ErrorBoundary`, following existing patterns (`LibraryPage`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ] 4.2 Create `src/components/friends/FriendsPageContent.tsx` — orchestrator using `useAuth` + `useFriends(currentUserId, locale)` + `usePendingRequestCount`; renders in order: translated h1 title, `FriendRequestList` (hidden if no pending), section header with friend count + `FriendSearchBar`, grid of `FriendsPageFriendCard` with infinite scroll; ARIA landmarks (`section` with `aria-label`); calls `pendingCount.decrement()` on accept/decline
    - _Requirements: 1.1, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 3.4, 10.1, 10.3, 10.4_
  - [ ] 4.3 Create `src/components/friends/FriendsPageFriendCard.tsx` — wrapper composing `FriendCard` with a `Trash2` icon button for removal; shows confirmation modal on click; disables button with spinner during deletion; props: `friend`, `locale`, `onRemove`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 5. Internationalization
  - [ ] 5.1 Add `friends.page.*` translation keys in `src/messages/en.json` — title, friendsCount (plural), removeFriend, confirmRemoveTitle, confirmRemoveMessage, confirmRemoveConfirm, confirmRemoveCancel, emptyState, explorePlayers, pendingBadgeLabel
    - _Requirements: 9.1, 9.3_
  - [ ] 5.2 Add corresponding `friends.page.*` translation keys in `src/messages/fr.json`
    - _Requirements: 9.1, 9.3_

- [ ] 6. Checkpoint — Ensure page renders and integrates correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Unit tests
  - [ ]* 7.1 Create `test/unit/components/friends/NotificationBadge.test.tsx` — test rendering with count=0 (hidden), count=5 (displayed), count=15 ("9+"), aria-label correctness
    - _Requirements: 3.1, 3.2, 3.3, 10.5_
  - [ ]* 7.2 Create `test/unit/components/friends/FriendsPageContent.test.tsx` — test rendering with pending requests, without pending requests, with friends, empty state, translated title, ARIA landmarks
    - _Requirements: 1.4, 5.1, 5.5, 6.4, 10.1_
  - [ ]* 7.3 Create `test/unit/components/friends/FriendsPageFriendCard.test.tsx` — test remove button rendering, confirmation modal, loading state during deletion, button disabled state
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]* 7.4 Create `test/unit/api/players/pending-count.test.ts` — test 200 with count, 401 if unauthenticated, 500 on server error
    - _Requirements: 4.1, 4.2_
  - [ ]* 7.5 Create `test/unit/hooks/usePendingRequestCount.test.ts` — test initial fetch, decrement, refresh, no fetch when unauthenticated
    - _Requirements: 3.1, 3.4, 4.1_
  - [ ]* 7.6 Create or update `test/unit/lib/utils/navigation-utils.test.ts` — verify `/friends` link is present in `NAV_LINKS` at the correct position (between Collections and Profil), verify `isActive` works for `/friends`
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 8. Property-based tests
  - [ ]* 8.1 Write property test for badge formatting in `test/unit/lib/utils/friendsPage.property.test.ts`
    - **Property 1: Formatage du badge de notification**
    - For all integers `count` ≥ 0: `formatBadgeCount(count)` returns `null` if 0, string of count if 1–9, `"9+"` if > 9; for count > 0 the aria-label contains the numeric value
    - **Validates: Requirements 3.1, 3.2, 3.3, 10.5**
  - [ ]* 8.2 Write property test for pending request counting in `test/unit/lib/utils/friendsPage.property.test.ts`
    - **Property 2: Compteur de demandes en attente**
    - For all lists of friendships and any userId, `countPendingRequests(friendships, userId)` equals the count where `receiver_id === userId` and `status === 'pending'`
    - **Validates: Requirement 4.1**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Lint du code
  - [ ] 10.1 Exécuter `bun run lint`
  - [ ] 10.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [ ] 10.3 Corriger les erreurs de lint si nécessaire

- [ ] 11. Build de production
  - [ ] 11.1 Exécuter `bun run build`
  - [ ] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 11.3 Corriger les erreurs de build si nécessaire

- [ ] 12. README de la fonctionnalité
  - [ ] 12.1 Créer `docs/README_friends-management-page.md`
  - [ ] 12.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 2 correctness properties from the design (badge formatting, pending count)
- Existing friends-system components (`FriendCard`, `FriendRequestCard`, `FriendSearchBar`, `FriendRequestList`, `FriendList`, `useFriends`) are reused directly — no modifications needed
- All tests use Vitest with fast-check for property-based tests, placed in `test/` directory
- No SQL migration needed — uses existing `friendships` table
- TypeScript is the implementation language throughout
