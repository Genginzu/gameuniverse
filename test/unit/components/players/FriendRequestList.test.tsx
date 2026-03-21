import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import type { FriendRequest } from "@/types/friendship";

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

vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/lib/utils/friendUtils", () => ({
  getAriaLabel: (action: string, name: string) => `${action} ${name}`,
}));

import { FriendRequestList } from "@/components/players/friends/FriendRequestList";

const makeRequest = (index: number): FriendRequest => ({
  friendshipId: `fs-${index}`,
  sender: {
    id: `sender-${index}`,
    displayName: `Sender ${index}`,
    avatarUrl: index % 2 === 0 ? `https://img.test/${index}.png` : null,
  },
  createdAt: `2024-03-0${index + 1}T12:00:00Z`,
});

const REQUESTS: FriendRequest[] = [makeRequest(0), makeRequest(1)];

describe("FriendRequestList", () => {
  let onAccept: ReturnType<typeof vi.fn>;
  let onDecline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onAccept = vi.fn(() => Promise.resolve());
    onDecline = vi.fn(() => Promise.resolve());
  });

  it("returns null when requests array is empty", () => {
    const { container } = render(
      <FriendRequestList requests={[]} onAccept={onAccept} onDecline={onDecline} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders a section with pending requests heading", () => {
    render(<FriendRequestList requests={REQUESTS} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText("pendingRequests")).toBeInTheDocument();
  });

  it("renders sender display names", () => {
    render(<FriendRequestList requests={REQUESTS} onAccept={onAccept} onDecline={onDecline} />);
    expect(screen.getByText("Sender 0")).toBeInTheDocument();
    expect(screen.getByText("Sender 1")).toBeInTheDocument();
  });

  it("renders accept and decline buttons with aria-labels including player name", () => {
    render(
      <FriendRequestList requests={[REQUESTS[0]]} onAccept={onAccept} onDecline={onDecline} />
    );
    expect(screen.getByRole("button", { name: "accept Sender 0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "decline Sender 0" })).toBeInTheDocument();
  });

  it("calls onAccept with friendshipId when accept button is clicked", async () => {
    render(
      <FriendRequestList requests={[REQUESTS[0]]} onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByRole("button", { name: "accept Sender 0" }));
    await waitFor(() => expect(onAccept).toHaveBeenCalledWith("fs-0"));
  });

  it("calls onDecline with friendshipId when decline button is clicked", async () => {
    render(
      <FriendRequestList requests={[REQUESTS[0]]} onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByRole("button", { name: "decline Sender 0" }));
    await waitFor(() => expect(onDecline).toHaveBeenCalledWith("fs-0"));
  });

  it("has aria-busy=false when no operation is in progress", () => {
    const { container } = render(
      <FriendRequestList requests={REQUESTS} onAccept={onAccept} onDecline={onDecline} />
    );
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-busy", "false");
  });

  it("sets aria-busy=true while an accept operation is in progress", async () => {
    // Make onAccept hang (never resolve) to keep processing state
    let resolveAccept: () => void;
    onAccept = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolveAccept = r;
        })
    );

    const { container } = render(
      <FriendRequestList requests={[REQUESTS[0]]} onAccept={onAccept} onDecline={onDecline} />
    );

    fireEvent.click(screen.getByRole("button", { name: "accept Sender 0" }));

    await waitFor(() => {
      const section = container.querySelector("section");
      expect(section).toHaveAttribute("aria-busy", "true");
    });

    // Cleanup: resolve the pending promise
    resolveAccept!();
  });
});
