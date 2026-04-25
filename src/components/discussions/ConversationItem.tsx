"use client";

import { memo } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { LazyImage } from "@/components/ui/lazy-image";
import { truncatePreview, formatMessageDate } from "@/lib/utils/discussion-utils";
import type { ConversationSummary } from "@/types/discussion";

import UnreadBadge from "./UnreadBadge";

interface ConversationItemProps {
  conversation: ConversationSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default memo(function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const t = useTranslations("discussions");
  const { friend, lastMessage, unreadCount } = conversation;

  const preview = lastMessage ? truncatePreview(lastMessage.content, 80) : t("noMessages");
  const timestamp = lastMessage
    ? formatMessageDate(lastMessage.createdAt, {
        justNow: t("timeJustNow"),
        minutesAgo: (min) => t("timeMinutesAgo", { min }),
        hoursAgo: (hours) => t("timeHoursAgo", { hours }),
      })
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 ${
        isSelected
          ? "bg-linear-to-r from-blue-500/15 via-purple-600/10 to-purple-700/10 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
          : "cursor-pointer hover:bg-white/40 dark:hover:bg-slate-700/40"
      }`}
      data-testid="conversation-item"
    >
      {/* Avatar */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-blue-500/20 via-purple-600/20 to-purple-700/20">
        {friend.avatarUrl ? (
          <LazyImage
            src={friend.avatarUrl}
            alt={friend.displayName}
            fill
            className="object-cover"
            sizes="40px"
            showSkeleton
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:user" className="text-neon-primary/70 h-5 w-5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {friend.displayName}
          </p>
          {timestamp && (
            <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
              {timestamp}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              unreadCount > 0
                ? "font-medium text-slate-700 dark:text-slate-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {preview}
          </p>
          {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
        </div>
      </div>
    </button>
  );
});
