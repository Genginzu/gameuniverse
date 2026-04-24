"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";

interface Review {
  id: string; rating: number; comment: string | null;
  coachResponse: string | null; coachRespondedAt: string | null; createdAt: string;
  student: { username: string; avatarUrl: string | null };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} icon={i < rating ? "lucide:star" : "lucide:star"} className={`size-3.5 ${i < rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`} />
      ))}
    </div>
  );
}

export function CoachReviewsSection({ coachId }: { coachId: string }) {
  const t = useTranslations("coaching.reviews");
  const { data, isLoading } = useSWR<{ reviews: Review[] }>(`/api/coaching/reviews?coachId=${coachId}`, fetcher);

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />;
  if (!data?.reviews.length) return <p className="text-sm text-gray-500 dark:text-gray-400">{t("empty")}</p>;

  return (
    <div className="space-y-3">
      {data.reviews.map((r) => (
        <div key={r.id} className="glass-card space-y-2 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white">
                {r.student.avatarUrl ? <img src={r.student.avatarUrl} alt="" className="size-7 rounded-full object-cover" /> : r.student.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{r.student.username}</span>
              <Stars rating={r.rating} />
            </div>
            <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>}
          {r.coachResponse && (
            <div className="ml-4 rounded-lg border-l-2 border-cyan-400 bg-cyan-500/5 p-3">
              <p className="text-xs font-medium text-cyan-400">{t("coachResponse")}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.coachResponse}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
