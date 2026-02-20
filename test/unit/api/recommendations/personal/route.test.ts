import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { GameRecommendation } from "@/types/recommendation";

// vi.hoisted ensures mock fns are available when vi.mock factories run
const { mockGetUser, mockGetPersonalRecommendations, mockFetchUserLibraryGameIds } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    mockGetPersonalRecommendations: vi.fn(() => Promise.resolve([])),
    mockFetchUserLibraryGameIds: vi.fn(() => Promise.resolve([])),
  })
);

const mockSupabase = {
  auth: { getUser: mockGetUser },
};

vi.mock("../../../../../src/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("../../../../../src/lib/services/recommendationService", () => ({
  getPersonalRecommendations: mockGetPersonalRecommendations,
}));

vi.mock("../../../../../src/lib/services/recommendation/dataFetchers", () => ({
  fetchUserLibraryGameIds: mockFetchUserLibraryGameIds,
}));

import { GET } from "../../../../../src/app/api/recommendations/personal/route";

const USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

function mockAuthenticated(id = USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id } }, error: null });
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
}

const SAMPLE_RECOMMENDATIONS: GameRecommendation[] = [
  {
    id: "rec-1",
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: "/images/elden.jpg",
    genres: [{ id: "g1", name: "RPG" }],
    developer: "FromSoftware",
    combinedScore: 0.85,
  },
  {
    id: "rec-2",
    slug: "hollow-knight",
    title: "Hollow Knight",
    coverImage: "/images/hollow.jpg",
    genres: [{ id: "g2", name: "Metroidvania" }],
    developer: "Team Cherry",
    combinedScore: 0.72,
  },
];

describe("/api/recommendations/personal", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockGetPersonalRecommendations.mockReset().mockResolvedValue(SAMPLE_RECOMMENDATIONS);
    mockFetchUserLibraryGameIds.mockReset().mockResolvedValue(["lib-1", "lib-2", "lib-3"]);
    mockUnauthenticated();
  });

  // Requirement 7.1 — 401 when user is not authenticated
  it("should return 401 when user is not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/recommendations/personal");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  // Requirement 5.1 — 200 with recommendations for authenticated user
  it("should return 200 with recommendations for authenticated user", async () => {
    mockAuthenticated();
    const req = new NextRequest("http://localhost/api/recommendations/personal");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recommendations).toEqual(SAMPLE_RECOMMENDATIONS);
  });

  // Requirement 7.3 — empty library returns empty recommendations
  it("should return 200 with empty recommendations when library is empty", async () => {
    mockAuthenticated();
    mockGetPersonalRecommendations.mockResolvedValue([]);
    mockFetchUserLibraryGameIds.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/recommendations/personal");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recommendations).toEqual([]);
    expect(body.basedOnGameCount).toBe(0);
  });

  // Requirement 5.2 — limit query parameter is passed to service
  it("should pass limit query parameter to the service", async () => {
    mockAuthenticated();
    const req = new NextRequest("http://localhost/api/recommendations/personal?limit=5");
    await GET(req);

    expect(mockGetPersonalRecommendations).toHaveBeenCalledWith(USER_ID, { limit: 5 });
  });

  it("should default limit to 10 when not provided", async () => {
    mockAuthenticated();
    const req = new NextRequest("http://localhost/api/recommendations/personal");
    await GET(req);

    expect(mockGetPersonalRecommendations).toHaveBeenCalledWith(USER_ID, { limit: 10 });
  });

  it("should fallback to 10 when limit is invalid", async () => {
    mockAuthenticated();
    const req = new NextRequest("http://localhost/api/recommendations/personal?limit=abc");
    await GET(req);

    expect(mockGetPersonalRecommendations).toHaveBeenCalledWith(USER_ID, { limit: 10 });
  });

  // 500 on unexpected error
  it("should return 500 on unexpected error", async () => {
    mockAuthenticated();
    mockGetPersonalRecommendations.mockRejectedValue(new Error("DB down"));

    const req = new NextRequest("http://localhost/api/recommendations/personal");
    const res = await GET(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to compute recommendations");
  });

  // Response includes basedOnGameCount and generatedAt
  it("should include basedOnGameCount and generatedAt in response", async () => {
    mockAuthenticated();
    const req = new NextRequest("http://localhost/api/recommendations/personal");
    const res = await GET(req);
    const body = await res.json();

    expect(body).toHaveProperty("recommendations");
    expect(body).toHaveProperty("basedOnGameCount");
    expect(body).toHaveProperty("generatedAt");
    expect(body.basedOnGameCount).toBe(3);
    expect(new Date(body.generatedAt).toISOString()).toBe(body.generatedAt);
  });
});
