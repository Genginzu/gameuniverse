"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import type { ConversationSummary } from "@/types/discussion";

import ConversationItem from "./ConversationItem";

function ConversationSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl p-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3.5 w-24 rounded-md bg-slate-200/60 dark:bg-slate-700/60" />
          <div className="h-3 w-12 rounded-md bg-slate-200/40 dark:bg-slate-700/40" />
        </div>
        <div className="h-3 w-40 rounded-md bg-slate-200/40 dark:bg-slate-700/40" />
      </div>
    </div>
  );
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  isLoading,
}: ConversationListProps) {
  const t = useTranslations("discussions");

  return (
    <div
      className="glass-card flex h-full w-full flex-col rounded-2xl"
      data-testid="conversation-list"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 px-5 py-4 dark:border-slate-700/50">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("conversations")}</h2>
        <button
          type="button"
          onClick={onNewConversation}
          className="flex items-center gap-1.5 rounded-xl bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-300 hover:opacity-90"
          aria-label={t("newConversation")}
          data-testid="new-conversation-button"
        >
          <Icon icon="lucide:plus" className="h-3.5 w-3.5" />
          {t("new")}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col gap-1" data-testid="conversation-list-skeleton">
            {Array.from({ length: 5 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="rounded-2xl bg-linear-to-br from-blue-500/20 via-purple-600/20 to-purple-700/20 p-4">
              <Icon icon="lucide:message-square" className="text-neon-primary h-8 w-8" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("noConversations")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedId === conversation.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
