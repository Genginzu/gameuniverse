import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  apiCreateCollection,
  apiUpdateCollection,
  apiDeleteCollection,
  apiToggleVisibility,
  apiAddItem,
  apiRemoveItem,
  apiReorderItems,
} from "../../../../src/lib/services/collectionApi";

const mockFetch = mock(() => Promise.resolve(new Response()));

describe("collectionApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  const playerId = "player-123";
  const slug = "best-rpgs";

  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // -----------------------------------------------------------------------
  // apiCreateCollection
  // -----------------------------------------------------------------------
  describe("apiCreateCollection", () => {
    it("should POST to the correct endpoint with input body", async () => {
      const input = { name: "Best RPGs", description: "My top RPGs" };
      mockFetch.mockImplementation(() =>
        Promise.resolve(jsonResponse({ collection: { id: "c1", ...input } }, 201))
      );

      await apiCreateCollection(playerId, input);

      expect(mockFetch).toHaveBeenCalledWith(`/api/players/${playerId}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    });

    it("should return the parsed response data", async () => {
      const collection = { id: "c1", name: "Best RPGs", slug: "best-rpgs" };
      mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ collection }, 201)));

      const result = await apiCreateCollection(playerId, { name: "Best RPGs" });

      expect(result).toEqual({ collection });
    });

    it("should throw on error response", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(jsonResponse({ error: "Validation failed" }, 400))
      );

      await expect(apiCreateCollection(playerId, { name: "" })).rejects.toThrow(
        "Validation failed"
      );
    });
  });

  // -----------------------------------------------------------------------
  // apiUpdateCollection
  // -----------------------------------------------------------------------
  describe("apiUpdateCollection", () => {
    it("should PATCH to the correct endpoint", async () => {
      const input = { name: "Updated Name" };
      mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ collection: {} })));

      await apiUpdateCollection(playerId, slug, input);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/players/${playerId}/collections/${slug}`,
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should throw on forbidden response", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(jsonResponse({ error: "Forbidden" }, 403))
      );

      await expect(apiUpdateCollection(playerId, slug, { name: "X" })).rejects.toThrow("Forbidden");
    });
  });

  // -----------------------------------------------------------------------
  // apiDeleteCollection
  // -----------------------------------------------------------------------
  describe("apiDeleteCollection", () => {
    it("should DELETE to the correct endpoint", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await apiDeleteCollection(playerId, slug);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/players/${playerId}/collections/${slug}`,
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should return null for 204 responses", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      const result = await apiDeleteCollection(playerId, slug);

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // apiToggleVisibility
  // -----------------------------------------------------------------------
  describe("apiToggleVisibility", () => {
    it("should PATCH with the inverted isPublic value", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ collection: {} })));

      await apiToggleVisibility(playerId, slug, true);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/players/${playerId}/collections/${slug}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isPublic: true }),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // apiAddItem
  // -----------------------------------------------------------------------
  describe("apiAddItem", () => {
    it("should POST to the items endpoint", async () => {
      const input = { gameId: "game-1", note: "Great game" };
      mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ success: true }, 201)));

      await apiAddItem(playerId, slug, input);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/players/${playerId}/collections/${slug}/items`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(input),
        })
      );
    });

    it("should throw on 409 conflict (duplicate)", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(jsonResponse({ error: "Ce jeu est déjà dans la collection" }, 409))
      );

      await expect(apiAddItem(playerId, slug, { gameId: "game-1" })).rejects.toThrow(
        "Ce jeu est déjà dans la collection"
      );
    });
  });

  // -----------------------------------------------------------------------
  // apiRemoveItem
  // -----------------------------------------------------------------------
  describe("apiRemoveItem", () => {
    it("should DELETE to the correct item endpoint", async () => {
      const gameId = "game-42";
      mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await apiRemoveItem(playerId, slug, gameId);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/players/${playerId}/collections/${slug}/items/${gameId}`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  // -----------------------------------------------------------------------
  // apiReorderItems
  // -----------------------------------------------------------------------
  describe("apiReorderItems", () => {
    it("should PATCH to the reorder endpoint with items payload", async () => {
      const items = [
        { gameId: "g1", position: 0 },
        { gameId: "g2", position: 1 },
      ];
      mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ success: true })));

      await apiReorderItems(playerId, slug, items);

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/players/${playerId}/collections/${slug}/items/reorder`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ items }),
        })
      );
    });
  });

  // -----------------------------------------------------------------------
  // Error handling — generic
  // -----------------------------------------------------------------------
  describe("error handling", () => {
    it("should throw generic error when response has no error field", async () => {
      mockFetch.mockImplementation(() => Promise.resolve(new Response("{}", { status: 500 })));

      await expect(apiCreateCollection(playerId, { name: "Test" })).rejects.toThrow(
        "An error occurred"
      );
    });

    it("should throw generic error when response body is not JSON", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response("not json", { status: 500 }))
      );

      await expect(apiCreateCollection(playerId, { name: "Test" })).rejects.toThrow(
        "An error occurred"
      );
    });
  });
});
