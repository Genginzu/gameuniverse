import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/services/collectionApi", () => ({
  apiCreateCollection: vi.fn(async () => ({ slug: "new" })),
  apiUpdateCollection: vi.fn(async () => ({ slug: "updated" })),
  apiDeleteCollection: vi.fn(async () => {}),
  apiToggleVisibility: vi.fn(async () => ({ is_public: true })),
  apiAddItem: vi.fn(async () => ({ id: "item1" })),
  apiRemoveItem: vi.fn(async () => {}),
  apiReorderItems: vi.fn(async () => ({ success: true })),
}));

import { useCollectionMutations } from "@/hooks/useCollectionMutations";
import {
  apiCreateCollection,
  apiDeleteCollection,
  apiAddItem,
} from "@/lib/services/collectionApi";

describe("useCollectionMutations", () => {
  const refetchCollections = vi.fn(async () => {});
  const refetchDetail = vi.fn(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createCollection calls apiCreateCollection and refetchCollections", async () => {
    const { result } = renderHook(() =>
      useCollectionMutations({ playerId: "p1", refetchCollections, refetchDetail })
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.createCollection({ name: "My Col" } as any);
    });

    expect(apiCreateCollection).toHaveBeenCalledWith("p1", { name: "My Col" });
    expect(refetchCollections).toHaveBeenCalled();
    expect(res).toEqual({ slug: "new" });
  });

  it("deleteCollection calls apiDeleteCollection and refetchCollections", async () => {
    const { result } = renderHook(() =>
      useCollectionMutations({ playerId: "p1", refetchCollections })
    );

    await act(async () => {
      await result.current.deleteCollection("my-col");
    });

    expect(apiDeleteCollection).toHaveBeenCalledWith("p1", "my-col");
    expect(refetchCollections).toHaveBeenCalled();
  });

  it("addItem calls apiAddItem and refetchDetail", async () => {
    const { result } = renderHook(() =>
      useCollectionMutations({ playerId: "p1", refetchCollections, refetchDetail })
    );

    await act(async () => {
      await result.current.addItem("my-col", { gameId: "g1" } as any);
    });

    expect(apiAddItem).toHaveBeenCalledWith("p1", "my-col", { gameId: "g1" });
    expect(refetchDetail).toHaveBeenCalled();
  });
});
