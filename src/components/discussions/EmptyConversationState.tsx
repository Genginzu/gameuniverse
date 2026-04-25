"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

export default function EmptyConversationState() {
  const t = useTranslations("discussions");

  return (
    <div
      className="glass-card flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl p-8"
      data-testid="empty-conversation-state"
    >
      <div className="rounded-2xl bg-linear-to-br from-blue-500/20 via-purple-600/20 to-purple-700/20 p-5 shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300">
        <Icon icon="lucide:message-square" className="text-neon-primary h-10 w-10" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("selectConversation")}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t("selectConversationHint")}
        </p>
      </div>
    </div>
  );
}
