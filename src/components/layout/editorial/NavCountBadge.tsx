"use client";

import { useTranslations } from "next-intl";

import { useNotifications } from "@/hooks/useNotifications";
import { usePendingRequestCount } from "@/hooks/usePendingRequestCount";

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

/**
 * Counter badge rendered next to editorial navigation links that carry a
 * live count (unread notifications, pending friend requests).
 */
export function NavCountBadge({ href }: { href: string }) {
  const t = useTranslations("editorial.subSidebar");
  const { unreadCount } = useNotifications();
  const { count: pendingFriends } = usePendingRequestCount();

  if (href === "/notifications") {
    return <CountBadge count={unreadCount} ariaLabel={t("unreadBadge", { count: unreadCount })} />;
  }
  if (href === "/friends") {
    return (
      <CountBadge
        count={pendingFriends}
        ariaLabel={t("pendingFriendsBadge", { count: pendingFriends })}
      />
    );
  }
  return null;
}
