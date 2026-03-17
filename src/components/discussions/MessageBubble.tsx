"use client";

import { useTranslations } from "next-intl";

import { formatMessageDate } from "@/lib/utils/discussion-utils";
import type { Message } from "@/types/discussion";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const t = useTranslations("discussions");
  const timestamp = formatMessageDate(message.createdAt);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`} data-testid="message-bubble">
      <div
        className={`max-w-[75%] px-4 py-2.5 shadow-sm transition-all duration-300 ${
          isOwn
            ? "rounded-2xl rounded-br-md bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 text-white shadow-[0_2px_12px_rgba(139,92,246,0.25)]"
            : "rounded-2xl rounded-bl-md bg-white/50 text-slate-900 shadow-black/5 backdrop-blur-sm dark:bg-slate-700/50 dark:text-slate-100 dark:shadow-black/10"
        }`}
        data-testid={isOwn ? "message-own" : "message-received"}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
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
}
