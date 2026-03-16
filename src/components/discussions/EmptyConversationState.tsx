"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

export default function EmptyConversationState() {
  const t = useTranslations("discussions");

  return (
    <div
      className="glass-card flex h-full flex-col items-center justify-center gap-4 rounded-xl p-8"
      data-testid="empty-conversation-state"
    >
      <div className="rounded-2xl bg-gradient-to-br from-neon-violet/20 to-neon-cyan/20 p-4 transition-all duration-300">
        <MessageSquare className="h-10 w-10 text-neon-violet" />
      </div>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {t("selectConversation")}
      </p>
    </div>
  );
}
