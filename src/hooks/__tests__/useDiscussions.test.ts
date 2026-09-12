import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mutable mock user — allows toggling auth state between tests
let mockUser: { id: string } | null = { id: "user-123" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/services/discussionService", () => ({
  DiscussionService: {
    fetchConversations: vi.fn(),
    createConversation: vi.fn(),
    fetchMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    fetchUnreadCount: vi.fn(),
  },
}));

import { useDiscussions } from "@/hooks/useDiscussions";
import { DiscussionService } from "@/lib/services/discussionService";

const mockedFetchConversations = DiscussionService.fetchConversations as ReturnType<typeof vi.fn>;
const mockedFetchMessages = DiscussionService.fetchMessages as ReturnType<typeof vi.fn>;
const mockedSendMessage = DiscussionService.sendMessage as ReturnType<typeof vi.fn>;
const mockedMarkAsRead = DiscussionService.markAsRead as ReturnType<typeof vi.fn>;
const mockedCreateConversation = DiscussionService.createConversation as ReturnType<typeof vi.fn>;

const MOCK_CONVERSATIONS = {
  conversations: [
    {
      id: "conv-1",
      friend: { id: "friend-1", displayName: "Alice", avatarUrl: null },
      lastMessage: { content: "Hello", senderId: "friend-1", createdAt: "2024-03-01T12:00:00Z" },
      unreadCount: 2,
    },
  ],
};

const MOCK_MESSAGES = {
  messages: [
    {
      id: "m1",
      conversationId: "conv-1",
      senderId: "user-123",
      content: "Hi",
      createdAt: "2024-03-01T12:00:00Z",
      readAt: null,
    },
  ],
  hasMore: false,
  nextCursor: null,
};

describe("useDiscussions", () => {
  beforeEach(() => {
    mockUser = { id: "user-123" };
    mockedFetchConversations.mockReset();
    mockedFetchMessages.mockReset();
    mockedSendMessage.mockReset();
    mockedMarkAsRead.mockReset();
    mockedCreateConversation.mockReset();
    mockedFetchConversations.mockResolvedValue(MOCK_CONVERSATIONS);
    mockedFetchMessages.mockResolvedValue(MOCK_MESSAGES);
    mockedMarkAsRead.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Requirements 2.1, 5.1 — Fetches conversations on mount ---
  it("should fetch conversations on mount when authenticated", async () => {
    const { result } = renderHook(() => useDiscussions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchConversations).toHaveBeenCalledOnce();
    expect(result.current.conversations).toEqual(MOCK_CONVERSATIONS.conversations);
  });

  // --- No fetch when unauthenticated ---
  it("should not fetch when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => useDiscussions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchConversations).not.toHaveBeenCalled();
    expect(result.current.conversations).toEqual([]);
  });

  // --- Requirements 2.4, 5.1 — selectConversation loads messages and marks as read ---
  it("should load messages and call markAsRead when selecting a conversation", async () => {
    const { result } = renderHook(() => useDiscussions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.selectConversation("conv-1");
    });

    expect(mockedFetchMessages).toHaveBeenCalledWith("conv-1");
    expect(mockedMarkAsRead).toHaveBeenCalledWith("conv-1");
    expect(result.current.messages).toEqual(MOCK_MESSAGES.messages);
    expect(result.current.selectedConversationId).toBe("conv-1");
  });

  // --- Requirement 4.1 — sendMessage appends message and refreshes ---
  it("should send message, append it, and refresh conversations", async () => {
    const newMessage = {
      id: "m2",
      conversationId: "conv-1",
      senderId: "user-123",
      content: "New msg",
      createdAt: "2024-03-01T13:00:00Z",
      readAt: null,
    };
    mockedSendMessage.mockResolvedValue(newMessage);

    const { result } = renderHook(() => useDiscussions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Select conversation first so sendMessage has a selectedConversationId
    await act(async () => {
      await result.current.selectConversation("conv-1");
    });

    await act(async () => {
      await result.current.sendMessage("New msg");
    });

    expect(mockedSendMessage).toHaveBeenCalledWith("conv-1", "New msg");
    expect(result.current.messages).toContainEqual(newMessage);
    // fetchConversations called: mount + selectConversation refresh + sendMessage refresh
    expect(mockedFetchConversations).toHaveBeenCalled();
  });

  // --- Error handling — sets error state on failure ---
  it("should set error state on fetch failure", async () => {
    mockedFetchConversations.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useDiscussions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.conversations).toEqual([]);
  });

  // --- Requirement 3.3 — createConversation creates and selects ---
  it("should create a conversation and select it", async () => {
    mockedCreateConversation.mockResolvedValue({ id: "conv-new" });
    mockedFetchMessages.mockResolvedValue({ messages: [], hasMore: false, nextCursor: null });

    const { result } = renderHook(() => useDiscussions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createConversation("friend-2");
    });

    expect(mockedCreateConversation).toHaveBeenCalledWith("friend-2");
    expect(result.current.selectedConversationId).toBe("conv-new");
    // Should have fetched messages for the new conversation
    expect(mockedFetchMessages).toHaveBeenCalledWith("conv-new");
  });
});
