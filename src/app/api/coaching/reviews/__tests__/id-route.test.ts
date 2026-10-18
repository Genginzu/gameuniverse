/**
 * Tests for the coaching review response API route (PATCH by id).
 *
 * Issue #377 — the coach-response endpoint must only ever write
 * coach_response / coach_responded_at, never rating or comment.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

let mockGetUser: ReturnType<typeof vi.fn>;
let mockSupabaseFrom: ReturnType<typeof vi.fn>;

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
      from: (table: string) => mockSupabaseFrom(table),
    }),
}));

const { PATCH } = await import("@/app/api/coaching/reviews/[id]/route");

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const COACH_USER = { id: "coach-player-1" };

describe("Coaching review response API — PATCH", () => {
  beforeEach(() => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: COACH_USER } }));
    mockSupabaseFrom = vi.fn();
  });

  test("returns 401 when unauthenticated", async () => {
    mockGetUser = vi.fn(() => Promise.resolve({ data: { user: null } }));
    const res = await PATCH(
      makeRequest("http://localhost/api/coaching/reviews/review-1", {
        method: "PATCH",
        body: JSON.stringify({ response: "Thanks" }),
      }),
      makeParams("review-1")
    );
    expect(res.status).toBe(401);
  });

  test("returns 400 when response is missing", async () => {
    const res = await PATCH(
      makeRequest("http://localhost/api/coaching/reviews/review-1", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
      makeParams("review-1")
    );
    expect(res.status).toBe(400);
  });

  test("returns 403 when the caller does not own the coach profile", async () => {
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "coaching_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "review-1", coach_id: "coach-1" }, error: null })
              ),
            })),
          })),
        };
      }
      // coach_profiles ownership check — no match
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      };
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/coaching/reviews/review-1", {
        method: "PATCH",
        body: JSON.stringify({ response: "Thanks" }),
      }),
      makeParams("review-1")
    );
    expect(res.status).toBe(403);
  });

  test("coach response update only writes coach_response + coach_responded_at", async () => {
    let updatePayload: Record<string, unknown> | null = null;
    mockSupabaseFrom = vi.fn((table: string) => {
      if (table === "coaching_reviews") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "review-1", coach_id: "coach-1" }, error: null })
              ),
            })),
          })),
          update: vi.fn((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return { eq: vi.fn(() => Promise.resolve({ error: null })) };
          }),
        };
      }
      // coach_profiles ownership check — match
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: "coach-1" }, error: null })),
            })),
          })),
        })),
      };
    });

    const res = await PATCH(
      makeRequest("http://localhost/api/coaching/reviews/review-1", {
        method: "PATCH",
        body: JSON.stringify({ response: "Thanks for the feedback", rating: 1 }),
      }),
      makeParams("review-1")
    );
    expect(res.status).toBe(200);
    expect(updatePayload).not.toBeNull();
    const payload = updatePayload as unknown as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["coach_responded_at", "coach_response"]);
    expect(payload.coach_response).toBe("Thanks for the feedback");
    // Attacker-supplied rating in the body is ignored by the handler.
    expect(payload).not.toHaveProperty("rating");
  });
});
