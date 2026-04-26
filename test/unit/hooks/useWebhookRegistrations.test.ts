import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createSWRWrapper } from "../../helpers/swr-wrapper";
import { useWebhookRegistrations } from "@/hooks/useWebhookRegistrations";

const originalFetch = globalThis.fetch;

const mockRegistrations = {
  webhooks: [{ id: 1, endpoint: "games", method: "create", active: true }],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useWebhookRegistrations", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "POST") return Promise.resolve(jsonResponse({ success: true }));
      if (init?.method === "DELETE") return Promise.resolve(jsonResponse({ success: true }));
      return Promise.resolve(jsonResponse(mockRegistrations));
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches /api/admin/webhooks/registrations", async () => {
    const { result } = renderHook(() => useWebhookRegistrations(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.webhooks).toEqual(mockRegistrations.webhooks);
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/webhooks/registrations");
  });

  it("registerWebhook POSTs to registrations endpoint", async () => {
    const { result } = renderHook(() => useWebhookRegistrations(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.registerWebhook("games", "create" as any);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/webhooks/registrations",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deleteWebhook DELETEs with webhook ID", async () => {
    const { result } = renderHook(() => useWebhookRegistrations(), {
      wrapper: createSWRWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteWebhook(42);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/webhooks/registrations/42",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
