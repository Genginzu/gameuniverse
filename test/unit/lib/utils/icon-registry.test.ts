import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchIcons } from "@/lib/utils/icon-registry";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

describe("searchIcons", () => {
  it("returns results when API responds with icons", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ icons: ["mdi:home", "mdi:star"] }),
    });
    const results = await searchIcons("home");
    expect(results).toEqual([{ name: "mdi:home" }, { name: "mdi:star" }]);
  });

  it("returns empty array for empty query", async () => {
    expect(await searchIcons("")).toEqual([]);
    expect(await searchIcons("   ")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    expect(await searchIcons("home")).toEqual([]);
  });

  it("returns empty array on non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    expect(await searchIcons("home")).toEqual([]);
  });

  it("encodes query and passes limit", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ icons: [] }),
    });
    await searchIcons("a b", 10);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.iconify.design/search?query=a%20b&limit=10"
    );
  });
});
