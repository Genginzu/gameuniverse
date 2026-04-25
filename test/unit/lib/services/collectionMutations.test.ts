import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockFrom })),
}));
vi.mock("@/lib/services/collectionService", () => ({
  generateSlug: (name: string) => name.toLowerCase().replace(/\s+/g, "-"),
  calculateNextPosition: (items: unknown[]) => items.length,
}));

import { createCollection, updateCollection } from "@/lib/services/collectionMutations";

function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "eq", "insert", "update", "delete"]) c[m] = vi.fn().mockReturnValue(c);
  c.single = vi.fn().mockResolvedValue(result);
  c.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return c;
}

beforeEach(() => vi.clearAllMocks());

describe("collectionMutations", () => {
  it("creates collection with slug", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "c1", slug: "my-col" }, error: null }));
    const result = await createCollection("u1", { name: "My Col" });
    expect(result).toEqual({ id: "c1", slug: "my-col" });
  });

  it("updates collection", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "c1", slug: "my-col" }, error: null }));
    const result = await updateCollection("u1", "my-col", { name: "Updated" });
    expect(result.id).toBe("c1");
  });
});
