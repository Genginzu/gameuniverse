import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameReviewsTab } from "../GameReviewsTab";
import type { Review } from "@/types/review";

const state = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false },
  reviews: {} as Record<string, unknown>,
}));

vi.mock("@/hooks/useTranslations", () => ({ useReviewTranslations: () => (key: string) => key }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => state.auth }));
vi.mock("@/hooks/useReviews", () => ({ useReviews: () => state.reviews }));
vi.mock("@/components/shared/SuspensionGate", () => ({
  SuspensionGate: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="suspension-gate">{children}</div>
  ),
}));
vi.mock("../ReviewList", () => ({
  ReviewList: ({ reviews, loading }: { reviews: Review[]; loading: boolean }) => (
    <div data-testid="review-list">{loading ? "loading" : reviews.length}</div>
  ),
}));
vi.mock("../ReviewFormDialog", () => ({
  ReviewFormDialog: (props: {
    existingReview?: Review;
    onSubmit: (data: unknown) => Promise<boolean>;
  }) => (
    <button onClick={() => props.onSubmit({ rating: 10 })}>
      {props.existingReview ? "edit-review" : "write-review"}
    </button>
  ),
}));

const OWN_REVIEW = { id: "r1", rating: 15 } as unknown as Review;

function setReviews(overrides: Record<string, unknown> = {}) {
  state.reviews = {
    reviews: [],
    averageRating: null,
    totalCount: 0,
    userHasReviewed: false,
    userReview: null,
    loading: false,
    error: null,
    submitting: false,
    fetchReviews: vi.fn(),
    submitReview: vi.fn().mockResolvedValue(true),
    updateReview: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function renderTab() {
  render(<GameReviewsTab gameId="game-1" gameTitle="Zelda" />);
}

describe("GameReviewsTab", () => {
  beforeEach(() => {
    state.auth = { user: { id: "user-1" }, loading: false };
    setReviews();
  });

  it("asks anonymous visitors to log in", () => {
    state.auth = { user: null, loading: false };
    renderTab();
    expect(screen.getByText("loginPrompt")).toBeInTheDocument();
    expect(screen.queryByTestId("suspension-gate")).not.toBeInTheDocument();
  });

  it("shows nothing auth-related while auth is loading", () => {
    state.auth = { user: null, loading: true };
    renderTab();
    expect(screen.queryByText("loginPrompt")).not.toBeInTheDocument();
    expect(screen.queryByText("write-review")).not.toBeInTheDocument();
  });

  it("offers to write a review behind the suspension gate and submits it", () => {
    renderTab();
    const button = screen.getByText("write-review");
    expect(screen.getByTestId("suspension-gate")).toContainElement(button);

    fireEvent.click(button);
    expect(state.reviews.submitReview).toHaveBeenCalledWith({ rating: 10 });
    expect(state.reviews.updateReview).not.toHaveBeenCalled();
  });

  it("offers to edit the existing review instead of writing a new one", () => {
    setReviews({ userHasReviewed: true, userReview: OWN_REVIEW });
    renderTab();
    expect(screen.queryByText("write-review")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("edit-review"));
    expect(state.reviews.updateReview).toHaveBeenCalledWith({ rating: 10 });
  });

  it("renders the average rating with the total review count", () => {
    setReviews({ averageRating: 14.25, totalCount: 42, reviews: [OWN_REVIEW] });
    renderTab();
    expect(screen.getByText("14.3")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByTestId("review-list")).toHaveTextContent("1");
  });

  it("hides the average rating when there is none", () => {
    renderTab();
    expect(screen.queryByText("/20")).not.toBeInTheDocument();
  });

  it("shows the error message", () => {
    setReviews({ error: "Failed to load reviews" });
    renderTab();
    expect(screen.getByText("Failed to load reviews")).toBeInTheDocument();
  });
});
