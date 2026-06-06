"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { Icon } from "@iconify/react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  coachResponse: string | null;
  coachRespondedAt: string | null;
  createdAt: string;
  student: { username: string; avatarUrl: string | null };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          icon="lucide:star"
          className={`size-3.5 ${i < rating ? "text-amber-400" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

export function CoachReviewsSection({ coachId }: { coachId: string }) {
  const t = useTranslations("coaching.reviews");
  const { data, isLoading } = useSWR<{ reviews: Review[] }>(
    `/api/coaching/reviews?coachId=${coachId}`,
    fetcher
  );

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-white/[0.06]" />;
  if (!data?.reviews.length)
    return <p className="text-editorial-muted text-sm">{t("empty")}</p>;

  return (
    <div className="space-y-3">
      {data.reviews.map((r) => (
        <div key={r.id} className="border-editorial-line bg-editorial-2 space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="from-palette-secondary-500 to-palette-primary-500 flex size-7 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white">
                {r.student.avatarUrl ? (
                  <img
                    src={r.student.avatarUrl}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  r.student.username[0].toUpperCase()
                )}
              </div>
              <span className="text-sm font-medium text-white">{r.student.username}</span>
              <Stars rating={r.rating} />
            </div>
            <span className="text-editorial-muted text-xs">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          {r.comment && <p className="text-editorial-muted text-sm">{r.comment}</p>}
          {r.coachResponse && (
            <div className="border-editorial-accent bg-editorial-accent/5 ml-4 rounded-lg border-l-2 p-3">
              <p className="text-editorial-accent text-xs font-medium">{t("coachResponse")}</p>
              <p className="text-editorial-muted mt-1 text-sm">{r.coachResponse}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
