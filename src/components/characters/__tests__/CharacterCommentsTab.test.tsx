import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterCommentsTab } from "../comments/CharacterCommentsTab";
import type { Comment } from "@/types/comment";

const state = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false },
  comments: {} as Record<string, unknown>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => state.auth }));
vi.mock("@/hooks/useComments", () => ({ useComments: () => state.comments }));
vi.mock("../comments/CommentForm", () => ({
  CommentForm: ({
    initialContent,
    isEditing,
  }: {
    initialContent?: string;
    isEditing?: boolean;
  }) => <div data-testid={isEditing ? "edit-form" : "create-form"}>{initialContent}</div>,
}));
vi.mock("../comments/CommentList", () => ({
  CommentList: ({ comments }: { comments: Comment[] }) => (
    <div data-testid="comment-list">{comments.length}</div>
  ),
}));

const OWN_COMMENT: Comment = {
  id: "comment-1",
  userId: "user-1",
  characterId: "char-1",
  content: "Great character!",
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  playerName: "Alice",
  playerAvatar: null,
};

function setComments(overrides: Record<string, unknown> = {}) {
  state.comments = {
    comments: [],
    totalCount: 0,
    userHasCommented: false,
    userComment: null,
    loading: false,
    error: null,
    submitting: false,
    submitComment: vi.fn(),
    updateComment: vi.fn(),
    ...overrides,
  };
}

describe("CharacterCommentsTab", () => {
  beforeEach(() => {
    state.auth = { user: { id: "user-1" }, loading: false };
    setComments();
  });

  it("shows the login prompt to anonymous visitors", () => {
    state.auth = { user: null, loading: false };
    render(<CharacterCommentsTab characterId="char-1" />);
    expect(screen.getByText("loginPrompt")).toBeInTheDocument();
    expect(screen.queryByTestId("create-form")).not.toBeInTheDocument();
  });

  it("shows the create form to an authenticated user without a comment", () => {
    render(<CharacterCommentsTab characterId="char-1" />);
    expect(screen.getByTestId("create-form")).toBeInTheDocument();
    expect(screen.queryByText("loginPrompt")).not.toBeInTheDocument();
  });

  it("shows the edit form prefilled with the user's comment", () => {
    setComments({
      comments: [OWN_COMMENT],
      totalCount: 1,
      userHasCommented: true,
      userComment: OWN_COMMENT,
    });
    render(<CharacterCommentsTab characterId="char-1" />);
    expect(screen.getByTestId("edit-form")).toHaveTextContent("Great character!");
    expect(screen.queryByTestId("create-form")).not.toBeInTheDocument();
  });

  it("hides both form and login prompt while auth is loading", () => {
    state.auth = { user: null, loading: true };
    render(<CharacterCommentsTab characterId="char-1" />);
    expect(screen.queryByText("loginPrompt")).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("comment-list")).toBeInTheDocument();
  });

  it("renders the total count, the list and the error message", () => {
    setComments({ comments: [OWN_COMMENT], totalCount: 7, error: "Failed to load comments" });
    render(<CharacterCommentsTab characterId="char-1" />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByTestId("comment-list")).toHaveTextContent("1");
    expect(screen.getByText("Failed to load comments")).toBeInTheDocument();
  });

  it("renders only the skeleton while comments are loading", () => {
    setComments({ loading: true });
    render(<CharacterCommentsTab characterId="char-1" />);
    expect(screen.queryByTestId("comment-list")).not.toBeInTheDocument();
  });

  it("reports the total count to the parent once loaded", () => {
    const onCountLoaded = vi.fn();
    setComments({ totalCount: 4 });
    render(<CharacterCommentsTab characterId="char-1" onCountLoaded={onCountLoaded} />);
    expect(onCountLoaded).toHaveBeenCalledWith(4);
  });

  it("does not report the count while loading", () => {
    const onCountLoaded = vi.fn();
    setComments({ loading: true, totalCount: 4 });
    render(<CharacterCommentsTab characterId="char-1" onCountLoaded={onCountLoaded} />);
    expect(onCountLoaded).not.toHaveBeenCalled();
  });
});
