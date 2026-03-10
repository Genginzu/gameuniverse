"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FriendshipEventData } from "@/types/activity";

interface ActivityItemFriendshipProps {
  data: FriendshipEventData;
  locale: string;
}

export function ActivityItemFriendship({ data, locale }: ActivityItemFriendshipProps) {
  const t = useTranslations("players.activity");

  const descriptionKey = `friendshipDescription.${data.action}`;

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich(descriptionKey, {
          player: () => (
            <Link
              href={`/${locale}/players/${data.friendId}`}
              className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              {data.friendName}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
