"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { NotificationService } from "@/lib/services/notificationService";
import type {
  Notification,
  PaginatedNotificationsResponse,
  NotificationStatusFilter,
} from "@/types/notification";
import type { NotificationCategory } from "@/lib/notificationDisplay";

export const NOTIFICATION_CENTER_PAGE_SIZE = 20;

export interface UseNotificationCenterReturn {
  notifications: Notification[];
  total: number;
  totalPages: number;
  page: number;
  category: NotificationCategory | "all";
  status: NotificationStatusFilter;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setCategory: (category: NotificationCategory | "all") => void;
  setStatus: (status: NotificationStatusFilter) => void;
  toggleRead: (id: string, isRead: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  mutate: () => Promise<void>;
}

/**
 * Data hook for the unified notification center page.
 *
 * Kept separate from `useNotifications` (which powers the header bell badge and
 * only tracks unread items) so paginated/filter state here never interferes
 * with the badge's polling behaviour.
 */
export function useNotificationCenter(): UseNotificationCenterReturn {
  const { user } = useAuth();
  const [page, setPageState] = useState(1);
  const [category, setCategoryState] = useState<NotificationCategory | "all">("all");
  const [status, setStatusState] = useState<NotificationStatusFilter>("all");

  const key = user?.id
    ? (["notification-center", user.id, page, category, status] as const)
    : null;

  const { data, isLoading, error, mutate } = useSWR<PaginatedNotificationsResponse>(
    key,
    () =>
      NotificationService.fetchPage({
        page,
        limit: NOTIFICATION_CENTER_PAGE_SIZE,
        category,
        status,
      }),
    { keepPreviousData: true, onError: () => {} }
  );

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / NOTIFICATION_CENTER_PAGE_SIZE));

  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "Failed to fetch notifications"
    : null;

  const setPage = useCallback((next: number) => setPageState(Math.max(1, next)), []);

  const setCategory = useCallback((next: NotificationCategory | "all") => {
    setCategoryState(next);
    setPageState(1);
  }, []);

  const setStatus = useCallback((next: NotificationStatusFilter) => {
    setStatusState(next);
    setPageState(1);
  }, []);

  const toggleRead = useCallback(
    async (id: string, isRead: boolean) => {
      const optimistic = notifications.map((n) => (n.id === id ? { ...n, isRead } : n));
      await mutate({ notifications: optimistic, total }, { revalidate: false });

      try {
        await NotificationService.setReadStatus(id, isRead);
        await mutate();
      } catch {
        await mutate();
      }
    },
    [notifications, total, mutate]
  );

  const markAllAsRead = useCallback(async () => {
    const optimistic = notifications.map((n) => ({ ...n, isRead: true }));
    await mutate({ notifications: optimistic, total }, { revalidate: false });

    try {
      await NotificationService.markAllAsRead();
      await mutate();
    } catch {
      await mutate();
    }
  }, [notifications, total, mutate]);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return useMemo(
    () => ({
      notifications,
      total,
      totalPages,
      page,
      category,
      status,
      isLoading,
      error: errorMessage,
      setPage,
      setCategory,
      setStatus,
      toggleRead,
      markAllAsRead,
      mutate: refresh,
    }),
    [
      notifications,
      total,
      totalPages,
      page,
      category,
      status,
      isLoading,
      errorMessage,
      setPage,
      setCategory,
      setStatus,
      toggleRead,
      markAllAsRead,
      refresh,
    ]
  );
}
