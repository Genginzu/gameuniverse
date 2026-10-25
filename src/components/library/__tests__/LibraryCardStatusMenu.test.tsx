import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LibraryCardStatusMenu } from "@/components/library/LibraryCardStatusMenu";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.status ? `${key}:${values.status}` : key,
}));

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}

function renderMenu() {
  const Wrapper = createSWRWrapper();
  return render(
    <Wrapper>
      <LibraryStatusProvider gameIds={["g1"]}>
        <LibraryCardStatusMenu gameId="g1" title="Hades" belowBadges />
      </LibraryStatusProvider>
    </Wrapper>
  );
}

describe("LibraryCardStatusMenu", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/library/batch-status"
          ? jsonResponse({ statuses: { g1: true }, libraryStatuses: { g1: "owned" } })
          : jsonResponse({ inLibrary: true, status: "playing" })
      )
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows the batch-seeded status and switches the game to playing", async () => {
    renderMenu();

    fireEvent.click(await screen.findByRole("button", { name: "cardTriggerLabel:owned" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "playing" }));

    expect(await screen.findByRole("button", { name: "cardTriggerLabel:playing" })).toBeInTheDocument();
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith("/api/library/g1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "playing" }),
      })
    );
  });

  it("shows a spinner in the status button while the change is saved", async () => {
    let resolvePatch: (response: Response) => void = () => {};
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return new Promise<Response>((resolve) => {
          resolvePatch = resolve;
        });
      }
      return Promise.resolve(
        url === "/api/library/batch-status"
          ? jsonResponse({ statuses: { g1: true }, libraryStatuses: { g1: "owned" } })
          : jsonResponse({ inLibrary: true, status: "completed" })
      );
    });
    renderMenu();

    fireEvent.click(await screen.findByRole("button", { name: "cardTriggerLabel:owned" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "completed" }));

    const trigger = await screen.findByRole("button", { name: "cardTriggerLabel:completed" });
    await waitFor(() => expect(trigger).toHaveAttribute("aria-busy", "true"));
    expect(trigger.querySelector("[data-icon='svg-spinners:ring-resize']")).not.toBeNull();

    resolvePatch(jsonResponse({ inLibrary: true, status: "completed" }));
    await waitFor(() => expect(trigger).toHaveAttribute("aria-busy", "false"));
  });
});
