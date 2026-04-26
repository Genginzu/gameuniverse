"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { FriendshipEventData } from "@/types/activity";

interface ActivityItemFriendshipProps {
  data: FriendshipEventData;
  locale: string;
}

export function ActivityItemFriendship({ data, locale: _locale }: ActivityItemFriendshipProps) {
  const t = useTranslations("players.activity");

  const descriptionKey = `friendshipDescription.${data.action}`;

  return (
    <div>
      <p className="text-sm text-gray-800 dark:text-slate-200">
        {t.rich(descriptionKey, {
          player: () => (
            <Link
              href={`/players/${data.friendId}`}
              className="text-palette-secondary-600 dark:text-palette-secondary-400 font-medium hover:underline"
            >
              {data.friendName}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
