"use client";

import { User } from "lucide-react";
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

export default function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const t = useTranslations("discussions");
  const { friend, lastMessage, unreadCount } = conversation;

  const preview = lastMessage ? truncatePreview(lastMessage.content, 80) : t("noMessages");

  const timestamp = lastMessage ? formatMessageDate(lastMessage.createdAt) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 ${
        isSelected
          ? "border-l-2 border-neon-violet bg-white/60 dark:bg-slate-700/60"
          : "cursor-pointer hover:bg-white/60 dark:hover:bg-slate-700/60"
      }`}
      data-testid="conversation-item"
    >
      {/* Avatar */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
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
            <User className="h-5 w-5 text-blue-300" />
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
            <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
              {timestamp}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{preview}</p>
          {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
        </div>
      </div>
    </button>
  );
}
