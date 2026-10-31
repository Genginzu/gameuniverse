"use client";

/**
 * RecommendationFeedback : outcome of the card actions — dismissal error, then
 * the "not interested" notice (with undo) and the "added to library / to the
 * wishlist" notice. Quick add errors are reported by the quick add itself.
 */

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { QuickAction } from "@/types/library";
import { RecommendationNotice } from "./RecommendationNotice";

interface NoticeGame {
  slug: string;
  title: string;
}

interface RecommendationFeedbackProps {
  dismissed: NoticeGame | null;
  added: (NoticeGame & { list: QuickAction }) | null;
  dismissFailed: boolean;
  onUndo: () => void;
}

function gameLink(slug: string) {
  return function GameLink(title: ReactNode) {
    return (
      <Link
        href={`/games/${slug}`}
        className="text-editorial-accent font-semibold underline-offset-2 hover:underline focus-visible:underline"
      >
        {title}
      </Link>
    );
  };
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="-mt-2 text-sm text-red-400">
      {message}
    </p>
  );
}

export function RecommendationFeedback({
  dismissed,
  added,
  dismissFailed,
  onUndo,
}: RecommendationFeedbackProps) {
  const t = useTranslations("homeDashboard.recommendations");

  return (
    <>
      {dismissFailed && <ErrorLine message={t("dismissError")} />}
      {dismissed && (
        <RecommendationNotice
          icon="lucide:eye-off"
          message={t.rich("dismissed", { game: gameLink(dismissed.slug), title: dismissed.title })}
          undo={{ label: t("undo"), onClick: onUndo }}
        />
      )}
      {added && (
        <RecommendationNotice
          icon={added.list === "wishlist" ? "lucide:star" : "lucide:library"}
          message={t.rich(added.list === "wishlist" ? "wishlisted" : "added", {
            game: gameLink(added.slug),
            title: added.title,
          })}
        />
      )}
    </>
  );
}
