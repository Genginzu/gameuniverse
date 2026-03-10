"use client";

import { useTranslations } from "next-intl";

interface NotificationBadgeProps {
  count: number;
}

/**
 * Pure function for badge count formatting.
 * Returns null when count is 0 (badge hidden), the string representation
 * for 1–9, and "9+" for counts above 9.
 */
export function formatBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  if (count > 9) return "9+";
  return String(count);
}

/**
 * Notification badge displaying pending friend request count.
 * Rendered inline (ml-auto) inside a flex parent link.
 * Returns null when there are no pending requests.
 */
export function NotificationBadge({ count }: NotificationBadgeProps) {
  const t = useTranslations("friends.page");

  const formattedCount = formatBadgeCount(count);
  if (formattedCount === null) return null;

  return (
    <span
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-violet px-1.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgb(var(--neon-violet)/0.5)]"
      aria-label={t("pendingBadgeLabel", { count })}
    >
      {formattedCount}
    </span>
  );
}
