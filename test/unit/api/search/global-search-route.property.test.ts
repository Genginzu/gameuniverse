import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";

/**
 * Feature: global-search
 * Property 2: Short query rejection
 * **Validates: Requirements 1.4**
 *
 * For any string of length 0 or 1 (including whitespace-only strings trimmed
 * to < 2 chars), the Global_Search_API SHALL return a 400 error and SHALL NOT
 * execute any search.
 */

const mockSearch = vi.fn();
const mockToGlobalSearchResponse = vi.fn();

vi.mock("@/lib/services/globalSearchService", () => ({
  GlobalSearchService: {
    search: (...args: unknown[]) => mockSearch(...args),
    toGlobalSearchResponse: (...args: unknown[]) => mockToGlobalSearchResponse(...args),
  },
}));

import { GET } from "@/app/api/search/global/route";

function makeRequest(queryParams: Record<string, string> = {}) {
  const params = new URLSearchParams(queryParams);
  return new NextRequest(`http://localhost/api/search/global?${params.toString()}`);
}

// Generator: whitespace characters used for padding
const whitespaceCharArb = fc.constantFrom(" ", "\t", "\n", "\r");

// Generator: strings made entirely of whitespace (1-20 chars)
const whitespaceOnlyArb = fc
  .array(whitespaceCharArb, { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(""));

// Generator: strings with optional whitespace padding around 0-1 core chars,
// filtered to ensure trimmed length < 2
const paddedShortStringArb = fc
  .tuple(
    fc.array(whitespaceCharArb, { minLength: 0, maxLength: 10 }).map((a) => a.join("")),
    fc.string({ minLength: 0, maxLength: 1 }),
    fc.array(whitespaceCharArb, { minLength: 0, maxLength: 10 }).map((a) => a.join(""))
  )
  .map(([leading, core, trailing]) => `${leading}${core}${trailing}`)
  .filter((s) => s.trim().length < 2);

describe("Property 2: Short query rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty strings with 400 and never calls search", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(""), async (query) => {
        vi.clearAllMocks();
        const response = await GET(makeRequest({ query }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBeDefined();
        expect(mockSearch).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it("rejects single-character strings with 400 and never calls search", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 1 }), async (query) => {
        vi.clearAllMocks();
        const response = await GET(makeRequest({ query }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBeDefined();
        expect(mockSearch).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it("rejects whitespace-only strings that trim to < 2 chars with 400", async () => {
    await fc.assert(
      fc.asyncProperty(whitespaceOnlyArb, async (query) => {
        vi.clearAllMocks();
        const response = await GET(makeRequest({ query }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBeDefined();
        expect(mockSearch).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it("rejects strings that trim to 0 or 1 non-whitespace char with 400", async () => {
    await fc.assert(
      fc.asyncProperty(paddedShortStringArb, async (query) => {
        vi.clearAllMocks();
        const response = await GET(makeRequest({ query }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBeDefined();
        expect(mockSearch).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});
