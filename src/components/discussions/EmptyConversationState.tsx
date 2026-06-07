"use client";

import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

export default function EmptyConversationState() {
  const t = useTranslations("discussions");

  return (
    <div
      className="border-editorial-line bg-editorial-2 flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl border p-8"
      data-testid="empty-conversation-state"
    >
      <div className="bg-editorial-accent/15 rounded-2xl p-5">
        <Icon icon="lucide:message-square" className="text-editorial-accent h-10 w-10" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white/85">{t("selectConversation")}</p>
        <p className="text-editorial-muted mt-1 text-xs">{t("selectConversationHint")}</p>
      </div>
    </div>
  );
}
