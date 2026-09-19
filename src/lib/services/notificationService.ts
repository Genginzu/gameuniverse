import type {
  NotificationsResponse,
  NotificationCountResponse,
  PaginatedNotificationsResponse,
  NotificationStatusFilter,
} from "@/types/notification";
import type { NotificationCategory } from "@/lib/notificationDisplay";

/**
 * Service client pour gérer les opérations de notifications.
 * Communique avec les endpoints /api/notifications/*.
 */
export class NotificationService {
  /**
   * Récupère les notifications non lues du joueur authentifié.
   */
  static async fetchNotifications(limit?: number): Promise<NotificationsResponse> {
    const params = limit ? `?limit=${limit}` : "";
    const response = await fetch(`/api/notifications${params}`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch notifications");
    }
    return response.json();
  }

  /**
   * Récupère une page de notifications filtrée (centre de notifications).
   */
  static async fetchPage(options: {
    page: number;
    limit: number;
    category: NotificationCategory | "all";
    status: NotificationStatusFilter;
  }): Promise<PaginatedNotificationsResponse> {
    const params = new URLSearchParams({
      page: String(options.page),
      limit: String(options.limit),
      status: options.status,
    });
    if (options.category !== "all") params.set("type", options.category);

    const response = await fetch(`/api/notifications?${params}`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch notifications");
    }
    return response.json();
  }

  /**
   * Récupère le compteur de notifications non lues.
   */
  static async fetchUnreadCount(): Promise<NotificationCountResponse> {
    const response = await fetch("/api/notifications/count");
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to fetch unread count");
    }
    return response.json();
  }

  /**
   * Marque une notification comme lue.
   */
  static async markAsRead(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to mark notification as read");
    }
    return response.json();
  }

  /**
   * Bascule le statut lu/non-lu d'une notification.
   */
  static async setReadStatus(id: string, isRead: boolean): Promise<{ success: boolean }> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to update notification");
    }
    return response.json();
  }

  /**
   * Marque toutes les notifications non lues comme lues.
   */
  static async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || "Failed to mark all notifications as read");
    }
    return response.json();
  }
}
