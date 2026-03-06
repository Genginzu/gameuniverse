"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CommentEventData } from "@/types/activity";

interface ActivityItemCommentProps {
  data: CommentEventData;
  locale: string;
}

export function ActivityItemComment({ data, locale }: ActivityItemCommentProps) {
  const t = useTranslations("players.activity");

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("commentDescription", {
          character: () => (
            <Link
              href={`/${locale}/characters/${data.characterSlug}`}
              className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              {data.characterName}
            </Link>
          ),
        })}
      </p>
      {data.contentExcerpt && (
        <p className="mt-1.5 line-clamp-2 text-sm italic text-gray-500 dark:text-slate-400">
          &ldquo;{data.contentExcerpt.replace(/<[^>]+>/g, "")}&rdquo;
        </p>
      )}
    </div>
  );
}
