import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { SWRConfig } from "swr";
import React from "react";

let mockUser: { id: string } | null = { id: "u1" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/services/notificationService", () => ({
  NotificationService: {
    fetchNotifications: vi.fn(),
    fetchUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationService } from "@/lib/services/notificationService";

const mockedFetchNotifications = NotificationService.fetchNotifications as ReturnType<typeof vi.fn>;
const mockedFetchUnreadCount = NotificationService.fetchUnreadCount as ReturnType<typeof vi.fn>;
const mockedMarkAsRead = NotificationService.markAsRead as ReturnType<typeof vi.fn>;
const mockedMarkAllAsRead = NotificationService.markAllAsRead as ReturnType<typeof vi.fn>;

/** Wrapper that disables SWR cache between tests */
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children
  );

const MOCK_NOTIFICATIONS = {
  notifications: [
    {
      id: "n1",
      recipientId: "u1",
      senderId: "u2",
      type: "post_comment",
      referenceId: "p1",
      contentPreview: "Great post!",
      isRead: false,
      createdAt: "2024-06-01T10:00:00Z",
      sender: { username: "Alice", avatarUrl: null },
    },
  ],
};

describe("useNotifications", () => {
  beforeEach(() => {
    mockUser = { id: "u1" };
    mockedFetchNotifications.mockReset();
    mockedFetchUnreadCount.mockReset();
    mockedMarkAsRead.mockReset();
    mockedMarkAllAsRead.mockReset();
    mockedFetchNotifications.mockResolvedValue(MOCK_NOTIFICATIONS);
    mockedFetchUnreadCount.mockResolvedValue({ count: 1 });
    mockedMarkAsRead.mockResolvedValue({ success: true });
    mockedMarkAllAsRead.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("fetches notifications and unread count when authenticated", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchNotifications).toHaveBeenCalled();
    expect(mockedFetchUnreadCount).toHaveBeenCalled();
    expect(result.current.notifications).toEqual(MOCK_NOTIFICATIONS.notifications);
    expect(result.current.unreadCount).toBe(1);
  });

  it("does not fetch when user is not authenticated", async () => {
    mockUser = null;

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedFetchNotifications).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("markAsRead calls the service and revalidates", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead("n1");
    });

    expect(mockedMarkAsRead).toHaveBeenCalledWith("n1");
  });

  it("markAllAsRead calls the service and revalidates", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(mockedMarkAllAsRead).toHaveBeenCalled();
  });

  it("sets error state on fetch failure", async () => {
    mockedFetchNotifications.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });
  });
});
