import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useDismissWithUndo } from "@/hooks/useDismissWithUndo";
import { createSWRWrapper } from "@/test-helpers/swr-wrapper";
import type { GameRecommendation } from "@/types/recommendation";

vi.mock("next-intl", () => ({ useLocale: () => "fr" }));

const REC: GameRecommendation = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "seven-deadly-sins",
  title: "The Seven Deadly Sins: Origin",
  coverImage: null,
  genres: [],
  developer: "",
  metascore: null,
  combinedScore: 1,
};

type Pending = { resolve: () => void };
let pendingPosts: Pending[];
let fetchMock: ReturnType<typeof vi.fn>;

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  pendingPosts = [];
  fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      return new Promise<Response>((resolve) => {
        pendingPosts.push({ resolve: () => resolve(json({ dismissed: true })) });
      });
    }
    return Promise.resolve(json({ dismissed: false, recommendations: [], basedOnGameCount: 0 }));
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

function methods() {
  return fetchMock.mock.calls.map(([url, init]) => `${(init as RequestInit | undefined)?.method ?? "GET"} ${url}`);
}

describe("useDismissWithUndo", () => {
  it("still restores the game when undo is clicked while the dismissal is in flight", async () => {
    const { result } = renderHook(() => useDismissWithUndo(), { wrapper: createSWRWrapper() });

    let dismissing: Promise<void> = Promise.resolve();
    act(() => {
      dismissing = result.current.dismiss(REC);
    });
    await waitFor(() => expect(result.current.lastDismissed?.id).toBe(REC.id));

    let undoing: Promise<void> = Promise.resolve();
    act(() => {
      undoing = result.current.undo();
    });

    await act(async () => {
      pendingPosts.forEach((post) => post.resolve());
      await dismissing;
      await undoing;
    });

    const sent = methods();
    const post = sent.indexOf("POST /api/recommendations/dismissals");
    const del = sent.indexOf(`DELETE /api/recommendations/dismissals/${REC.id}`);
    expect(post).toBeGreaterThanOrEqual(0);
    expect(del).toBeGreaterThan(post);
    expect(result.current.failed).toBe(false);
  });

  it("keeps the dismissed game (slug included) for the undo notice", async () => {
    const { result } = renderHook(() => useDismissWithUndo(), { wrapper: createSWRWrapper() });

    act(() => {
      void result.current.dismiss(REC);
    });

    await waitFor(() =>
      expect(result.current.lastDismissed).toEqual({ id: REC.id, slug: REC.slug, title: REC.title })
    );
  });
});
