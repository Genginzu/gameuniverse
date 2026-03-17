"use client";

import { useEffect, useRef } from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Message } from "@/types/discussion";

import MessageBubble from "@/components/discussions/MessageBubble";

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function MessageThread({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
}: MessageThreadProps) {
  const t = useTranslations("discussions");
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom on initial load and new messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > prevMessageCountRef.current;
    const isInitialLoad = prevMessageCountRef.current === 0 && messages.length > 0;

    if (isInitialLoad || isNewMessage) {
      container.scrollTop = container.scrollHeight;
    }

    prevMessageCountRef.current = messages.length;
  }, [messages]);

  return (
    <div className="flex h-full flex-col" data-testid="message-thread">
      {/* Scrollable message area */}
      <div ref={containerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all duration-300 hover:bg-white/50 disabled:opacity-50 dark:bg-slate-700/40 dark:text-slate-300 dark:hover:bg-slate-700/60"
              data-testid="load-more-button"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              {t("loadMore")}
            </button>
          </div>
        )}

        {/* Loading spinner (initial load) */}
        {isLoading && messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neon-violet" />
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
        ))}
      </div>
    </div>
  );
}
