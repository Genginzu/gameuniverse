"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { CommentEventData } from "@/types/activity";

interface ActivityItemCommentProps {
  data: CommentEventData;
  locale: string;
}

export function ActivityItemComment({ data, locale: _locale }: ActivityItemCommentProps) {
  const t = useTranslations("players.activity");

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich("commentDescription", {
          character: () => (
            <Link
              href={`/characters/${data.characterSlug}`}
              className="text-palette-secondary-600 dark:text-palette-secondary-400 font-medium hover:underline"
            >
              {data.characterName}
            </Link>
          ),
        })}
      </p>
      {data.contentExcerpt && (
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 italic dark:text-slate-400">
          &ldquo;{data.contentExcerpt.replace(/<[^>]+>/g, "")}&rdquo;
        </p>
      )}
    </div>
  );
}
