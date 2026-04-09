"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Link } from "@/i18n/navigation";
import type { CollectionItem } from "@/types/collection";

interface CollectionGameCardProps {
  item: CollectionItem;
}

export function CollectionGameCard({ item }: CollectionGameCardProps) {
  return (
    <div className="group relative">
      <Link href={`/games/${item.slug}`}>
        <div className="relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-xs transition-all duration-200 hover:shadow-md dark:bg-gray-800">
          {/* Cover image */}
          <div className="relative aspect-2/3 bg-gray-100 dark:bg-gray-700">
            <LazyImage
              src={item.coverImage ?? undefined}
              alt={item.title}
              fill
              className="rounded-t-lg object-cover"
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
              showSkeleton
            />
          </div>

          {/* Info section */}
          <div className="p-1.5">
            <h3 className="line-clamp-1 text-[11px] font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {item.title}
            </h3>

            {/* Owner note — compact inline */}
            {item.note && (
              <p className="mt-0.5 line-clamp-1 text-[10px] italic text-blue-600 dark:text-blue-300">
                {item.note}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
