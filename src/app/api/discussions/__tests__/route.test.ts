import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// --- Mock functions ---
const mockGetUser = vi.fn();
const mockGetConversations = vi.fn();
const mockCreateConversation = vi.fn();
const mockGetMessages = vi.fn();
const mockSendMessage = vi.fn();
const mockMarkAsRead = vi.fn();
const mockGetUnreadCount = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createRouteHandlerClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

vi.mock("@/lib/services/discussionServerService", () => ({
  DiscussionServerService: {
    getConversations: (...args: unknown[]) => mockGetConversations(...args),
    createConversation: (...args: unknown[]) => mockCreateConversation(...args),
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
    getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from "@/app/api/discussions/route";
import { GET as GET_UNREAD } from "@/app/api/discussions/unread-count/route";
import {
  GET as GET_MESSAGES,
  POST as POST_MESSAGE,
} from "@/app/api/discussions/[conversationId]/messages/route";
import { PATCH } from "@/app/api/discussions/[conversationId]/read/route";

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(url, options);
}

const unauthResponse = { data: { user: null }, error: { message: "Not authenticated" } };
const authUser = { id: "user-123" };
const authResponse = { data: { user: authUser }, error: null };
const routeContext = { params: Promise.resolve({ conversationId: "conv-123" }) };

describe("Discussion API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 13: Unauthenticated API calls return 401
   * Validates: Requirements 7.7
   */
  describe("Property 13: Unauthenticated calls return 401", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue(unauthResponse);
    });

    it("GET /api/discussions → 401", async () => {
      const res = await GET();
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentication required" });
    });

    it("POST /api/discussions → 401", async () => {
      const req = createRequest("http://localhost/api/discussions", {
        method: "POST",
        body: JSON.stringify({ friendId: "friend-1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentication required" });
    });

    it("GET /api/discussions/unread-count → 401", async () => {
      const res = await GET_UNREAD();
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentication required" });
    });

    it("GET /api/discussions/[id]/messages → 401", async () => {
      const req = createRequest("http://localhost/api/discussions/conv-123/messages");
      const res = await GET_MESSAGES(req, {
        params: Promise.resolve({ conversationId: "conv-123" }),
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentication required" });
    });

    it("POST /api/discussions/[id]/messages → 401", async () => {
      const req = createRequest("http://localhost/api/discussions/conv-123/messages", {
        method: "POST",
        body: JSON.stringify({ content: "hello" }),
      });
      const res = await POST_MESSAGE(req, {
        params: Promise.resolve({ conversationId: "conv-123" }),
      });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentication required" });
    });

    it("PATCH /api/discussions/[id]/read → 401", async () => {
      const req = createRequest("http://localhost/api/discussions/conv-123/read", {
        method: "PATCH",
      });
      const res = await PATCH(req, { params: Promise.resolve({ conversationId: "conv-123" }) });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Authentication required" });
    });
  });

  describe("Validation errors", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue(authResponse);
    });

    it("POST /api/discussions with invalid friendId → 400", async () => {
      const req = createRequest("http://localhost/api/discussions", {
        method: "POST",
        body: JSON.stringify({ friendId: "not-a-uuid" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("POST /api/discussions/[id]/messages with empty content → 400", async () => {
      const req = createRequest("http://localhost/api/discussions/conv-123/messages", {
        method: "POST",
        body: JSON.stringify({ content: "" }),
      });
      const res = await POST_MESSAGE(req, routeContext);
      expect(res.status).toBe(400);
    });
  });

  describe("Success cases", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue(authResponse);
    });

    it("GET /api/discussions returns conversations", async () => {
      const mockConvos = [
        {
          id: "c1",
          friend: { id: "f1", displayName: "Alice", avatarUrl: null },
          lastMessage: null,
          unreadCount: 0,
        },
      ];
      mockGetConversations.mockResolvedValue(mockConvos);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.conversations).toEqual(mockConvos);
      expect(mockGetConversations).toHaveBeenCalledWith("user-123");
    });

    it("POST /api/discussions creates conversation → 201", async () => {
      const friendId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const mockConvo = { id: "conv-new", participant1: authUser.id, participant2: friendId };
      mockCreateConversation.mockResolvedValue(mockConvo);

      const req = createRequest("http://localhost/api/discussions", {
        method: "POST",
        body: JSON.stringify({ friendId }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockCreateConversation).toHaveBeenCalledWith("user-123", friendId);
    });

    it("POST /api/discussions with non-friend → 403", async () => {
      const friendId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      mockCreateConversation.mockRejectedValue(
        new Error("Cannot create conversation: not friends")
      );

      const req = createRequest("http://localhost/api/discussions", {
        method: "POST",
        body: JSON.stringify({ friendId }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Cannot create conversation: not friends" });
    });

    it("GET /api/discussions/unread-count returns count", async () => {
      mockGetUnreadCount.mockResolvedValue(5);
      const res = await GET_UNREAD();
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 5 });
    });
  });
});
