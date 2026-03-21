import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import type { RelationshipStatus } from "@/types/friendship";

vi.mock("next-intl", () => {
  const createTranslator = () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = (key: string) => key;
    t.markup = (key: string) => key;
    t.has = () => true;
    return t;
  };
  return {
    useTranslations: () => createTranslator(),
    useLocale: () => "fr",
    useMessages: () => ({}),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { FriendActionButton } from "@/components/players/friends/FriendActionButton";

const PLAYER_ID = "other-player";
const mockSendRequest = vi.fn(() => Promise.resolve());
const mockAcceptRequest = vi.fn(() => Promise.resolve());
const mockDeclineRequest = vi.fn(() => Promise.resolve());
const mockRemoveFriend = vi.fn(() => Promise.resolve());

function renderButton(
  overrides: {
    relationshipStatus?: RelationshipStatus;
    isAuthenticated?: boolean;
    isOwner?: boolean;
    friendshipId?: string | null;
  } = {}
) {
  return render(
    <FriendActionButton
      playerId={PLAYER_ID}
      isAuthenticated={overrides.isAuthenticated ?? true}
      isOwner={overrides.isOwner ?? false}
      relationshipStatus={overrides.relationshipStatus ?? "none"}
      friendshipId={overrides.friendshipId ?? "friendship-123"}
      sendRequest={mockSendRequest}
      acceptRequest={mockAcceptRequest}
      declineRequest={mockDeclineRequest}
      removeFriend={mockRemoveFriend}
    />
  );
}

describe("FriendActionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when user is the profile owner", () => {
    const { container } = renderButton({ isOwner: true });
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when not authenticated", () => {
    const { container } = renderButton({ isAuthenticated: false });
    expect(container.innerHTML).toBe("");
  });

  it("renders 'Add friend' button when status is none", () => {
    renderButton({ relationshipStatus: "none" });
    expect(screen.getByRole("button", { name: /addFriend/i })).toBeInTheDocument();
  });

  it("calls sendRequest when 'Add friend' is clicked", async () => {
    renderButton({ relationshipStatus: "none" });
    fireEvent.click(screen.getByRole("button", { name: /addFriend/i }));
    await waitFor(() => expect(mockSendRequest).toHaveBeenCalled());
  });

  it("renders disabled 'Request sent' when status is pending_sent", () => {
    renderButton({ relationshipStatus: "pending_sent" });
    const btn = screen.getByRole("button", { name: /requestSent/i });
    expect(btn).toBeDisabled();
  });

  it("renders Accept and Decline when status is pending_received", () => {
    renderButton({ relationshipStatus: "pending_received" });
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("renders 'Remove friend' when status is accepted", () => {
    renderButton({ relationshipStatus: "accepted" });
    expect(screen.getByRole("button", { name: /removeFriend/i })).toBeInTheDocument();
  });

  it("asks for confirmation before removing a friend", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderButton({ relationshipStatus: "accepted" });
    fireEvent.click(screen.getByRole("button", { name: /removeFriend/i }));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith("confirmRemove"));
    expect(mockRemoveFriend).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("has an aria-live='polite' wrapper", () => {
    const { container } = renderButton({ relationshipStatus: "none" });
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
  });
});
