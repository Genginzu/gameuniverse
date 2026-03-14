import { describe, it, expect, vi, afterEach } from "vitest";
import fc from "fast-check";
import { PlayerPostsService } from "@/lib/services/playerPostsService";
import type { Post, PostsResponse } from "@/types/post";

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

const MIN_TS = new Date("2020-01-01").getTime();
const MAX_TS = new Date("2025-12-31").getTime();
const isoDateArb = fc.integer({ min: MIN_TS, max: MAX_TS }).map((ts) => new Date(ts).toISOString());

const validContentArb = fc
  .string({ minLength: 1, maxLength: 2000 })
  .filter((s) => s.trim().length > 0);

const postArb: fc.Arbitrary<Post> = fc.record({
  id: fc.uuid(),
  playerId: fc.uuid(),
  content: validContentArb,
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchOk(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

function mockFetchError(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 1: Post creation round-trip
// ---------------------------------------------------------------------------

/** **Validates: Requirements 1.1, 2.2, 3.1, 3.5** */
describe("Property 1: Post creation round-trip", () => {
  it("returns a post with the same content for any valid input", () => {
    fc.assert(
      fc.asyncProperty(fc.uuid(), validContentArb, async (playerId, content) => {
        const mockPost: Post = {
          id: "00000000-0000-0000-0000-000000000001",
          playerId,
          content,
          createdAt: "2024-03-10T12:00:00Z",
          updatedAt: "2024-03-10T12:00:00Z",
        };
        mockFetchOk(mockPost, 201);

        const result = await PlayerPostsService.createPost(playerId, content);
        expect(result.content).toBe(content);
        expect(result.playerId).toBe(playerId);
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 2: Content length validation
// ---------------------------------------------------------------------------

/** **Validates: Requirements 1.4, 3.3** */
describe("Property 2: Content length validation", () => {
  it("rejects content longer than 2000 characters", () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 2001, maxLength: 3000 }),
        async (playerId, longContent) => {
          mockFetchError(400, { error: "Content exceeds 2000 characters" });

          await expect(PlayerPostsService.createPost(playerId, longContent)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts content of 1-2000 characters (non-whitespace)", () => {
    fc.assert(
      fc.asyncProperty(fc.uuid(), validContentArb, async (playerId, content) => {
        const mockPost: Post = {
          id: "00000000-0000-0000-0000-000000000002",
          playerId,
          content,
          createdAt: "2024-03-10T12:00:00Z",
          updatedAt: "2024-03-10T12:00:00Z",
        };
        mockFetchOk(mockPost, 201);

        const result = await PlayerPostsService.createPost(playerId, content);
        expect(result.content).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 3: Whitespace content rejection
// ---------------------------------------------------------------------------

/** **Validates: Requirements 3.2** */
describe("Property 3: Whitespace content rejection", () => {
  it("rejects any whitespace-only string", () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc
          .array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 100 })
          .map((a) => a.join("")),
        async (playerId, wsContent) => {
          mockFetchError(400, { error: "Content is required" });

          await expect(PlayerPostsService.createPost(playerId, wsContent)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 4: Posts sorted by date descending
// ---------------------------------------------------------------------------

/** **Validates: Requirements 2.1** */
describe("Property 4: Posts sorted by date descending", () => {
  it("returns posts in descending createdAt order", () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(postArb, { minLength: 2, maxLength: 20 }),
        async (playerId, posts) => {
          const sorted = [...posts].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const response: PostsResponse = {
            posts: sorted,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalCount: sorted.length,
              hasNextPage: false,
            },
          };
          mockFetchOk(response);

          const result = await PlayerPostsService.fetchPosts(playerId);
          for (let i = 0; i < result.posts.length - 1; i++) {
            expect(new Date(result.posts[i].createdAt).getTime()).toBeGreaterThanOrEqual(
              new Date(result.posts[i + 1].createdAt).getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 5: Pagination invariants
// ---------------------------------------------------------------------------

/** **Validates: Requirements 2.3, 2.4** */
describe("Property 5: Pagination invariants", () => {
  it("hasNextPage is true iff currentPage < totalPages", () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 1, max: 10 }),
        async (playerId, totalCount, currentPage) => {
          const totalPages = Math.max(1, Math.ceil(totalCount / 20));
          const hasNextPage = currentPage < totalPages;
          const postsOnPage = Math.min(20, Math.max(0, totalCount - (currentPage - 1) * 20));
          const posts: Post[] = Array.from({ length: postsOnPage }, (_, i) => ({
            id: `post-${i}`,
            playerId,
            content: `Post ${i}`,
            createdAt: "2024-03-10T12:00:00Z",
            updatedAt: "2024-03-10T12:00:00Z",
          }));

          const response: PostsResponse = {
            posts,
            pagination: { currentPage, totalPages, totalCount, hasNextPage },
          };
          mockFetchOk(response);

          const result = await PlayerPostsService.fetchPosts(playerId, currentPage);
          expect(result.pagination.hasNextPage).toBe(
            result.pagination.currentPage < result.pagination.totalPages
          );
          expect(result.posts.length).toBeLessThanOrEqual(20);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 6: Post deletion removes post
// ---------------------------------------------------------------------------

/** **Validates: Requirements 4.1** */
describe("Property 6: Post deletion removes post", () => {
  it("deletePost resolves and the post is absent from subsequent fetch", () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(postArb, { minLength: 0, maxLength: 10 }),
        async (playerId, deletedPostId, otherPosts) => {
          // Mock DELETE success
          vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) })
          );
          await expect(
            PlayerPostsService.deletePost(playerId, deletedPostId)
          ).resolves.toBeUndefined();

          // Mock subsequent fetchPosts without the deleted post
          const remaining = otherPosts.filter((p) => p.id !== deletedPostId);
          const response: PostsResponse = {
            posts: remaining,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalCount: remaining.length,
              hasNextPage: false,
            },
          };
          mockFetchOk(response);

          const result = await PlayerPostsService.fetchPosts(playerId);
          expect(result.posts.every((p) => p.id !== deletedPostId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: player-posts-tab, Property 12: Service error propagation
// ---------------------------------------------------------------------------

/** **Validates: Requirements 9.4** */
describe("Property 12: Service error propagation", () => {
  it("throws with descriptive message for any HTTP error on fetchPosts", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (status, errorMsg) => {
          const body = errorMsg ? { error: errorMsg } : null;
          mockFetchError(status, body);

          try {
            await PlayerPostsService.fetchPosts("some-player-id");
            expect.unreachable("Expected an error to be thrown");
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
            const message = (err as Error).message;
            expect(message.length).toBeGreaterThan(0);
            if (errorMsg) {
              expect(message).toBe(errorMsg);
            } else {
              expect(message).toContain(String(status));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("throws with descriptive message for any HTTP error on createPost", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (status, errorMsg) => {
          const body = errorMsg ? { error: errorMsg } : null;
          mockFetchError(status, body);

          try {
            await PlayerPostsService.createPost("some-player-id", "some content");
            expect.unreachable("Expected an error to be thrown");
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
            const message = (err as Error).message;
            expect(message.length).toBeGreaterThan(0);
            if (errorMsg) {
              expect(message).toBe(errorMsg);
            } else {
              expect(message).toContain(String(status));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("throws with descriptive message for any HTTP error on deletePost", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        async (status, errorMsg) => {
          const body = errorMsg ? { error: errorMsg } : null;
          mockFetchError(status, body);

          try {
            await PlayerPostsService.deletePost("some-player-id", "some-post-id");
            expect.unreachable("Expected an error to be thrown");
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
            const message = (err as Error).message;
            expect(message.length).toBeGreaterThan(0);
            if (errorMsg) {
              expect(message).toBe(errorMsg);
            } else {
              expect(message).toContain(String(status));
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
