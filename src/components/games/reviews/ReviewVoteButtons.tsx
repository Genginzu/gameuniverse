"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useReviewVote } from "@/hooks/useReviewVote";
import { useReviewTranslations } from "@/hooks/useTranslations";
import type { ReviewVoteCounts, VoteType } from "@/types/review";

interface ReviewVoteButtonsProps {
  reviewId: string;
  reviewUserId: string;
  initialCounts: ReviewVoteCounts;
  initialUserVote: VoteType | null;
}

export function ReviewVoteButtons({
  reviewId,
  reviewUserId,
  initialCounts,
  initialUserVote,
}: ReviewVoteButtonsProps) {
  const { user } = useAuth();
  const t = useReviewTranslations();
  const { voteCounts, userVote, isVoting, handleVote } = useReviewVote(
    reviewId,
    reviewUserId,
    initialCounts,
    initialUserVote
  );

  const isOwnReview = user?.id === reviewUserId;
  const isDisabled = !user || isOwnReview || isVoting;

  const title = !user ? t("votes.loginToVote") : undefined;

  return (
    <div className="flex items-center gap-2" role="group" aria-label={t("votes.helpful")}>
      <VoteButton
        type="helpful"
        count={voteCounts.helpful}
        isActive={userVote === "helpful"}
        disabled={isDisabled}
        title={title}
        ariaLabel={t("votes.helpfulAriaLabel", { count: voteCounts.helpful })}
        onClick={() => handleVote("helpful")}
      />
      <VoteButton
        type="not_helpful"
        count={voteCounts.notHelpful}
        isActive={userVote === "not_helpful"}
        disabled={isDisabled}
        title={title}
        ariaLabel={t("votes.notHelpfulAriaLabel", { count: voteCounts.notHelpful })}
        onClick={() => handleVote("not_helpful")}
      />
    </div>
  );
}

function VoteButton({
  type,
  count,
  isActive,
  disabled,
  title,
  ariaLabel,
  onClick,
}: {
  type: VoteType;
  count: number;
  isActive: boolean;
  disabled: boolean;
  title?: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  const isHelpful = type === "helpful";
  const iconName = isHelpful ? "lucide:thumbs-up" : "lucide:thumbs-down";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 focus-visible:outline-hidden",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isActive && isHelpful && "bg-green-500/20 text-green-400",
        isActive && !isHelpful && "bg-red-500/20 text-red-400",
        !isActive && "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
      )}
    >
      <Icon icon={iconName} className="h-4 w-4" />
      <span>{count}</span>
    </button>
  );
}
