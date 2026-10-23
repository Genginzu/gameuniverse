"use client";

import { useTranslations } from "next-intl";

import { useNotifications } from "@/hooks/useNotifications";
import { usePendingRequestCount } from "@/hooks/usePendingRequestCount";
import type { NavBadge } from "@/types/navigation";

interface CountBadgeProps {
  count: number;
  ariaLabel: string;
}

function CountBadge({ count, ariaLabel }: CountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className="from-cta-from to-cta-to ml-auto inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-linear-to-r px-1 text-[10px] leading-none font-bold text-white"
      aria-label={ariaLabel}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function UnreadNotificationsBadge() {
  const t = useTranslations("editorial.subSidebar");
  const { unreadCount } = useNotifications();
  return <CountBadge count={unreadCount} ariaLabel={t("unreadBadge", { count: unreadCount })} />;
}

function PendingFriendsBadge() {
  const t = useTranslations("editorial.subSidebar");
  const { count } = usePendingRequestCount();
  return <CountBadge count={count} ariaLabel={t("pendingFriendsBadge", { count })} />;
}

/**
 * Live counter rendered next to a navigation link carrying a `badge` in the
 * Navigation Model. Only the hook of the requested counter runs.
 */
export function NavCountBadge({ badge }: { badge?: NavBadge }) {
  if (badge === "unreadNotifications") return <UnreadNotificationsBadge />;
  if (badge === "pendingFriends") return <PendingFriendsBadge />;
  return null;
}
