"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";

import { formatMessageDate } from "@/lib/utils/discussion-utils";
import type { Message } from "@/types/discussion";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default memo(function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const t = useTranslations("discussions");
  const timestamp = formatMessageDate(message.createdAt, {
    justNow: t("timeJustNow"),
    minutesAgo: (min) => t("timeMinutesAgo", { min }),
    hoursAgo: (hours) => t("timeHoursAgo", { hours }),
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid="message-bubble">
      <div
        className={`max-w-[85%] px-3.5 py-2.5 transition-all duration-300 sm:max-w-[75%] sm:px-4 ${
          isOwn
            ? "rounded-2xl rounded-br-md bg-linear-to-br from-blue-500 via-purple-600 to-purple-700 text-white shadow-[0_2px_12px_rgba(139,92,246,0.25)]"
            : "rounded-2xl rounded-bl-md bg-white text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 backdrop-blur-xs dark:bg-slate-700/70 dark:text-slate-100 dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)] dark:ring-white/5"
        }`}
        data-testid={isOwn ? "message-own" : "message-received"}
      >
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {message.content}
        </p>
        <span
          className={`mt-1 block text-[10px] ${
            isOwn ? "text-white/60" : "text-slate-400 dark:text-slate-500"
          }`}
          aria-label={t("sentAt", { time: timestamp })}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
});
