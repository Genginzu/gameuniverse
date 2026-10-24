import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const FAKE_KEY = "ps_test_token_123";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  vi.stubEnv("PANDASCORE_API_KEY", FAKE_KEY);
});

function mockFetchOk(data: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockFetchError(status: number) {
  vi.mocked(fetch).mockResolvedValue({
    ok: false,
    status,
    statusText: "Error",
    text: () => Promise.resolve("error body"),
  } as unknown as Response);
}

describe("PandaScore client", () => {
  // Dynamic import so env stubs are applied before module loads
  async function loadClient() {
    return import("@/lib/pandascore/client");
  }

  it("throws when PANDASCORE_API_KEY is missing", async () => {
    vi.stubEnv("PANDASCORE_API_KEY", "");
    const client = await loadClient();
    await expect(client.getRunningMatches()).rejects.toThrow(
      "PANDASCORE_API_KEY is not configured"
    );
  });

  it("sends Bearer token in Authorization header", async () => {
    mockFetchOk([]);
    const client = await loadClient();
    await client.getRunningMatches();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/matches/running"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${FAKE_KEY}`,
        }),
      })
    );
  });

  it("returns the response data", async () => {
    const data = [{ id: 1, name: "Match 1" }];
    mockFetchOk(data);
    const client = await loadClient();
    const result = await client.getRunningMatches();
    expect(result).toEqual(data);
  });

  it("passes query params to URL", async () => {
    mockFetchOk([]);
    const client = await loadClient();
    await client.getUpcomingMatches({ page: 2, per_page: 10 });

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("/matches/upcoming");
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("per_page=10");
  });

  it("getMatchById calls /matches/:id", async () => {
    mockFetchOk({ id: 99 });
    const client = await loadClient();
    await client.getMatchById(99);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/matches/99"), expect.any(Object));
  });

  it("throws on API error and logs it", async () => {
    mockFetchError(401);
    const { logger } = await import("@/lib/logger");
    const client = await loadClient();
    await expect(client.getRunningMatches()).rejects.toThrow("PandaScore API error: 401");
    expect(logger.error).toHaveBeenCalledWith(
      "PandaScore API error",
      expect.objectContaining({ status: 401 })
    );
  });
});
