"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

export function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-editorial-line bg-editorial-2 animate-pulse rounded-lg border p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export function PostsFeedEmpty() {
  const t = useTranslations("players.posts");

  return (
    <div className="border-editorial-line bg-editorial-2 flex flex-col items-center justify-center rounded-lg border py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-slate-700/50">
        <Icon
          icon="lucide:message-square-off"
          className="h-10 w-10 text-gray-400 dark:text-slate-400"
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">{t("empty")}</p>
    </div>
  );
}
