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
        className={`max-w-[75%] px-4 py-2.5 transition-all duration-300 ${
          isOwn
            ? "rounded-2xl rounded-br-md bg-gradient-to-br from-neon-violet/80 to-neon-cyan/60 text-white"
            : "rounded-2xl rounded-bl-md bg-white/40 text-slate-900 backdrop-blur-xl dark:bg-slate-800/50 dark:text-slate-100"
        }`}
        data-testid={isOwn ? "message-own" : "message-received"}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        <span
          className={`mt-1 block text-[10px] ${
            isOwn ? "text-white/70" : "text-slate-500 dark:text-slate-400"
          }`}
          aria-label={t("sentAt", { time: timestamp })}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}
