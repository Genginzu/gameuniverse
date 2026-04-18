import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

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

const mockSubscribe = vi.fn(() => Promise.resolve());
const mockUnsubscribe = vi.fn(() => Promise.resolve());
let mockIsSubscribed = false;
let mockIsLoading = false;

vi.mock("@/hooks/useSubscriptionRelationship", () => ({
  useSubscriptionRelationship: () => ({
    isSubscribed: mockIsSubscribed,
    isLoading: mockIsLoading,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    error: null,
  }),
}));

import { SubscribeButton } from "@/components/players/subscription/SubscribeButton";

function renderButton(
  overrides: { isAuthenticated?: boolean; isOwner?: boolean; targetId?: string } = {}
) {
  return render(
    <SubscribeButton
      targetId={overrides.targetId ?? "target-1"}
      isAuthenticated={overrides.isAuthenticated ?? true}
      isOwner={overrides.isOwner ?? false}
    />
  );
}

describe("SubscribeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSubscribed = false;
    mockIsLoading = false;
  });

  it("renders nothing when user is the profile owner", () => {
    const { container } = renderButton({ isOwner: true });
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when the visitor is not authenticated", () => {
    const { container } = renderButton({ isAuthenticated: false });
    expect(container.innerHTML).toBe("");
  });

  it("renders 'Subscribe' when not subscribed", () => {
    mockIsSubscribed = false;
    renderButton();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("calls subscribe() when 'Subscribe' is clicked", async () => {
    mockIsSubscribed = false;
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled());
  });

  it("renders 'Unsubscribe' when already subscribed", () => {
    mockIsSubscribed = true;
    renderButton();
    expect(screen.getByRole("button", { name: /unsubscribe/i })).toBeInTheDocument();
  });

  it("asks for confirmation before unsubscribing", async () => {
    mockIsSubscribed = true;
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /unsubscribe/i }));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith("confirmUnsubscribe"));
    expect(mockUnsubscribe).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("calls unsubscribe() when confirmation is accepted", async () => {
    mockIsSubscribed = true;
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /unsubscribe/i }));
    await waitFor(() => expect(mockUnsubscribe).toHaveBeenCalled());
    confirmSpy.mockRestore();
  });

  it("wraps the button in an aria-live='polite' region", () => {
    renderButton();
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
  });
});
