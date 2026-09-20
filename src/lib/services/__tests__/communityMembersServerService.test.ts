import { describe, it, expect, beforeEach, vi } from "vitest";

let resultQueue: Array<{ data?: unknown; error?: unknown }>;

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null };
}

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(() => Promise.resolve(nextResult()));
  builder.maybeSingle = vi.fn(() => Promise.resolve(nextResult()));
  builder.insert = vi.fn(() => Promise.resolve(nextResult()));
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  builder.then = (resolve: (v: unknown) => unknown) => resolve(nextResult());
  return builder;
}

const mockFrom = vi.fn(() => makeBuilder());

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { CommunityMembersServerService } from "@/lib/services/communityMembersServerService";

const COMMUNITY_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

describe("CommunityMembersServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue = [];
  });

  describe("fetchMembers", () => {
    it("maps member rows to CommunityMember objects", async () => {
      resultQueue = [
        {
          data: [
            {
              id: "m1",
              community_id: COMMUNITY_ID,
              player_id: PLAYER_ID,
              role: "owner",
              joined_at: "2024-01-01T00:00:00Z",
              player: { id: PLAYER_ID, username: "Alice", avatar_url: null },
            },
          ],
          error: null,
        },
      ];

      const members = await CommunityMembersServerService.fetchMembers(COMMUNITY_ID);

      expect(members).toEqual([
        {
          id: "m1",
          communityId: COMMUNITY_ID,
          playerId: PLAYER_ID,
          role: "owner",
          joinedAt: "2024-01-01T00:00:00Z",
          player: { id: PLAYER_ID, username: "Alice", avatarUrl: null },
        },
      ]);
    });

    it("returns an empty list when the table is missing (PGRST205)", async () => {
      resultQueue = [{ data: null, error: { code: "PGRST205" } }];

      const members = await CommunityMembersServerService.fetchMembers(COMMUNITY_ID);

      expect(members).toEqual([]);
    });

    it("throws on an unexpected error", async () => {
      resultQueue = [{ data: null, error: { code: "XX000", message: "boom" } }];

      await expect(CommunityMembersServerService.fetchMembers(COMMUNITY_ID)).rejects.toThrow(
        "boom"
      );
    });
  });

  describe("getMemberRole", () => {
    it("returns the role when a membership row exists", async () => {
      resultQueue = [{ data: { role: "moderator" }, error: null }];

      const role = await CommunityMembersServerService.getMemberRole(COMMUNITY_ID, PLAYER_ID);

      expect(role).toBe("moderator");
    });

    it("returns null when no membership row exists", async () => {
      resultQueue = [{ data: null, error: null }];

      const role = await CommunityMembersServerService.getMemberRole(COMMUNITY_ID, PLAYER_ID);

      expect(role).toBeNull();
    });
  });

  describe("joinCommunity", () => {
    it("inserts a member row with role 'member'", async () => {
      resultQueue = [{ error: null }];

      await expect(
        CommunityMembersServerService.joinCommunity(COMMUNITY_ID, PLAYER_ID)
      ).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("community_members");
    });

    it("throws when the insert fails", async () => {
      resultQueue = [{ error: { message: "duplicate key" } }];

      await expect(
        CommunityMembersServerService.joinCommunity(COMMUNITY_ID, PLAYER_ID)
      ).rejects.toThrow("duplicate key");
    });
  });

  describe("leaveCommunity", () => {
    it("deletes the membership row", async () => {
      resultQueue = [{ error: null }];

      await expect(
        CommunityMembersServerService.leaveCommunity(COMMUNITY_ID, PLAYER_ID)
      ).resolves.toBeUndefined();
    });

    it("throws when the delete fails", async () => {
      resultQueue = [{ error: { message: "not allowed" } }];

      await expect(
        CommunityMembersServerService.leaveCommunity(COMMUNITY_ID, PLAYER_ID)
      ).rejects.toThrow("not allowed");
    });
  });

  describe("updateMemberRole", () => {
    it("updates the member's role", async () => {
      resultQueue = [{ error: null }];

      await expect(
        CommunityMembersServerService.updateMemberRole(COMMUNITY_ID, PLAYER_ID, "moderator")
      ).resolves.toBeUndefined();
    });

    it("throws when the update fails", async () => {
      resultQueue = [{ error: { message: "forbidden" } }];

      await expect(
        CommunityMembersServerService.updateMemberRole(COMMUNITY_ID, PLAYER_ID, "moderator")
      ).rejects.toThrow("forbidden");
    });
  });
});
