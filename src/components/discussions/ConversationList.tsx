"use client";

import { Plus, MessageSquare, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ConversationSummary } from "@/types/discussion";

import ConversationItem from "./ConversationItem";

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
    <div className="glass-card flex h-full flex-col" data-testid="conversation-list">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 p-4 dark:border-slate-700/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("conversations")}</h2>
        <button
          type="button"
          onClick={onNewConversation}
          className="rounded-xl bg-gradient-to-br from-neon-violet to-neon-cyan p-2 text-white shadow-lg transition-all duration-300 hover:opacity-90"
          aria-label={t("newConversation")}
          data-testid="new-conversation-button"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neon-violet" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <MessageSquare className="h-10 w-10 text-slate-400 dark:text-slate-500" />
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
