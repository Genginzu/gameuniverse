"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDismiss = useCallback(
    async (id: string) => {
      await markAsRead(id);
    },
    [markAsRead]
  );

  const handleDismissAll = useCallback(async () => {
    await markAllAsRead();
    setIsOpen(false);
  }, [markAllAsRead]);

  if (!user) return null;

  const badgeText = unreadCount === 0 ? null : unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl p-2 transition-all hover:bg-white/40 hover:shadow-md dark:hover:bg-slate-700/40"
        aria-label={t("ariaLabel", { count: unreadCount })}
      >
        <Icon icon="mdi:bell-outline" className="h-6 w-6 text-white" />
        {badgeText && (
          <span className="from-palette-secondary-500 to-palette-primary-500 absolute top-1 right-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-linear-to-r px-1 text-[10px] leading-none font-bold text-white">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          onDismiss={handleDismiss}
          onDismissAll={handleDismissAll}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
