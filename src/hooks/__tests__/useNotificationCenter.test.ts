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
    fetchPage: vi.fn(),
    setReadStatus: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { NotificationService } from "@/lib/services/notificationService";

const mockedFetchPage = NotificationService.fetchPage as ReturnType<typeof vi.fn>;
const mockedSetReadStatus = NotificationService.setReadStatus as ReturnType<typeof vi.fn>;
const mockedMarkAllAsRead = NotificationService.markAllAsRead as ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children
  );

const makeNotif = (id: string, isRead = false) => ({
  id,
  recipientId: "u1",
  senderId: "u2",
  type: "post_comment" as const,
  referenceId: "p1",
  contentPreview: "Hi",
  isRead,
  createdAt: "2024-06-01T10:00:00Z",
  sender: { username: "Alice", avatarUrl: null },
});

describe("useNotificationCenter", () => {
  beforeEach(() => {
    mockUser = { id: "u1" };
    mockedFetchPage.mockReset();
    mockedSetReadStatus.mockReset();
    mockedMarkAllAsRead.mockReset();
    mockedFetchPage.mockResolvedValue({ notifications: [makeNotif("n1")], total: 25 });
    mockedSetReadStatus.mockResolvedValue({ success: true });
    mockedMarkAllAsRead.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the first page and computes totalPages", async () => {
    const { result } = renderHook(() => useNotificationCenter(), { wrapper });

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(result.current.total).toBe(25);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.page).toBe(1);
    expect(mockedFetchPage).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      category: "all",
      status: "all",
    });
  });

  it("resets to page 1 when the category changes", async () => {
    const { result } = renderHook(() => useNotificationCenter(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.setCategory("friends"));
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(result.current.category).toBe("friends");
  });

  it("toggleRead calls the service with the new status", async () => {
    const { result } = renderHook(() => useNotificationCenter(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));

    await act(async () => {
      await result.current.toggleRead("n1", true);
    });
    expect(mockedSetReadStatus).toHaveBeenCalledWith("n1", true);
  });

  it("markAllAsRead calls the service", async () => {
    const { result } = renderHook(() => useNotificationCenter(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));

    await act(async () => {
      await result.current.markAllAsRead();
    });
    expect(mockedMarkAllAsRead).toHaveBeenCalled();
  });

  it("does not fetch when unauthenticated", async () => {
    mockUser = null;
    const { result } = renderHook(() => useNotificationCenter(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedFetchPage).not.toHaveBeenCalled();
  });
});
