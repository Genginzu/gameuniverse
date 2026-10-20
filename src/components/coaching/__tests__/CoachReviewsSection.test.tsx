import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock("@iconify/react", () => ({
  Icon: ({ icon }: { icon: string }) => React.createElement("span", { "data-icon": icon }),
}));

vi.mock("swr", () => ({
  default: () => ({
    isLoading: false,
    data: {
      reviews: [
        {
          id: "review-1",
          rating: 4,
          comment: "Useful session",
          coachResponse: "Thanks!",
          coachRespondedAt: "2026-01-02T00:00:00Z",
          createdAt: "2026-01-01T00:00:00Z",
          student: { username: null, avatarUrl: null },
        },
      ],
    },
  }),
}));

import { CoachReviewsSection } from "@/components/coaching/CoachReviewsSection";

describe("CoachReviewsSection", () => {
  it("renders a review whose student deleted their account", () => {
    render(<CoachReviewsSection coachId="coach-1" />);
    expect(screen.getByText("accountDeletion.deletedUser")).toBeTruthy();
    expect(screen.getByText("Useful session")).toBeTruthy();
    expect(screen.getByText("Thanks!")).toBeTruthy();
  });
});
