import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { GameCardQuickAdd } from "@/components/games/GameCardQuickAdd";
import { LibraryStatusProvider } from "@/components/providers/LibraryStatusProvider";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";

const auth = vi.hoisted(() => ({ user: { id: "user-1" } as { id: string } | null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: auth.user }) }));

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-toast", () => ({ toast: toastMock }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { title?: string }) =>
    values?.title ? `${key}:${values.title}` : key,
}));

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Stateful fake server: a confirmed POST /api/library puts the game in the library.
function routeFetch(initialInLibrary: boolean, postStatus = 201) {
  let inLibrary = initialInLibrary;
  return vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/library/batch-status") {
      return Promise.resolve(jsonResponse({ statuses: { g1: inLibrary } }));
    }
    if (url === "/api/library" && init?.method === "POST") {
      if (postStatus < 400) inLibrary = true;
      return Promise.resolve(jsonResponse({}, postStatus));
    }
    return Promise.resolve(jsonResponse({ inLibrary }));
  });
}

function renderQuickAdd({ withProvider = true } = {}) {
  const Wrapper = createSWRWrapper();
  const card = <GameCardQuickAdd gameId="g1" title="Hades" belowBadges={false} />;
  return render(
    <Wrapper>
      {withProvider ? <LibraryStatusProvider gameIds={["g1"]}>{card}</LibraryStatusProvider> : card}
    </Wrapper>
  );
}

describe("GameCardQuickAdd", () => {
  let mockFetch: ReturnType<typeof routeFetch>;

  beforeEach(() => {
    auth.user = { id: "user-1" };
    toastMock.mockReset();
    mockFetch = routeFetch(false);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("adds the game to the library in one click, then shows it as owned", async () => {
    renderQuickAdd();

    fireEvent.click(await screen.findByRole("button", { name: "add:Hades" }));

    expect(await screen.findByRole("img", { name: "inLibrary:Hades" })).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: "g1" }),
    });
  });

  it("shows a check instead of the button when the game is already owned", async () => {
    mockFetch = routeFetch(true);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    renderQuickAdd();

    expect(await screen.findByRole("img", { name: "inLibrary:Hades" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("seeds the status in batch instead of one request per card", async () => {
    renderQuickAdd();

    await screen.findByRole("button", { name: "add:Hades" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/library/batch-status");
  });

  it("reports a failed addition and keeps the button", async () => {
    mockFetch = routeFetch(false, 500);
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    renderQuickAdd();

    fireEvent.click(await screen.findByRole("button", { name: "add:Hades" }));

    await waitFor(() => expect(toastMock).toHaveBeenCalledWith({ title: "error", variant: "destructive" }));
    expect(screen.getByRole("button", { name: "add:Hades" })).toBeInTheDocument();
  });

  it("renders nothing for a signed-out visitor", () => {
    auth.user = null;
    const { container } = renderQuickAdd();

    expect(container).toBeEmptyDOMElement();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders nothing outside a LibraryStatusProvider", () => {
    const { container } = renderQuickAdd({ withProvider: false });

    expect(container).toBeEmptyDOMElement();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
