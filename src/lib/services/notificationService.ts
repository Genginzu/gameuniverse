import type { NotificationsResponse, NotificationCountResponse } from "@/types/notification";

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
