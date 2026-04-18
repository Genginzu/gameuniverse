import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NotificationService } from "@/lib/services/notificationService";

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn() as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("NotificationService", () => {
  it("fetches notifications without limit", async () => {
    const data = { notifications: [{ id: "n1" }] };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response);

    const result = await NotificationService.fetchNotifications();
    expect(result).toEqual(data);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/notifications");
  });

  it("fetches notifications with limit", async () => {
    const data = { notifications: [] };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response);

    await NotificationService.fetchNotifications(5);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/notifications?limit=5");
  });

  it("fetches unread count", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ count: 3 }),
    } as Response);

    const result = await NotificationService.fetchUnreadCount();
    expect(result).toEqual({ count: 3 });
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/notifications/count");
  });

  it("marks a notification as read", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const result = await NotificationService.markAsRead("n1");
    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/notifications/n1/read", {
      method: "PATCH",
    });
  });

  it("marks all notifications as read", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const result = await NotificationService.markAllAsRead();
    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/notifications/read-all", {
      method: "PATCH",
    });
  });

  it("throws on fetchNotifications error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    } as Response);

    await expect(NotificationService.fetchNotifications()).rejects.toThrow("Unauthorized");
  });

  it("throws on fetchUnreadCount error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    } as Response);

    await expect(NotificationService.fetchUnreadCount()).rejects.toThrow("Server error");
  });

  it("throws on markAsRead error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Forbidden" }),
    } as Response);

    await expect(NotificationService.markAsRead("n1")).rejects.toThrow("Forbidden");
  });

  it("throws default message when error body is empty", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error("parse error")),
    } as Response);

    await expect(NotificationService.markAllAsRead()).rejects.toThrow(
      "Failed to mark all notifications as read"
    );
  });
});
