"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface MatchComment {
  id: string;
  matchId: string;
  matchSource: string;
  playerId: string;
  playerName: string | null;
  playerAvatar: string | null;
  content: string;
  reactions: Record<string, string[]>;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "👎"];

interface MatchDiscussionProps {
  matchId: string;
  matchSource?: "internal" | "pandascore";
}

export function MatchDiscussion({ matchId, matchSource = "pandascore" }: MatchDiscussionProps) {
  const t = useTranslations("esport.discussion");
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const apiUrl = `/api/matches/${encodeURIComponent(matchId)}/comments?source=${matchSource}`;
  const { data, isLoading } = useSWR<{ comments: MatchComment[] }>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
  });

  const comments = data?.comments ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = content.trim();
      if (!trimmed || submitting) return;
      setSubmitting(true);
      try {
        await fetch(`/api/matches/${encodeURIComponent(matchId)}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed, source: matchSource }),
        });
        setContent("");
        mutate(apiUrl);
      } finally {
        setSubmitting(false);
      }
    },
    [content, submitting, matchId, matchSource, apiUrl]
  );

  const handleReaction = useCallback(
    async (commentId: string, emoji: string) => {
      await fetch(`/api/matches/${encodeURIComponent(matchId)}/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      mutate(apiUrl);
    },
    [matchId, apiUrl]
  );

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Icon icon="mdi:forum" className="size-5" />
        {t("title")}
        {comments.length > 0 && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({comments.length})
          </span>
        )}
      </h3>

      {isLoading ? (
        <DiscussionSkeleton />
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("noComments")}
        </p>
      ) : (
        <div className="mb-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              userId={user?.id}
              onReact={handleReaction}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("placeholder")}
            maxLength={2000}
            className="glass-input min-h-[44px] flex-1 rounded-xl px-4 text-base"
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="from-palette-secondary-500 to-palette-primary-500 min-h-[44px] min-w-[44px] rounded-xl bg-linear-to-r px-4 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            <Icon icon="mdi:send" className="size-5" />
          </button>
        </form>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">{t("loginRequired")}</p>
      )}
    </div>
  );
}

function CommentBubble({
  comment,
  userId,
  onReact,
}: {
  comment: MatchComment;
  userId?: string;
  onReact: (commentId: string, emoji: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="rounded-xl bg-white/30 p-3 transition-all dark:bg-slate-800/30">
      <div className="mb-1 flex items-center gap-2">
        {comment.playerAvatar ? (
          <img src={comment.playerAvatar} alt="" className="size-6 rounded-full object-cover" />
        ) : (
          <div className="bg-palette-primary-100 dark:bg-palette-primary-900 flex size-6 items-center justify-center rounded-full">
            <Icon icon="mdi:account" className="text-palette-primary-500 size-4" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {comment.playerName ?? "Anonyme"}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(comment.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>

      {/* Existing reactions */}
      <div className="flex flex-wrap items-center gap-1">
        {Object.entries(comment.reactions).map(([emoji, users]) => (
          <button
            key={emoji}
            onClick={() => onReact(comment.id, emoji)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all ${
              userId && users.includes(userId)
                ? "bg-palette-primary-100 dark:bg-palette-primary-900/50"
                : "bg-white/40 hover:bg-white/60 dark:bg-slate-700/40 dark:hover:bg-slate-700/60"
            }`}
          >
            <span>{emoji}</span>
            <span className="text-gray-600 dark:text-gray-300">{users.length}</span>
          </button>
        ))}

        {userId && (
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex size-6 items-center justify-center rounded-full bg-white/40 text-xs transition-all hover:bg-white/60 dark:bg-slate-700/40 dark:hover:bg-slate-700/60"
            >
              <Icon icon="mdi:emoticon-outline" className="size-4 text-gray-500" />
            </button>
            {showReactions && (
              <div className="glass-dropdown absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-xl p-1.5">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(comment.id, emoji);
                      setShowReactions(false);
                    }}
                    className="rounded-lg p-1 text-base transition-all hover:bg-white/60 dark:hover:bg-slate-700/60"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DiscussionSkeleton() {
  return (
    <div className="mb-4 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/30 p-3 dark:bg-slate-800/30">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
