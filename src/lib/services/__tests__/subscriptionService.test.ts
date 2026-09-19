import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SubscriptionService } from "@/lib/services/subscriptionService";

const VIEWER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const TARGET = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
    } as Response)
  );
}

describe("SubscriptionService (client)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getCounts hits the count endpoint", async () => {
    const fetchMock = mockFetch({ followers: 4, following: 2 });
    vi.stubGlobal("fetch", fetchMock);

    const counts = await SubscriptionService.getCounts(TARGET);

    expect(fetchMock).toHaveBeenCalledWith(`/api/players/${TARGET}/subscriptions/count`);
    expect(counts).toEqual({ followers: 4, following: 2 });
  });

  it("getSubscriptions hits the subscriptions endpoint", async () => {
    const fetchMock = mockFetch({ subscriptions: [] });
    vi.stubGlobal("fetch", fetchMock);

    await SubscriptionService.getSubscriptions(VIEWER);

    expect(fetchMock).toHaveBeenCalledWith(`/api/players/${VIEWER}/subscriptions`);
  });

  it("getSubscribers hits the subscribers endpoint", async () => {
    const fetchMock = mockFetch({ subscriptions: [] });
    vi.stubGlobal("fetch", fetchMock);

    await SubscriptionService.getSubscribers(TARGET);

    expect(fetchMock).toHaveBeenCalledWith(`/api/players/${TARGET}/subscribers`);
  });

  it("subscribe posts targetId to the subscriptions endpoint", async () => {
    const fetchMock = mockFetch({ success: true });
    vi.stubGlobal("fetch", fetchMock);

    await SubscriptionService.subscribe(VIEWER, TARGET);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/players/${VIEWER}/subscriptions`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ targetId: TARGET }),
      })
    );
  });

  it("unsubscribe deletes the target subscription", async () => {
    const fetchMock = mockFetch({ success: true });
    vi.stubGlobal("fetch", fetchMock);

    await SubscriptionService.unsubscribe(VIEWER, TARGET);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/players/${VIEWER}/subscriptions/${TARGET}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throws with the server error message on failure", async () => {
    const fetchMock = mockFetch({ error: "nope" }, false, 500);
    vi.stubGlobal("fetch", fetchMock);

    await expect(SubscriptionService.getCounts(TARGET)).rejects.toThrow("nope");
  });
});
