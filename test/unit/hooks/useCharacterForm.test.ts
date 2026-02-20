import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const originalFetch = globalThis.fetch;

const mockGames = [
  { id: "g1", title: "Super Mario Bros", slug: "super-mario-bros", coverImage: "/mario.png" },
  { id: "g2", title: "The Legend of Zelda", slug: "legend-of-zelda", coverImage: null },
];

function createSuccessFetch() {
  return vi.fn((url: string, options?: RequestInit) => {
    // Games list fetch (reference data for the form)
    if (typeof url === "string" && url.includes("/api/admin/games")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            games: mockGames.map((g) => ({
              id: g.id,
              slug: g.slug,
              title: g.title,
              coverImage: g.coverImage,
            })),
            pagination: { currentPage: 1, totalPages: 1, totalCount: 2, limit: 100 },
          }),
      });
    }
    // POST/PUT character
    if (options?.method === "POST" || options?.method === "PUT") {
      return Promise.resolve({
        ok: true,
        status: options.method === "POST" ? 201 : 200,
        json: () =>
          Promise.resolve({
            message: `Character ${options.method === "POST" ? "created" : "updated"} successfully`,
            character: { id: "new-id", slug: "test-char" },
          }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  }) as unknown as typeof fetch;
}

describe("useCharacterForm", () => {
  beforeEach(() => {
    globalThis.fetch = createSuccessFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should initialize with default values in create mode", async () => {
    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result } = renderHook(() => useCharacterForm("create"));

    expect(result.current.form.getValues("slug")).toBe("");
    expect(result.current.form.getValues("translations")).toHaveLength(1);
    expect(result.current.form.getValues("games")).toEqual([]);
    expect(result.current.form.getValues("media")).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("should load available games on mount", async () => {
    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result } = renderHook(() => useCharacterForm("create"));

    await waitFor(
      () => {
        expect(result.current.loadingOptions).toBe(false);
      },
      { timeout: 2000 }
    );

    expect(result.current.availableGames).toHaveLength(2);
    expect(result.current.availableGames[0]).toEqual({
      id: "g1",
      title: "Super Mario Bros",
      slug: "super-mario-bros",
      coverImage: "/mario.png",
    });
  });

  it("should handle games loading failure gracefully", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as unknown as typeof fetch;

    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result } = renderHook(() => useCharacterForm("create"));

    await waitFor(
      () => {
        expect(result.current.loadingOptions).toBe(false);
      },
      { timeout: 2000 }
    );

    // Should gracefully degrade — empty list, no crash
    expect(result.current.availableGames).toEqual([]);
  });

  it("should submit character in create mode", async () => {
    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result } = renderHook(() => useCharacterForm("create"));

    await waitFor(
      () => {
        expect(result.current.loadingOptions).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.submitCharacter({
        slug: "test-character",
        translations: [{ language_code: "fr", name: "Test" }],
        games: [],
        media: [],
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const postCalls = calls.filter(
      (call) => (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "POST"
    );
    expect(postCalls.length).toBe(1);
    expect((postCalls[0] as unknown[])[0]).toContain("/api/admin/characters");

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("should submit character in edit mode", async () => {
    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result } = renderHook(() => useCharacterForm("edit", undefined, "char-123"));

    await waitFor(
      () => {
        expect(result.current.loadingOptions).toBe(false);
      },
      { timeout: 2000 }
    );

    await act(async () => {
      await result.current.submitCharacter({
        slug: "updated-character",
        translations: [{ language_code: "fr", name: "Updated" }],
        games: [],
        media: [],
      });
    });

    const calls = (globalThis.fetch as unknown as ReturnType<typeof mock>).mock.calls;
    const putCalls = calls.filter(
      (call) => (call as unknown[])[1] && ((call as unknown[])[1] as RequestInit).method === "PUT"
    );
    expect(putCalls.length).toBe(1);
    expect((putCalls[0] as unknown[])[0]).toContain("/api/admin/characters/char-123");
  });

  it("should throw on submit error with correct message", async () => {
    globalThis.fetch = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: "Character with this slug already exists" }),
        });
      }
      // Still return games for the initial load
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ games: mockGames, pagination: {} }),
      });
    }) as unknown as typeof fetch;

    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result } = renderHook(() => useCharacterForm("create"));

    await waitFor(
      () => {
        expect(result.current.loadingOptions).toBe(false);
      },
      { timeout: 2000 }
    );

    let caughtError: Error | null = null;
    try {
      await act(async () => {
        await result.current.submitCharacter({
          slug: "duplicate-slug",
          translations: [{ language_code: "fr", name: "Dup" }],
          games: [],
          media: [],
        });
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe("Character with this slug already exists");
    // isSubmitting is reset in the finally block
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should reset form when initialData changes", async () => {
    const initialData = {
      slug: "initial-slug",
      background_color: "#ff0000",
      main_image_url: "",
      background_image_url: "",
      translations: [
        { language_code: "fr", name: "Initial", role: "", description: "", biography: "" },
      ],
      games: [],
      media: [],
    };

    const { useCharacterForm } = await import("../../../src/hooks/useCharacterForm");
    const { result, rerender } = renderHook(
      ({ data }) => useCharacterForm("edit", data, "char-1"),
      { initialProps: { data: initialData } }
    );

    expect(result.current.form.getValues("slug")).toBe("initial-slug");

    const updatedData = { ...initialData, slug: "updated-slug" };
    rerender({ data: updatedData });

    await waitFor(
      () => {
        expect(result.current.form.getValues("slug")).toBe("updated-slug");
      },
      { timeout: 2000 }
    );
  });
});
