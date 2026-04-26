import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fantasyService", () => {
  it("createTeam inserts team with league budget", async () => {
    // Mock league lookup
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { budget_cap: 8000 }, error: null })),
        })),
      })),
    });

    // Mock team insert
    mockFrom.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: "team-1",
                player_id: "user-1",
                league_id: "league-1",
                name: "My Team",
                budget_remaining: 8000,
                total_points: 0,
              },
              error: null,
            })
          ),
        })),
      })),
    });

    const { createTeam } = await import("@/lib/services/fantasyService");
    const team = await createTeam("user-1", "league-1", "My Team");

    expect(team.name).toBe("My Team");
    expect(team.budgetRemaining).toBe(8000);
    expect(team.players).toEqual([]);
  });

  it("addPlayer throws on insufficient budget", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { budget_remaining: 100 }, error: null })),
        })),
      })),
    });

    const { addPlayer } = await import("@/lib/services/fantasyService");
    await expect(addPlayer("team-1", 42, "Faker", 500)).rejects.toThrow("Insufficient budget");
  });

  it("getLeaderboard returns sorted entries", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "t1", name: "Team A", player_id: "p1", total_points: 500 },
                  { id: "t2", name: "Team B", player_id: "p2", total_points: 300 },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
    });

    const { getLeaderboard } = await import("@/lib/services/fantasyService");
    const lb = await getLeaderboard("league-1");

    expect(lb).toHaveLength(2);
    expect(lb[0].teamName).toBe("Team A");
    expect(lb[0].totalPoints).toBe(500);
  });
});
