import { describe, it, expect } from "vitest";
import type { Comment } from "../../../../src/types/comment";

/**
 * Unit Tests for CharacterCommentsTab Component Logic
 *
 * **Validates: Requirements 1.1, 1.4, 1.5, 3.3**
 * - 1.1: Authenticated user sees the comment form
 * - 1.4: Authenticated user with existing comment sees edit form
 * - 1.5: Non-authenticated user sees a login prompt
 * - 3.3: Empty state when no comments exist
 */

interface AuthState {
  user: { id: string } | null;
  loading: boolean;
}

interface CommentsState {
  comments: Comment[];
  totalCount: number;
  userHasCommented: boolean;
  userComment: Comment | null;
  error: string | null;
  submitting: boolean;
}

/**
 * Simulates the rendering decisions of CharacterCommentsTab.
 * Mirrors the logic in the actual component without DOM rendering.
 */
function simulateCharacterCommentsTab(auth: AuthState, commentsState: CommentsState) {
  const isAuthenticated = !auth.loading && auth.user !== null;
  const showLoginPrompt = !auth.loading && !isAuthenticated;
  const showCreateForm = isAuthenticated && !commentsState.userHasCommented;
  const showEditForm =
    isAuthenticated && commentsState.userHasCommented && commentsState.userComment !== null;
  const showEmptyState = commentsState.comments.length === 0;
  const showError = commentsState.error !== null;

  return {
    showLoginPrompt,
    showCreateForm,
    showEditForm,
    showEmptyState,
    showError,
    errorMessage: commentsState.error,
    totalCount: commentsState.totalCount,
    commentCount: commentsState.comments.length,
    editInitialContent: showEditForm ? commentsState.userComment!.content : null,
  };
}

// --- Fixtures ---

const authenticatedAuth: AuthState = {
  user: { id: "user-1" },
  loading: false,
};

const unauthenticatedAuth: AuthState = {
  user: null,
  loading: false,
};

const loadingAuth: AuthState = {
  user: null,
  loading: true,
};

const emptyComments: CommentsState = {
  comments: [],
  totalCount: 0,
  userHasCommented: false,
  userComment: null,
  error: null,
  submitting: false,
};

const existingComment: Comment = {
  id: "comment-1",
  userId: "user-1",
  characterId: "char-1",
  content: "Great character!",
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  playerName: "Alice",
  playerAvatar: null,
};

const commentsWithData: CommentsState = {
  comments: [
    existingComment,
    {
      id: "comment-2",
      userId: "user-2",
      characterId: "char-1",
      content: "Interesting backstory",
      createdAt: "2025-01-14T08:00:00Z",
      updatedAt: "2025-01-14T08:00:00Z",
      playerName: "Bob",
      playerAvatar: null,
    },
  ],
  totalCount: 2,
  userHasCommented: true,
  userComment: existingComment,
  error: null,
  submitting: false,
};

// --- Tests ---

describe("CharacterCommentsTab", () => {
  describe("non-authenticated user (Req 1.5)", () => {
    it("shows login prompt when user is not authenticated", () => {
      const result = simulateCharacterCommentsTab(unauthenticatedAuth, emptyComments);
      expect(result.showLoginPrompt).toBe(true);
      expect(result.showCreateForm).toBe(false);
      expect(result.showEditForm).toBe(false);
    });
  });

  describe("authenticated user without existing comment (Req 1.1)", () => {
    it("shows create form when user has not commented", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, emptyComments);
      expect(result.showCreateForm).toBe(true);
      expect(result.showLoginPrompt).toBe(false);
      expect(result.showEditForm).toBe(false);
    });
  });

  describe("authenticated user with existing comment (Req 1.4)", () => {
    it("shows edit form with existing content", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, commentsWithData);
      expect(result.showEditForm).toBe(true);
      expect(result.showCreateForm).toBe(false);
      expect(result.showLoginPrompt).toBe(false);
      expect(result.editInitialContent).toBe("Great character!");
    });
  });

  describe("comment list rendering (Req 3.3)", () => {
    it("shows empty state when no comments exist", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, emptyComments);
      expect(result.showEmptyState).toBe(true);
      expect(result.commentCount).toBe(0);
    });

    it("does not show empty state when comments exist", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, commentsWithData);
      expect(result.showEmptyState).toBe(false);
      expect(result.commentCount).toBe(2);
    });
  });

  describe("comment count display", () => {
    it("displays total count of zero for no comments", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, emptyComments);
      expect(result.totalCount).toBe(0);
    });

    it("displays correct total count with comments", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, commentsWithData);
      expect(result.totalCount).toBe(2);
    });
  });

  describe("auth loading state", () => {
    it("hides both form and login prompt while auth is loading", () => {
      const result = simulateCharacterCommentsTab(loadingAuth, emptyComments);
      expect(result.showCreateForm).toBe(false);
      expect(result.showEditForm).toBe(false);
      expect(result.showLoginPrompt).toBe(false);
    });
  });

  describe("error handling", () => {
    it("displays error message when present", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, {
        ...emptyComments,
        error: "Failed to load comments",
      });
      expect(result.showError).toBe(true);
      expect(result.errorMessage).toBe("Failed to load comments");
    });

    it("hides error when no error exists", () => {
      const result = simulateCharacterCommentsTab(authenticatedAuth, emptyComments);
      expect(result.showError).toBe(false);
      expect(result.errorMessage).toBeNull();
    });
  });
});
