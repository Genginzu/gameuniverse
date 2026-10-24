import { describe, it, expect } from "vitest";

import { buildLibraryUrl, parseLibraryQueryParams } from "@/lib/utils/libraryQueryParams";

function parse(query: string) {
  return parseLibraryQueryParams(new URLSearchParams(query));
}

describe("parseLibraryQueryParams", () => {
  it("returns no filter by default", () => {
    expect(parse("")).toEqual({ status: null, limit: null });
  });

  it("accepts known statuses and positive limits", () => {
    expect(parse("status=playing&limit=12")).toEqual({ status: "playing", limit: 12 });
  });

  it("ignores unknown statuses and invalid limits", () => {
    expect(parse("status=deleted&limit=abc")).toEqual({ status: null, limit: null });
    expect(parse("limit=0")).toEqual({ status: null, limit: null });
    expect(parse("limit=-5")).toEqual({ status: null, limit: null });
  });

  it("clamps large limits", () => {
    expect(parse("limit=5000").limit).toBe(100);
  });
});

describe("buildLibraryUrl", () => {
  it("builds the full library URL without filters", () => {
    expect(buildLibraryUrl()).toBe("/api/library");
  });

  it("round-trips the filters", () => {
    const url = buildLibraryUrl({ status: "playing", limit: 12 });
    expect(url).toBe("/api/library?status=playing&limit=12");
    expect(parse(url.split("?")[1])).toEqual({ status: "playing", limit: 12 });
  });
});
