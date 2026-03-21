"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LazyImage } from "@/components/ui/lazy-image";
import { Icon } from "@iconify/react";
import type { LibraryEventData } from "@/types/activity";

interface ActivityItemLibraryProps {
  data: LibraryEventData;
  locale: string;
}

export function ActivityItemLibrary({ data, locale }: ActivityItemLibraryProps) {
  const t = useTranslations("players.activity");

  return (
    <div className="flex gap-3">
      {/* Cover thumbnail */}
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-slate-700">
        {data.coverImage ? (
          <LazyImage
            src={data.coverImage}
            alt={data.gameName}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon icon="lucide:gamepad-2" className="h-5 w-5 text-slate-500" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-800 dark:text-slate-200">
          {t.rich("libraryDescription", {
            game: () => (
              <Link
                href={`/${locale}/games/${data.gameSlug}`}
                className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
              >
                {data.gameName}
              </Link>
            ),
          })}
        </p>
        <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-slate-700/50 dark:text-slate-300">
          {t(`status.${data.status}`)}
        </span>
      </div>
    </div>
  );
}
