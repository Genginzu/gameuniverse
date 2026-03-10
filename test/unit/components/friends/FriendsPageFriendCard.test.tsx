import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import type { FriendSummary } from "@/types/friendship";

// --- Mocks ---

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`;
      }
      return key;
    };
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return { useTranslations: () => createTranslator() };
});

vi.mock("@/components/players/FriendCard", () => ({
  FriendCard: ({ friend }: { friend: FriendSummary }) => (
    <div data-testid="friend-card">{friend.displayName}</div>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { FriendsPageFriendCard } from "@/components/friends/FriendsPageFriendCard";

const mockFriend: FriendSummary = {
  id: "friend-1",
  friendshipId: "fs-1",
  displayName: "Alice",
  avatarUrl: null,
  level: 5,
  acceptedAt: "2024-01-01T00:00:00Z",
};

describe("FriendsPageFriendCard", () => {
  let onRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onRemove = vi.fn(() => Promise.resolve());
  });

  it("renders the FriendCard component", () => {
    render(<FriendsPageFriendCard friend={mockFriend} locale="en" onRemove={onRemove} />);
    expect(screen.getByTestId("friend-card")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders a remove button with aria-label", () => {
    render(<FriendsPageFriendCard friend={mockFriend} locale="en" onRemove={onRemove} />);
    const removeBtn = screen.getByRole("button", { name: /removeFriend/i });
    expect(removeBtn).toBeInTheDocument();
  });

  it("opens confirmation dialog when remove button is clicked", () => {
    render(<FriendsPageFriendCard friend={mockFriend} locale="en" onRemove={onRemove} />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /removeFriend/i }));

    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("confirmRemoveTitle")).toBeInTheDocument();
  });

  it("shows friend name in the confirmation message", () => {
    render(<FriendsPageFriendCard friend={mockFriend} locale="en" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: /removeFriend/i }));

    expect(screen.getByText(/confirmRemoveMessage.*Alice/)).toBeInTheDocument();
  });

  it("calls onRemove with friendshipId when confirm button is clicked", async () => {
    render(<FriendsPageFriendCard friend={mockFriend} locale="en" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: /removeFriend/i }));

    const confirmBtn = screen.getByText("confirmRemoveConfirm");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith("fs-1");
    });
  });

  it("disables remove button and shows spinner during deletion", async () => {
    let resolveRemove!: () => void;
    const slowRemove = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRemove = resolve;
        })
    );

    render(<FriendsPageFriendCard friend={mockFriend} locale="en" onRemove={slowRemove} />);

    // Open dialog and click confirm
    fireEvent.click(screen.getByRole("button", { name: /removeFriend/i }));
    fireEvent.click(screen.getByText("confirmRemoveConfirm"));

    // While deleting: remove button should be disabled
    await waitFor(() => {
      const removeBtn = screen.getByRole("button", { name: /removeFriend/i });
      expect(removeBtn).toBeDisabled();
    });

    // Resolve the promise
    await act(async () => {
      resolveRemove();
    });

    // After deletion: button should be enabled again
    await waitFor(() => {
      const removeBtn = screen.getByRole("button", { name: /removeFriend/i });
      expect(removeBtn).not.toBeDisabled();
    });
  });
});
