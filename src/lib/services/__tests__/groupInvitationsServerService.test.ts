import { describe, it, expect, beforeEach, vi } from "vitest";

let resultQueue: Array<{ data?: unknown; error?: unknown; count?: number | null }>;

function nextResult() {
  return resultQueue.shift() ?? { data: null, error: null, count: 0 };
}

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.maybeSingle = vi.fn(() => Promise.resolve(nextResult()));
  builder.single = vi.fn(() => Promise.resolve(nextResult()));
  builder.insert = vi.fn(chain);
  builder.update = vi.fn(chain);
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

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(async () => ({ sent: true })),
}));
vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

// Email comes from auth.users through the auth admin API (issues #375, #387).
const { mockGetUserById } = vi.hoisted(() => ({
  mockGetUserById: vi.fn(async (id: string) => ({
    data: { user: { id, email: "player@example.com" } },
    error: null,
  })),
}));
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    auth: { admin: { getUserById: mockGetUserById } },
  }),
}));

import { GroupInvitationsServerService } from "@/lib/services/groupInvitationsServerService";

const GROUP_ID = "gggggggg-gggg-4ggg-gggg-gggggggggggg";
const PLAYER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const INVITER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("GroupInvitationsServerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resultQueue = [];
    mockSendEmail.mockResolvedValue({ sent: true });
  });

  describe("createInvitation", () => {
    it("resolves a username to a player_id and sends an email", async () => {
      resultQueue = [
        { data: { id: PLAYER_ID }, error: null }, // profile lookup (id only; email from auth.users)
        {
          data: {
            id: "inv1",
            group_id: GROUP_ID,
            invited_by: INVITER_ID,
            invited_email: null,
            invited_player_id: PLAYER_ID,
            status: "pending",
            token: "tok-123",
            created_at: "2024-01-01T00:00:00Z",
            expires_at: "2024-01-15T00:00:00Z",
            invited_player: { id: PLAYER_ID, username: "Bob", avatar_url: null },
          },
          error: null,
        },
      ];

      const invitation = await GroupInvitationsServerService.createInvitation(
        GROUP_ID,
        "rpg-fans",
        "RPG Fans",
        INVITER_ID,
        { username: "Bob" }
      );

      expect(invitation.invitedPlayerId).toBe(PLAYER_ID);
      expect(invitation.status).toBe("pending");
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "player@example.com" })
      );
    });

    it("creates an email-based invitation without a username lookup", async () => {
      resultQueue = [
        {
          data: {
            id: "inv2",
            group_id: GROUP_ID,
            invited_by: INVITER_ID,
            invited_email: "new@example.com",
            invited_player_id: null,
            status: "pending",
            token: "tok-456",
            created_at: "2024-01-01T00:00:00Z",
            expires_at: "2024-01-15T00:00:00Z",
            invited_player: null,
          },
          error: null,
        },
      ];

      const invitation = await GroupInvitationsServerService.createInvitation(
        GROUP_ID,
        "rpg-fans",
        "RPG Fans",
        INVITER_ID,
        { email: "new@example.com" }
      );

      expect(invitation.invitedEmail).toBe("new@example.com");
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "new@example.com" })
      );
    });

    it("throws when the username does not match any player", async () => {
      resultQueue = [{ data: null, error: null }];

      await expect(
        GroupInvitationsServerService.createInvitation(
          GROUP_ID,
          "rpg-fans",
          "RPG Fans",
          INVITER_ID,
          { username: "Ghost" }
        )
      ).rejects.toThrow("Player not found");
    });

    it("throws a friendly error on duplicate pending invitation (23505)", async () => {
      resultQueue = [
        { data: { id: PLAYER_ID }, error: null },
        { data: null, error: { code: "23505" } },
      ];

      await expect(
        GroupInvitationsServerService.createInvitation(
          GROUP_ID,
          "rpg-fans",
          "RPG Fans",
          INVITER_ID,
          { username: "Bob" }
        )
      ).rejects.toThrow("An invitation is already pending for this player");
    });
  });

  describe("acceptInvitation", () => {
    const baseInvitation = {
      id: "inv1",
      group_id: GROUP_ID,
      invited_player_id: PLAYER_ID,
      status: "pending" as const,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    it("accepts a valid invitation and adds the member", async () => {
      resultQueue = [
        { data: baseInvitation, error: null },
        { count: 10, error: null },
        { error: null }, // insert member
        { error: null }, // update invitation status
      ];

      await expect(
        GroupInvitationsServerService.acceptInvitation("tok-123", PLAYER_ID)
      ).resolves.toBeUndefined();
    });

    it("throws when the invitation does not exist", async () => {
      resultQueue = [{ data: null, error: null }];

      await expect(
        GroupInvitationsServerService.acceptInvitation("bad-token", PLAYER_ID)
      ).rejects.toThrow("Invitation not found");
    });

    it("throws when the invitation is not addressed to the caller", async () => {
      resultQueue = [{ data: baseInvitation, error: null }];

      await expect(
        GroupInvitationsServerService.acceptInvitation("tok-123", "someone-else")
      ).rejects.toThrow("This invitation is not addressed to you");
    });

    it("throws when the invitation was already answered", async () => {
      resultQueue = [{ data: { ...baseInvitation, status: "accepted" }, error: null }];

      await expect(
        GroupInvitationsServerService.acceptInvitation("tok-123", PLAYER_ID)
      ).rejects.toThrow("This invitation has already been answered");
    });

    it("throws when the invitation has expired", async () => {
      resultQueue = [
        {
          data: { ...baseInvitation, expires_at: new Date(Date.now() - 86400000).toISOString() },
          error: null,
        },
      ];

      await expect(
        GroupInvitationsServerService.acceptInvitation("tok-123", PLAYER_ID)
      ).rejects.toThrow("This invitation has expired");
    });

    it("throws when the group has reached the 50-member cap", async () => {
      resultQueue = [
        { data: baseInvitation, error: null },
        { count: 50, error: null },
      ];

      await expect(
        GroupInvitationsServerService.acceptInvitation("tok-123", PLAYER_ID)
      ).rejects.toThrow("This group has reached the maximum of 50 members");
    });
  });

  describe("declineInvitation", () => {
    it("declines a pending invitation addressed to the caller", async () => {
      resultQueue = [
        { data: { id: "inv1", invited_player_id: PLAYER_ID, status: "pending" }, error: null },
        { error: null },
      ];

      await expect(
        GroupInvitationsServerService.declineInvitation("tok-123", PLAYER_ID)
      ).resolves.toBeUndefined();
    });

    it("throws when not addressed to the caller", async () => {
      resultQueue = [
        { data: { id: "inv1", invited_player_id: "someone-else", status: "pending" }, error: null },
      ];

      await expect(
        GroupInvitationsServerService.declineInvitation("tok-123", PLAYER_ID)
      ).rejects.toThrow("This invitation is not addressed to you");
    });
  });
});
