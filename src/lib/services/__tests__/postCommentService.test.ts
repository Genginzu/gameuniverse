import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PostCommentService } from "@/lib/services/postCommentService";

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn() as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("PostCommentService", () => {
  it("fetches comments for a post", async () => {
    const data = { comments: [{ id: "c1" }], totalCount: 1 };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response);

    const result = await PostCommentService.fetchComments("post-1");
    expect(result).toEqual(data);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/posts/post-1/comments");
  });

  it("creates a comment", async () => {
    const comment = { id: "c2", content: "Nice post!" };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(comment),
    } as Response);

    const result = await PostCommentService.createComment("post-1", "Nice post!");
    expect(result).toEqual(comment);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/posts/post-1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Nice post!" }),
    });
  });

  it("deletes a comment", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(undefined),
    } as Response);

    await PostCommentService.deleteComment("post-1", "c1");
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/posts/post-1/comments/c1", {
      method: "DELETE",
    });
  });

  it("throws on fetchComments error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    } as Response);

    await expect(PostCommentService.fetchComments("post-1")).rejects.toThrow("Not found");
  });

  it("throws on createComment error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Content too long" }),
    } as Response);

    await expect(PostCommentService.createComment("post-1", "x")).rejects.toThrow(
      "Content too long"
    );
  });

  it("throws on deleteComment error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Forbidden" }),
    } as Response);

    await expect(PostCommentService.deleteComment("post-1", "c1")).rejects.toThrow("Forbidden");
  });

  it("throws default message when error body is empty", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error("parse error")),
    } as Response);

    await expect(PostCommentService.fetchComments("post-1")).rejects.toThrow(
      "Failed to fetch comments"
    );
  });
});
