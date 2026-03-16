import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Mock setup ---

const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Import after mocks
import { DiscussionServerService } from "@/lib/services/discussionServerService";

// --- Constants ---

const USER_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const FRIEND_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const CONV_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc";

// --- Chain builder helper ---

function buildChain(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "eq",
    "neq",
    "or",
    "is",
    "order",
    "limit",
    "in",
    "lt",
    "insert",
    "update",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  chain.single = vi.fn().mockResolvedValue(result);
  // Make chain itself thenable for queries that resolve directly
  chain.then = vi.fn((resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Tests ---

describe("DiscussionServerService", () => {
  // ── getConversations ──────────────────────────────────────────────

  describe("getConversations", () => {
    it("returns conversations with friend profile, last message and unread count", async () => {
      const convChain = buildChain({
        data: [{ id: CONV_ID, participant_1: USER_ID, participant_2: FRIEND_ID }],
        error: null,
      });
      const profileChain = buildChain({
        data: [{ id: FRIEND_ID, username: "Alice", avatar_url: "https://img.png" }],
        error: null,
      });
      const lastMsgChain = buildChain({
        data: [{ content: "Hello!", sender_id: FRIEND_ID, created_at: "2024-03-01T12:00:00Z" }],
        error: null,
      });
      const unreadChain = buildChain({ data: null, error: null, count: 3 });

      mockFrom.mockImplementation((table: string) => {
        if (table === "profiles") return profileChain;
        if (table === "conversations") return convChain;
        // messages: first call = last message, second call = unread count
        return lastMsgChain;
      });
      // After last message query, next messages query is unread count
      let msgCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === "profiles") return profileChain;
        if (table === "conversations") return convChain;
        if (table === "messages") {
          msgCallCount++;
          return msgCallCount === 1 ? lastMsgChain : unreadChain;
        }
        return buildChain({ data: null, error: null });
      });

      const result = await DiscussionServerService.getConversations(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].friend.displayName).toBe("Alice");
      expect(result[0].lastMessage?.content).toBe("Hello!");
      expect(result[0].unreadCount).toBe(3);
    });

    it("returns empty array when no conversations", async () => {
      const emptyChain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(emptyChain);

      const result = await DiscussionServerService.getConversations(USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ── createConversation ────────────────────────────────────────────

  describe("createConversation", () => {
    it("verifies friendship before creating", async () => {
      // USER_ID < FRIEND_ID alphabetically, so p1=USER_ID, p2=FRIEND_ID
      const friendshipChain = buildChain({ data: { id: "f1" }, error: null });
      const existingChain = buildChain({ data: null, error: null });
      const insertChain = buildChain({ data: { id: CONV_ID }, error: null });

      let convCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === "friendships") return friendshipChain;
        if (table === "conversations") {
          convCallCount++;
          return convCallCount === 1 ? existingChain : insertChain;
        }
        return buildChain({ data: null, error: null });
      });

      const result = await DiscussionServerService.createConversation(USER_ID, FRIEND_ID);

      expect(result).toEqual({ id: CONV_ID });
      expect(mockFrom).toHaveBeenCalledWith("friendships");
    });

    it("throws when not friends (Property 4)", async () => {
      const noFriendChain = buildChain({ data: null, error: null });
      mockFrom.mockReturnValue(noFriendChain);

      await expect(DiscussionServerService.createConversation(USER_ID, FRIEND_ID)).rejects.toThrow(
        "Cannot create conversation: not friends"
      );
    });

    it("returns existing conversation — idempotent (Property 5)", async () => {
      const friendshipChain = buildChain({ data: { id: "f1" }, error: null });
      const existingChain = buildChain({ data: { id: CONV_ID }, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "friendships") return friendshipChain;
        if (table === "conversations") return existingChain;
        return buildChain({ data: null, error: null });
      });

      const result = await DiscussionServerService.createConversation(USER_ID, FRIEND_ID);

      expect(result).toEqual({ id: CONV_ID });
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────

  describe("markAsRead", () => {
    it("only updates messages where sender != userId (Property 10)", async () => {
      // verifyParticipation chain
      const participationChain = buildChain({ data: { id: CONV_ID }, error: null });
      const updateChain = buildChain({ data: null, error: null });

      let convCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          convCallCount++;
          return participationChain;
        }
        if (table === "messages") return updateChain;
        return buildChain({ data: null, error: null });
      });

      await DiscussionServerService.markAsRead(CONV_ID, USER_ID);

      // Verify the update chain was called with neq("sender_id", userId)
      expect(updateChain.update).toHaveBeenCalled();
      expect(updateChain.neq).toHaveBeenCalledWith("sender_id", USER_ID);
      expect(updateChain.is).toHaveBeenCalledWith("read_at", null);
    });
  });

  // ── getUnreadCount ────────────────────────────────────────────────

  describe("getUnreadCount", () => {
    it("returns correct unread count", async () => {
      const convChain = buildChain({
        data: [{ id: CONV_ID }],
        error: null,
      });
      const countChain = buildChain({ data: null, error: null, count: 7 });

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") return convChain;
        if (table === "messages") return countChain;
        return buildChain({ data: null, error: null });
      });

      const result = await DiscussionServerService.getUnreadCount(USER_ID);

      expect(result).toBe(7);
    });

    it("returns 0 when no conversations", async () => {
      const emptyChain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(emptyChain);

      const result = await DiscussionServerService.getUnreadCount(USER_ID);

      expect(result).toBe(0);
    });
  });

  // ── sendMessage ───────────────────────────────────────────────────

  describe("sendMessage", () => {
    it("inserts message and returns it (Property 14)", async () => {
      const participationChain = buildChain({ data: { id: CONV_ID }, error: null });
      const msgData = {
        id: "msg-1",
        conversation_id: CONV_ID,
        sender_id: USER_ID,
        content: "Hi there",
        created_at: "2024-03-01T12:00:00Z",
        read_at: null,
      };
      const insertChain = buildChain({ data: msgData, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") return participationChain;
        if (table === "messages") return insertChain;
        return buildChain({ data: null, error: null });
      });

      const result = await DiscussionServerService.sendMessage(CONV_ID, USER_ID, "Hi there");

      expect(result.content).toBe("Hi there");
      expect(result.senderId).toBe(USER_ID);
      expect(result.conversationId).toBe(CONV_ID);
    });
  });

  // ── getMessages ───────────────────────────────────────────────────

  describe("getMessages", () => {
    it("returns messages with pagination info (Property 15)", async () => {
      const participationChain = buildChain({ data: { id: CONV_ID }, error: null });
      const rows = [
        {
          id: "m2",
          conversation_id: CONV_ID,
          sender_id: FRIEND_ID,
          content: "Hey",
          created_at: "2024-03-01T12:01:00Z",
          read_at: null,
        },
        {
          id: "m1",
          conversation_id: CONV_ID,
          sender_id: USER_ID,
          content: "Hi",
          created_at: "2024-03-01T12:00:00Z",
          read_at: null,
        },
      ];
      const msgChain = buildChain({ data: rows, error: null });
      // Override then to resolve with the data directly (query resolves as { data, error })
      msgChain.then = vi.fn((resolve: (v: unknown) => void) =>
        Promise.resolve({ data: rows, error: null }).then(resolve)
      );

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") return participationChain;
        if (table === "messages") return msgChain;
        return buildChain({ data: null, error: null });
      });

      const result = await DiscussionServerService.getMessages(CONV_ID, USER_ID);

      expect(result.messages).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      // Messages should be reversed to ascending order
      expect(result.messages[0].content).toBe("Hi");
      expect(result.messages[1].content).toBe("Hey");
    });
  });
});
