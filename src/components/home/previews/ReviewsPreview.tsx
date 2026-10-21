"use client";

import { useTranslations } from "next-intl";

import { ReviewCard } from "@/components/games/reviews/ReviewCard";
import { KickerLabel } from "@/components/shared/KickerLabel";
import type { HomeReviewPreview } from "@/types/home";
import { DEMO_REVIEW_META } from "./previewDemoData";

interface ReviewsPreviewProps {
  reviews: HomeReviewPreview[];
}

function useDemoReview(): HomeReviewPreview {
  const t = useTranslations("landing.previews.mockups.demoReview");
  return {
    ...DEMO_REVIEW_META,
    gameId: "demo-game",
    content: `<p>${t("content")}</p>`,
    positivePoints: [t("positive")],
    negativePoints: [t("negative")],
    updatedAt: DEMO_REVIEW_META.createdAt,
    playerAvatar: null,
    voteCounts: { helpful: 12, notHelpful: 1 },
    userVote: null,
    gameTitle: null,
    gameSlug: null,
  };
}

/** Latest public review (or a demo one) rendered with the real review card. */
export function ReviewsPreview({ reviews }: ReviewsPreviewProps) {
  const t = useTranslations("landing.previews.mockups");
  const demoReview = useDemoReview();
  const review = reviews[0] ?? demoReview;

  return (
    <div className="flex flex-col gap-3">
      {review.gameTitle && (
        <KickerLabel as="span">{t("reviewFor", { game: review.gameTitle })}</KickerLabel>
      )}
      <div className="relative max-h-[22rem] overflow-hidden">
        <ReviewCard review={review} />
        <div className="from-editorial-2 pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
      </div>
    </div>
  );
}
