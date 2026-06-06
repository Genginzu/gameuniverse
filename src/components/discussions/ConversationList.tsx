"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import type { ConversationSummary } from "@/types/discussion";

import ConversationItem from "./ConversationItem";

function ConversationSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl p-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3.5 w-24 rounded-md bg-white/[0.06]" />
          <div className="h-3 w-12 rounded-md bg-white/[0.04]" />
        </div>
        <div className="h-3 w-40 rounded-md bg-white/[0.04]" />
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
      className="border-editorial-line bg-editorial-2 flex h-full w-full flex-col rounded-2xl border"
      data-testid="conversation-list"
    >
      {/* Header */}
      <div className="border-editorial-line flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-base font-bold text-white">{t("conversations")}</h2>
        <button
          type="button"
          onClick={onNewConversation}
          className="bg-editorial-accent flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:opacity-90"
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
            <div className="bg-editorial-accent/15 rounded-2xl p-4">
              <Icon icon="lucide:message-square" className="text-editorial-accent h-8 w-8" />
            </div>
            <p className="text-editorial-muted text-sm">{t("noConversations")}</p>
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
