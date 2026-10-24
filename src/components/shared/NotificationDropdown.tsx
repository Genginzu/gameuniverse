"use client";

import { useRef, useCallback, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import type { Notification } from "@/types/notification";

interface NotificationDropdownProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onClose: () => void;
  /** The bell button: an inside region, so pressing it toggles instead of re-opening. */
  triggerRef?: RefObject<HTMLElement | null>;
}

const MAX_VISIBLE = 5;

export function NotificationDropdown({
  notifications,
  onDismiss,
  onDismissAll,
  onClose,
  triggerRef,
}: NotificationDropdownProps) {
  const t = useTranslations("notifications");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const sorted = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_VISIBLE);

  useDismissableLayer(dropdownRef, {
    open: true,
    onDismiss: onClose,
    insideRefs: triggerRef ? [triggerRef] : undefined,
    initialFocusRef: firstItemRef,
  });

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
      className={`absolute top-full right-0 z-50 mt-2 w-screen max-w-[480px] rounded-2xl border p-2 sm:w-[480px] ${
        prefersReducedMotion ? "" : "animate-in fade-in slide-in-from-top-2 duration-200"
      }`}
      style={{
        background: "var(--editorial-bg-2)",
        borderColor: "var(--editorial-line)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
      }}
    >
      {sorted.length === 0 ? (
        <>
          <p className="px-3 py-6 text-center text-sm text-slate-400">
            {t("noNotifications")}
          </p>
          <div className="border-t pt-2" style={{ borderColor: "var(--editorial-line)" }}>
            <Link
              href="/notifications"
              onClick={onClose}
              className="block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {t("viewAll")}
            </Link>
          </div>
        </>
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
          <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--editorial-line)" }}>
            <button
              type="button"
              onClick={onDismissAll}
              className="w-full rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors"
              style={{ color: "rgb(var(--neon-primary))" }}
            >
              {t("markAllAsRead")}
            </button>
          </div>
          <div className="mt-1 border-t pt-2" style={{ borderColor: "var(--editorial-line)" }}>
            <Link
              href="/notifications"
              onClick={onClose}
              className="block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {t("viewAll")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
