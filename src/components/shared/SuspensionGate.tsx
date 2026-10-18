"use client";

import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useMySuspension } from "@/hooks/useMySuspension";

interface SuspensionNoticeProps {
  until: string | null;
  className?: string;
}

/** Explains to a suspended user why they cannot publish, and until when. */
export function SuspensionNotice({ until, className }: SuspensionNoticeProps) {
  const t = useTranslations("suspension");
  const format = useFormatter();

  const body = until
    ? t("bodyUntil", {
        date: format.dateTime(new Date(until), { dateStyle: "long", timeStyle: "short" }),
      })
    : t("bodyIndefinite");

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-left",
        className
      )}
    >
      <Icon
        icon="lucide:shield-alert"
        className="mt-0.5 size-5 shrink-0 text-amber-300"
        aria-hidden
      />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-amber-100">{t("title")}</p>
        <p className="text-sm text-amber-100/90">{body}</p>
        <p className="text-xs text-amber-100/75">{t("readOnly")}</p>
      </div>
    </div>
  );
}

interface SuspensionGateProps {
  children: ReactNode;
  className?: string;
}

/**
 * Renders the write UI (form, composer…) normally, or the suspension notice
 * while the signed-in user is suspended. Only mount it where the user is
 * authenticated: it fetches the current user's status.
 */
export function SuspensionGate({ children, className }: SuspensionGateProps) {
  const { suspended, until } = useMySuspension();
  if (suspended) return <SuspensionNotice until={until} className={className} />;
  return <>{children}</>;
}
