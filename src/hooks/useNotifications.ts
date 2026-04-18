"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { NotificationService } from "@/lib/services/notificationService";
import type {
  Notification,
  NotificationsResponse,
  NotificationCountResponse,
} from "@/types/notification";

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  mutate: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();

  const {
    data: notifData,
    isLoading: isLoadingNotifs,
    error: notifError,
    mutate: mutateNotifs,
  } = useSWR<NotificationsResponse>(
    user?.id ? "/api/notifications" : null,
    () => NotificationService.fetchNotifications(),
    { onError: () => {} }
  );

  const { data: countData, mutate: mutateCount } = useSWR<NotificationCountResponse>(
    user?.id ? "/api/notifications/count" : null,
    () => NotificationService.fetchUnreadCount(),
    { refreshInterval: 30000, onError: () => {} }
  );

  const notifications = notifData?.notifications ?? [];
  const unreadCount = countData?.count ?? 0;
  const error = notifError
    ? notifError instanceof Error
      ? notifError.message
      : "Failed to fetch notifications"
    : null;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const optimisticNotifs = notifications.filter((n) => n.id !== notificationId);
      const optimisticCount = Math.max(0, unreadCount - 1);

      await mutateNotifs({ notifications: optimisticNotifs }, { revalidate: false });
      await mutateCount({ count: optimisticCount }, { revalidate: false });

      try {
        await NotificationService.markAsRead(notificationId);
        await mutateNotifs();
        await mutateCount();
      } catch {
        await mutateNotifs();
        await mutateCount();
      }
    },
    [notifications, unreadCount, mutateNotifs, mutateCount]
  );

  const markAllAsRead = useCallback(async () => {
    await mutateNotifs({ notifications: [] }, { revalidate: false });
    await mutateCount({ count: 0 }, { revalidate: false });

    try {
      await NotificationService.markAllAsRead();
      await mutateNotifs();
      await mutateCount();
    } catch {
      await mutateNotifs();
      await mutateCount();
    }
  }, [mutateNotifs, mutateCount]);

  const mutate = useCallback(async () => {
    await Promise.all([mutateNotifs(), mutateCount()]);
  }, [mutateNotifs, mutateCount]);

  return {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifs,
    error,
    markAsRead,
    markAllAsRead,
    mutate,
  };
}
