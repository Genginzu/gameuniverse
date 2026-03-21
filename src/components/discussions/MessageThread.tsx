"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import type { Message } from "@/types/discussion";

import MessageBubble from "@/components/discussions/MessageBubble";

function MessageSkeleton({ isOwn }: { isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`animate-pulse space-y-2 rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "rounded-br-md bg-purple-500/15 dark:bg-purple-500/10"
            : "rounded-bl-md bg-slate-200/40 dark:bg-slate-700/40"
        }`}
        style={{ width: isOwn ? "55%" : "65%", maxWidth: "75%" }}
      >
        <div className="h-3 w-full rounded-md bg-slate-300/50 dark:bg-slate-600/50" />
        <div className="h-3 w-3/4 rounded-md bg-slate-300/40 dark:bg-slate-600/40" />
        <div className="h-2 w-12 rounded-md bg-slate-300/30 dark:bg-slate-600/30" />
      </div>
    </div>
  );
}

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
              className="flex items-center gap-1.5 rounded-xl bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-xs transition-all duration-300 hover:bg-white/50 disabled:opacity-50 dark:bg-slate-700/40 dark:text-slate-300 dark:hover:bg-slate-700/60"
              data-testid="load-more-button"
            >
              {isLoading ? (
                <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
              ) : (
                <Icon icon="lucide:chevron-up" className="h-4 w-4" />
              )}
              {t("loadMore")}
            </button>
          </div>
        )}

        {/* Loading skeleton (initial load) */}
        {isLoading && messages.length === 0 && (
          <div
            className="flex flex-1 flex-col justify-end gap-3"
            data-testid="message-thread-skeleton"
          >
            <MessageSkeleton isOwn={false} />
            <MessageSkeleton isOwn={true} />
            <MessageSkeleton isOwn={false} />
            <MessageSkeleton isOwn={true} />
            <MessageSkeleton isOwn={false} />
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
