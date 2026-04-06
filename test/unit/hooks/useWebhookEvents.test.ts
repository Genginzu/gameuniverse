import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useWebhookEvents } from "@/hooks/useWebhookEvents";

const originalFetch = globalThis.fetch;

const mockResponse = {
  events: [{ id: "e1", entityType: "game", eventType: "create", status: "pending" }],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useWebhookEvents", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() => Promise.resolve(jsonResponse(mockResponse)));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches /api/admin/webhooks/events with filters", async () => {
    const { result } = renderHook(
      () => useWebhookEvents({ entityType: "game", page: 2 }),
      { wrapper: createSWRWrapper() }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/webhooks/events?entityType=game&page=2")
    );
  });

  it("returns events array and pagination", async () => {
    const { result } = renderHook(() => useWebhookEvents(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toEqual(mockResponse.events);
    expect(result.current.pagination.total).toBe(1);
  });

  it("returns empty when no data yet", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useWebhookEvents(), {
      wrapper: createSWRWrapper(),
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.pagination.total).toBe(0);
  });
});
