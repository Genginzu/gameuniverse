"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { NotificationItem } from "@/components/shared/NotificationItem";
import type { Notification } from "@/types/notification";

interface NotificationDropdownProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onClose: () => void;
}

const MAX_VISIBLE = 8;

export function NotificationDropdown({
  notifications,
  onDismiss,
  onDismissAll,
  onClose,
}: NotificationDropdownProps) {
  const t = useTranslations("notifications");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const sorted = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_VISIBLE);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus first item on open
  useEffect(() => {
    firstItemRef.current?.focus();
  }, []);

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleDismiss = useCallback(
    (id: string) => {
      onDismiss(id);
    },
    [onDismiss]
  );

  return (
    <div
      ref={dropdownRef}
      role="menu"
      className={`glass-dropdown absolute top-full right-0 z-50 mt-2 w-screen max-w-[480px] p-2 sm:w-[480px] ${
        prefersReducedMotion ? "" : "animate-in fade-in slide-in-from-top-2 duration-200"
      }`}
    >
      {sorted.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
          {t("noNotifications")}
        </p>
      ) : (
        <>
          <div className="max-h-[360px] space-y-1 overflow-y-auto">
            {sorted.map((notification, index) => (
              <div key={notification.id} ref={index === 0 ? firstItemRef : undefined} tabIndex={0}>
                <NotificationItem
                  notification={notification}
                  onDismiss={handleDismiss}
                  onNavigate={onClose}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-gray-200/50 pt-2 dark:border-slate-600/50">
            <button
              type="button"
              onClick={onDismissAll}
              className="w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
            >
              {t("markAllAsRead")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
